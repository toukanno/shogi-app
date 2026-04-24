import {
  PieceType, Player, Piece, Position, Move, GameState, CapturedPieces,
  PROMOTION_MAP, canPromote, getBaseType, isPromoted
} from '../models/ShogiTypes';

// 初期盤面の生成
export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));

  // 後手（上手）の駒配置
  board[0][0] = { type: PieceType.Lance, owner: Player.Gote };
  board[0][1] = { type: PieceType.Knight, owner: Player.Gote };
  board[0][2] = { type: PieceType.Silver, owner: Player.Gote };
  board[0][3] = { type: PieceType.Gold, owner: Player.Gote };
  board[0][4] = { type: PieceType.King, owner: Player.Gote };
  board[0][5] = { type: PieceType.Gold, owner: Player.Gote };
  board[0][6] = { type: PieceType.Silver, owner: Player.Gote };
  board[0][7] = { type: PieceType.Knight, owner: Player.Gote };
  board[0][8] = { type: PieceType.Lance, owner: Player.Gote };
  board[1][1] = { type: PieceType.Rook, owner: Player.Gote };
  board[1][7] = { type: PieceType.Bishop, owner: Player.Gote };
  for (let col = 0; col < 9; col++) {
    board[2][col] = { type: PieceType.Pawn, owner: Player.Gote };
  }

  // 先手（下手）の駒配置
  board[8][0] = { type: PieceType.Lance, owner: Player.Sente };
  board[8][1] = { type: PieceType.Knight, owner: Player.Sente };
  board[8][2] = { type: PieceType.Silver, owner: Player.Sente };
  board[8][3] = { type: PieceType.Gold, owner: Player.Sente };
  board[8][4] = { type: PieceType.King, owner: Player.Sente };
  board[8][5] = { type: PieceType.Gold, owner: Player.Sente };
  board[8][6] = { type: PieceType.Silver, owner: Player.Sente };
  board[8][7] = { type: PieceType.Knight, owner: Player.Sente };
  board[8][8] = { type: PieceType.Lance, owner: Player.Sente };
  board[7][7] = { type: PieceType.Rook, owner: Player.Sente };
  board[7][1] = { type: PieceType.Bishop, owner: Player.Sente };
  for (let col = 0; col < 9; col++) {
    board[6][col] = { type: PieceType.Pawn, owner: Player.Sente };
  }

  return board;
}

// 初期状態の生成
export function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: Player.Sente,
    capturedPieces: {
      [Player.Sente]: [],
      [Player.Gote]: [],
    },
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isGameOver: false,
    winner: null,
  };
}

// 方向の定義（先手視点：上がマイナス）
const DIRECTIONS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  upLeft: [-1, -1],
  upRight: [-1, 1],
  downLeft: [1, -1],
  downRight: [1, 1],
};

// 駒の移動可能方向を取得（先手視点）
function getPieceMoves(type: PieceType): { steps: number[][]; slides: number[][] } {
  switch (type) {
    case PieceType.King:
      return {
        steps: [
          DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right,
          DIRECTIONS.upLeft, DIRECTIONS.upRight, DIRECTIONS.downLeft, DIRECTIONS.downRight,
        ],
        slides: [],
      };
    case PieceType.Rook:
      return {
        steps: [],
        slides: [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right],
      };
    case PieceType.Bishop:
      return {
        steps: [],
        slides: [DIRECTIONS.upLeft, DIRECTIONS.upRight, DIRECTIONS.downLeft, DIRECTIONS.downRight],
      };
    case PieceType.Gold:
    case PieceType.PromotedSilver:
    case PieceType.PromotedKnight:
    case PieceType.PromotedLance:
    case PieceType.PromotedPawn:
      return {
        steps: [
          DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right,
          DIRECTIONS.upLeft, DIRECTIONS.upRight,
        ],
        slides: [],
      };
    case PieceType.Silver:
      return {
        steps: [
          DIRECTIONS.up, DIRECTIONS.upLeft, DIRECTIONS.upRight,
          DIRECTIONS.downLeft, DIRECTIONS.downRight,
        ],
        slides: [],
      };
    case PieceType.Knight:
      return {
        steps: [[-2, -1], [-2, 1]],
        slides: [],
      };
    case PieceType.Lance:
      return {
        steps: [],
        slides: [DIRECTIONS.up],
      };
    case PieceType.Pawn:
      return {
        steps: [DIRECTIONS.up],
        slides: [],
      };
    case PieceType.PromotedRook:
      return {
        steps: [DIRECTIONS.upLeft, DIRECTIONS.upRight, DIRECTIONS.downLeft, DIRECTIONS.downRight],
        slides: [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right],
      };
    case PieceType.PromotedBishop:
      return {
        steps: [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right],
        slides: [DIRECTIONS.upLeft, DIRECTIONS.upRight, DIRECTIONS.downLeft, DIRECTIONS.downRight],
      };
    default:
      return { steps: [], slides: [] };
  }
}

