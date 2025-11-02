# LangGraph Visualizer - Frontend

Next.js + TypeScript + Tailwind CSS frontend for LangGraph visualization.

## 🏗️ 環境構築

### 前提条件

- Node.js 18以上
- npm または yarn
- バックエンドAPI（Flask）が起動していること

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 環境変数設定（オプション）

```bash
# .env.local ファイルを作成（必要に応じて）
echo 'FLASK_API_URL=http://localhost:5000' > .env.local
```

### 3. 開発サーバー起動

```bash
npm run dev
```

✅ フロントエンドが起動: http://localhost:3000

## 🚀 使用方法

### 開発時

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リンター実行
npm run lint

# ビルド
npm run build
```

### 本番環境

```bash
# ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📁 プロジェクト構造

```
frontend/
├── app/                     # App Router
│   ├── api/                 # API Routes
│   │   ├── analyze/
│   │   │   └── route.ts     # Flask API プロキシ
│   │   └── health/
│   │       └── route.ts     # ヘルスチェック
│   ├── visualizer/
│   │   └── page.tsx         # メイン可視化ページ
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # ホームページ
├── components/
│   ├── GraphView.tsx        # D3.js グラフ可視化
│   ├── StatePanel.tsx       # 状態表示パネル
│   ├── ControlPanel.tsx     # 操作パネル
│   └── VisualizerClient.tsx # メインクライアント
├── hooks/
│   └── useWebSocket.ts      # WebSocket フック
├── types/
│   └── index.ts             # TypeScript 型定義
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 主要機能

### ページ構成

- **`/`**: ホームページ（システム紹介）
- **`/visualizer`**: メイン可視化ページ
- **`/api/analyze`**: Flask API プロキシ（分析開始）
- **`/api/health`**: ヘルスチェック

### コンポーネント

1. **GraphView**: D3.jsによる動的グラフ表示
   - ノード・エッジの可視化
   - 実行状態の色分け
   - インタラクティブ操作

2. **StatePanel**: 実行状態の表示
   - 進行状況バー
   - 各エージェントの出力
   - 処理ログ

3. **ControlPanel**: 操作インターフェース
   - PDFアップロード
   - 分析開始ボタン
   - 接続状態表示

4. **VisualizerClient**: メインロジック
   - WebSocket通信管理
   - 状態管理
   - API呼び出し

## 🌐 API通信

### Next.js API Routes → Flask API

```typescript
// 分析開始
POST /api/analyze
{
  "session_id": "client-session-id",
  "pdf_data": "base64-encoded-pdf"
}

// ヘルスチェック
GET /api/health
```

### WebSocket通信

```typescript
// Flask SocketIO との接続
ws://localhost:5000

// 受信イベント
- 'connected': 接続確立
- 'graph_update': リアルタイム更新
```

## 🎨 スタイリング

- **Tailwind CSS**: ユーティリティファーストCSS
- **レスポンシブデザイン**: モバイル対応
- **ダークモード**: 未実装（将来対応予定）

## ⚠️ トラブルシューティング

### よくある問題

#### 1. WebSocket接続エラー

```bash
# Flask APIが起動しているか確認
curl http://localhost:5000/health

# CORS設定を確認
# Flask側でCORS(app, origins=["http://localhost:3000"])が設定されているか
```

#### 2. API呼び出しエラー

```bash
# Next.js API Routesの確認
curl http://localhost:3000/api/health

# ネットワーク設定確認
# ブラウザのデベロッパーツールでNetwork タブを確認
```

#### 3. 型エラー

```bash
# TypeScript型チェック
npm run type-check

# 依存関係の更新
npm install @types/d3 @types/node --save-dev
```

#### 4. ビルドエラー

```bash
# キャッシュクリア
rm -rf .next
npm run build

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

## 🔍 デバッグ

### 開発者ツール

```typescript
// デバッグ情報の表示（development環境のみ）
// VisualizerClient.tsx の最下部にDebug Infoセクションあり

// ブラウザコンソールでWebSocketログ確認
// Network タブでAPI通信確認
```

### ログ確認

```bash
# Next.js サーバーログ
npm run dev

# ブラウザコンソール
F12 → Console タブ
```

## 🚀 デプロイ

### Vercel（推奨）

```bash
# Vercel CLI使用
npm i -g vercel
vercel

# または GitHub 連携でのデプロイ
```

### その他のプラットフォーム

```bash
# 静的エクスポート（必要に応じて）
npm run build
npm run export
```

## 🔗 関連ファイル

- `../backend/`: Flask API バックエンド
- `../paper_analyzer.py`: 元の論文解析システム
- `../instruction_web.md`: システム設計書

## 📊 パフォーマンス

- **SSR**: 初期表示の高速化
- **WebSocket**: リアルタイム通信
- **TypeScript**: 型安全性
- **Tailwind CSS**: 最適化されたCSS