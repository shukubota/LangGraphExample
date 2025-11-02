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
      processing_time: '処理時間'
    };
    return fieldNames[field] || field;
  };

  const renderField = (key: string, value: any) => {
    if (key === 'paper_text') return null; // 長すぎるので除外
    if (key === 'messages' && Array.isArray(value)) {
      return (
        <div key={key} className="border rounded-lg">
          <button
            onClick={() => toggleSection(key)}
            className="w-full p-3 text-left font-medium bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
          >
            <span>{formatFieldName(key)}</span>
            <span className="text-sm text-gray-500">
              {expandedSections.has(key) ? '▼' : '▶'} ({value.length})
            </span>
          </button>
          {expandedSections.has(key) && (
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {value.map((message, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-200"
                >
                  {message}
                </div>
              ))}
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
           key === 'processing_time' ? `${value?.toFixed(2) || 0}秒` :
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
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📊</div>
            <p>分析開始待ち</p>
            <p className="text-sm mt-1">PDFをアップロードして分析を開始してください</p>
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
                {currentState.processing_time?.toFixed(2) || 0}秒
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">完了ステップ:</span>
              <span className="ml-2 text-gray-600">
                {currentState.messages?.length || 0}/5
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}