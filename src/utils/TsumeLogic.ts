import { GameState, Player, Move, CapturedPieces, Piece } from '../models/ShogiTypes';
import { TsumeProblem } from '../models/TsumeProblem';
import { enumerateLegalMoves, executeMove, isInCheck } from './ShogiLogic';

// 詰将棋の初期 GameState（先手番、手数0）
export function createTsumeState(problem: TsumeProblem): GameState {
  return {
    board: problem.board.map(row => row.map(cell => cell ? { ...cell } : null)),
    currentPlayer: Player.Sente,
    capturedPieces: {
      [Player.Sente]: [...problem.hands[Player.Sente]],
      [Player.Gote]: [...problem.hands[Player.Gote]],
    },
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isGameOver: false,
    winner: null,
  };
}

// 攻方（先手）が playerMovesRemaining 手以内で詰ませられる手を探す
// 見つかったら先手の最初の一手を返す。なければ null。
export function findMate(state: GameState, playerMovesRemaining: number): Move | null {
  if (playerMovesRemaining < 1) return null;
  if (state.currentPlayer !== Player.Sente) return null;

  const attackerMoves = enumerateLegalMoves(state);

  for (const move of attackerMoves) {
    const afterAttack = executeMove(state, move);
    // 王手でない手は詰将棋の候補手ではない
    if (!afterAttack.isCheck && !afterAttack.isCheckmate) continue;

    if (afterAttack.isCheckmate) {
      return move;
    }
    if (playerMovesRemaining === 1) continue;

    // 後手の応手すべてに対して次の攻方手が詰ませられるか
    const defenderMoves = enumerateLegalMoves(afterAttack);
    if (defenderMoves.length === 0) continue;  // stalemate 扱いは除外
    let allLeadToMate = true;
    for (const dmove of defenderMoves) {
      const afterDefense = executeMove(afterAttack, dmove);
      if (afterDefense.isGameOver) {
        // 先手が取られる形は論外
        allLeadToMate = false;
        break;
      }
      const next = findMate(afterDefense, playerMovesRemaining - 1);
      if (!next) {
        allLeadToMate = false;
        break;
      }
    }
    if (allLeadToMate) return move;
  }

  return null;
}

// 後手（玉方）の応手を選ぶ：詰みを最も遅らせる手
// 詰将棋として正しければ全応手が同じく詰むので任意でよいが、見栄えのため
// 駒を取れる応手を優先し、無ければ端に逃げる手を選ぶ。
export function chooseDefenderMove(state: GameState): Move | null {
  if (state.currentPlayer !== Player.Gote) return null;
  const moves = enumerateLegalMoves(state);
  if (moves.length === 0) return null;

  // 駒を取る手を優先
  const captures = moves.filter(m => state.board[m.to.row][m.to.col] !== null);
  if (captures.length > 0) {
    return captures[0];
  }
  return moves[0];
}

// 指定問題が実際に moves 手以内で詰むかを検証
export function validateProblem(problem: TsumeProblem): boolean {
  const state = createTsumeState(problem);
  // 初期局面で既に王手がかかっていない前提
  if (isInCheck(state.board, Player.Gote)) {
    // 問題によっては OK だが、ここでは想定しない
  }
  return findMate(state, problem.moves) !== null;
}

// 手が「正解の手」か（詰将棋の最初の攻方手として妥当か）
export function isSolutionMove(state: GameState, move: Move, movesRemaining: number): boolean {
  const after = executeMove(state, move);
  if (after.isCheckmate) return true;
  if (!after.isCheck) return false;
  if (movesRemaining <= 1) return after.isCheckmate;

  // 全ての後手応手に対して詰みがあるか
  const defenderMoves = enumerateLegalMoves(after);
  if (defenderMoves.length === 0) return false;
  for (const dmove of defenderMoves) {
    const afterDef = executeMove(after, dmove);
    if (afterDef.isGameOver) return false;
    if (!findMate(afterDef, movesRemaining - 1)) return false;
  }
  return true;
}

// 捕獲用 helper — TsumePlay から使う
export function opponentDefender(state: GameState): { move: Move; next: GameState } | null {
  const m = chooseDefenderMove(state);
  if (!m) return null;
  return { move: m, next: executeMove(state, m) };
}

// 盤面の駒数（テスト用）
export function countPieces(board: (Piece | null)[][]): number {
  let n = 0;
  for (const row of board) for (const c of row) if (c) n++;
  return n;
}

// export for tests
export { enumerateLegalMoves } from './ShogiLogic';

// 詰将棋クリア状況
const TSUME_PROGRESS_KEY = 'shogi-app-tsume-progress';

export function loadTsumeProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(TSUME_PROGRESS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveTsumeProgress(solved: Set<string>): void {
  try {
    localStorage.setItem(TSUME_PROGRESS_KEY, JSON.stringify(Array.from(solved)));
  } catch {
    // ignore
  }
}

export function markProblemSolved(id: string): Set<string> {
  const solved = loadTsumeProgress();
  solved.add(id);
  saveTsumeProgress(solved);
  return solved;
}

// clear all progress (テスト/リセット用)
export function resetTsumeProgress(): void {
  try {
    localStorage.removeItem(TSUME_PROGRESS_KEY);
  } catch {
    // ignore
  }
}

// エクスポート用に GameState から capture を計算
export function cloneCapturedPieces(cp: CapturedPieces): CapturedPieces {
  return {
    [Player.Sente]: [...cp[Player.Sente]],
    [Player.Gote]: [...cp[Player.Gote]],
  };
}