// 盤面内かチェック
function isInBoard(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

// 後手の場合、方向を反転
function adjustDirection(dir: number[], owner: Player): number[] {
  if (owner === Player.Gote) {
    return [-dir[0], -dir[1]];
  }
  return dir;
}

// 特定の駒の移動可能マスを取得
export function getValidMoves(
  board: (Piece | null)[][],
  pos: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const { steps, slides } = getPieceMoves(piece.type);

  // ステップ移動
  for (const dir of steps) {
    const adjusted = adjustDirection(dir, piece.owner);
    const newRow = pos.row + adjusted[0];
    const newCol = pos.col + adjusted[1];

    if (isInBoard(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target || target.owner !== piece.owner) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  // スライド移動
  for (const dir of slides) {
    const adjusted = adjustDirection(dir, piece.owner);
    let newRow = pos.row + adjusted[0];
    let newCol = pos.col + adjusted[1];

    while (isInBoard(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (target) {
        if (target.owner !== piece.owner) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      moves.push({ row: newRow, col: newCol });
      newRow += adjusted[0];
      newCol += adjusted[1];
    }
  }

  return moves;
}

// 王の位置を取得
function findKing(board: (Piece | null)[][], player: Player): Position | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PieceType.King && piece.owner === player) {
        return { row, col };
      }
    }
  }
  return null;
}

// 王手かチェック
export function isInCheck(board: (Piece | null)[][], player: Player): boolean {
  const kingPos = findKing(board, player);
  if (!kingPos) return false;

  const opponent = player === Player.Sente ? Player.Gote : Player.Sente;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.owner === opponent) {
        const moves = getValidMoves(board, { row, col }, piece);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// 成りが必須かチェック
export function mustPromote(piece: Piece, toRow: number): boolean {
  if (piece.owner === Player.Sente) {
    if (piece.type === PieceType.Pawn || piece.type === PieceType.Lance) {
      return toRow === 0;
    }
    if (piece.type === PieceType.Knight) {
      return toRow <= 1;
    }
  } else {
    if (piece.type === PieceType.Pawn || piece.type === PieceType.Lance) {
      return toRow === 8;
    }
    if (piece.type === PieceType.Knight) {
      return toRow >= 7;
    }
  }
  return false;
}

// 成りが可能かチェック
export function canPromoteMove(piece: Piece, fromRow: number, toRow: number): boolean {
  if (!canPromote(piece.type)) return false;
  if (isPromoted(piece.type)) return false;

  if (piece.owner === Player.Sente) {
    return fromRow <= 2 || toRow <= 2;
  } else {
    return fromRow >= 6 || toRow >= 6;
  }
}

// 持ち駒を打てるマスを取得
export function getDropPositions(
  board: (Piece | null)[][],
  pieceType: PieceType,
  player: Player,
  capturedPieces?: CapturedPieces
): Position[] {
  const positions: Position[] = [];
  const capturedForJudge: CapturedPieces = capturedPieces ?? {
    [Player.Sente]: [],
    [Player.Gote]: [],
  };

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== null) continue;

      // 歩・香車は1段目に打てない
      if (player === Player.Sente) {
        if ((pieceType === PieceType.Pawn || pieceType === PieceType.Lance) && row === 0) continue;
        if (pieceType === PieceType.Knight && row <= 1) continue;
      } else {
        if ((pieceType === PieceType.Pawn || pieceType === PieceType.Lance) && row === 8) continue;
        if (pieceType === PieceType.Knight && row >= 7) continue;
      }

      // 二歩チェック
      if (pieceType === PieceType.Pawn) {
        let hasPawnInCol = false;
        for (let r = 0; r < 9; r++) {
          const p = board[r][col];
          if (p && p.type === PieceType.Pawn && p.owner === player) {
            hasPawnInCol = true;
            break;
          }
        }
        if (hasPawnInCol) continue;

        // 打ち歩詰めチェック
        const testBoard = cloneBoard(board);
        testBoard[row][col] = { type: PieceType.Pawn, owner: player };
        const opponent = player === Player.Sente ? Player.Gote : Player.Sente;
        if (isInCheck(testBoard, opponent) && isCheckmatedOnBoard(testBoard, opponent, capturedForJudge)) {
          continue;
        }
      }

      positions.push({ row, col });
    }
  }

  return positions;
}

