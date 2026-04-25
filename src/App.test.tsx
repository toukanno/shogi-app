import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { createInitialBoard, createInitialState, getValidMoves, executeMove, isInCheck, getAIMove, canPromoteMove, mustPromote, getDropPositions, isLegalMove } from './utils/ShogiLogic';
import { PieceType, Player, Piece, GameState } from './models/ShogiTypes';

// --- UI Tests ---
describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders main menu with title', () => {
    render(<App />);
    expect(screen.getByText('将棋')).toBeInTheDocument();
    expect(screen.getByText('マスターズ')).toBeInTheDocument();
  });

  test('renders CPU and 2-player buttons', () => {
    render(<App />);
    expect(screen.getByText(/CPU戦（あなた先手）/)).toBeInTheDocument();
    expect(screen.getByText(/CPU戦（あなた後手）/)).toBeInTheDocument();
    expect(screen.getByText(/AI観戦（両者CPU）/)).toBeInTheDocument();
    expect(screen.getByText(/二人対戦/)).toBeInTheDocument();
  });

  test('navigates to game screen on CPU button click', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/CPU戦（あなた先手）/));
    expect(screen.getByText(/先手の番/)).toBeInTheDocument();
    expect(screen.getByText(/CPU対戦（あなた先手）/)).toBeInTheDocument();
  });

  test('navigates to game screen on 2-player button click', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/二人対戦/));
    expect(screen.getByText(/先手の番/)).toBeInTheDocument();
    expect(screen.getByText(/二人対戦/)).toBeInTheDocument();
  });

  test('back button returns to menu', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/CPU戦（あなた先手）/));
    fireEvent.click(screen.getByText(/← 戻る/));
    expect(screen.getByText('将棋')).toBeInTheDocument();
  });

  test('待った button exists in PvP mode and is disabled at start', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/二人対戦/));
    const undoBtn = screen.getByRole('button', { name: '待った' }) as HTMLButtonElement;
    expect(undoBtn).toBeInTheDocument();
    expect(undoBtn.disabled).toBe(true);
  });

  test('待った button is hidden in AI観戦 (ai-vs-ai) mode', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/AI観戦（両者CPU）/));
    expect(screen.queryByRole('button', { name: '待った' })).toBeNull();
  });
});

// --- Game Logic Tests ---
describe('Initial Board Setup', () => {
  test('creates a 9x9 board', () => {
    const board = createInitialBoard();
    expect(board.length).toBe(9);
    board.forEach(row => expect(row.length).toBe(9));
  });

  test('places correct pieces for Sente', () => {
    const board = createInitialBoard();
    expect(board[8][4]).toEqual({ type: PieceType.King, owner: Player.Sente });
    expect(board[8][3]).toEqual({ type: PieceType.Gold, owner: Player.Sente });
    expect(board[8][0]).toEqual({ type: PieceType.Lance, owner: Player.Sente });
    expect(board[7][7]).toEqual({ type: PieceType.Rook, owner: Player.Sente });
    expect(board[7][1]).toEqual({ type: PieceType.Bishop, owner: Player.Sente });
  });

  test('places correct pieces for Gote', () => {
    const board = createInitialBoard();
    expect(board[0][4]).toEqual({ type: PieceType.King, owner: Player.Gote });
    expect(board[1][1]).toEqual({ type: PieceType.Rook, owner: Player.Gote });
    expect(board[1][7]).toEqual({ type: PieceType.Bishop, owner: Player.Gote });
  });

  test('places 9 pawns for each player', () => {
    const board = createInitialBoard();
    for (let col = 0; col < 9; col++) {
      expect(board[6][col]).toEqual({ type: PieceType.Pawn, owner: Player.Sente });
      expect(board[2][col]).toEqual({ type: PieceType.Pawn, owner: Player.Gote });
    }
  });

  test('middle rows are empty', () => {
    const board = createInitialBoard();
    for (let row = 3; row <= 5; row++) {
      for (let col = 0; col < 9; col++) {
        expect(board[row][col]).toBeNull();
      }
    }
  });
});

