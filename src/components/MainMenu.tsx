import React from 'react';
import { GameMode } from '../models/GameMode';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #1a0800 0%, #2d0a00 30%, #1a0800 70%, #0d0500 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装飾 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(255,215,0,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(196,30,58,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.03) 0%, transparent 70%)
        `,
        pointerEvents: 'none',
      }} />

      {/* 日の丸モチーフ */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        maxWidth: '400px',
        maxHeight: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,30,58,0.15) 0%, rgba(196,30,58,0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* タイトル */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 'clamp(14px, 3vw, 18px)',
          color: '#ffd700',
          fontFamily: '"Noto Sans JP", sans-serif',
          letterSpacing: '8px',
          marginBottom: '8px',
          textShadow: '0 0 20px rgba(255,215,0,0.3)',
        }}>
          日本将棋
        </div>
        <h1 style={{
          fontSize: 'clamp(48px, 12vw, 80px)',
          color: '#ffd700',
          fontFamily: '"Noto Serif JP", serif',
          fontWeight: 900,
          margin: 0,
          textShadow: `
            0 0 30px rgba(255,215,0,0.4),
            0 2px 4px rgba(0,0,0,0.8),
            0 4px 8px rgba(0,0,0,0.4)
          `,
          letterSpacing: '4px',
          lineHeight: 1.1,
        }}>
          将棋
        </h1>
        <div style={{
          fontSize: 'clamp(20px, 5vw, 32px)',
          color: '#e8d5a8',
          fontFamily: '"Noto Serif JP", serif',
          fontWeight: 'bold',
          marginTop: '4px',
          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
          letterSpacing: '6px',
        }}>
          マスターズ
        </div>
      </div>

      {/* 将棋の駒の装飾 */}
      <div style={{
        margin: '20px 0',
        position: 'relative',
      }}>
        <svg viewBox="0 0 120 140" width="80" height="93" style={{
          filter: 'drop-shadow(0 4px 12px rgba(255,215,0,0.3))',
        }}>
          <defs>
            <linearGradient id="menuPieceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#8b6914" />
            </linearGradient>
          </defs>
          <path
            d="M60 10 L108 40 L102 130 L18 130 L12 40 Z"
            fill="url(#menuPieceGrad)"
            stroke="#ffd700"
            strokeWidth="2"
          />
          <text
            x="60" y="90"
            textAnchor="middle"
            fill="#1a0800"
            fontSize="50"
            fontFamily="'Noto Serif JP', serif"
            fontWeight="bold"
          >
            王
          </text>
        </svg>
      </div>

      {/* メインボタン */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '320px',
        marginTop: '10px',
      }}>
        {/* 対局（AI） */}
        <button
          onClick={() => onStartGame('ai-sente')}
          style={{
            padding: '18px 32px',
            background: 'linear-gradient(180deg, #d42a2a 0%, #a01020 50%, #8b0000 100%)',
            border: '2px solid #ff4444',
            borderRadius: '14px',
            color: '#fff',
            fontSize: 'clamp(20px, 5vw, 26px)',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(196,30,58,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '3px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(196,30,58,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,30,58,0.4)';
          }}
        >
          <span style={{ fontSize: '28px' }}>⚔</span>
          CPU戦（あなた先手）
        </button>

        <button
          onClick={() => onStartGame('ai-gote')}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(180deg, #4a3520 0%, #3a2510 50%, #2a1810 100%)',
            border: '2px solid #8b6914',
            borderRadius: '14px',
            color: '#e8d5a8',
            fontSize: 'clamp(18px, 4vw, 22px)',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '3px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🤖</span>
          CPU戦（あなた後手）
        </button>

        <button
          onClick={() => onStartGame('ai-vs-ai')}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(180deg, #4a3520 0%, #3a2510 50%, #2a1810 100%)',
            border: '2px solid #8b6914',
            borderRadius: '14px',
            color: '#e8d5a8',
            fontSize: 'clamp(18px, 4vw, 22px)',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '3px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🎥</span>
          AI観戦（両者CPU）
        </button>

        {/* 二人対戦 */}
        <button
          onClick={() => onStartGame('pvp')}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(180deg, #4a3520 0%, #3a2510 50%, #2a1810 100%)',
            border: '2px solid #8b6914',
            borderRadius: '14px',
            color: '#e8d5a8',
            fontSize: 'clamp(18px, 4vw, 22px)',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '3px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
          }}
        >
          <span style={{ fontSize: '24px' }}>👥</span>
          二人対戦
        </button>
      </div>

      {/* バージョン */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        color: '#666',
        fontSize: '11px',
        fontFamily: '"Noto Sans JP", sans-serif',
      }}>
        Version 1.0.0
      </div>
    </div>
  );
};

export default MainMenu;
