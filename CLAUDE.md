# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

将棋マスターズ — a Japanese shogi (Japanese chess) single-page app. Create React App (react-scripts 5) + TypeScript + React 19. All UI strings and code comments are in Japanese; preserve that convention when editing.

## Common Commands

- `npm install` — install dependencies.
- `npm start` — run CRA dev server (defaults to http://localhost:3000).
- `npm test` — Jest in watch mode. CI uses `CI=true npm test` for single-run mode.
- Run a single test file: `CI=true npm test -- src/App.test.tsx`
- Run a single test name: `CI=true npm test -- -t "renders main menu with title"`
- `npm run build` — production build into `build/`.
- Deploy: `vercel --prod` (config in `vercel.json` — SPA rewrite of everything to `/index.html`).
- CI: `.github/workflows/ci.yml` runs `npm ci && CI=true npm test && npm run build` on pushes/PRs to `main`.

Do **not** run `npm run eject`.

## Architecture

Three-screen SPA with no router: `src/App.tsx` holds a `'menu' | 'game' | 'tsume'` state and swaps between `MainMenu`, `GameScreen`, and `TsumeScreen`. There is no global store — game state lives in the screen component and is passed down. `App` also holds the persisted `AILevel` (`shogi-app-ai-level`).

### Pure logic vs. UI split
- `src/models/ShogiTypes.ts` — enums (`PieceType`, `Player`), `Piece`/`Position`/`Move`/`GameState`/`CapturedPieces` interfaces, and the `PIECE_NAMES` / `PROMOTION_MAP` / `UNPROMOTION_MAP` lookup tables plus helpers (`canPromote`, `isPromoted`, `getBaseType`). All rule-facing code should import types/helpers from here.
- `src/utils/ShogiLogic.ts` — **pure, stateless** rules engine. Exported: `createInitialBoard`, `createInitialState`, `getValidMoves`, `isInCheck`, `mustPromote`, `canPromoteMove`, `getDropPositions`, `executeMove`, `isLegalMove`, `getAIMove`. Everything returns new boards/state; never mutate inputs. `executeMove` computes `isCheck` / `isCheckmate` and sets `winner` on checkmate.
- `src/components/` — presentational React. `GameScreen` → `ShogiBoard` → (`ShogiPiece`, `CapturedPiecesPanel`, `PromotionDialog`).

### Board coordinates
- `board[row][col]` is a `(Piece | null)[9][9]`.
- `row: 0` is the top (Gote / 後手 / upper player); `row: 8` is the bottom (Sente / 先手 / lower player). Sente moves "up" = decreasing row.
- `DIRECTIONS` in `ShogiLogic.ts` is defined from Sente's perspective; `adjustDirection` flips it for Gote. Always go through this helper — don't hand-roll direction math.
- Promotion zone: rows 0–2 for Sente, rows 6–8 for Gote. `mustPromote` handles pawn/lance last-rank and knight last-two-ranks rules.
- Displayed coordinates use shogi notation (`9 8 7 ... 1` columns, `一 二 … 九` rows), computed as `9 - col` / `rowLabels[row]` in `GameScreen.formatMove` and `ShogiBoard`.

### Move flow
1. `ShogiBoard.handleCellClick` / `handleDropSelect` computes candidate squares via `getValidMoves` + `isLegalMove` (or `getDropPositions` + `isLegalMove` for drops), stores them in `validMoves`.
2. On confirmation it builds a `Move` (with `from: null` + `dropPiece` for drops) and calls `executeMove` via `applyMove`.
3. If `canPromoteMove` is true but `mustPromote` is false, `PromotionDialog` is opened and the move is deferred until the user chooses.
4. In vsAI mode, after Sente's move, `applyMove` schedules `getAIMove` → `executeMove` with a 500 ms `setTimeout` (tracked in `aiTimerRef` and cleared on unmount). `ShogiBoard` locks input when `currentPlayer === Gote && vsAI` via `isInteractionLocked`.

### AI
`getAIMove(state, level)` enumerates all legal moves (via shared `enumerateLegalMoves`), scores them with `evaluateMove` (MVV-LVA capture bonus, promotion delta, check bonus, mild positional terms, small random jitter), and picks based on `AILevel`:
- `Easy`: random legal move (40% chance of preferring a capture)
- `Normal`: random from top 3 scored
- `Hard`: always top-scored

It is one-ply and intentionally lightweight — keep it fast enough to run synchronously inside the 500 ms delay. `ShogiBoard` also has a "rehydrate" effect that schedules the AI move if the board mounts with `currentPlayer === Gote && vsAI && !isGameOver` (recovers a game reloaded mid-AI-turn).

### 詰将棋クエスト (tsume mode)
- `src/models/TsumeProblem.ts` — problem data (`TsumeProblem` = board + hands + `moves: 1 | 2`). `TSUME_PROBLEMS` is a hand-authored bundle; each problem is validated in `src/TsumeValidation.test.ts` via `findMate`.
- `src/utils/TsumeLogic.ts` — `findMate` (recursive force-mate search), `isSolutionMove` (strict validator — the move must check and every defender reply must still lead to mate), `chooseDefenderMove` (picks Gote's reply in between turns), plus `loadTsumeProgress` / `markProblemSolved` (`localStorage` key `shogi-app-tsume-progress`).
- `TsumeScreen` lists problems with ✓ for solved; `TsumePlay` reuses `ShogiBoard` with `vsAI={false}` and orchestrates defender replies itself.

### Special rules implemented
- 二歩 (nifu — two pawns on a file) and 打ち歩詰め (uchi-fu-zume — pawn drop mate) are enforced in `getDropPositions`. The latter uses `isCheckmatedOnBoard` with empty captured piece sets, which means it only checks on-board escape moves — be aware if you extend it.
- Checkmate detection is exhaustive across all legal moves and drops via `isCheckmatedOnBoard`.

### Persistence
`GameScreen` auto-saves `GameState` to `localStorage` under `shogi-app-save-ai` or `shogi-app-save-pvp` after every move, and rehydrates on mount. Reset clears the relevant key. If you change the `GameState` shape, stale saves will deserialize into the new shape as-is — consider a version key or migration.

## Conventions

- **Styling is inline only.** Every component uses `style={{ ... }}` with the shared palette (gold `#ffd700`, wood browns `#6b4c1e` / `#4a3520` / `#2a1810`, red accent `#c41e3a`). `src/styles/theme.ts` exists but components currently don't import it — match existing inline values rather than introducing CSS modules / styled-components.
- **TypeScript is strict** (`tsconfig.json`). Prefer discriminated unions and the existing enums over string literals.
- **Tests live in `src/App.test.tsx`** and cover both UI (React Testing Library) and the `ShogiLogic` rules engine. Add new rule tests to the existing `describe` blocks there unless the file gets unwieldy.
- **Japanese in source is intentional** — piece names, labels, comments, and commit-adjacent docs are written in Japanese. Don't translate existing strings.
- **ESLint** uses CRA defaults (`react-app`, `react-app/jest`); there is no separate lint script — warnings surface in `npm start` / `npm run build`.
