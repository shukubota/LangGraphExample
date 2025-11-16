from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import json
import base64
import io
import os
import sys
import uuid
from datetime import datetime

# 親ディレクトリのpaper_analyzer.pyをインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from paper_analyzer import analyze_paper, extract_text_from_pdf, detect_figures

app = Flask(__name__)
app.config['SECRET_KEY'] = 'langgraph-visualizer-secret'
CORS(app, origins=["http://localhost:3003"])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

class VisualizationManager:
    def __init__(self):
        self.active_sessions = {}
        self.session_states = {}
        
    def create_session(self, session_id: str):
        """新しいセッションを作成"""
        self.active_sessions[session_id] = {
            'created_at': datetime.now(),
            'status': 'connected'
        }
        self.session_states[session_id] = {
            'current_node': None,
            'graph_structure': None,
            'execution_history': [],
            'current_state': {}
        }
        
    def broadcast_to_session(self, session_id: str, event: str, data: dict):
        """特定のセッションにメッセージを送信"""
        if session_id in self.active_sessions:
            socketio.emit(event, data, room=session_id)
            print(f"Broadcasting to session {session_id}: {event}")
        
    def update_session_state(self, session_id: str, update_data: dict):
        """セッションの状態を更新"""
        if session_id in self.session_states:
            self.session_states[session_id].update(update_data)

viz_manager = VisualizationManager()

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        "status": "healthy",
        "active_sessions": len(viz_manager.active_sessions)
    })

