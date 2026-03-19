import React from 'react';
import { PieceType, Player } from '../models/ShogiTypes';
import ShogiPiece from './ShogiPiece';

interface CapturedPiecesPanelProps {
  pieces: PieceType[];
  player: Player;
  isCurrentPlayer: boolean;
  selectedPiece: PieceType | null;
  onSelectPiece: (pieceType: PieceType) => void;
  cellSize: number;
}

const CapturedPiecesPanel: React.FC<CapturedPiecesPanelProps> = ({
  pieces, player, isCurrentPlayer, selectedPiece, onSelectPiece, cellSize,
}) => {
  // 同じ種類の駒をグループ化
  const grouped = pieces.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieceOrder = [
    PieceType.Rook, PieceType.Bishop, PieceType.Gold, PieceType.Silver,
    PieceType.Knight, PieceType.Lance, PieceType.Pawn,
  ];

  const sortedPieces = pieceOrder.filter(p => grouped[p]);
  const isGote = player === Player.Gote;
  const smallSize = cellSize * 0.7;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isGote ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: '2px',
      padding: '4px 8px',
      minHeight: smallSize + 10,
      alignItems: 'center',
      background: isCurrentPlayer
        ? 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)'
        : 'transparent',
      borderRadius: '6px',
      border: isCurrentPlayer ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: '12px',
        color: isCurrentPlayer ? '#ffd700' : '#a08050',
        fontFamily: '"Noto Sans JP", sans-serif',
        fontWeight: 'bold',
        marginRight: isGote ? 0 : 8,
        marginLeft: isGote ? 8 : 0,
        minWidth: '30px',
      }}>
        {isGote ? '☖後手' : '☗先手'}
      </div>

      {sortedPieces.length === 0 && (
        <span style={{ fontSize: '11px', color: '#666' }}>なし</span>
      )}

      {sortedPieces.map(pieceType => (
        <div
          key={pieceType}
          onClick={() => isCurrentPlayer && onSelectPiece(pieceType)}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: isCurrentPlayer ? 'pointer' : 'default',
            padding: '2px',
            borderRadius: '4px',
            background: selectedPiece === pieceType ? 'rgba(255,107,53,0.3)' : 'transparent',
            border: selectedPiece === pieceType ? '1px solid #ff6b35' : '1px solid transparent',
          }}
        >
          <ShogiPiece
            piece={{ type: pieceType, owner: player }}
            size={smallSize}
            selected={selectedPiece === pieceType}
          />
          {grouped[pieceType] > 1 && (
            <span style={{
              fontSize: '11px',
              color: '#ffd700',
              fontWeight: 'bold',
              marginLeft: '-2px',
            }}>
              ×{grouped[pieceType]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CapturedPiecesPanel;
