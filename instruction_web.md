# LangGraph可視化Webアプリケーション実装指示書

## 🎯 目的

LangGraphのマルチエージェントワークフローを初心者にも分かりやすく可視化するWebアプリケーションを構築する。

- ノード間の状態変化をリアルタイムで表示
- 各エージェントの処理内容と結果を可視化
- インタラクティブなグラフ表示で理解を促進

## 🔍 実現可能性: ✅ YES

LangGraphの可視化Webアプリケーションは十分実現可能です。

### 技術的根拠

1. **LangGraph内部API**: 実行時ステートにアクセス可能
2. **WebSocket**: リアルタイム通信でライブ更新
3. **D3.js/Cytoscape.js**: 高度なグラフ可視化
4. **Flask**: 軽量なPython Webフレームワーク
5. **Next.js SSR**: サーバーサイドレンダリング対応

## 📋 機能要件

### コア機能

1. **グラフ構造の可視化**
   - ノードとエッジの動的表示
   - 条件分岐の視覚的表現
   - 現在実行中のノードをハイライト

2. **状態変化の追跡**
   - 各ステップでのState内容表示
   - データの変化をdiff表示
   - 処理時間の可視化

3. **リアルタイム実行**
   - WebSocketでライブ更新
   - プログレスバー表示
   - エラー状態の可視化

4. **インタラクティブ操作**
   - ノードクリックで詳細表示
   - 実行の一時停止/再開
   - 過去の実行履歴閲覧

## 🏗️ アーキテクチャ設計

### システム構成

```
┌─────────────────────────┐    HTTP/WebSocket    ┌──────────────────┐
│      Next.js SSR        │◄────────────────────►│   Flask API      │
│    (Frontend + API)     │                      │   (Backend)      │
│                         │                      │                  │
│ ┌─────────────────────┐ │                      │ ┌──────────────┐ │
│ │ SSR Pages           │ │                      │ │ LangGraph    │ │
│ │ - /visualizer       │ │                      │ │ Wrapper      │ │
│ │ - /analysis/[id]    │ │                      │ └──────────────┘ │
│ └─────────────────────┘ │                      │                  │
│                         │                      │ ┌──────────────┐ │
│ ┌─────────────────────┐ │   /api/langgraph/    │ │ WebSocket    │ │
│ │ API Routes          │ │◄────────────────────►│ │ Manager      │ │
│ │ - /api/analyze      │ │                      │ └──────────────┘ │
│ │ - /api/websocket    │ │                      │                  │
│ └─────────────────────┘ │                      │ ┌──────────────┐ │
│                         │                      │ │ State        │ │
│ ┌─────────────────────┐ │                      │ │ Manager      │ │
│ │ Client Components   │ │                      │ └──────────────┘ │
│ │ - GraphView         │ │                      └──────────────────┘
│ │ - StatePanel        │ │
│ │ - ControlPanel      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### データフロー

```
PDF Upload → Next.js /api/analyze → Flask API → LangGraph Execution
    ↓                     ↓               ↓            ↓
SSR Page ←─── State Updates ←─── WebSocket ←─── State Tracking
    ↓                     ↓               ↓            ↓
Client Components ←─── Real-time Updates ←─── WebSocket ←─── Processing
```

## 🛠️ 技術スタック

### Backend (Flask API)
- **Flask**: 軽量なPython Webフレームワーク
- **Flask-SocketIO**: WebSocket対応
- **LangGraph**: 既存のマルチエージェントシステム
- **eventlet**: 非同期処理サポート

### Frontend (Next.js SSR)
- **Next.js 14+**: App Router + SSR
- **TypeScript**: 型安全性
- **D3.js** または **Cytoscape.js**: グラフ可視化
- **Socket.io-client**: WebSocket通信
- **Tailwind CSS**: スタイリング
- **shadcn/ui**: UIコンポーネント

### 可視化ライブラリ比較

| ライブラリ | 特徴 | 適用場面 |
|---|---|---|
| **D3.js** | 高度なカスタマイズ、軽量 | 複雑なアニメーション |
| **Cytoscape.js** | グラフ特化、レイアウト豊富 | ネットワーク図 |
| **Vis.js** | 簡単、多機能 | プロトタイプ |

## 📁 プロジェクト構造

```
langgraph-visualizer/
├── flask-api/                    # Flask バックエンド
│   ├── app.py                   # Flask メインアプリ
│   ├── langgraph_wrapper.py     # LangGraph統合
│   ├── state_manager.py         # 状態管理
│   ├── websocket_handler.py     # SocketIO処理
│   └── requirements.txt
├── nextjs-frontend/             # Next.js フロントエンド
│   ├── app/                     # App Router
│   │   ├── visualizer/
│   │   │   └── page.tsx         # メイン可視化ページ
│   │   ├── analysis/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # 分析結果詳細ページ
│   │   ├── api/                 # API Routes
│   │   │   ├── analyze/
│   │   │   │   └── route.ts     # 分析開始API
│   │   │   └── websocket/
│   │   │       └── route.ts     # WebSocket プロキシ
│   │   ├── layout.tsx           # ルートレイアウト
│   │   └── page.tsx             # ホームページ
│   ├── components/
│   │   ├── ui/                  # shadcn/ui コンポーネント
│   │   ├── GraphView.tsx        # グラフ可視化
│   │   ├── StatePanel.tsx       # 状態表示
│   │   ├── ControlPanel.tsx     # 操作パネル
│   │   └── UploadDialog.tsx     # PDF アップロード
│   ├── hooks/
│   │   └── useWebSocket.ts      # WebSocket フック
│   ├── lib/
│   │   ├── utils.ts             # ユーティリティ
│   │   └── api.ts               # API クライアント
│   ├── types/
│   │   └── index.ts             # 型定義
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

