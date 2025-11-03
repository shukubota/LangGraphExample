'use client';

import React, { useState } from 'react';
import { PaperAnalysisState } from '@/types';

interface StatePanelProps {
  currentState: PaperAnalysisState | null;
  currentNode: string | null;
  className?: string;
}

export function StatePanel({ currentState, currentNode, className = '' }: StatePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['messages']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      paper_title: '論文タイトル',
      has_figures: '図表の有無',
      structure: '構造解析',
      technical_explanation: '専門用語解説',
      figure_analysis: '図表解析',
      trend_context: 'トレンド分析',
      final_summary: '最終レポート',
      messages: '処理ログ',
      processing_time: '処理時間',
      token_usage: 'トークン使用量'
    };
    return fieldNames[field] || field;
  };

  const renderField = (key: string, value: any) => {
    if (key === 'paper_text') return null; // 長すぎるので除外
    
    if (key === 'token_usage' && value) {
      return (
        <div key={key} className="border rounded-lg p-3 bg-blue-50">
          <div className="font-medium text-gray-900 mb-2">
            {formatFieldName(key)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-blue-700">入力:</span>
              <span className="ml-1 text-blue-600">{value.input_tokens?.toLocaleString() || 0} tokens</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">出力:</span>
              <span className="ml-1 text-blue-600">{value.output_tokens?.toLocaleString() || 0} tokens</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">合計:</span>
              <span className="ml-1 text-blue-600 font-semibold">{value.total_tokens?.toLocaleString() || 0} tokens</span>
            </div>
            {value.cost_usd && (
              <div>
                <span className="font-medium text-blue-700">推定コスト:</span>
                <span className="ml-1 text-blue-600">${value.cost_usd.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (key === 'messages' && Array.isArray(value)) {
      return (
        <div key={key} className="border rounded-lg">
          <button
            onClick={() => toggleSection(key)}
            className="w-full p-4 text-left font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-t-lg flex items-center justify-between border-b-2 border-blue-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-700">📜</span>
              <span className="text-gray-900">{formatFieldName(key)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {value.length}件
              </span>
              <span className="text-blue-600 font-bold">
                {expandedSections.has(key) ? '▼' : '▶'}
              </span>
            </div>
          </button>
          {expandedSections.has(key) && (
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto bg-white">
              {value.length > 0 ? value.map((message, index) => (
                <div
                  key={index}
                  className="text-sm p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-400 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold text-base">✓</span>
                    <span className="text-gray-900 font-medium leading-relaxed">
                      {message || `ステップ ${index + 1} 処理中...`}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-sm p-4 bg-gray-50 rounded-lg text-gray-600 text-center border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 text-lg mb-1">📋</div>
                  <div>処理ログはまだありません</div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'string' && value.length > 200) {
      return (
        <div key={key} className="border rounded-lg">
          <button
            onClick={() => toggleSection(key)}
            className="w-full p-3 text-left font-medium bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
          >
            <span>{formatFieldName(key)}</span>
            <span className="text-sm text-gray-500">
              {expandedSections.has(key) ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.has(key) && (
            <div className="p-3">
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {value || '未処理'}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={key} className="border rounded-lg p-3">
        <div className="font-medium text-gray-900 mb-1">
          {formatFieldName(key)}
        </div>
        <div className="text-sm text-gray-700">
          {key === 'has_figures' ? (value ? 'あり' : 'なし') :
           key === 'processing_time' ? (value ? `${value.toFixed(2)}秒` : '処理中...') :
           value || '未処理'}
        </div>
      </div>
    );
  };

  const getProgress = () => {
    if (!currentState?.messages) return 0;
    const totalSteps = 5; // 全エージェント数
    const completedSteps = currentState.messages.length;
    return Math.min((completedSteps / totalSteps) * 100, 100);
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          実行状態
        </h3>
        {currentNode && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-600 font-medium">
              {currentNode} 実行中
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {currentState && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">進行状況</span>
            <span className="text-sm text-gray-500">{Math.round(getProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* State Data */}
      <div className="p-4">
        {currentState ? (
          <div className="space-y-3">
            {Object.entries(currentState)
              .filter(([key]) => key !== 'paper_text')
              .map(([key, value]) => renderField(key, value))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">分析開始待ち</h3>
            <p className="text-sm text-gray-600">
              PDFをアップロードして分析を開始してください
            </p>
            <div className="mt-4 text-xs text-gray-400">
              リアルタイムで処理状態を表示します
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {currentState && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">処理時間:</span>
              <span className="ml-2 text-gray-600">
                {currentState.processing_time ? `${currentState.processing_time.toFixed(2)}秒` : '処理中...'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">完了ステップ:</span>
              <span className="ml-2 text-gray-600">
                {currentState.messages?.length || 0}/5
              </span>
            </div>
            {currentState.token_usage && (
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700">総トークン:</span>
                <span className="ml-2 text-blue-600 font-semibold">
                  {currentState.token_usage.total_tokens?.toLocaleString() || 0}
                </span>
                {currentState.token_usage.cost_usd && (
                  <span className="ml-3 text-gray-600">
                    (${currentState.token_usage.cost_usd.toFixed(4)})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}