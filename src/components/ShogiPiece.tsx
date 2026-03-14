import React from 'react';
import { Piece, Player, PIECE_NAMES, isPromoted } from '../models/ShogiTypes';

interface ShogiPieceProps {
  piece: Piece;
  size: number;
  selected?: boolean;
  onClick?: () => void;
}

const ShogiPiece: React.FC<ShogiPieceProps> = ({ piece, size, selected, onClick }) => {
  const isGote = piece.owner === Player.Gote;
  const promoted = isPromoted(piece.type);
  const name = PIECE_NAMES[piece.type];

  const fontSize = size * 0.55;

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isGote ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.15s ease',
        filter: selected ? 'drop-shadow(0 0 8px #ff6b35)' : 'none',
      }}
    >
      {/* 駒の形（五角形） */}
      <svg
        viewBox="0 0 100 110"
        width={size * 0.9}
        height={size * 0.95}
        style={{
          position: 'absolute',
          filter: selected
            ? 'drop-shadow(0 0 6px rgba(255, 107, 53, 0.8))'
            : 'drop-shadow(1px 2px 3px rgba(0,0,0,0.5))',
        }}
      >
        <defs>
          <linearGradient id={`pieceGrad-${piece.owner}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5e6c8" />
            <stop offset="50%" stopColor="#e8d5a8" />
            <stop offset="100%" stopColor="#d4bc82" />
          </linearGradient>
        </defs>
        <path
          d="M50 5 L90 30 L85 105 L15 105 L10 30 Z"
          fill={`url(#pieceGrad-${piece.owner})`}
          stroke="#8b6914"
          strokeWidth="1.5"
        />
      </svg>

      {/* 駒の文字 */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: `${fontSize}px`,
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontWeight: 'bold',
          color: promoted ? '#c41e3a' : '#1a0a00',
          textShadow: promoted ? '0 0 2px rgba(196, 30, 58, 0.3)' : 'none',
          lineHeight: 1,
          marginTop: size * 0.05,
          userSelect: 'none',
        }}
      >
        {name}
      </span>
    </div>
  );
};

export default ShogiPiece;
