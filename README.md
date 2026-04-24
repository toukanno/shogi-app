# shogi-app
将棋マスターズ - 本格将棋アプリ

本番環境: https://shogi-app-xi.vercel.app/

## Setup

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Vercel CLI をインストール
   ```bash
   npm install -g vercel
   ```
2. Vercel にログイン
   ```bash
   vercel login
   ```
3. 本番デプロイ
   ```bash
   vercel --prod
   ```

`vercel.json` は CRA の `build` 出力をそのまま配信し、SPA ルーティング用に `index.html` へ rewrite する設定です。
