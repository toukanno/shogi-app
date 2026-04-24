import React, { useState } from 'react';
import { AILevel } from './models/ShogiTypes';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import TsumeScreen from './components/TsumeScreen';

type Screen = 'menu' | 'game' | 'tsume';

const AI_LEVEL_STORAGE_KEY = 'shogi-app-ai-level';

function loadAILevel(): AILevel {
  try {
    const raw = localStorage.getItem(AI_LEVEL_STORAGE_KEY);
    if (raw === AILevel.Easy || raw === AILevel.Normal || raw === AILevel.Hard) {
      return raw;
    }
  } catch {
    // ignore
  }
  return AILevel.Normal;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [vsAI, setVsAI] = useState(true);
  const [aiLevel, setAILevel] = useState<AILevel>(() => loadAILevel());

  const handleStartGame = (ai: boolean) => {
    setVsAI(ai);
    setScreen('game');
  };

  const handleOpenTsume = () => {
    setScreen('tsume');
  };

  const handleBack = () => {
    setScreen('menu');
  };

  const handleChangeAILevel = (level: AILevel) => {
    setAILevel(level);
    try {
      localStorage.setItem(AI_LEVEL_STORAGE_KEY, level);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontFamily: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", sans-serif',
      touchAction: 'manipulation',
      userSelect: 'none',
      overscrollBehavior: 'none',
    } as React.CSSProperties}>
      {screen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenTsume={handleOpenTsume}
          aiLevel={aiLevel}
          onChangeAILevel={handleChangeAILevel}
        />
      )}
      {screen === 'game' && (
        <GameScreen vsAI={vsAI} aiLevel={aiLevel} onBack={handleBack} />
      )}
      {screen === 'tsume' && (
        <TsumeScreen onBack={handleBack} />
      )}
    </div>
  );
};

export default App;
