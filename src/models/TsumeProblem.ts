import { Piece, PieceType, Player, CapturedPieces } from './ShogiTypes';

// 詰将棋問題の盤面セルは「空」または駒1つ
export type TsumeCell = Piece | null;

// 詰将棋問題
export interface TsumeProblem {
  id: string;
  title: string;
  moves: 1 | 2;       // 何手詰め
  hint?: string;
  board: TsumeCell[][];   // 9x9
  hands: CapturedPieces;
}

// 盤面生成ヘルパー（省略表記から 9x9 を作る）
// 記法: 各セルは `{ type, owner }` または null。位置指定で渡す。
function emptyBoard(): TsumeCell[][] {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

function place(
  board: TsumeCell[][],
  row: number,
  col: number,
  type: PieceType,
  owner: Player,
): void {
  board[row][col] = { type, owner };
}

// --- 問題データ ---

// 問題1: 頭金（1手詰め）
function problem1(): TsumeProblem {
  const board = emptyBoard();
  place(board, 0, 4, PieceType.King, Player.Gote);
  place(board, 2, 4, PieceType.Pawn, Player.Sente);
  place(board, 8, 4, PieceType.King, Player.Sente);
  return {
    id: 'tsume-1',
    title: '第1問 · 頭金',
    moves: 1,
    hint: '金を打って王手。歩が支えている。',
    board,
    hands: {
      [Player.Sente]: [PieceType.Gold],
      [Player.Gote]: [],
    },
  };
}

// 問題2: 端の香打ち（1手詰め）
function problem2(): TsumeProblem {
  const board = emptyBoard();
  place(board, 0, 0, PieceType.King, Player.Gote);
  place(board, 1, 1, PieceType.Gold, Player.Sente);
  place(board, 8, 8, PieceType.King, Player.Sente);
  return {
    id: 'tsume-2',
    title: '第2問 · 香車打ち',
    moves: 1,
    hint: '香車を下から打ち込む。',
    board,
    hands: {
      [Player.Sente]: [PieceType.Lance],
      [Player.Gote]: [],
    },
  };
}

// 問題3: 飛車成り込み（1手詰め）
function problem3(): TsumeProblem {
  const board = emptyBoard();
  place(board, 0, 4, PieceType.King, Player.Gote);
  place(board, 1, 3, PieceType.Gold, Player.Sente);
  place(board, 1, 5, PieceType.Gold, Player.Sente);
  place(board, 8, 4, PieceType.King, Player.Sente);
  place(board, 8, 0, PieceType.Rook, Player.Sente);
  return {
    id: 'tsume-3',
    title: '第3問 · 飛車で詰ませる',
    moves: 1,
    hint: '持ち駒の飛車を頭に打つ。',
    board,
    hands: {
      [Player.Sente]: [PieceType.Rook],
      [Player.Gote]: [],
    },
  };
}

// 問題4: 2手詰め
function problem4(): TsumeProblem {
  const board = emptyBoard();
  place(board, 0, 4, PieceType.King, Player.Gote);
  place(board, 1, 4, PieceType.Pawn, Player.Gote);
  place(board, 2, 3, PieceType.Gold, Player.Sente);
  place(board, 2, 5, PieceType.Gold, Player.Sente);
  place(board, 8, 4, PieceType.King, Player.Sente);
  return {
    id: 'tsume-4',
    title: '第4問 · 2手詰め入門',
    moves: 2,
    hint: '金で王手 → 応手 → もう一手で詰み。',
    board,
    hands: {
      [Player.Sente]: [PieceType.Gold],
      [Player.Gote]: [],
    },
  };
}

// 問題5: 2手詰め（角の利き）
function problem5(): TsumeProblem {
  const board = emptyBoard();
  place(board, 0, 8, PieceType.King, Player.Gote);
  place(board, 1, 8, PieceType.Pawn, Player.Gote);
  place(board, 2, 6, PieceType.Silver, Player.Sente);
  place(board, 8, 4, PieceType.King, Player.Sente);
  return {
    id: 'tsume-5',
    title: '第5問 · 端玉の2手詰め',
    moves: 2,
    hint: '金を絡めて端玉を追い詰める。',
    board,
    hands: {
      [Player.Sente]: [PieceType.Gold, PieceType.Gold],
      [Player.Gote]: [],
    },
  };
}

export const TSUME_PROBLEMS: TsumeProblem[] = [
  problem1(),
  problem2(),
  problem3(),
  problem4(),
  problem5(),
];

export function getProblem(id: string): TsumeProblem | undefined {
  return TSUME_PROBLEMS.find(p => p.id === id);
}