// 盤面をコピー
function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

// 移動を実行（新しい盤面を返す）
export function executeMove(state: GameState, move: Move): GameState {
  const newBoard = cloneBoard(state.board);
  const newCaptured: CapturedPieces = {
    [Player.Sente]: [...state.capturedPieces[Player.Sente]],
    [Player.Gote]: [...state.capturedPieces[Player.Gote]],
  };

  if (move.from) {
    // 盤上の駒を移動
    newBoard[move.from.row][move.from.col] = null;
  } else if (move.dropPiece) {
    // 持ち駒から打つ
    const idx = newCaptured[move.piece.owner].indexOf(move.dropPiece);
    if (idx !== -1) {
      newCaptured[move.piece.owner].splice(idx, 1);
    }
  }

  // 駒を取る
  const captured = newBoard[move.to.row][move.to.col];
  if (captured) {
    const baseType = getBaseType(captured.type);
    newCaptured[move.piece.owner].push(baseType);
  }

  // 駒を配置
  let newPiece = { ...move.piece };
  if (move.promoted && PROMOTION_MAP[move.piece.type]) {
    newPiece.type = PROMOTION_MAP[move.piece.type]!;
  }
  newBoard[move.to.row][move.to.col] = newPiece;

  const nextPlayer = state.currentPlayer === Player.Sente ? Player.Gote : Player.Sente;
  const check = isInCheck(newBoard, nextPlayer);

  // 詰みチェック（簡易版）
  let checkmate = false;
  if (check) {
    checkmate = isCheckmated(newBoard, nextPlayer, newCaptured);
  }

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    capturedPieces: newCaptured,
    moveHistory: [...state.moveHistory, { ...move, captured: captured || undefined }],
    isCheck: check,
    isCheckmate: checkmate,
    isGameOver: checkmate,
    winner: checkmate ? state.currentPlayer : null,
  };
}

// 詰みチェック（盤面のみ、持ち駒なし - 打ち歩詰め判定用）
function isCheckmatedOnBoard(
  board: (Piece | null)[][],
  player: Player,
  captured: CapturedPieces
): boolean {
  // 全ての自分の駒について、合法手があるか確認
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.owner === player) {
        const moves = getValidMoves(board, { row, col }, piece);
        for (const move of moves) {
          const testBoard = cloneBoard(board);
          testBoard[row][col] = null;
          testBoard[move.row][move.col] = piece;
          if (!isInCheck(testBoard, player)) {
            return false;
          }
        }
      }
    }
  }

  // 持ち駒で合駒できるか確認
  const uniqueCaptured = Array.from(new Set(captured[player]));
  for (const pieceType of uniqueCaptured) {
    const drops = getDropPositions(board, pieceType, player, captured);
    for (const pos of drops) {
      const testBoard = cloneBoard(board);
      testBoard[pos.row][pos.col] = { type: pieceType, owner: player };
      if (!isInCheck(testBoard, player)) {
        return false;
      }
    }
  }

  return true;
}

// 詰みチェック（フル版）
function isCheckmated(
  board: (Piece | null)[][],
  player: Player,
  captured: CapturedPieces
): boolean {
  return isCheckmatedOnBoard(board, player, captured);
}