## 🔧 実装戦略

### 主要コンポーネント

1. **Flask API サーバー**
   - LangGraphラッパーの実装
   - SocketIOによるWebSocket管理
   - 状態管理とブロードキャスト

2. **Next.js SSR アプリケーション**
   - SSRページでSEO対応
   - API Routesで Flask API とのプロキシ
   - TypeScript + Tailwind でモダンUI

3. **リアルタイム可視化**
   - D3.js/Cytoscape.js による動的グラフ表示
   - WebSocket経由のリアルタイム更新
   - 状態変化のアニメーション

## 💻 核心実装コード

### 1. Flask API サーバー

```python
# flask-api/app.py
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
from langgraph_wrapper import VisualizableLangGraph
from paper_analyzer import create_analyzer_graph

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins="*")

class VisualizationManager:
    def __init__(self):
        self.active_sessions = {}
        
    def broadcast_update(self, session_id: str, data: dict):
        """特定のセッションに更新を送信"""
        socketio.emit('graph_update', data, room=session_id)

viz_manager = VisualizationManager()

@app.route('/analyze', methods=['POST'])
def start_analysis():
    """論文分析を開始"""
    data = request.get_json()
    session_id = data.get('session_id')
    pdf_data = data.get('pdf_data')  # base64 encoded PDF
    
    # LangGraphの可視化実行
    graph = create_analyzer_graph()
    viz_graph = VisualizableLangGraph(
        graph, 
        lambda update: viz_manager.broadcast_update(session_id, update)
    )
    
    # バックグラウンドで実行開始
    socketio.start_background_task(
        target=viz_graph.execute_with_visualization,
        initial_state={"pdf_data": pdf_data}
    )
    
    return jsonify({"status": "started", "session_id": session_id})

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'session_id': request.sid})

@socketio.on('join_session')
def handle_join_session(data):
    session_id = data['session_id']
    join_room(session_id)
    print(f'Client joined session: {session_id}')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

### 2. Next.js API Route

```typescript
// nextjs-frontend/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Flask APIにリクエストを転送
    const response = await fetch(`${FLASK_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Flask API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

### 3. SSR可視化ページ

```typescript
// nextjs-frontend/app/visualizer/page.tsx
import { Metadata } from 'next';
import { VisualizerClient } from '@/components/VisualizerClient';

export const metadata: Metadata = {
  title: 'LangGraph 可視化 | 論文解説システム',
  description: 'LangGraphのマルチエージェント実行をリアルタイムで可視化',
};

export default function VisualizerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          LangGraph マルチエージェント可視化
        </h1>
        <p className="text-gray-600">
          論文解説システムの動作をリアルタイムで確認できます
        </p>
      </div>
      
      <VisualizerClient />
    </div>
  );
}
```

```typescript
// nextjs-frontend/components/VisualizerClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { GraphView } from '@/components/GraphView';
import { StatePanel } from '@/components/StatePanel';
import { ControlPanel } from '@/components/ControlPanel';

interface GraphData {
  nodes: Array<{id: string; label: string; type: string}>;
  edges: Array<{source: string; target: string}>;
}

