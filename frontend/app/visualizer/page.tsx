import { Metadata } from 'next';
import { VisualizerClient } from '@/components/VisualizerClient';

export const metadata: Metadata = {
  title: 'LangGraph 可視化 | 論文解説システム',
  description: 'LangGraphのマルチエージェント実行をリアルタイムで可視化',
  keywords: ['LangGraph', '可視化', '論文解説', 'マルチエージェント', 'AI'],
};

export default function VisualizerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 LangGraph マルチエージェント可視化
          </h1>
          <p className="text-gray-600 text-lg">
            論文解説システムの動作をリアルタイムで確認できます
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 このシステムについて:</strong> 
              PDFの論文を5つのAIエージェント（構造解析、専門用語翻訳、図表解析、トレンド分析、統合）が
              協調して「5分で分かる論文解説」を生成します。
            </p>
          </div>
        </div>
        
        {/* Main Visualizer */}
        <VisualizerClient />
        
        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>LangGraph Visualization System v1.0</p>
          <p className="mt-1">
            バックエンド: Flask + SocketIO | フロントエンド: Next.js + TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}