// 合法手かチェック（自玉が王手にならないか）
export function isLegalMove(
  board: (Piece | null)[][],
  from: Position | null,
  to: Position,
  piece: Piece,
  promoted: boolean = false
): boolean {
  const testBoard = cloneBoard(board);

  if (from) {
    testBoard[from.row][from.col] = null;
  }

  let newPiece = { ...piece };
  if (promoted && PROMOTION_MAP[piece.type]) {
    newPiece.type = PROMOTION_MAP[piece.type]!;
  }
  testBoard[to.row][to.col] = newPiece;

  return !isInCheck(testBoard, piece.owner);
}

// 駒の価値
const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.King]: 15000,
  [PieceType.Rook]: 1000,
  [PieceType.Bishop]: 900,
  [PieceType.Gold]: 500,
  [PieceType.Silver]: 450,
  [PieceType.Knight]: 300,
  [PieceType.Lance]: 250,
  [PieceType.Pawn]: 100,
  [PieceType.PromotedRook]: 1300,
  [PieceType.PromotedBishop]: 1200,
  [PieceType.PromotedSilver]: 510,
  [PieceType.PromotedKnight]: 510,
  [PieceType.PromotedLance]: 510,
  [PieceType.PromotedPawn]: 520,
};

// 持ち駒の価値（盤上より少し低めに評価し、打てる柔軟性も考慮）
const HAND_VALUES: Partial<Record<PieceType, number>> = {
  [PieceType.Rook]: 1050,
  [PieceType.Bishop]: 950,
  [PieceType.Gold]: 480,
  [PieceType.Silver]: 430,
  [PieceType.Knight]: 270,
  [PieceType.Lance]: 230,
  [PieceType.Pawn]: 90,
};

// 詰みスコア（深さに応じて逓減させ、最短詰みを優先）
const MATE_SCORE = 1_000_000;

// 全ての合法手を生成
function generateAllMoves(state: GameState): Move[] {
  const player = state.currentPlayer;
  const allMoves: Move[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = state.board[row][col];
      if (piece && piece.owner === player) {
        const moves = getValidMoves(state.board, { row, col }, piece);
        for (const to of moves) {
          const canProm = canPromoteMove(piece, row, to.row);
          const mustProm = mustPromote(piece, to.row);

          if (canProm) {
            if (isLegalMove(state.board, { row, col }, to, piece, true)) {
              allMoves.push({ from: { row, col }, to, piece, promoted: true });
            }
            if (!mustProm && isLegalMove(state.board, { row, col }, to, piece, false)) {
              allMoves.push({ from: { row, col }, to, piece, promoted: false });
            }
          } else if (isLegalMove(state.board, { row, col }, to, piece, false)) {
            allMoves.push({ from: { row, col }, to, piece, promoted: false });
          }
        }
      }
    }
  }

  const uniqueCaptured = Array.from(new Set(state.capturedPieces[player]));
  for (const pieceType of uniqueCaptured) {
    const drops = getDropPositions(state.board, pieceType, player, state.capturedPieces);
    for (const pos of drops) {
      const piece: Piece = { type: pieceType, owner: player };
      if (isLegalMove(state.board, null, pos, piece)) {
        allMoves.push({ from: null, to: pos, piece, dropPiece: pieceType });
      }
    }
  }

  return allMoves;
}

// 手の並び替え用スコア（αβ枝刈りを効かせるため、有望な手を先に試す）
function moveOrderScore(state: GameState, move: Move): number {
  let s = 0;
  const target = state.board[move.to.row][move.to.col];
  if (target) {
    // MVV-LVA：高価値の駒を安価な駒で取るほど先に試す
    s += 10 * PIECE_VALUES[target.type] - PIECE_VALUES[move.piece.type];
  }
  if (move.promoted) {
    const promotedType = PROMOTION_MAP[move.piece.type];
    if (promotedType) {
      s += PIECE_VALUES[promotedType] - PIECE_VALUES[move.piece.type];
    }
  }
  // 敵陣に向かう手を優先
  if (move.piece.owner === Player.Sente) {
    s += (8 - move.to.row) * 2;
  } else {
    s += move.to.row * 2;
  }
  return s;
}

