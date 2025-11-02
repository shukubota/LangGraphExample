# 生成AI論文解説マルチエージェントシステム

LangGraphを使った論文解説システム。生成AI関連の論文を非専門家にも分かりやすく解説します。

## 🎯 目的

- 生成AI論文（Attention is All You Need、Stable Diffusion等）の理解を支援
- 専門用語を噛み砕いて説明
- 研究トレンドと影響を把握
- LangGraphのマルチエージェント実装を学習

## 📦 システム構成

### マルチエージェント構造

```
論文PDF → 構造解析Agent → 専門用語翻訳Agent → [条件分岐]
                                                 ├─ 図表解析Agent (図表検出時)
                                                 └─ スキップ
                                                      ↓
                                               トレンド分析Agent
                                                      ↓
                                               統合Agent → レポート生成
```

### 各エージェントの役割

1. **構造解析Agent**: 論文の主張・問題・解決方法・結果を抽出
2. **専門用語翻訳Agent**: 重要な専門用語を非専門家向けに説明
3. **図表解析Agent**: 図表がある場合のみ実行し、ビジュアル要素を解説
4. **トレンド分析Agent**: 研究背景、位置づけ、影響を分析
5. **統合Agent**: 全結果を統合し「5分で分かる論文解説」を生成

## 🚀 使い方

### 環境変数設定（direnv使用）

```bash
# .envrcファイルを作成
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' > .envrc
direnv allow
```

### インストール

```bash
pip install langgraph langchain langchain-anthropic pypdf
```

### 実行

```bash
# PDFファイルから
python paper_analyzer.py path/to/paper.pdf

# Pythonから
from paper_analyzer import analyze_paper
result = analyze_paper(paper_pdf_path="paper.pdf")
print(result["final_summary"])
```

## 📋 出力形式

```markdown
# 5分で分かる: [論文タイトル]

## 🎯 この論文のポイント
（3行要約）

## 🔬 何を解決したのか？
（問題と解決方法）

## 📖 重要な専門用語
（噛み砕いた説明）

## 📊 図表の解説
（条件付き: 図表がある場合のみ）

## 🌐 研究の流れ
（背景と影響）

## 💡 非専門家へのメッセージ
（社会への影響）
```

## 🔧 技術スタック

- **LangGraph**: マルチエージェントオーケストレーション
- **LangChain**: LLM統合
- **Anthropic Claude**: 言語モデル（claude-sonnet-4）
- **pypdf**: PDF読み込み

## 📖 詳細

実装の詳細は `INSTRUCTION.md` を参照してください。
