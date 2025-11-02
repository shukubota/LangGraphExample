# LangGraph Visualization - Backend API

Flask + SocketIO backend for LangGraph visualization.

## 🏗️ 環境構築

### 前提条件

- Python 3.8以上
- pip（Python パッケージマネージャー）
- direnv（環境変数管理）- 推奨

### 1. プロジェクトクローン・移動

```bash
# プロジェクトディレクトリに移動
cd /path/to/LangGraphExample
```

### 2. Python仮想環境の作成（推奨）

```bash
# 仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 3. 環境変数設定

#### direnvを使用する場合（推奨）

```bash
# プロジェクトルートで.envrcを確認
cat .envrc
# export ANTHROPIC_API_KEY="sk-ant-xxxxx" が設定されていることを確認

# direnvを有効化
direnv allow
```

#### 手動で設定する場合

```bash
# 一時的に設定
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# または.bashrc/.zshrcに追加
echo 'export ANTHROPIC_API_KEY="your-anthropic-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 4. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 5. サーバー起動

```bash
python app.py
```

✅ サーバーが起動したら: http://localhost:5000 でアクセス可能

### 6. 動作確認

```bash
# ヘルスチェック
curl http://localhost:5000/health

# 期待されるレスポンス:
# {"status": "healthy", "active_sessions": 0}
```

## 🚀 Quick Start

### すでに環境構築済みの場合

```bash
cd backend
source venv/bin/activate  # 仮想環境使用時
python app.py
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Start Analysis
```
POST /analyze
Content-Type: application/json

{
  "session_id": "client-session-id",
  "pdf_data": "base64-encoded-pdf-data"
}
```

## 🔌 WebSocket Events

### Client → Server

- `connect`: Client connection
- `join_session`: Join specific session
- `disconnect`: Client disconnection

### Server → Client

- `connected`: Connection established
- `graph_update`: Real-time updates
  - `type: 'graph_structure'`: Graph structure
  - `type: 'node_started'`: Node execution started
  - `type: 'node_completed'`: Node execution completed
  - `type: 'analysis_completed'`: Analysis finished

## 📁 File Structure

```
backend/
├── app.py                   # Main Flask application
├── langgraph_wrapper.py     # LangGraph visualization wrapper
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🔧 Key Components

### VisualizationManager
- Manages WebSocket sessions
- Broadcasts updates to clients
- Tracks session states

### VisualizableLangGraph
- Wraps LangGraph execution
- Provides real-time updates
- Hooks into node execution

## 🌐 Integration

This backend integrates with:
- Parent directory's `paper_analyzer.py`
- Next.js frontend via WebSocket
- CORS enabled for `http://localhost:3000`

## ⚠️ トラブルシューティング

### よくある問題と解決方法

#### 1. `ANTHROPIC_API_KEY` が設定されていない

```bash
# エラー: ValueError: ANTHROPIC_API_KEY が設定されていません
# 解決: 環境変数を確認
echo $ANTHROPIC_API_KEY

# 空の場合は設定
export ANTHROPIC_API_KEY="your-api-key"
```

#### 2. ポート5000が使用中

```bash
# エラー: Address already in use
# 解決: ポートを変更または既存プロセスを終了
lsof -ti:5000 | xargs kill -9

# または app.py のポートを変更
socketio.run(app, host='0.0.0.0', port=5001, debug=True)
```

#### 3. 依存関係のエラー

```bash
# 古いパッケージが原因の場合
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

#### 4. 親ディレクトリのpaper_analyzer.pyが見つからない

```bash
# プロジェクト構造を確認
ls ../paper_analyzer.py

# ない場合は、既存の論文解析システムがルートにあることを確認
```

## 🐛 Debugging

### デバッグモードの有効化

```python
# app.py でデバッグモードを有効化
socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

### ログレベルの調整

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Monitoring

- **ヘルスチェック**: `/health` エンドポイントでサーバー状況確認
- **WebSocketログ**: コンソールでリアルタイム通信を監視
- **セッション追跡**: `VisualizationManager` でアクティブセッション管理

## 🔗 関連ファイル

- `../paper_analyzer.py`: 元の論文解析システム
- `../requirements.txt`: 元のプロジェクト依存関係  
- `../.envrc`: 環境変数設定（direnv）