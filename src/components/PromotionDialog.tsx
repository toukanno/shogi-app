import React from 'react';
import { Piece, PROMOTION_MAP, PIECE_NAMES } from '../models/ShogiTypes';

interface PromotionDialogProps {
  piece: Piece;
  onSelect: (promote: boolean) => void;
}

const PromotionDialog: React.FC<PromotionDialogProps> = ({ piece, onSelect }) => {
  const promotedType = PROMOTION_MAP[piece.type];
  const originalName = PIECE_NAMES[piece.type];
  const promotedName = promotedType ? PIECE_NAMES[promotedType] : '';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #3a2010 0%, #2a1508 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #8b6914',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 60px rgba(255,215,0,0.1)',
        textAlign: 'center',
        minWidth: '220px',
      }}>
        <h3 style={{
          color: '#ffd700',
          fontFamily: '"Noto Serif JP", serif',
          fontSize: '18px',
          marginBottom: '20px',
          textShadow: '0 0 10px rgba(255,215,0,0.3)',
        }}>
          成りますか？
        </h3>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => onSelect(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(180deg, #d42a2a 0%, #8b0000 100%)',
              border: '2px solid #ff4444',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '20px',
              fontFamily: '"Noto Serif JP", serif',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {promotedName}（成）
          </button>

          <button
            onClick={() => onSelect(false)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
              border: '2px solid #6b4c1e',
              borderRadius: '10px',
              color: '#e8d5a8',
              fontSize: '20px',
              fontFamily: '"Noto Serif JP", serif',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {originalName}（不成）
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionDialog;