describe('Initial Game State', () => {
  test('starts with Sente', () => {
    const state = createInitialState();
    expect(state.currentPlayer).toBe(Player.Sente);
  });

  test('no check or checkmate initially', () => {
    const state = createInitialState();
    expect(state.isCheck).toBe(false);
    expect(state.isCheckmate).toBe(false);
    expect(state.isGameOver).toBe(false);
    expect(state.winner).toBeNull();
  });

  test('no captured pieces initially', () => {
    const state = createInitialState();
    expect(state.capturedPieces[Player.Sente]).toEqual([]);
    expect(state.capturedPieces[Player.Gote]).toEqual([]);
  });
});

describe('Piece Movement', () => {
  test('pawn can move one square forward', () => {
    const board = createInitialBoard();
    const pawn: Piece = { type: PieceType.Pawn, owner: Player.Sente };
    const moves = getValidMoves(board, { row: 6, col: 0 }, pawn);
    expect(moves).toEqual([{ row: 5, col: 0 }]);
  });

  test('king can move in all 8 directions', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const king: Piece = { type: PieceType.King, owner: Player.Sente };
    board[4][4] = king;
    const moves = getValidMoves(board, { row: 4, col: 4 }, king);
    expect(moves.length).toBe(8);
  });

  test('rook slides in 4 directions', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const rook: Piece = { type: PieceType.Rook, owner: Player.Sente };
    board[4][4] = rook;
    const moves = getValidMoves(board, { row: 4, col: 4 }, rook);
    // 4 up + 4 down + 4 left + 4 right = 16
    expect(moves.length).toBe(16);
  });

  test('bishop slides diagonally', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const bishop: Piece = { type: PieceType.Bishop, owner: Player.Sente };
    board[4][4] = bishop;
    const moves = getValidMoves(board, { row: 4, col: 4 }, bishop);
    // 4 upLeft + 4 upRight + 4 downLeft + 4 downRight = 16
    expect(moves.length).toBe(16);
  });

  test('knight jumps in L-shape', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const knight: Piece = { type: PieceType.Knight, owner: Player.Sente };
    board[4][4] = knight;
    const moves = getValidMoves(board, { row: 4, col: 4 }, knight);
    expect(moves).toEqual(expect.arrayContaining([
      { row: 2, col: 3 },
      { row: 2, col: 5 },
    ]));
    expect(moves.length).toBe(2);
  });

  test('lance slides forward only', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const lance: Piece = { type: PieceType.Lance, owner: Player.Sente };
    board[8][0] = lance;
    const moves = getValidMoves(board, { row: 8, col: 0 }, lance);
    expect(moves.length).toBe(8); // rows 0-7
  });

  test('piece cannot move to square occupied by own piece', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const rook: Piece = { type: PieceType.Rook, owner: Player.Sente };
    const pawn: Piece = { type: PieceType.Pawn, owner: Player.Sente };
    board[4][4] = rook;
    board[2][4] = pawn; // own piece blocking
    const moves = getValidMoves(board, { row: 4, col: 4 }, rook);
    expect(moves.some(m => m.row === 2 && m.col === 4)).toBe(false);
    expect(moves.some(m => m.row === 1 && m.col === 4)).toBe(false);
    expect(moves.some(m => m.row === 3 && m.col === 4)).toBe(true);
  });

  test('piece can capture opponent piece', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const rook: Piece = { type: PieceType.Rook, owner: Player.Sente };
    const enemyPawn: Piece = { type: PieceType.Pawn, owner: Player.Gote };
    board[4][4] = rook;
    board[2][4] = enemyPawn;
    const moves = getValidMoves(board, { row: 4, col: 4 }, rook);
    expect(moves.some(m => m.row === 2 && m.col === 4)).toBe(true);
    expect(moves.some(m => m.row === 1 && m.col === 4)).toBe(false);
  });

  test('gote pieces move in opposite direction', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const gotePawn: Piece = { type: PieceType.Pawn, owner: Player.Gote };
    board[2][4] = gotePawn;
    const moves = getValidMoves(board, { row: 2, col: 4 }, gotePawn);
    expect(moves).toEqual([{ row: 3, col: 4 }]);
  });
});

