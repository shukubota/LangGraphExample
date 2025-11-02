import os
import time
from typing import TypedDict, Annotated, List, Literal
import operator

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from pypdf import PdfReader


class PaperAnalysisState(TypedDict):
    """論文分析のステート"""
    # 入力
    paper_text: str          # 論文本文
    paper_title: str         # タイトル
    has_figures: bool        # 図表の有無
    
    # 各Agentの出力
    structure: str           # 構造解析結果
    technical_explanation: str  # 専門用語解説
    figure_analysis: str     # 図表解析（条件付き）
    trend_context: str       # トレンド分析
    final_summary: str       # 最終レポート
    
    # メタ情報
    messages: Annotated[List[str], operator.add]  # 処理ログ
    processing_time: float   # 処理時間


# グローバル変数として LLM を保持
llm = None


def structure_analyzer(state: PaperAnalysisState) -> PaperAnalysisState:
    """論文の構造を分析"""
    
    prompt = f"""
あなたは論文の構造を分析する専門家です。

論文タイトル: {state['paper_title']}
論文テキスト（抜粋）:
{state['paper_text'][:3000]}

以下を簡潔に分析:
1. 論文の主張（Main Claim）
2. 解決した問題（Problem）
3. 提案手法の概要（Solution）
4. 主要な結果（Key Results）

非専門家に分かる言葉で説明してください。
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        **state,
        "structure": response.content,
        "messages": ["✅ 構造解析完了"]
    }


def technical_translator(state: PaperAnalysisState) -> PaperAnalysisState:
    """専門用語を翻訳"""
    
    prompt = f"""
論文: {state['paper_title']}

構造分析結果:
{state['structure']}

重要な専門用語を5つ抽出し、非専門家向けに説明してください。

例:
- Attention Mechanism → 「文章のどの部分に注目すべきかを自動的に学習する仕組み」
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        **state,
        "technical_explanation": response.content,
        "messages": ["✅ 専門用語解説完了"]
    }


def figure_analyzer(state: PaperAnalysisState) -> PaperAnalysisState:
    """図表を解析"""
    
    prompt = f"""
論文「{state['paper_title']}」の図表について説明してください。

この分野の論文で使われる図表の種類と、それらが何を示しているかを説明してください。
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        **state,
        "figure_analysis": response.content,
        "messages": ["✅ 図表解析完了"]
    }


def trend_analyzer(state: PaperAnalysisState) -> PaperAnalysisState:
    """研究トレンドを分析"""
    
    prompt = f"""
論文「{state['paper_title']}」について:

1. この研究が登場した背景
2. 研究分野での位置づけ
3. 後続研究への影響
4. 関連する重要な論文

を簡潔に説明してください。
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        **state,
        "trend_context": response.content,
        "messages": ["✅ トレンド分析完了"]
    }