// 位置評価（AI視点での静的評価値）
function evaluatePosition(state: GameState, aiPlayer: Player): number {
  // 詰みは末端で特別扱い
  if (state.isCheckmate) {
    return state.winner === aiPlayer ? MATE_SCORE : -MATE_SCORE;
  }

  const opponent = aiPlayer === Player.Sente ? Player.Gote : Player.Sente;
  let score = 0;

  // 盤上の駒得評価 + 簡易位置評価
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = state.board[row][col];
      if (!piece) continue;
      const sign = piece.owner === aiPlayer ? 1 : -1;
      score += sign * PIECE_VALUES[piece.type];

      // 敵陣に侵入した駒へのボーナス（成り駒除く）
      if (!isPromoted(piece.type) && piece.type !== PieceType.King) {
        if (piece.owner === Player.Sente && row <= 2) {
          score += sign * 20;
        } else if (piece.owner === Player.Gote && row >= 6) {
          score += sign * 20;
        }
      }

      // 金銀の中央寄せ（ごく弱い位置評価）
      if (piece.type === PieceType.Gold || piece.type === PieceType.Silver) {
        const centerDist = Math.abs(col - 4) + Math.abs(row - 4);
        score += sign * (8 - centerDist);
      }
    }
  }

  // 持ち駒評価
  for (const t of state.capturedPieces[aiPlayer]) {
    score += HAND_VALUES[t] ?? 0;
  }
  for (const t of state.capturedPieces[opponent]) {
    score -= HAND_VALUES[t] ?? 0;
  }

  // 王手ボーナス（軽め、戦術的圧力の指標）
  if (state.isCheck) {
    score += state.currentPlayer === aiPlayer ? -30 : 30;
  }

  return score;
}

// ネガマックス + αβ枝刈り
function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
  deadline: number
): number {
  // 時間切れチェック（各ノードで軽くチェック）
  if (Date.now() > deadline) {
    const sign = state.currentPlayer === aiPlayer ? 1 : -1;
    return sign * evaluatePosition(state, aiPlayer);
  }

  if (state.isCheckmate) {
    // 手番側が詰まされている = 手番側の負け
    return -(MATE_SCORE - (10 - depth));
  }

  if (depth === 0) {
    const sign = state.currentPlayer === aiPlayer ? 1 : -1;
    return sign * evaluatePosition(state, aiPlayer);
  }

  const moves = generateAllMoves(state);
  if (moves.length === 0) {
    // 合法手なし（稀：将棋にステイルメイトはなく、実質詰み）
    return -(MATE_SCORE - (10 - depth));
  }

  moves.sort((a, b) => moveOrderScore(state, b) - moveOrderScore(state, a));

  let best = -Infinity;
  for (const move of moves) {
    const newState = executeMove(state, move);
    const score = -negamax(newState, depth - 1, -beta, -alpha, aiPlayer, deadline);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

// AIの手を取得（反復深化 + αβ探索）
export function getAIMove(state: GameState): Move | null {
  const aiPlayer = state.currentPlayer;
  const rootMoves = generateAllMoves(state);
  if (rootMoves.length === 0) return null;

  rootMoves.sort((a, b) => moveOrderScore(state, b) - moveOrderScore(state, a));

  const MAX_DEPTH = 3;
  const TIME_BUDGET_MS = 800;
  const start = Date.now();
  const deadline = start + TIME_BUDGET_MS;

  let bestMoves: Move[] = [rootMoves[0]];
  let orderedMoves: Move[] = rootMoves;

  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    if (Date.now() > deadline) break;

    let alpha = -Infinity;
    const beta = Infinity;
    const scored: Array<{ move: Move; score: number }> = [];
    let timedOut = false;

    for (const move of orderedMoves) {
      if (Date.now() > deadline) {
        timedOut = true;
        break;
      }
      const newState = executeMove(state, move);
      const score = -negamax(newState, depth - 1, -beta, -alpha, aiPlayer, deadline);
      scored.push({ move, score });
      if (score > alpha) alpha = score;
    }

    if (!timedOut && scored.length > 0) {
      scored.sort((a, b) => b.score - a.score);
      const bestScore = scored[0].score;
      // 同点上位手を候補化（棋譜の変化を残す）
      const EPS = 5;
      bestMoves = scored.filter(s => s.score >= bestScore - EPS).map(s => s.move);
      // 次深度の探索順を最善順で並べ直す（αβ効率UP）
      orderedMoves = scored.map(s => s.move);

      // 勝ち確定が見えたら探索打ち切り
      if (bestScore >= MATE_SCORE - 100) break;
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