export function VisualizerClient() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { socket, isConnected } = useWebSocket('ws://localhost:5000');

  useEffect(() => {
    if (!socket) return;

    socket.on('graph_update', (data) => {
      switch (data.type) {
        case 'graph_structure':
          setGraphData({
            nodes: data.nodes,
            edges: data.edges
          });
          break;
        case 'execution_step':
          setCurrentNode(data.step.node_name);
          setCurrentState(data.step.state_after);
          break;
        case 'analysis_complete':
          setIsAnalyzing(false);
          setCurrentNode(null);
          break;
      }
    });

    return () => {
      socket.off('graph_update');
    };
  }, [socket]);

  const handleStartAnalysis = async (pdfFile: File) => {
    if (!isConnected) return;

    setIsAnalyzing(true);
    
    // PDFをbase64に変換
    const base64Pdf = await fileToBase64(pdfFile);
    
    // Next.js API Route経由でFlask APIを呼び出し
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: socket?.id,
        pdf_data: base64Pdf,
      }),
    });
    
    if (!response.ok) {
      setIsAnalyzing(false);
      console.error('Analysis failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <GraphView 
          graphData={graphData}
          currentNode={currentNode}
          isAnalyzing={isAnalyzing}
        />
      </div>
      
      <div className="space-y-6">
        <ControlPanel 
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={isAnalyzing}
          isConnected={isConnected}
        />
        
        <StatePanel 
          currentState={currentState}
          currentNode={currentNode}
        />
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
```

### 4. WebSocketフック

```typescript
// nextjs-frontend/hooks/useWebSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Session ID:', data.session_id);
      // セッションIDをローカルストレージに保存
      localStorage.setItem('session_id', data.session_id);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [url]);

  return { socket, isConnected };
}
```

## 🚀 実装手順

### ステップ1: プロジェクト初期化

```bash
# Flask API バックエンド
mkdir flask-api
cd flask-api
pip install flask flask-socketio flask-cors eventlet

# Next.js フロントエンド
npx create-next-app@latest nextjs-frontend --typescript --tailwind --app
cd nextjs-frontend
npm install socket.io-client d3 @types/d3
npx shadcn-ui@latest init
```

### ステップ2: 基本構造作成

1. **Flask + SocketIO サーバー構築**
   - LangGraphラッパーの実装
   - WebSocket接続管理
   - 既存paper_analyzer.pyとの統合

2. **Next.js SSR アプリの基本レイアウト**
   - App Routerの設定
   - TypeScript型定義
   - Tailwind CSS + shadcn/ui

3. **API Routes作成**
   - Flask APIとのプロキシ設定
   - WebSocket接続管理

### ステップ3: コア機能実装

1. **リアルタイム可視化システム**
   - D3.js/Cytoscape.js グラフ表示
   - WebSocket経由の状態更新
   - SSRページでの初期レンダリング

2. **状態管理とUI**
   - ステート変化の追跡
   - インタラクティブなコンポーネント
   - レスポンシブデザイン

### ステップ4: 統合とテスト

1. **エンドツーエンド統合**
   - PDF アップロード → 分析 → 可視化
   - エラーハンドリング
   - パフォーマンス最適化

2. **SEOとアクセシビリティ**
   - SSRでの適切なメタデータ
   - ARIA対応
   - モバイル対応

## 📊 期待される効果

### 学習効果

1. **LangGraphの理解促進**
   - 抽象的な概念の可視化
   - 実行フローの直感的把握
   - デバッグ能力の向上

2. **マルチエージェントシステムの理解**
   - エージェント間の協調の可視化
   - 状態共有メカニズムの理解
   - 条件分岐ロジックの把握

3. **実用的価値**
   - 開発デバッグツールとして活用
   - 教育・プレゼンテーション用途
   - システム監視ダッシュボード

## ⚠️ 技術的考慮事項

### パフォーマンス

1. **リアルタイム更新の最適化**
   - 更新頻度の調整
   - 必要な情報のみ送信
   - クライアントサイドキャッシュ

2. **大規模データの処理**
   - ステート情報の圧縮
   - 履歴データのページネーション
   - メモリ使用量の監視

### セキュリティ

1. **WebSocket接続の保護**
   - 認証機能の実装
   - CORS設定の適切な構成
   - 入力データの検証

## 🎯 結論

**実現可能性: ✅ 高い**

LangGraphの可視化Webアプリケーションは技術的に実現可能で、教育的価値も高いプロジェクトです。

## 🔄 API フロー詳細

### Next.js → Flask API の通信

```typescript
// ユーザーがPDFをアップロード
PDF Upload → Next.js /api/analyze → Flask /analyze → LangGraph実行

// リアルタイム更新
LangGraph State → Flask SocketIO → Next.js WebSocket → UI更新
```

### データフロー

1. **PDF アップロード**: Next.js のファイルアップロード
2. **API プロキシ**: `/api/analyze` が Flask API を呼び出し
3. **WebSocket接続**: Flask SocketIO と Next.js クライアント間
4. **状態同期**: リアルタイムでUI更新

## 🎯 結論

**実現可能性: ✅ 高い**

### 技術構成の利点

- **Next.js SSR**: SEO対応とパフォーマンス
- **Flask API**: LangGraphとの簡単な統合
- **WebSocket**: リアルタイム可視化
- **TypeScript**: 型安全性

### 推奨実装スケジュール

- **Week 1**: Flask API + Next.js 基盤構築
- **Week 2**: WebSocket通信とリアルタイム可視化
- **Week 3**: UI/UX改善とSSR最適化
- **Week 4**: テストと本番環境対応

### 必要スキル

- Python (Flask, SocketIO)
- TypeScript/Next.js
- D3.js または グラフ可視化ライブラリ
- WebSocket プログラミング

この構成により、LangGraphの動作を直感的に理解できる強力な学習ツールが完成し、SSRによるSEO対応も実現します。