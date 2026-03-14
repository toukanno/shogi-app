// 将棋の駒の種類
export enum PieceType {
  // 基本駒
  King = 'king',           // 王将・玉将
  Rook = 'rook',           // 飛車
  Bishop = 'bishop',       // 角行
  Gold = 'gold',           // 金将
  Silver = 'silver',       // 銀将
  Knight = 'knight',       // 桂馬
  Lance = 'lance',         // 香車
  Pawn = 'pawn',           // 歩兵

  // 成り駒
  PromotedRook = 'promoted_rook',       // 龍王
  PromotedBishop = 'promoted_bishop',   // 龍馬
  PromotedSilver = 'promoted_silver',   // 成銀
  PromotedKnight = 'promoted_knight',   // 成桂
  PromotedLance = 'promoted_lance',     // 成香
  PromotedPawn = 'promoted_pawn',       // と金
}

export enum Player {
  Sente = 'sente',  // 先手（下手）
  Gote = 'gote',    // 後手（上手）
}

export interface Piece {
  type: PieceType;
  owner: Player;
}

export interface Position {
  row: number;  // 0-8 (上から)
  col: number;  // 0-8 (左から)
}

export interface Move {
  from: Position | null;  // null = 持ち駒から打つ
  to: Position;
  piece: Piece;
  captured?: Piece;
  promoted?: boolean;
  dropPiece?: PieceType;  // 持ち駒から打つ場合
}

export interface CapturedPieces {
  [Player.Sente]: PieceType[];
  [Player.Gote]: PieceType[];
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  capturedPieces: CapturedPieces;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isGameOver: boolean;
  winner: Player | null;
}

// 駒の日本語名
export const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.King]: '王',
  [PieceType.Rook]: '飛',
  [PieceType.Bishop]: '角',
  [PieceType.Gold]: '金',
  [PieceType.Silver]: '銀',
  [PieceType.Knight]: '桂',
  [PieceType.Lance]: '香',
  [PieceType.Pawn]: '歩',
  [PieceType.PromotedRook]: '龍',
  [PieceType.PromotedBishop]: '馬',
  [PieceType.PromotedSilver]: '全',
  [PieceType.PromotedKnight]: '圭',
  [PieceType.PromotedLance]: '杏',
  [PieceType.PromotedPawn]: 'と',
};

// 成れる駒のマッピング
export const PROMOTION_MAP: Partial<Record<PieceType, PieceType>> = {
  [PieceType.Rook]: PieceType.PromotedRook,
  [PieceType.Bishop]: PieceType.PromotedBishop,
  [PieceType.Silver]: PieceType.PromotedSilver,
  [PieceType.Knight]: PieceType.PromotedKnight,
  [PieceType.Lance]: PieceType.PromotedLance,
  [PieceType.Pawn]: PieceType.PromotedPawn,
};

// 成り駒から元の駒へのマッピング
export const UNPROMOTION_MAP: Partial<Record<PieceType, PieceType>> = {
  [PieceType.PromotedRook]: PieceType.Rook,
  [PieceType.PromotedBishop]: PieceType.Bishop,
  [PieceType.PromotedSilver]: PieceType.Silver,
  [PieceType.PromotedKnight]: PieceType.Knight,
  [PieceType.PromotedLance]: PieceType.Lance,
  [PieceType.PromotedPawn]: PieceType.Pawn,
};

export function isPromoted(type: PieceType): boolean {
  return type in UNPROMOTION_MAP;
}

export function canPromote(type: PieceType): boolean {
  return type in PROMOTION_MAP;
}

export function getBaseType(type: PieceType): PieceType {
  return UNPROMOTION_MAP[type] || type;
}
