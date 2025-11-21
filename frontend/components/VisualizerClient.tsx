'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { GraphView } from '@/components/GraphView';
import { StatePanel } from '@/components/StatePanel';
import { ControlPanel } from '@/components/ControlPanel';
import { GraphData, PaperAnalysisState } from '@/types';

export function VisualizerClient() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [currentState, setCurrentState] = useState<PaperAnalysisState | null>(null);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'pending' | 'running' | 'completed' | 'error'>>({});
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const { isConnected, sessionId, lastMessage, connectionError } = useWebSocket();

  // WebSocketメッセージの処理
  useEffect(() => {
    if (!lastMessage) return;

    console.log('Processing WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'graph_structure':
        if (lastMessage.structure) {
          setGraphData(lastMessage.structure);
          console.log('Graph structure updated:', lastMessage.structure);
        } else if (lastMessage.data) {
          setGraphData(lastMessage.data);
          console.log('Graph data updated:', lastMessage.data);
        }
        break;

      case 'analysis_started':
        setIsAnalyzing(true);
        setCurrentNode(null);
        setAnalysisError(null);
        setNodeStatuses({});
        
        // グラフ構造も同時に受信する場合
        if (lastMessage.structure) {
          setGraphData(lastMessage.structure);
          console.log('Graph structure updated from analysis_started:', lastMessage.structure);
        }
        
        console.log('Analysis started');
        break;

      case 'node_started':
        if (lastMessage.node_id || lastMessage.node_name) {
          const nodeId = (lastMessage.node_id || lastMessage.node_name) as string;
          setCurrentNode(nodeId);
          setNodeStatuses(prev => ({
            ...prev,
            [nodeId]: 'running' as const
          }));
          console.log('Node started:', nodeId);
        }
        break;

      case 'node_completed':
        if (lastMessage.node_id || lastMessage.node_name) {
          const nodeId = (lastMessage.node_id || lastMessage.node_name) as string;
          setNodeStatuses(prev => ({
            ...prev,
            [nodeId]: 'completed' as const
          }));
          
          // 完了したノードがcurrentNodeの場合、クリア
          setCurrentNode(prev => prev === nodeId ? null : prev);
          
          if (lastMessage.state) {
            setCurrentState(lastMessage.state);
          }
          console.log('Node completed:', nodeId);
        }
        break;

      case 'analysis_completed':
        setIsAnalyzing(false);
        setCurrentNode(null);
        if (lastMessage.final_state) {
          setCurrentState(lastMessage.final_state);
        }
        console.log('Analysis completed');
        break;

      case 'analysis_error':
        setIsAnalyzing(false);
        setCurrentNode(null);
        setAnalysisError(lastMessage.error || 'Unknown error occurred');
        console.error('Analysis error:', lastMessage.error);
        break;

      default:
        console.log('Unhandled message type:', lastMessage.type);
    }
  }, [lastMessage]);

  // グラフデータにノードステータスを適用
  const graphDataWithStatus = graphData ? {
    ...graphData,
    nodes: graphData.nodes.map(node => ({
      ...node,
      status: nodeStatuses[node.id] || 'pending'
    }))
  } : null;

  const handleStartAnalysis = async (pdfFile: File) => {
    if (!isConnected || !sessionId) {
      alert('サーバーに接続されていません');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      // PDFをbase64に変換
      const base64Pdf = await fileToBase64(pdfFile);
      
      console.log('Starting analysis with session:', sessionId);
      
      // Next.js API Route経由でFlask APIを呼び出し
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          pdf_data: base64Pdf,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Analysis request failed');
      }
      
      const result = await response.json();
      console.log('Analysis started successfully:', result);
      
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setIsAnalyzing(false);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to start analysis');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-medium">接続エラー</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {connectionError} - バックエンドサーバーが起動しているか確認してください。
          </p>
        </div>
      )}

      {/* Analysis Error Banner */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-medium">分析エラー</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{analysisError}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Graph View - Takes up most space */}
        <div className="xl:col-span-3">
          <GraphView 
            graphData={graphDataWithStatus}
            currentNode={currentNode}
            isAnalyzing={isAnalyzing}
          />
        </div>
        
        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-6">
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

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-2">
              <div><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</div>
              <div><strong>Session ID:</strong> {sessionId || 'None'}</div>
              <div><strong>Current Node:</strong> {currentNode || 'None'}</div>
              <div><strong>Is Analyzing:</strong> {isAnalyzing ? 'Yes' : 'No'}</div>
              <div><strong>Graph Nodes:</strong> {graphData?.nodes.length || 0}</div>
              <div><strong>Last Message:</strong> {lastMessage?.type || 'None'}</div>
            </div>
          </details>
        </div>
      )}
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