describe('Promoted Pieces', () => {
  test('promoted rook can move diagonally one step plus rook slides', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const promotedRook: Piece = { type: PieceType.PromotedRook, owner: Player.Sente };
    board[4][4] = promotedRook;
    const moves = getValidMoves(board, { row: 4, col: 4 }, promotedRook);
    // 4 diagonal steps + 4+4+4+4 slides = 4 + 16 = 20
    expect(moves.length).toBe(20);
  });

  test('promoted bishop can move orthogonally one step plus bishop slides', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const promotedBishop: Piece = { type: PieceType.PromotedBishop, owner: Player.Sente };
    board[4][4] = promotedBishop;
    const moves = getValidMoves(board, { row: 4, col: 4 }, promotedBishop);
    // 4 orthogonal steps + 4+4+4+4 diagonal slides = 4 + 16 = 20
    expect(moves.length).toBe(20);
  });

  test('gold general moves like gold', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const gold: Piece = { type: PieceType.Gold, owner: Player.Sente };
    board[4][4] = gold;
    const moves = getValidMoves(board, { row: 4, col: 4 }, gold);
    expect(moves.length).toBe(6);
  });

  test('promoted pawn moves like gold', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const promotedPawn: Piece = { type: PieceType.PromotedPawn, owner: Player.Sente };
    board[4][4] = promotedPawn;
    const moves = getValidMoves(board, { row: 4, col: 4 }, promotedPawn);
    expect(moves.length).toBe(6);
  });
});

describe('Check Detection', () => {
  test('detects check from rook', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.King, owner: Player.Sente };
    board[4][0] = { type: PieceType.Rook, owner: Player.Gote };
    expect(isInCheck(board, Player.Sente)).toBe(true);
  });

  test('no check when blocked', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.King, owner: Player.Sente };
    board[4][0] = { type: PieceType.Rook, owner: Player.Gote };
    board[4][2] = { type: PieceType.Pawn, owner: Player.Sente };
    expect(isInCheck(board, Player.Sente)).toBe(false);
  });
});

describe('Move Execution', () => {
  test('executing a move changes the current player', () => {
    const state = createInitialState();
    const move = {
      from: { row: 6, col: 0 },
      to: { row: 5, col: 0 },
      piece: { type: PieceType.Pawn, owner: Player.Sente },
    };
    const newState = executeMove(state, move);
    expect(newState.currentPlayer).toBe(Player.Gote);
  });

  test('capturing a piece adds it to captured pieces', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.Rook, owner: Player.Sente };
    board[4][0] = { type: PieceType.Pawn, owner: Player.Gote };

    const state: GameState = {
      board,
      currentPlayer: Player.Sente,
      capturedPieces: { [Player.Sente]: [], [Player.Gote]: [] },
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isGameOver: false,
      winner: null,
    };

    const move = {
      from: { row: 4, col: 4 },
      to: { row: 4, col: 0 },
      piece: { type: PieceType.Rook, owner: Player.Sente },
    };

    const newState = executeMove(state, move);
    expect(newState.capturedPieces[Player.Sente]).toContain(PieceType.Pawn);
  });

  test('promoted piece is captured as base type', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.Rook, owner: Player.Sente };
    board[4][0] = { type: PieceType.PromotedPawn, owner: Player.Gote };

    const state: GameState = {
      board,
      currentPlayer: Player.Sente,
      capturedPieces: { [Player.Sente]: [], [Player.Gote]: [] },
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isGameOver: false,
      winner: null,
    };

    const move = {
      from: { row: 4, col: 4 },
      to: { row: 4, col: 0 },
      piece: { type: PieceType.Rook, owner: Player.Sente },
    };

    const newState = executeMove(state, move);
    expect(newState.capturedPieces[Player.Sente]).toContain(PieceType.Pawn);
  });
});