def synthesizer(state: PaperAnalysisState) -> PaperAnalysisState:
    """最終レポートを生成"""
    
    figure_section = ""
    if state.get('figure_analysis'):
        figure_section = f"\n## 📊 図表の解説\n{state['figure_analysis']}\n"
    
    prompt = f"""
以下の分析結果を統合して「5分で分かる論文解説」を作成してください。

【構造分析】
{state['structure']}

【専門用語解説】
{state['technical_explanation']}

【研究トレンド】
{state['trend_context']}

以下の形式で出力:

# 5分で分かる: {state['paper_title']}

## 🎯 この論文のポイント
（3行要約）

## 🔬 何を解決したのか？
（問題と解決方法）

## 📖 重要な専門用語
（噛み砕いた説明）

{figure_section}

## 🌐 研究の流れ
（背景と影響）

## 💡 非専門家へのメッセージ
（社会への影響）
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        **state,
        "final_summary": response.content,
        "messages": ["✅ 最終レポート生成完了"]
    }


def should_analyze_figures(state: PaperAnalysisState) -> Literal["with_figures", "without_figures"]:
    """図表解析が必要か判定"""
    return "with_figures" if state.get('has_figures') else "without_figures"


def create_analyzer_graph(api_key: str):
    """マルチエージェントグラフを構築"""
    
    global llm
    
    # LLM初期化
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        api_key=api_key,
        temperature=0.3
    )
    
    # グラフ作成
    workflow = StateGraph(PaperAnalysisState)
    
    # ノード追加
    workflow.add_node("structure_analyzer", structure_analyzer)
    workflow.add_node("technical_translator", technical_translator)
    workflow.add_node("figure_analyzer", figure_analyzer)
    workflow.add_node("trend_analyzer", trend_analyzer)
    workflow.add_node("synthesizer", synthesizer)
    
    # フロー定義
    workflow.set_entry_point("structure_analyzer")
    workflow.add_edge("structure_analyzer", "technical_translator")
    
    # 条件分岐: 図表があれば解析
    workflow.add_conditional_edges(
        "technical_translator",
        should_analyze_figures,
        {
            "with_figures": "figure_analyzer",
            "without_figures": "trend_analyzer"
        }
    )
    
    workflow.add_edge("figure_analyzer", "trend_analyzer")
    workflow.add_edge("trend_analyzer", "synthesizer")
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile()


def extract_text_from_pdf(pdf_path: str, max_pages: int = 15) -> tuple[str, str]:
    """PDFからテキストとタイトルを抽出"""
    
    reader = PdfReader(pdf_path)
    
    # タイトル取得
    title = "Unknown Title"
    if reader.metadata and reader.metadata.title:
        title = reader.metadata.title
    
    # テキスト抽出（最初のmax_pagesページ）
    text = ""
    for page in reader.pages[:max_pages]:
        text += page.extract_text() + "\n"
    
    return title, text


def detect_figures(text: str) -> bool:
    """図表の存在を検出"""
    keywords = ["figure", "fig.", "table", "diagram"]
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in keywords)


def analyze_paper(
    paper_title: str = None,
    paper_text: str = None,
    paper_pdf_path: str = None,
    api_key: str = None,
    verbose: bool = True
):
    """論文を分析"""
    
    start_time = time.time()
    
    # APIキー取得
    api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY が設定されていません")
    
    # PDF読み込み
    if paper_pdf_path:
        if verbose:
            print(f"📖 PDFを読み込み中: {paper_pdf_path}")
        paper_title, paper_text = extract_text_from_pdf(paper_pdf_path)
    
    if not paper_text:
        raise ValueError("paper_text または paper_pdf_path が必要です")
    
    # 図表検出
    has_figures = detect_figures(paper_text)
    
    if verbose:
        print(f"\n論文タイトル: {paper_title}")
        print(f"図表検出: {'あり ✅' if has_figures else 'なし'}\n")
    
    # 初期ステート
    initial_state = {
        "paper_text": paper_text,
        "paper_title": paper_title or "Unknown Title",
        "has_figures": has_figures,
        "structure": "",
        "technical_explanation": "",
        "figure_analysis": "",
        "trend_context": "",
        "final_summary": "",
        "messages": [],
        "processing_time": 0.0
    }
    
    # グラフ実行
    graph = create_analyzer_graph(api_key)
    result = graph.invoke(initial_state)
    
    # 処理時間を記録
    processing_time = time.time() - start_time
    result["processing_time"] = processing_time
    
    if verbose:
        print(f"\n✨ 処理完了! (所要時間: {processing_time:.1f}秒)")
        print("\n📋 処理ログ:")
        for msg in result["messages"]:
            print(f"  {msg}")
    
    return result


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python paper_analyzer.py <PDF_PATH>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # 実行
    result = analyze_paper(paper_pdf_path=pdf_path)
    
    # 結果表示
    print("\n" + "=" * 70)
    print("📋 最終レポート")
    print("=" * 70)
    print(result["final_summary"])
    
    # ファイル保存
    output_file = "paper_analysis_report.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(result["final_summary"])
    
    print(f"\n✅ レポートを {output_file} に保存しました")