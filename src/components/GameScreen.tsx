import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Move, PIECE_NAMES } from '../models/ShogiTypes';
import { createInitialState, executeMove } from '../utils/ShogiLogic';
import ShogiBoard from './ShogiBoard';
import { GameMode } from '../models/GameMode';

interface GameScreenProps {
  gameMode: GameMode;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameMode, onBack }) => {
  const storageKey = `shogi-app-save-${gameMode}`;
  const aiControlsSente = gameMode === 'ai-gote' || gameMode === 'ai-vs-ai';
  const aiControlsGote = gameMode === 'ai-sente' || gameMode === 'ai-vs-ai';
  const modeLabel = gameMode === 'pvp'
    ? '二人対戦'
    : gameMode === 'ai-sente'
      ? 'CPU対戦（あなた先手）'
      : gameMode === 'ai-gote'
        ? 'CPU対戦（あなた後手）'
        : 'AI観戦（両者CPU）';
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as GameState;
      }
    } catch (error) {
      console.warn('保存データの読み込みに失敗しました', error);
    }
    return createInitialState();
  });
  const [boardSize, setBoardSize] = useState(360);
  const [isSaved, setIsSaved] = useState(false);

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
    setIsSaved(false);
  }, []);

  const handleReset = () => {
    setGameState(createInitialState());
    setIsSaved(false);
    localStorage.removeItem(storageKey);
  };

  // 待った: AI モードでは AI 手と直前の自分の手をまとめて 2 手戻す。
  // PvP は 1 手戻す。AI 観戦モードでは無効。
  const undoSteps = gameMode === 'ai-vs-ai' ? 0 : (gameMode === 'pvp' ? 1 : 2);
  const canUndo = undoSteps > 0
    && gameState.moveHistory.length >= undoSteps;

  const handleUndo = () => {
    if (!canUndo) return;
    const newHistory = gameState.moveHistory.slice(
      0,
      gameState.moveHistory.length - undoSteps,
    );
    let newState = createInitialState();
    for (const move of newHistory) {
      newState = executeMove(newState, move);
    }
    setGameState(newState);
    setIsSaved(false);
  };

  const [showHistory, setShowHistory] = useState(false);

  const moveCount = gameState.moveHistory.length;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(gameState));
      setIsSaved(true);
    } catch (error) {
      console.warn('保存データの保存に失敗しました', error);
    }
  }, [gameState, storageKey]);

  const formatMove = (move: Move, idx: number): string => {
    const player = move.piece.owner === Player.Sente ? '☗' : '☖';
    const col = 9 - move.to.col;
    const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const rowStr = rowLabels[move.to.row];
    const pieceName = PIECE_NAMES[move.piece.type];
    const promoted = move.promoted ? '成' : '';
    const drop = move.from === null ? '打' : '';
    return `${idx + 1}. ${player}${col}${rowStr}${pieceName}${promoted}${drop}`;
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
            {modeLabel} · {moveCount}手目 · {isSaved ? '自動保存済み' : '保存中...'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {gameMode !== 'ai-vs-ai' && (
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
                border: '1px solid #6b4c1e',
                borderRadius: '8px',
                color: '#e8d5a8',
                fontSize: '14px',
                fontFamily: '"Noto Sans JP", sans-serif',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              待った
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 12px',
              background: showHistory
                ? 'linear-gradient(180deg, #6b4c1e 0%, #4a3520 100%)'
                : 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
              border: '1px solid #6b4c1e',
              borderRadius: '8px',
              color: '#e8d5a8',
              fontSize: '14px',
              fontFamily: '"Noto Sans JP", sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            棋譜
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 12px',
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
      </div>

      {/* 盤面 */}
      <ShogiBoard
        gameState={gameState}
        onMove={handleMove}
        aiControlsSente={aiControlsSente}
        aiControlsGote={aiControlsGote}
        boardSize={boardSize}
        interactionDisabled={
          (gameState.currentPlayer === Player.Sente && aiControlsSente)
          || (gameState.currentPlayer === Player.Gote && aiControlsGote)
        }
      />

      {/* 棋譜パネル */}
      {showHistory && gameState.moveHistory.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '520px',
          marginTop: '8px',
          background: 'linear-gradient(180deg, rgba(42,24,16,0.95) 0%, rgba(26,8,0,0.95) 100%)',
          borderRadius: '10px',
          border: '1px solid #6b4c1e',
          padding: '10px 14px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          <div style={{
            color: '#ffd700',
            fontSize: '12px',
            fontFamily: '"Noto Sans JP", sans-serif',
            fontWeight: 'bold',
            marginBottom: '6px',
          }}>
            棋譜
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 12px',
          }}>
            {gameState.moveHistory.map((move, idx) => (
              <span key={idx} style={{
                fontSize: '12px',
                color: move.piece.owner === Player.Sente ? '#e8d5a8' : '#a0c0e8',
                fontFamily: '"Noto Sans JP", sans-serif',
                whiteSpace: 'nowrap',
              }}>
                {formatMove(move, idx)}
              </span>
            ))}
          </div>
        </div>
      )}

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
