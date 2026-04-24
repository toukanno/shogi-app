import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import { GameMode } from './models/GameMode';

type Screen = 'menu' | 'game';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('ai-sente');

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('game');
  };

  const handleBack = () => {
    setScreen('menu');
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
      {screen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
      {screen === 'game' && <GameScreen gameMode={gameMode} onBack={handleBack} />}
    </div>
  );
};

export default App;
