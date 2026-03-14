export const theme = {
  colors: {
    // メイン背景
    bgDark: '#1a0a00',
    bgGradientStart: '#2d0a00',
    bgGradientEnd: '#0d0500',

    // 盤面
    boardLight: '#e8c875',
    boardDark: '#d4a843',
    boardBorder: '#8b6914',
    boardLine: '#6b5010',

    // 駒
    pieceLight: '#f5e6c8',
    pieceDark: '#d4a843',
    pieceText: '#1a0a00',
    pieceSelected: '#ff6b35',
    pieceEnemy: '#f5e6c8',

    // UI要素
    primary: '#c41e3a',
    primaryDark: '#8b0000',
    primaryLight: '#ff4444',
    gold: '#ffd700',
    goldDark: '#b8860b',

    // テキスト
    textLight: '#fff8e7',
    textDark: '#1a0a00',
    textGold: '#ffd700',
    textMuted: '#a08050',

    // エフェクト
    validMove: 'rgba(76, 175, 80, 0.5)',
    check: 'rgba(255, 0, 0, 0.4)',
    lastMove: 'rgba(255, 215, 0, 0.3)',

    // ボタン
    buttonRed: 'linear-gradient(180deg, #d42a2a 0%, #8b0000 100%)',
    buttonGold: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
    buttonDark: 'linear-gradient(180deg, #4a3520 0%, #2a1810 100%)',
  },

  fonts: {
    japanese: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho Pro", serif',
    display: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", sans-serif',
  },

  shadows: {
    piece: '2px 2px 4px rgba(0,0,0,0.5)',
    board: '0 4px 20px rgba(0,0,0,0.6)',
    button: '0 4px 12px rgba(0,0,0,0.4)',
    glow: '0 0 20px rgba(255, 215, 0, 0.3)',
  },
};
