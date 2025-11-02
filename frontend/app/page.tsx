import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🤖 LangGraph Visualizer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            LangGraphのマルチエージェントワークフローをリアルタイムで可視化し、
            論文解説システムの動作を直感的に理解できます
          </p>
          <Link
            href="/visualizer"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            🚀 可視化を開始
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              リアルタイム可視化
            </h3>
            <p className="text-gray-600">
              各エージェントの実行状況をリアルタイムで確認。
              ノード間の状態変化やデータフローを直感的に理解できます。
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              マルチエージェント協調
            </h3>
            <p className="text-gray-600">
              5つのAIエージェント（構造解析、専門用語翻訳、図表解析、トレンド分析、統合）の
              協調動作を可視化します。
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              論文解説生成
            </h3>
            <p className="text-gray-600">
              論文PDFから「5分で分かる論文解説」を自動生成。
              専門用語を噛み砕いて非専門家にも理解しやすく説明します。
            </p>
          </div>
        </div>

        {/* System Architecture */}
        <div className="bg-white rounded-lg p-8 shadow-md mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            システム構成
          </h2>
          <div className="text-center">
            <div className="inline-block bg-gray-50 rounded-lg p-6 max-w-4xl">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-blue-100 px-4 py-2 rounded-lg">
                    <strong>Next.js SSR</strong><br/>
                    <small>フロントエンド</small>
                  </div>
                  <div className="text-2xl">↔️</div>
                  <div className="bg-green-100 px-4 py-2 rounded-lg">
                    <strong>Flask + SocketIO</strong><br/>
                    <small>バックエンド</small>
                  </div>
                </div>
                <div className="text-xl">⬇️</div>
                <div className="bg-purple-100 px-4 py-2 rounded-lg">
                  <strong>LangGraph + Claude</strong><br/>
                  <small>マルチエージェント実行</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📚 使い方
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                1. 環境構築
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• バックエンド（Flask API）を起動</p>
                <p>• フロントエンド（Next.js）を起動</p>
                <p>• ANTHROPIC_API_KEYを設定</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                2. 分析実行
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 論文PDFをアップロード</p>
                <p>• 分析開始ボタンをクリック</p>
                <p>• リアルタイム可視化を確認</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 ヒント:</strong> 
              生成AI分野の論文（Attention is All You Need、Stable Diffusion等）で
              最適な解説が生成されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
