// LangGraph可視化の型定義

export interface GraphNode {
  id: string;
  label: string;
  type: 'agent' | 'condition' | 'start' | 'end';
  description?: string;
  position?: { x: number; y: number };
  status?: 'pending' | 'running' | 'completed' | 'error';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: 'direct' | 'conditional' | 'entry' | 'exit' | 'loop';
  label?: string;
  condition?: string;
  weight?: number; // 1-10, affects thickness
  importance?: 'low' | 'medium' | 'high' | 'critical';
  animated?: boolean;
  dataFlow?: {
    active: boolean;
    direction: 'forward' | 'backward' | 'bidirectional';
    speed?: 'slow' | 'medium' | 'fast';
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExecutionStep {
  node_name: string;
  state_before: Record<string, any>;
  state_after: Record<string, any>;
  timestamp: string;
  duration: number;
  status: 'running' | 'completed' | 'error';
  description?: string;
}

export interface PaperAnalysisState {
  paper_text: string;
  paper_title: string;
  has_figures: boolean;
  structure: string;
  technical_explanation: string;
  figure_analysis: string;
  trend_context: string;
  final_summary: string;
  messages: string[];
  processing_time: number;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd?: number;
  };
}

export interface WebSocketMessage {
  type: 'graph_structure' | 'node_started' | 'node_completed' | 'analysis_started' | 'analysis_completed' | 'analysis_error';
  data?: any;
  node_id?: string;
  node_name?: string;
  description?: string;
  state?: PaperAnalysisState;
  timestamp?: string;
  error?: string;
  step?: number;
  total_steps?: number;
  duration?: number;
  final_state?: PaperAnalysisState;
  structure?: GraphData;
}

export interface AnalysisSession {
  session_id: string;
  status: 'connected' | 'analyzing' | 'completed' | 'error';
  created_at: string;
  current_node?: string;
  progress?: number;
  error_message?: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded
}