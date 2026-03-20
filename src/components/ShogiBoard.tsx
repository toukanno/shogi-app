import React, { useState, useCallback } from 'react';
import {
  Piece, PieceType, Player, Position, GameState, Move
} from '../models/ShogiTypes';
import {
  getValidMoves, isLegalMove, canPromoteMove, mustPromote,
  getDropPositions, executeMove, getAIMove
} from '../utils/ShogiLogic';
import ShogiPiece from './ShogiPiece';
import CapturedPiecesPanel from './CapturedPiecesPanel';
import PromotionDialog from './PromotionDialog';

interface ShogiBoardProps {
  gameState: GameState;
  onMove: (newState: GameState) => void;
  vsAI: boolean;
  boardSize: number;
}

const ShogiBoard: React.FC<ShogiBoardProps> = ({ gameState, onMove, vsAI, boardSize }) => {
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<PieceType | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [promotionChoice, setPromotionChoice] = useState<{
    from: Position | null;
    to: Position;
    piece: Piece;
  } | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const cellSize = boardSize / 9;

  const applyMove = useCallback((move: Move) => {
    const newState = executeMove(gameState, move);
    setLastMove(move);
    onMove(newState);

    // AI の番
    if (vsAI && !newState.isGameOver) {
      setTimeout(() => {
        const aiMove = getAIMove(newState);
        if (aiMove) {
          const aiState = executeMove(newState, aiMove);
          setLastMove(aiMove);
          onMove(aiState);
        }
      }, 500);
    }
  }, [gameState, onMove, vsAI]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.isGameOver) return;
    if (promotionChoice) return;

    const clickedPiece = gameState.board[row][col];

    // 持ち駒を打つモード
    if (selectedDrop) {
      if (clickedPiece) {
        setSelectedDrop(null);
        setValidMoves([]);
        return;
      }
      if (validMoves.some(m => m.row === row && m.col === col)) {
        const piece: Piece = { type: selectedDrop, owner: gameState.currentPlayer };
        const move: Move = {
          from: null,
          to: { row, col },
          piece,
          dropPiece: selectedDrop,
        };
        applyMove(move);
        setSelectedDrop(null);
        setValidMoves([]);
      }
      return;
    }

    // 移動先を選択
    if (selectedPos && validMoves.some(m => m.row === row && m.col === col)) {
      const piece = gameState.board[selectedPos.row][selectedPos.col]!;
      const canProm = canPromoteMove(piece, selectedPos.row, row);
      const mustProm = mustPromote(piece, row);

      if (canProm && !mustProm) {
        setPromotionChoice({ from: selectedPos, to: { row, col }, piece });
        return;
      }

      const move: Move = {
        from: selectedPos,
        to: { row, col },
        piece,
        promoted: mustProm,
      };
      applyMove(move);
      setSelectedPos(null);
      setValidMoves([]);
      return;
    }

    // 自分の駒を選択
    if (clickedPiece && clickedPiece.owner === gameState.currentPlayer) {
      setSelectedPos({ row, col });
      setSelectedDrop(null);
      const moves = getValidMoves(gameState.board, { row, col }, clickedPiece)
        .filter(m => isLegalMove(gameState.board, { row, col }, m, clickedPiece));
      setValidMoves(moves);
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  }, [gameState, selectedPos, selectedDrop, validMoves, promotionChoice, applyMove]);

  const handleDropSelect = useCallback((pieceType: PieceType) => {
    if (gameState.isGameOver) return;
    if (selectedDrop === pieceType) {
      setSelectedDrop(null);
      setValidMoves([]);
      return;
    }
    setSelectedPos(null);
    setSelectedDrop(pieceType);
    const drops = getDropPositions(gameState.board, pieceType, gameState.currentPlayer)
      .filter(pos => isLegalMove(gameState.board, null, pos, { type: pieceType, owner: gameState.currentPlayer }));
    setValidMoves(drops);
  }, [gameState, selectedDrop]);

  const handlePromotion = useCallback((promote: boolean) => {
    if (!promotionChoice) return;
    const move: Move = {
      from: promotionChoice.from,
      to: promotionChoice.to,
      piece: promotionChoice.piece,
      promoted: promote,
    };
    applyMove(move);
    setPromotionChoice(null);
    setSelectedPos(null);
    setValidMoves([]);
  }, [promotionChoice, applyMove]);

  // 盤面座標の表示
  const colLabels = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
  const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      width: '100%',
    }}>
      {/* 後手の持ち駒 */}
      <CapturedPiecesPanel
        pieces={gameState.capturedPieces[Player.Gote]}
        player={Player.Gote}
        isCurrentPlayer={gameState.currentPlayer === Player.Gote && !vsAI}
        selectedPiece={gameState.currentPlayer === Player.Gote ? selectedDrop : null}
        onSelectPiece={handleDropSelect}
        cellSize={cellSize}
      />

      {/* 盤面 */}
      <div style={{ position: 'relative' }}>
        {/* 列ラベル（上） */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2px',
          paddingLeft: cellSize * 0.3,
        }}>
          {colLabels.map((label, i) => (
            <div key={i} style={{
              width: cellSize,
              textAlign: 'center',
              fontSize: '11px',
              color: '#a08050',
              fontFamily: '"Noto Sans JP", sans-serif',
            }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          {/* 盤面本体 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(9, ${cellSize}px)`,
            gridTemplateRows: `repeat(9, ${cellSize}px)`,
            border: '3px solid #6b4c1e',
            borderRadius: '2px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #e8c875 0%, #d4a843 50%, #c99a38 100%)',
            position: 'relative',
          }}>
            {/* 星マーク */}
            {[
              { row: 2, col: 2 }, { row: 2, col: 5 },
              { row: 5, col: 2 }, { row: 5, col: 5 },
            ].map(({ row: sr, col: sc }) => (
              <div key={`star-${sr}-${sc}`} style={{
                position: 'absolute',
                left: sc * cellSize + cellSize - 3,
                top: sr * cellSize + cellSize - 3,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6b5010',
                zIndex: 1,
              }} />
            ))}

            {gameState.board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                const isSelected = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;
                const isValid = validMoves.some(m => m.row === rowIdx && m.col === colIdx);
                const isLastFrom = lastMove?.from?.row === rowIdx && lastMove?.from?.col === colIdx;
                const isLastTo = lastMove?.to.row === rowIdx && lastMove?.to.col === colIdx;
                const isCheckSquare = gameState.isCheck && piece?.type === PieceType.King &&
                  piece?.owner === gameState.currentPlayer;

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      border: '0.5px solid rgba(107, 80, 16, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      background: isSelected
                        ? 'rgba(255, 107, 53, 0.35)'
                        : isCheckSquare
                          ? 'rgba(255, 0, 0, 0.3)'
                          : isLastTo
                            ? 'rgba(255, 215, 0, 0.25)'
                            : isLastFrom
                              ? 'rgba(255, 215, 0, 0.12)'
                              : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {isValid && !piece && (
                      <div style={{
                        width: cellSize * 0.3,
                        height: cellSize * 0.3,
                        borderRadius: '50%',
                        background: 'rgba(76, 175, 80, 0.5)',
                        boxShadow: '0 0 6px rgba(76, 175, 80, 0.4)',
                      }} />
                    )}
                    {isValid && piece && (
                      <div style={{
                        position: 'absolute',
                        inset: 2,
                        border: '2px solid rgba(255, 68, 68, 0.7)',
                        borderRadius: '3px',
                        background: 'rgba(255, 68, 68, 0.15)',
                      }} />
                    )}
                    {piece && (
                      <ShogiPiece
                        piece={piece}
                        size={cellSize * 0.88}
                        selected={isSelected}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 行ラベル（右） */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: '3px',
          }}>
            {rowLabels.map((label, i) => (
              <div key={i} style={{
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                fontSize: '11px',
                color: '#a08050',
                fontFamily: '"Noto Serif JP", serif',
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 先手の持ち駒 */}
      <CapturedPiecesPanel
        pieces={gameState.capturedPieces[Player.Sente]}
        player={Player.Sente}
        isCurrentPlayer={gameState.currentPlayer === Player.Sente}
        selectedPiece={gameState.currentPlayer === Player.Sente ? selectedDrop : null}
        onSelectPiece={handleDropSelect}
        cellSize={cellSize}
      />

      {/* 成り選択ダイアログ */}
      {promotionChoice && (
        <PromotionDialog
          piece={promotionChoice.piece}
          onSelect={handlePromotion}
        />
      )}
    </div>
  );
};

export default ShogiBoard;