describe('Promotion Rules', () => {
  test('pawn must promote on last rank', () => {
    const pawn: Piece = { type: PieceType.Pawn, owner: Player.Sente };
    expect(mustPromote(pawn, 0)).toBe(true);
    expect(mustPromote(pawn, 1)).toBe(false);
  });

  test('knight must promote on last two ranks', () => {
    const knight: Piece = { type: PieceType.Knight, owner: Player.Sente };
    expect(mustPromote(knight, 0)).toBe(true);
    expect(mustPromote(knight, 1)).toBe(true);
    expect(mustPromote(knight, 2)).toBe(false);
  });

  test('can promote when entering or exiting enemy territory', () => {
    const pawn: Piece = { type: PieceType.Pawn, owner: Player.Sente };
    expect(canPromoteMove(pawn, 3, 2)).toBe(true);  // entering
    expect(canPromoteMove(pawn, 2, 3)).toBe(true);  // exiting
    expect(canPromoteMove(pawn, 4, 3)).toBe(false);
  });

  test('gote promotion zone is rows 6-8', () => {
    const pawn: Piece = { type: PieceType.Pawn, owner: Player.Gote };
    expect(canPromoteMove(pawn, 5, 6)).toBe(true);
    expect(mustPromote(pawn, 8)).toBe(true);
  });
});

describe('Drop Rules', () => {
  test('cannot drop on occupied square', () => {
    const board = createInitialBoard();
    const drops = getDropPositions(board, PieceType.Pawn, Player.Sente);
    drops.forEach(pos => {
      expect(board[pos.row][pos.col]).toBeNull();
    });
  });

  test('pawn cannot be dropped on last rank', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const drops = getDropPositions(board, PieceType.Pawn, Player.Sente);
    expect(drops.some(p => p.row === 0)).toBe(false);
  });

  test('knight cannot be dropped on last two ranks', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const drops = getDropPositions(board, PieceType.Knight, Player.Sente);
    expect(drops.some(p => p.row === 0)).toBe(false);
    expect(drops.some(p => p.row === 1)).toBe(false);
  });

  test('二歩 (nifu) - cannot drop pawn in column that already has own pawn', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[5][3] = { type: PieceType.Pawn, owner: Player.Sente };
    const drops = getDropPositions(board, PieceType.Pawn, Player.Sente);
    expect(drops.some(p => p.col === 3)).toBe(false);
  });

  test('打ち歩詰め判定では相手の持ち駒による受けも考慮する', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[2][4] = { type: PieceType.King, owner: Player.Gote };
    board[4][4] = { type: PieceType.Rook, owner: Player.Sente };
    board[4][8] = { type: PieceType.King, owner: Player.Sente };

    const capturedPieces = {
      [Player.Sente]: [],
      [Player.Gote]: [PieceType.Gold],
    };
    const drops = getDropPositions(board, PieceType.Pawn, Player.Sente, capturedPieces);
    expect(drops.some(p => p.row === 3 && p.col === 4)).toBe(true);
  });
});

describe('Legal Move (self-check prevention)', () => {
  test('cannot move king into check', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.King, owner: Player.Sente };
    board[0][3] = { type: PieceType.Rook, owner: Player.Gote };
    const king: Piece = { type: PieceType.King, owner: Player.Sente };
    expect(isLegalMove(board, { row: 4, col: 4 }, { row: 4, col: 3 }, king)).toBe(false);
  });

  test('can move king to safe square', () => {
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    board[4][4] = { type: PieceType.King, owner: Player.Sente };
    board[0][3] = { type: PieceType.Rook, owner: Player.Gote };
    const king: Piece = { type: PieceType.King, owner: Player.Sente };
    expect(isLegalMove(board, { row: 4, col: 4 }, { row: 4, col: 5 }, king)).toBe(true);
  });
});

describe('AI', () => {
  test('AI returns a valid move', () => {
    const state = createInitialState();
    // Switch to Gote for AI
    const goteState = { ...state, currentPlayer: Player.Gote as Player };
    const move = getAIMove(goteState);
    expect(move).not.toBeNull();
    if (move) {
      expect(move.piece.owner).toBe(Player.Gote);
    }
  });

  test('AI returns null when no moves available', () => {
    // Empty board with just a king surrounded by enemy pieces
    const board: (Piece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    // This is an extreme case; just test that it handles gracefully
    const state: GameState = {
      board,
      currentPlayer: Player.Sente,
      capturedPieces: { [Player.Sente]: [], [Player.Gote]: [] },
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isGameOver: false,
      winner: null,
    };
    const move = getAIMove(state);
    expect(move).toBeNull();
  });
});
