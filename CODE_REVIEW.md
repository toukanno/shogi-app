# コードレビューまとめ

対象: `work` ブランチ（主に `fix: consider captured pieces in pawn-drop mate check` の変更）

## 指摘事項

### 1. `getDropPositions` と `isCheckmatedOnBoard` の相互再帰による探索過剰化リスク

**重要度:** 高

- `getDropPositions` の歩打ち判定（`pieceType === Pawn`）で、打ち歩詰めチェックとして `isCheckmatedOnBoard` を呼び出しています。
- 一方で `isCheckmatedOnBoard` は、持ち駒による受け手を調べるため `getDropPositions` を呼び出しています。
- このため、特に持ち駒に歩があるケースで、再帰的に同系統の探索が連鎖し、局面によっては探索量が急増します。

## 影響

- 実装の正しさテストは通るものの、局面によっては応答遅延の原因になります。
- 最悪ケースでスタックが深くなり、実行時間や安定性に悪影響が出る可能性があります。

## 推奨対応

- `getDropPositions` に「打ち歩詰め判定をスキップする」オプション（例: `skipPawnMateCheck`）を追加する。
- `isCheckmatedOnBoard` 側から受け手候補を列挙するときはこのオプションを有効化し、相互再帰を断つ。
- 必要に応じて、性能回帰を検知するテスト（探索ノード数や実行時間上限の目安）を追加する。

## 参考（確認したテスト）

- `src/App.test.tsx` の「打ち歩詰め判定では相手の持ち駒による受けも考慮する」テストは通過。
- ただしこのテストは機能正しさ中心で、性能回帰の検知は未対応。
