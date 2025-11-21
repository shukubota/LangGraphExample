'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge } from '@/types';

interface GraphViewProps {
  graphData: GraphData | null;
  currentNode: string | null;
  isAnalyzing: boolean;
  className?: string;
}

export function GraphView({ graphData, currentNode, isAnalyzing, className = '' }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // SVGのviewBoxを設定
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ズームとパンの設定
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // データの準備
    const nodes = graphData.nodes.map(d => ({
      ...d,
      x: d.position?.x || Math.random() * width,
      y: d.position?.y || Math.random() * height,
    }));

    const links = graphData.edges.map(d => ({
      ...d,
      source: d.source,
      target: d.target,
    }));

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Arrow marker definitions for different edge types
    const defs = svg.append('defs');
    
    // Standard arrow
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666');
    
    // Conditional arrow (red)
    defs.append('marker')
      .attr('id', 'arrowhead-conditional')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#ef4444');
    
    // Entry arrow (green)
    defs.append('marker')
      .attr('id', 'arrowhead-entry')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#10b981');
    
    // Exit arrow (purple)
    defs.append('marker')
      .attr('id', 'arrowhead-exit')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#8b5cf6');
    
    // Gradient for animated edges
    const gradient = defs.append('linearGradient')
      .attr('id', 'flow-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);
    
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 1);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    
    const link = linkGroup
      .selectAll('.link')
      .data(links)
      .enter().append('g')
      .attr('class', 'link');
    
    // Main edge lines
    link.append('line')
      .attr('class', 'edge-line')
      .attr('stroke', (d: any) => getEdgeColor(d))
      .attr('stroke-width', (d: any) => getEdgeThickness(d))
      .attr('marker-end', (d: any) => getArrowMarker(d))
      .style('stroke-dasharray', (d: any) => getEdgeStyle(d))
      .style('opacity', 0.8);
    
    // Animated flow overlay for active edges
    link.filter((d: any) => d.animated || d.dataFlow?.active)
      .append('line')
      .attr('class', 'edge-animation')
      .attr('stroke', 'url(#flow-gradient)')
      .attr('stroke-width', (d: any) => Math.max(2, getEdgeThickness(d) - 1))
      .style('stroke-dasharray', '10,5')
      .style('opacity', 0.7);

    // Link labels with background
    const linkLabelGroup = g.append('g').attr('class', 'link-labels');
    
    const linkLabels = linkLabelGroup
      .selectAll('.link-label-group')
      .data(links.filter((d: any) => d.label))
      .enter().append('g')
      .attr('class', 'link-label-group');
    
    // Label background
    linkLabels.append('rect')
      .attr('class', 'label-background')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 0.5);
    
    // Label text
    const labelText = linkLabels.append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'medium')
      .attr('fill', (d: any) => getEdgeLabelColor(d))
      .attr('dy', '.35em')
      .text((d: any) => d.label || '');
    
    // Adjust background size to text
    linkLabels.selectAll('.label-background')
      .attr('width', function(this: any, d: any) {
        const textWidth = this.nextSibling?.getBBox?.()?.width || 0;
        return textWidth + 8;
      })
      .attr('height', 16)
      .attr('x', function(this: any, d: any) {
        const textWidth = this.nextSibling?.getBBox?.()?.width || 0;
        return -(textWidth + 8) / 2;
      })
      .attr('y', -8);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node circles
    node.append('circle')
      .attr('r', 40)
      .attr('fill', (d: any) => getNodeColor(d.id, d.status, currentNode))
      .attr('stroke', (d: any) => d.id === selectedNode ? '#2563eb' : '#fff')
      .attr('stroke-width', (d: any) => d.id === selectedNode ? 3 : 2)
      .style('filter', (d: any) => d.id === currentNode ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))' : 'none');

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .style('pointer-events', 'none')
      .selectAll('tspan')
      .data((d: any) => d.label.split(' '))
      .enter().append('tspan')
      .attr('x', 0)
      .attr('dy', (d: any, i: number) => i === 0 ? 0 : '1.1em')
      .text((d: any) => d);

    // Node click handler
    node.on('click', (event, d: any) => {
      setSelectedNode(selectedNode === d.id ? null : d.id);
      event.stopPropagation();
    });

    // Background click to deselect
    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Simulation tick
    simulation.on('tick', () => {
      // Update main edge lines
      link.selectAll('.edge-line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      // Update animated edge lines
      link.selectAll('.edge-animation')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      // Update label positions
      linkLabelGroup.selectAll('.link-label-group')
        .attr('transform', (d: any) => {
          const x = (d.source.x + d.target.x) / 2;
          const y = (d.source.y + d.target.y) / 2;
          return `translate(${x}, ${y})`;
        });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Start edge animations
    const animateEdges = () => {
      link.selectAll('.edge-animation')
        .style('stroke-dashoffset', '0')
        .transition()
        .duration((d: any) => {
          switch (d.dataFlow?.speed) {
            case 'fast': return 1000;
            case 'medium': return 2000;
            case 'slow': return 3000;
            default: return 2000;
          }
        })
        .ease(d3.easeLinear)
        .style('stroke-dashoffset', '15')
        .on('end', function(d: any) {
          if (d.animated || d.dataFlow?.active) {
            animateEdges.call(this);
          }
        });
    };

    // Start animations for active flows
    setTimeout(animateEdges, 100);

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [graphData, currentNode, selectedNode]);

  const getNodeColor = (nodeId: string, status: string = 'pending', currentNode: string | null) => {
    if (nodeId === currentNode) return '#3b82f6'; // 実行中: 青
    
    switch (status) {
      case 'completed': return '#10b981'; // 完了: 緑
      case 'error': return '#ef4444'; // エラー: 赤
      case 'running': return '#f59e0b'; // 実行中: オレンジ
      default: return '#6b7280'; // 未実行: グレー
    }
  };

  const getEdgeColor = (edge: any) => {
    switch (edge.type) {
      case 'conditional': return '#ef4444'; // 条件分岐: 赤
      case 'entry': return '#10b981'; // 開始: 緑
      case 'exit': return '#8b5cf6'; // 終了: 紫
      case 'loop': return '#f59e0b'; // ループ: オレンジ
      default: return '#6b7280'; // 通常: グレー
    }
  };

  const getEdgeThickness = (edge: any) => {
    if (edge.weight) {
      return Math.max(1, Math.min(8, edge.weight)); // 1-8px
    }
    
    switch (edge.importance) {
      case 'critical': return 6;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 1.5;
      default: return 2;
    }
  };

  const getEdgeStyle = (edge: any) => {
    switch (edge.type) {
      case 'conditional': return '8,4'; // 破線
      case 'loop': return '4,4'; // 点線
      default: return 'none'; // 実線
    }
  };

  const getArrowMarker = (edge: any) => {
    switch (edge.type) {
      case 'conditional': return 'url(#arrowhead-conditional)';
      case 'entry': return 'url(#arrowhead-entry)';
      case 'exit': return 'url(#arrowhead-exit)';
      default: return 'url(#arrowhead)';
    }
  };

  const getEdgeLabelColor = (edge: any) => {
    switch (edge.type) {
      case 'conditional': return '#dc2626';
      case 'entry': return '#059669';
      case 'exit': return '#7c3aed';
      default: return '#374151';
    }
  };

  const getSelectedNodeInfo = () => {
    if (!selectedNode || !graphData) return null;
    return graphData.nodes.find(node => node.id === selectedNode);
  };

  const selectedNodeInfo = getSelectedNodeInfo();

  return (
    <div className={`relative bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          LangGraph実行フロー
        </h3>
        <div className="space-y-3 mt-2">
          {/* ノード状態の凡例 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">ノード状態</h4>
            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>未実行</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>実行中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>現在</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>完了</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>エラー</span>
              </div>
            </div>
          </div>
          
          {/* エッジタイプの凡例 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">接続タイプ</h4>
            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-gray-500"></div>
                <span>通常</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-red-500" style={{borderTop: '1px dashed #ef4444'}}></div>
                <span>条件分岐</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-green-500"></div>
                <span>開始</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-purple-500"></div>
                <span>終了</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-blue-400 animate-pulse"></div>
                <span>データフロー</span>
              </div>
            </div>
          </div>
        </div>
        {isAnalyzing && (
          <div className="mt-2 text-sm text-blue-600 font-medium">
            📊 分析実行中...
          </div>
        )}
      </div>

      {/* Graph */}
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full h-96 border-b"
          style={{ minHeight: '400px' }}
        />
        
        {!graphData && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            PDFをアップロードして分析を開始してください
          </div>
        )}
      </div>

      {/* Selected Node Info */}
      {selectedNodeInfo && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="font-semibold text-gray-900 mb-2">
            {selectedNodeInfo.label}
          </h4>
          {selectedNodeInfo.description && (
            <p className="text-sm text-gray-600">
              {selectedNodeInfo.description}
            </p>
          )}
          <div className="mt-2 text-sm">
            <span className="font-medium">ステータス: </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              selectedNodeInfo.status === 'completed' ? 'bg-green-100 text-green-800' :
              selectedNodeInfo.status === 'running' ? 'bg-blue-100 text-blue-800' :
              selectedNodeInfo.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedNodeInfo.status === 'completed' ? '完了' :
               selectedNodeInfo.status === 'running' ? '実行中' :
               selectedNodeInfo.status === 'error' ? 'エラー' : '待機中'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}