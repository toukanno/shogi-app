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

Two-screen SPA with no router: `src/App.tsx` holds a `'menu' | 'game'` state and a selected `GameMode`, then swaps between `MainMenu` and `GameScreen`. There is no global store — game state lives in `GameScreen` and is passed down.

### Game modes
`src/models/GameMode.ts` defines `type GameMode = 'pvp' | 'ai-sente' | 'ai-gote' | 'ai-vs-ai'`. `MainMenu` renders one button per mode; `GameScreen` translates the mode into two booleans (`aiControlsSente`, `aiControlsGote`) which it passes to `ShogiBoard`. `ai-sente` means *the user* plays Sente (so AI controls Gote); `ai-gote` is the inverse; `ai-vs-ai` is observer mode where both sides are AI.

### Pure logic vs. UI split
- `src/models/ShogiTypes.ts` — enums (`PieceType`, `Player`), `Piece`/`Position`/`Move`/`GameState`/`CapturedPieces` interfaces, and the `PIECE_NAMES` / `PROMOTION_MAP` / `UNPROMOTION_MAP` lookup tables plus helpers (`canPromote`, `isPromoted`, `getBaseType`). All rule-facing code should import types/helpers from here.
- `src/models/GameMode.ts` — the four-way `GameMode` union.
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
2. On confirmation it builds a `Move` (with `from: null` + `dropPiece` for drops) and calls `executeMove` via `applyMove`, which simply commits the new state through the `onMove` callback.
3. If `canPromoteMove` is true but `mustPromote` is false, `PromotionDialog` is opened and the move is deferred until the user chooses.
4. AI scheduling is **state-driven, not event-driven**: a `useEffect` in `ShogiBoard` watches `gameState.currentPlayer` and, whenever the side to move is AI-controlled (and the game isn't over), it kicks off a 500 ms `setTimeout` that calls `getAIMove` → `executeMove` → `onMove`. The handle is held in `aiTimerRef` and cleared by the effect's cleanup on unmount or when the state/mode changes. This is what makes `ai-gote` (AI plays first) and `ai-vs-ai` (both sides AI, cascading moves) work — `applyMove` itself never schedules the next AI turn.
5. `ShogiBoard` locks human input via `isInteractionLocked` whenever it is the AI's turn (or the parent passes `interactionDisabled`). `CapturedPiecesPanel` for an AI-controlled side renders as non-interactive (`isCurrentPlayer` is false even on its turn).

### AI
`getAIMove` runs an iterative-deepening **negamax search with αβ pruning** (`negamax` in `ShogiLogic.ts`). Defaults: `MAX_DEPTH = 3`, `TIME_BUDGET_MS = 800`. Each iteration re-orders the root moves by the previous depth's scores so the next iteration's αβ cuts harder. Move ordering inside `negamax` uses `moveOrderScore` (MVV-LVA capture priority + promotion delta + push-into-enemy-camp bias). The static evaluator `evaluatePosition` sums `PIECE_VALUES` on the board, weighted `HAND_VALUES` for captured pieces, a small enemy-camp bonus for unpromoted pieces, a center-distance term for gold/silver, and a check-pressure term. Mate scores use a `MATE_SCORE - depth` ramp so shorter mates beat longer ones. Top-tied moves (within `EPS = 5`) are kept and one is picked at random for variety. Time budget is enforced at every node by checking `Date.now() > deadline`. The 500 ms `setTimeout` in `ShogiBoard` is purely for visual pacing — total user-visible delay can reach ~500 ms + ~800 ms.

### Special rules implemented
- 二歩 (nifu — two pawns on a file) and 打ち歩詰め (uchi-fu-zume — pawn drop mate) are enforced in `getDropPositions`. The drop-mate test calls `isCheckmatedOnBoard`, passing the *current* `capturedPieces` so opponent's hand-drop defenses are considered.
- Checkmate detection is exhaustive across all legal moves and drops via `isCheckmatedOnBoard`.

### Persistence
`GameScreen` auto-saves `GameState` to `localStorage` under `shogi-app-save-${gameMode}` (so `pvp`, `ai-sente`, `ai-gote`, `ai-vs-ai` each have an independent save) after every state change, and rehydrates on mount. Reset clears the active key. If you change the `GameState` shape, stale saves will deserialize into the new shape as-is — consider a version key or migration. The previous `shogi-app-save-ai` / `shogi-app-save-pvp` keys are no longer read.

## Conventions

- **Styling is inline only.** Every component uses `style={{ ... }}` with the shared palette (gold `#ffd700`, wood browns `#6b4c1e` / `#4a3520` / `#2a1810`, red accent `#c41e3a`). `src/styles/theme.ts` exists but components currently don't import it — match existing inline values rather than introducing CSS modules / styled-components.
- **TypeScript is strict** (`tsconfig.json`). Prefer discriminated unions and the existing enums over string literals.
- **Tests live in `src/App.test.tsx`** and cover both UI (React Testing Library) and the `ShogiLogic` rules engine. Add new rule tests to the existing `describe` blocks there unless the file gets unwieldy.
- **Japanese in source is intentional** — piece names, labels, comments, and commit-adjacent docs are written in Japanese. Don't translate existing strings.
- **ESLint** uses CRA defaults (`react-app`, `react-app/jest`); there is no separate lint script — warnings surface in `npm start` / `npm run build`.
