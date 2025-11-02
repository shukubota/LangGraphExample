'use client';

import React, { useState, useRef } from 'react';
import { UploadedFile } from '@/types';

interface ControlPanelProps {
  onStartAnalysis: (file: File) => void;
  isAnalyzing: boolean;
  isConnected: boolean;
  className?: string;
}

export function ControlPanel({ 
  onStartAnalysis, 
  isAnalyzing, 
  isConnected, 
  className = '' 
}: ControlPanelProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('PDFファイルを選択してください');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }
    
    setUploadedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleStartAnalysis = () => {
    if (uploadedFile && !isAnalyzing) {
      onStartAnalysis(uploadedFile);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          論文分析コントロール
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'サーバー接続中' : 'サーバー未接続'}
          </span>
        </div>
      </div>

      {/* File Upload */}
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            論文PDF
          </label>
          
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-4xl text-gray-400 mb-2">📄</div>
              <p className="text-sm text-gray-600 mb-2">
                PDFファイルをドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-500 mb-3">
                または
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ファイルを選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                最大10MB、PDF形式のみ
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isAnalyzing}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={!uploadedFile || isAnalyzing || !isConnected}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              !uploadedFile || isAnalyzing || !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                分析実行中...
              </div>
            ) : (
              '🚀 分析開始'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {!isConnected && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ サーバーに接続できません。バックエンドが起動しているか確認してください。
            </p>
          </div>
        )}

        {!uploadedFile && isConnected && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 論文のPDFファイルをアップロードして分析を開始してください。
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          使用方法
        </h4>
        <ol className="text-xs text-gray-600 space-y-1">
          <li>1. 論文のPDFファイルをアップロード</li>
          <li>2. 分析開始ボタンをクリック</li>
          <li>3. リアルタイムで実行フローを確認</li>
          <li>4. 生成された解説レポートを確認</li>
        </ol>
      </div>
    </div>
  );
}