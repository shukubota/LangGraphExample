import asyncio
import time
from typing import Dict, Any, Callable, List
from dataclasses import dataclass
from datetime import datetime
from langgraph.graph import StateGraph
import sys
import os

# 親ディレクトリのpaper_analyzer.pyをインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from paper_analyzer import (
    PaperAnalysisState, 
    create_analyzer_graph,
    structure_analyzer,
    technical_translator,
    figure_analyzer,
    trend_analyzer,
    synthesizer,
    should_analyze_figures
)

@dataclass
class ExecutionStep:
    """実行ステップの情報"""
    node_name: str
    state_before: Dict[str, Any]
    state_after: Dict[str, Any]
    timestamp: datetime
    duration: float
    status: str  # 'running', 'completed', 'error'
    description: str = ""

class VisualizableLangGraph:
    """可視化対応のLangGraphラッパー"""
    
    def __init__(self, api_key: str, websocket_callback: Callable = None):
        self.api_key = api_key
        self.websocket_callback = websocket_callback
        self.execution_history: List[ExecutionStep] = []
        self.graph = None
        
    def setup_graph(self):
        """グラフを設定"""
        self.graph = create_analyzer_graph(self.api_key)
        
    async def execute_with_visualization(self, initial_state: Dict[str, Any]):
        """可視化付きでグラフを実行"""
        
        if not self.graph:
            self.setup_graph()
            
        # グラフ構造を送信
        await self._send_graph_structure()
        
        # 実行開始
        await self._send_update({
            'type': 'execution_started',
            'timestamp': datetime.now().isoformat(),
            'initial_state': initial_state
        })
        
        try:
            # グラフ実行（各ステップをフック）
            result = await self._execute_with_hooks(initial_state)
            
            # 実行完了
            await self._send_update({
                'type': 'execution_completed',
                'timestamp': datetime.now().isoformat(),
                'final_result': result
            })
            
            return result
            
        except Exception as e:
            # エラー発生
            await self._send_update({
                'type': 'execution_error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            })
            raise
    
    async def _execute_with_hooks(self, initial_state: Dict[str, Any]):
        """フック付きでグラフを実行"""
        
        # 実行順序を定義
        execution_order = [
            'structure_analyzer',
            'technical_translator',
        ]
        
        # 条件分岐: 図表があれば図表解析を追加
        if initial_state.get('has_figures', False):
            execution_order.append('figure_analyzer')
        
        execution_order.extend([
            'trend_analyzer',
            'synthesizer'
        ])
        
        current_state = initial_state.copy()
        
        for node_name in execution_order:
            await self._execute_node(node_name, current_state)
            
        return current_state
    
    async def _execute_node(self, node_name: str, state: Dict[str, Any]):
        """単一ノードを実行"""
        
        start_time = time.time()
        state_before = state.copy()
        
        # ノード実行開始通知
        await self._send_update({
            'type': 'node_started',
            'node_name': node_name,
            'timestamp': datetime.now().isoformat(),
            'state_before': state_before
        })
        
        try:
            # ノード関数のマッピング
            node_functions = {
                'structure_analyzer': structure_analyzer,
                'technical_translator': technical_translator,
                'figure_analyzer': figure_analyzer,
                'trend_analyzer': trend_analyzer,
                'synthesizer': synthesizer
            }
            
            if node_name in node_functions:
                # ノード実行
                result = node_functions[node_name](state)
                state.update(result)
                
                duration = time.time() - start_time
                
                # 実行ステップを記録
                step = ExecutionStep(
                    node_name=node_name,
                    state_before=state_before,
                    state_after=state.copy(),
                    timestamp=datetime.now(),
                    duration=duration,
                    status='completed',
                    description=f"{node_name} execution completed"
                )
                self.execution_history.append(step)
                
                # ノード完了通知
                await self._send_update({
                    'type': 'node_completed',
                    'node_name': node_name,
                    'timestamp': datetime.now().isoformat(),
                    'state_after': state.copy(),
                    'duration': duration,
                    'step': step.__dict__
                })
                
                # 少し待機してリアルタイム感を演出
                await asyncio.sleep(0.5)
                
            else:
                raise ValueError(f"Unknown node: {node_name}")
                
        except Exception as e:
            duration = time.time() - start_time
            
            # エラーステップを記録
            step = ExecutionStep(
                node_name=node_name,
                state_before=state_before,
                state_after=state.copy(),
                timestamp=datetime.now(),
                duration=duration,
                status='error',
                description=f"Error in {node_name}: {str(e)}"
            )
            self.execution_history.append(step)
            
            # ノードエラー通知
            await self._send_update({
                'type': 'node_error',
                'node_name': node_name,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'duration': duration
            })
            
            raise
    
    async def _send_graph_structure(self):
        """グラフ構造を送信"""
        
        graph_structure = {
            'nodes': [
                {
                    'id': 'structure_analyzer',
                    'label': '構造解析Agent',
                    'type': 'agent',
                    'description': '論文の主張・問題・解決方法・結果を抽出',
                    'position': {'x': 100, 'y': 200}
                },
                {
                    'id': 'technical_translator',
                    'label': '専門用語翻訳Agent',
                    'type': 'agent',
                    'description': '重要な専門用語を非専門家向けに説明',
                    'position': {'x': 300, 'y': 200}
                },
                {
                    'id': 'figure_analyzer',
                    'label': '図表解析Agent',
                    'type': 'agent',
                    'description': '図表がある場合のみ実行し、ビジュアル要素を解説',
                    'position': {'x': 500, 'y': 100}
                },
                {
                    'id': 'trend_analyzer',
                    'label': 'トレンド分析Agent',
                    'type': 'agent',
                    'description': '研究背景、位置づけ、影響を分析',
                    'position': {'x': 500, 'y': 300}
                },
                {
                    'id': 'synthesizer',
                    'label': '統合Agent',
                    'type': 'agent',
                    'description': '全結果を統合し「5分で分かる論文解説」を生成',
                    'position': {'x': 700, 'y': 200}
                }
            ],
            'edges': [
                {
                    'id': 'edge_1',
                    'source': 'structure_analyzer',
                    'target': 'technical_translator',
                    'type': 'direct',
                    'label': '構造分析結果'
                },
                {
                    'id': 'edge_2',
                    'source': 'technical_translator',
                    'target': 'figure_analyzer',
                    'type': 'conditional',
                    'label': '図表あり',
                    'condition': 'has_figures == true'
                },
                {
                    'id': 'edge_3',
                    'source': 'technical_translator',
                    'target': 'trend_analyzer',
                    'type': 'conditional',
                    'label': '図表なし',
                    'condition': 'has_figures == false'
                },
                {
                    'id': 'edge_4',
                    'source': 'figure_analyzer',
                    'target': 'trend_analyzer',
                    'type': 'direct',
                    'label': '図表解析結果'
                },
                {
                    'id': 'edge_5',
                    'source': 'trend_analyzer',
                    'target': 'synthesizer',
                    'type': 'direct',
                    'label': 'トレンド分析結果'
                }
            ]
        }
        
        await self._send_update({
            'type': 'graph_structure',
            'structure': graph_structure
        })
    
    async def _send_update(self, data: Dict[str, Any]):
        """WebSocket経由で更新を送信"""
        if self.websocket_callback:
            try:
                if asyncio.iscoroutinefunction(self.websocket_callback):
                    await self.websocket_callback(data)
                else:
                    self.websocket_callback(data)
            except Exception as e:
                print(f"WebSocket callback error: {e}")
    
    def get_execution_summary(self) -> Dict[str, Any]:
        """実行サマリーを取得"""
        total_duration = sum(step.duration for step in self.execution_history)
        completed_steps = [step for step in self.execution_history if step.status == 'completed']
        error_steps = [step for step in self.execution_history if step.status == 'error']
        
        return {
            'total_steps': len(self.execution_history),
            'completed_steps': len(completed_steps),
            'error_steps': len(error_steps),
            'total_duration': total_duration,
            'execution_history': [step.__dict__ for step in self.execution_history],
            'success_rate': len(completed_steps) / len(self.execution_history) if self.execution_history else 0
        }
    
    def reset(self):
        """実行履歴をリセット"""
        self.execution_history.clear()


# 使用例
async def example_usage():
    """使用例"""
    
    def websocket_callback(data):
        print(f"WebSocket update: {data['type']}")
    
    # 可視化ラッパーを作成
    viz_graph = VisualizableLangGraph(
        api_key="your-api-key",
        websocket_callback=websocket_callback
    )
    
    # 初期状態
    initial_state = {
        "paper_text": "Sample paper text...",
        "paper_title": "Sample Paper Title",
        "has_figures": True,
        "structure": "",
        "technical_explanation": "",
        "figure_analysis": "",
        "trend_context": "",
        "final_summary": "",
        "messages": [],
        "processing_time": 0.0
    }
    
    # 実行
    result = await viz_graph.execute_with_visualization(initial_state)
    
    # サマリー取得
    summary = viz_graph.get_execution_summary()
    print(f"Execution summary: {summary}")
    
    return result

if __name__ == "__main__":
    # テスト実行
    asyncio.run(example_usage())