@app.route('/analyze', methods=['POST'])
def start_analysis():
    """論文分析を開始"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        pdf_data = data.get('pdf_data')  # base64 encoded PDF
        
        if not session_id or not pdf_data:
            return jsonify({"error": "session_id and pdf_data are required"}), 400
            
        print(f"Starting analysis for session: {session_id}")
        
        # セッションが存在しない場合は作成
        if session_id not in viz_manager.active_sessions:
            viz_manager.create_session(session_id)
        
        # PDFデータをデコード
        try:
            # base64データからヘッダーを除去
            if ',' in pdf_data:
                pdf_data = pdf_data.split(',')[1]
            
            pdf_bytes = base64.b64decode(pdf_data)
            
            # 一時ファイルとして保存
            temp_pdf_path = f"/tmp/temp_paper_{session_id}.pdf"
            with open(temp_pdf_path, 'wb') as f:
                f.write(pdf_bytes)
                
        except Exception as e:
            return jsonify({"error": f"PDF decode error: {str(e)}"}), 400
        
        # グラフ構造を先に送信
        graph_structure = {
            'nodes': [
                {'id': 'structure_analyzer', 'label': '構造解析', 'type': 'agent', 'x': 100, 'y': 100},
                {'id': 'technical_translator', 'label': '専門用語翻訳', 'type': 'agent', 'x': 300, 'y': 100},
                {'id': 'figure_analyzer', 'label': '図表解析', 'type': 'agent', 'x': 500, 'y': 50},
                {'id': 'trend_analyzer', 'label': 'トレンド分析', 'type': 'agent', 'x': 500, 'y': 150},
                {'id': 'synthesizer', 'label': '統合', 'type': 'agent', 'x': 700, 'y': 100}
            ],
            'edges': [
                {'source': 'structure_analyzer', 'target': 'technical_translator'},
                {'source': 'technical_translator', 'target': 'figure_analyzer', 'condition': 'has_figures'},
                {'source': 'technical_translator', 'target': 'trend_analyzer', 'condition': 'no_figures'},
                {'source': 'figure_analyzer', 'target': 'trend_analyzer'},
                {'source': 'trend_analyzer', 'target': 'synthesizer'}
            ]
        }
        
        viz_manager.broadcast_to_session(session_id, 'graph_update', {
            'type': 'graph_structure',
            'data': graph_structure
        })
        
        # バックグラウンドで分析実行
        socketio.start_background_task(
            target=execute_analysis_with_visualization,
            session_id=session_id,
            pdf_path=temp_pdf_path
        )
        
        return jsonify({
            "status": "started", 
            "session_id": session_id,
            "message": "Analysis started successfully"
        })
        
    except Exception as e:
        print(f"Error starting analysis: {str(e)}")
        return jsonify({"error": f"Analysis start failed: {str(e)}"}), 500

def execute_analysis_with_visualization(session_id: str, pdf_path: str):
    """可視化付きで分析を実行"""
    try:
        print(f"Executing analysis for session: {session_id}")
        
        # 開始通知
        viz_manager.broadcast_to_session(session_id, 'graph_update', {
            'type': 'analysis_started',
            'timestamp': datetime.now().isoformat()
        })
        
        # 論文テキスト抽出
        title, text = extract_text_from_pdf(pdf_path)
        has_figures = detect_figures(text)
        
        print(f"Extracted title: {title}, has_figures: {has_figures}")
        
        # 初期状態
        current_state = {
            "paper_text": text,
            "paper_title": title,
            "has_figures": has_figures,
            "structure": "",
            "technical_explanation": "",
            "figure_analysis": "",
            "trend_context": "",
            "final_summary": "",
            "messages": [],
            "processing_time": 0.0
        }
        
        # 各ステップをシミュレート（実際のLangGraph実行の代わり）
        steps = [
            {
                'node': 'structure_analyzer',
                'description': '論文の構造を分析中...',
                'state_key': 'structure'
            },
            {
                'node': 'technical_translator',
                'description': '専門用語を翻訳中...',
                'state_key': 'technical_explanation'
            }
        ]
        
        # 条件分岐: 図表があれば図表解析を追加
        if has_figures:
            steps.append({
                'node': 'figure_analyzer',
                'description': '図表を解析中...',
                'state_key': 'figure_analysis'
            })
        
        steps.extend([
            {
                'node': 'trend_analyzer',
                'description': '研究トレンドを分析中...',
                'state_key': 'trend_context'
            },
            {
                'node': 'synthesizer',
                'description': '最終レポートを生成中...',
                'state_key': 'final_summary'
            }
        ])
        
        # 各ステップを順次実行
        for i, step in enumerate(steps):
            # ノード開始通知
            viz_manager.broadcast_to_session(session_id, 'graph_update', {
                'type': 'node_started',
                'node_id': step['node'],
                'description': step['description'],
                'step': i + 1,
                'total_steps': len(steps)
            })
            
            # 状態更新をシミュレート
            socketio.sleep(2)  # 処理時間をシミュレート
            
            # 仮の結果を設定
            current_state[step['state_key']] = f"[{step['node']}の処理結果]"
            current_state['messages'].append(f"✅ {step['description'][:-3]}完了")
            
            # ノード完了通知
            viz_manager.broadcast_to_session(session_id, 'graph_update', {
                'type': 'node_completed',
                'node_id': step['node'],
                'state': current_state.copy(),
                'timestamp': datetime.now().isoformat()
            })
            
            # 次のステップまで少し待機
            socketio.sleep(0.5)
        
        # トークン使用量をシミュレート（実際の実装では実際の値を使用）
        token_usage = {
            'input_tokens': 1500 + len(steps) * 200,
            'output_tokens': 800 + len(steps) * 150,
            'total_tokens': 2300 + len(steps) * 350,
            'cost_usd': (2300 + len(steps) * 350) * 0.000015  # Claude 3.5 Sonnet概算
        }
        current_state['token_usage'] = token_usage
        
        # 分析完了通知
        viz_manager.broadcast_to_session(session_id, 'graph_update', {
            'type': 'analysis_completed',
            'final_state': current_state,
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"Analysis completed for session: {session_id}")
        
        # 一時ファイルを削除
        try:
            os.remove(pdf_path)
        except:
            pass
            
    except Exception as e:
        print(f"Error in analysis execution: {str(e)}")
        viz_manager.broadcast_to_session(session_id, 'graph_update', {
            'type': 'analysis_error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })

@socketio.on('connect')
def handle_connect():
    """クライアント接続時の処理"""
    session_id = request.sid
    print(f'Client connected: {session_id}')
    
    viz_manager.create_session(session_id)
    
    emit('connected', {
        'session_id': session_id,
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('disconnect')
def handle_disconnect():
    """クライアント切断時の処理"""
    session_id = request.sid
    print(f'Client disconnected: {session_id}')
    
    # セッション情報をクリーンアップ
    if session_id in viz_manager.active_sessions:
        del viz_manager.active_sessions[session_id]
    if session_id in viz_manager.session_states:
        del viz_manager.session_states[session_id]

@socketio.on('join_session')
def handle_join_session(data):
    """セッション参加処理"""
    session_id = data.get('session_id', request.sid)
    join_room(session_id)
    print(f'Client joined session: {session_id}')
    
    emit('session_joined', {
        'session_id': session_id,
        'status': 'joined'
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))  # デフォルトを5001に変更
    print("Starting Flask-SocketIO server...")
    print(f"Server will be available at: http://localhost:{port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True)