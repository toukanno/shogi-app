import React, { useState, useEffect } from 'react';
import { TSUME_PROBLEMS, TsumeProblem } from '../models/TsumeProblem';
import { loadTsumeProgress } from '../utils/TsumeLogic';
import TsumePlay from './TsumePlay';

interface TsumeScreenProps {
  onBack: () => void;
}

const TsumeScreen: React.FC<TsumeScreenProps> = ({ onBack }) => {
  const [solved, setSolved] = useState<Set<string>>(() => loadTsumeProgress());
  const [active, setActive] = useState<TsumeProblem | null>(null);

  const handleSolved = (id: string) => {
    setSolved(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setSolved(loadTsumeProgress());
  }, [active]);

  if (active) {
    return (
      <TsumePlay
        problem={active}
        onBack={() => setActive(null)}
        onSolved={handleSolved}
      />
    );
  }

  const solvedCount = solved.size;
  const total = TSUME_PROBLEMS.length;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #1a0800 0%, #2d0a00 30%, #1a0800 70%, #0d0500 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 16px 40px',
    }}>
      <div style={{
        width: '100%', maxWidth: '520px',
        display: 'flex', alignItems: 'center', marginBottom: 12,
      }}>
        <button onClick={onBack} style={{
          padding: '8px 16px',
          background: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
          border: '1px solid #6b4c1e',
          borderRadius: '8px',
          color: '#e8d5a8',
          fontSize: '14px',
          fontFamily: '"Noto Sans JP", sans-serif',
          cursor: 'pointer',
        }}>← メニュー</button>
        <div style={{
          flex: 1, textAlign: 'center',
          color: '#ffd700', fontSize: '22px', fontWeight: 'bold',
          fontFamily: '"Noto Serif JP", serif',
          textShadow: '0 0 15px rgba(255,215,0,0.3)',
        }}>
          詰将棋クエスト
        </div>
        <div style={{
          padding: '8px 12px',
          color: '#e8d5a8',
          fontSize: '13px',
          fontFamily: '"Noto Sans JP", sans-serif',
        }}>
          {solvedCount}/{total}
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: '520px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {TSUME_PROBLEMS.map((p, i) => {
          const isDone = solved.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              style={{
                padding: '16px 18px',
                background: isDone
                  ? 'linear-gradient(180deg, #4a3a1a 0%, #2a2008 100%)'
                  : 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
                border: isDone ? '2px solid #ffd700' : '1px solid #6b4c1e',
                borderRadius: '12px',
                color: '#e8d5a8',
                fontFamily: '"Noto Sans JP", sans-serif',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: isDone ? '#ffd700' : '#6b4c1e',
                color: isDone ? '#1a0800' : '#e8d5a8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 'bold',
                flexShrink: 0,
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffd700' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '12px', color: '#a08050', marginTop: 2 }}>
                  {p.moves}手詰め {isDone && '· クリア済'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TsumeScreen;
