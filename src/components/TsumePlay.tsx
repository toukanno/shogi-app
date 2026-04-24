import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player } from '../models/ShogiTypes';
import { TsumeProblem } from '../models/TsumeProblem';
import {
  createTsumeState, isSolutionMove, chooseDefenderMove, markProblemSolved,
} from '../utils/TsumeLogic';
import { executeMove } from '../utils/ShogiLogic';
import ShogiBoard from './ShogiBoard';

interface TsumePlayProps {
  problem: TsumeProblem;
  onBack: () => void;
  onSolved: (id: string) => void;
}

type Feedback =
  | { kind: 'idle' }
  | { kind: 'defender_thinking' }
  | { kind: 'wrong'; message: string }
  | { kind: 'solved' };

const TsumePlay: React.FC<TsumePlayProps> = ({ problem, onBack, onSolved }) => {
  const [gameState, setGameState] = useState<GameState>(() => createTsumeState(problem));
  const [boardSize, setBoardSize] = useState(360);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });
  const [movesUsed, setMovesUsed] = useState(0);
  const defenderTimerRef = useRef<number | null>(null);

  // 問題変更時リセット
  useEffect(() => {
    setGameState(createTsumeState(problem));
    setFeedback({ kind: 'idle' });
    setMovesUsed(0);
  }, [problem]);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxSize = Math.min(vw - 32, vh * 0.5, 460);
      setBoardSize(Math.max(260, maxSize));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => () => {
    if (defenderTimerRef.current !== null) {
      window.clearTimeout(defenderTimerRef.current);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (defenderTimerRef.current !== null) {
      window.clearTimeout(defenderTimerRef.current);
      defenderTimerRef.current = null;
    }
    setGameState(createTsumeState(problem));
    setFeedback({ kind: 'idle' });
    setMovesUsed(0);
  }, [problem]);

  const handlePlayerMove = useCallback((newState: GameState) => {
    // ShogiBoard から呼ばれる。直前の state は参照用で、差分から手を復元する。
    const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
    if (!lastMove) {
      setGameState(newState);
      return;
    }
    // 攻方の手だけ検証
    if (lastMove.piece.owner !== Player.Sente) {
      setGameState(newState);
      return;
    }

    const prevState = gameState;
    const movesRemaining = problem.moves - movesUsed;
    const valid = isSolutionMove(prevState, lastMove, movesRemaining);

    setGameState(newState);
    const nextUsed = movesUsed + 1;
    setMovesUsed(nextUsed);

    if (newState.isCheckmate) {
      setFeedback({ kind: 'solved' });
      markProblemSolved(problem.id);
      onSolved(problem.id);
      return;
    }

    if (!valid) {
      setFeedback({ kind: 'wrong', message: 'その手では詰みません' });
      return;
    }

    // 残り手数があれば後手が応手
    if (nextUsed < problem.moves && newState.isCheck) {
      setFeedback({ kind: 'defender_thinking' });
      defenderTimerRef.current = window.setTimeout(() => {
        const dmove = chooseDefenderMove(newState);
        if (!dmove) {
          // 後手に合法手がない = 実質詰み（executeMove でチェック済みのはず）
          setFeedback({ kind: 'solved' });
          markProblemSolved(problem.id);
          onSolved(problem.id);
          defenderTimerRef.current = null;
          return;
        }
        const afterDef = executeMove(newState, dmove);
        setGameState(afterDef);
        setFeedback({ kind: 'idle' });
        defenderTimerRef.current = null;
      }, 400);
    }
  }, [gameState, movesUsed, problem, onSolved]);

  const interactionDisabled = feedback.kind === 'defender_thinking'
    || feedback.kind === 'solved'
    || feedback.kind === 'wrong';

  const movesLabel = problem.moves === 1 ? '1手詰め' : `${problem.moves}手詰め`;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #1a0800 0%, #2d0a00 30%, #1a0800 70%, #0d0500 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 8px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <button onClick={onBack} style={headerBtnStyle}>← 戻る</button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            color: '#ffd700',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: '"Noto Sans JP", sans-serif',
            textShadow: '0 0 10px rgba(255,215,0,0.3)',
          }}>
            {problem.title}
          </div>
          <div style={{ color: '#a08050', fontSize: '11px' }}>
            {movesLabel} · {movesUsed}/{problem.moves} 手目
          </div>
        </div>
        <button onClick={handleReset} style={headerBtnStyle}>初手</button>
      </div>

      <ShogiBoard
        gameState={gameState}
        onMove={handlePlayerMove}
        vsAI={false}
        boardSize={boardSize}
        interactionDisabled={interactionDisabled}
      />

      {problem.hint && feedback.kind === 'idle' && movesUsed === 0 && (
        <div style={{
          marginTop: '8px', maxWidth: '520px', width: '100%',
          padding: '8px 12px',
          background: 'rgba(42,24,16,0.7)',
          border: '1px solid #6b4c1e',
          borderRadius: '8px',
          color: '#e8d5a8',
          fontSize: '12px',
          fontFamily: '"Noto Sans JP", sans-serif',
        }}>
          💡 {problem.hint}
        </div>
      )}

      {feedback.kind === 'defender_thinking' && (
        <div style={feedbackStyle('#a08050')}>玉方 応手中…</div>
      )}

      {feedback.kind === 'wrong' && (
        <div style={{ ...feedbackStyle('#ff6666'), display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>✗ {feedback.message}</span>
          <button onClick={handleReset} style={smallBtn('#c41e3a')}>やり直し</button>
        </div>
      )}

      {feedback.kind === 'solved' && (
        <div style={{
          marginTop: '14px',
          maxWidth: '520px', width: '100%',
          padding: '16px',
          background: 'linear-gradient(180deg, #3a2010 0%, #2a1508 100%)',
          border: '2px solid #ffd700',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(255,215,0,0.2)',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆</div>
          <div style={{ color: '#ffd700', fontSize: '20px', fontWeight: 'bold', fontFamily: '"Noto Serif JP", serif' }}>
            正解！
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button onClick={handleReset} style={smallBtn('#4a3520')}>もう一度</button>
            <button onClick={onBack} style={smallBtn('#c41e3a')}>問題一覧</button>
          </div>
        </div>
      )}
    </div>
  );
};

const headerBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
  border: '1px solid #6b4c1e',
  borderRadius: '8px',
  color: '#e8d5a8',
  fontSize: '14px',
  fontFamily: '"Noto Sans JP", sans-serif',
  cursor: 'pointer',
};

const feedbackStyle = (color: string): React.CSSProperties => ({
  marginTop: '10px',
  maxWidth: '520px',
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(26,8,0,0.85)',
  border: `1px solid ${color}`,
  borderRadius: '8px',
  color,
  fontSize: '14px',
  fontFamily: '"Noto Sans JP", sans-serif',
  textAlign: 'center',
});

const smallBtn = (bg: string): React.CSSProperties => ({
  padding: '10px 18px',
  background: bg,
  border: '1px solid #6b4c1e',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: '"Noto Sans JP", sans-serif',
  fontWeight: 'bold',
  cursor: 'pointer',
});

export default TsumePlay;
