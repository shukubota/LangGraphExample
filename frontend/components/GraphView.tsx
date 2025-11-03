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

    // Arrow marker definition
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666')
      .style('stroke', 'none');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', (d: any) => d.type === 'conditional' ? '#ff6b6b' : '#666')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .style('stroke-dasharray', (d: any) => d.type === 'conditional' ? '5,5' : 'none');

    // Link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .attr('dy', -5)
      .text((d: any) => d.label || '');

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
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

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
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>未実行</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>実行中 (オレンジ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>現在のノード (青)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>完了</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>エラー</span>
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