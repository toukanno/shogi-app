import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Player, PIECE_NAMES } from '../models/ShogiTypes';
import { createInitialState } from '../utils/ShogiLogic';
import ShogiBoard from './ShogiBoard';

interface GameScreenProps {
  vsAI: boolean;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ vsAI, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [moveCount, setMoveCount] = useState(0);
  const [boardSize, setBoardSize] = useState(360);

  // レスポンシブ盤面サイズ
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxSize = Math.min(vw - 32, vh * 0.55, 500);
      setBoardSize(Math.max(280, maxSize));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMove = useCallback((newState: GameState) => {
    setGameState(newState);
    setMoveCount(prev => prev + 1);
  }, []);

  const handleReset = () => {
    setGameState(createInitialState());
    setMoveCount(0);
  };

  const currentPlayerLabel = gameState.currentPlayer === Player.Sente ? '☗先手' : '☖後手';

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #1a0800 0%, #2d0a00 30%, #1a0800 70%, #0d0500 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 8px',
      position: 'relative',
    }}>
      {/* ヘッダー */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        padding: '0 4px',
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
            border: '1px solid #6b4c1e',
            borderRadius: '8px',
            color: '#e8d5a8',
            fontSize: '14px',
            fontFamily: '"Noto Sans JP", sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          ← 戻る
        </button>

        <div style={{
          textAlign: 'center',
          flex: 1,
        }}>
          <div style={{
            color: gameState.isCheck ? '#ff4444' : '#ffd700',
            fontSize: '16px',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            textShadow: gameState.isCheck
              ? '0 0 10px rgba(255,68,68,0.5)'
              : '0 0 10px rgba(255,215,0,0.3)',
          }}>
            {gameState.isCheckmate
              ? `${gameState.winner === Player.Sente ? '☗先手' : '☖後手'}の勝ち！`
              : gameState.isCheck
                ? `${currentPlayerLabel}の番 — 王手！`
                : `${currentPlayerLabel}の番`}
          </div>
          <div style={{
            color: '#a08050',
            fontSize: '11px',
            fontFamily: '"Noto Sans JP", sans-serif',
          }}>
            {vsAI ? 'CPU対戦' : '二人対戦'} · {moveCount}手目
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
            border: '1px solid #6b4c1e',
            borderRadius: '8px',
            color: '#e8d5a8',
            fontSize: '14px',
            fontFamily: '"Noto Sans JP", sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          初手
        </button>
      </div>

      {/* 盤面 */}
      <ShogiBoard
        gameState={gameState}
        onMove={handleMove}
        vsAI={vsAI}
        boardSize={boardSize}
      />

      {/* 勝利ダイアログ */}
      {gameState.isGameOver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #3a2010 0%, #2a1508 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '3px solid #ffd700',
            boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 80px rgba(255,215,0,0.2)',
            textAlign: 'center',
            maxWidth: '320px',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px',
            }}>
              🏆
            </div>
            <h2 style={{
              color: '#ffd700',
              fontFamily: '"Noto Serif JP", serif',
              fontSize: '28px',
              marginBottom: '8px',
              textShadow: '0 0 20px rgba(255,215,0,0.4)',
            }}>
              詰み！
            </h2>
            <p style={{
              color: '#e8d5a8',
              fontFamily: '"Noto Sans JP", sans-serif',
              fontSize: '18px',
              marginBottom: '24px',
            }}>
              {gameState.winner === Player.Sente ? '☗先手' : '☖後手'}の勝利
              <br />
              <span style={{ fontSize: '14px', color: '#a08050' }}>
                {moveCount}手で決着
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(180deg, #d42a2a 0%, #8b0000 100%)',
                  border: '2px solid #ff4444',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '18px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  letterSpacing: '2px',
                }}
              >
                もう一局
              </button>
              <button
                onClick={onBack}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
                  border: '2px solid #6b4c1e',
                  borderRadius: '12px',
                  color: '#e8d5a8',
                  fontSize: '18px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  letterSpacing: '2px',
                }}
              >
                メニュー
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
