import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Compass, Share2, Sparkles, Loader2, ChevronRight,
  ChevronDown, ZoomIn, ZoomOut, Maximize2, Search, Info
} from 'lucide-react';

export default function MindmapViewer({ videoId, transcript = '', summary = '' }) {
  const [mindmap, setMindmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  // Fallback mindmap extractor from markdown summary
  const extractMindmapFromSummary = (summaryText) => {
    if (!summaryText) return null;
    const lines = summaryText.split('\n');
    const branches = [];
    let currentBranch = null;

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
    let colorIdx = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^##\s+/, '').replace(/[📌💡📊🔍⚠️🎯⚡📋📖🧠🔬🎓]/g, '').trim();
        currentBranch = {
          name: title,
          summary: 'Core thematic category from lecture synthesis.',
          color: colors[colorIdx % colors.length],
          nodes: [],
        };
        branches.push(currentBranch);
        colorIdx++;
      } else if (currentBranch && (trimmed.startsWith('- **') || trimmed.startsWith('* **'))) {
        const match = trimmed.match(/^[-*]\s+\*\*([^*]+)\*\*:\s*(.+)$/);
        if (match) {
          currentBranch.nodes.push({
            name: match[1],
            detail: match[2],
          });
        }
      }
    });

    return {
      title: 'Lecture Knowledge Graph',
      branches: branches.length > 0 ? branches : [
        {
          name: 'Core Synthesis',
          summary: 'Foundational lecture concepts',
          color: '#3b82f6',
          nodes: [
            { name: 'Primary Theory', detail: 'Central mechanics discussed in the video.' },
            { name: 'Applied Case Study', detail: 'Real-world practical examples.' }
          ]
        }
      ]
    };
  };

  useEffect(() => {
    let isMounted = true;
    async function loadMindmap() {
      setLoading(true);
      try {
        if (videoId) {
          const data = await api.getMindmap(videoId, transcript, summary);
          if (isMounted && data?.mindmap && data.mindmap.branches?.length > 0) {
            setMindmap(data.mindmap);
            // Default expand all branches
            setExpandedBranches(new Set(data.mindmap.branches.map((_, i) => i)));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API Mindmap generation error, using summary fallback:', err);
      }

      const fallback = extractMindmapFromSummary(summary);
      if (isMounted) {
        setMindmap(fallback);
        if (fallback?.branches) {
          setExpandedBranches(new Set(fallback.branches.map((_, i) => i)));
        }
        setLoading(false);
      }
    }

    loadMindmap();
    return () => {
      isMounted = false;
    };
  }, [videoId, transcript, summary]);

  const toggleBranch = (idx) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => {
    if (mindmap?.branches) {
      setExpandedBranches(new Set(mindmap.branches.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedBranches(new Set());
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '48px', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Generating Concept Knowledge Graph...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Mapping topic hierarchies, semantic branches, and sub-concepts.</p>
      </div>
    );
  }

  if (!mindmap || !mindmap.branches || mindmap.branches.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No mindmap structure available.</p>
      </div>
    );
  }

  const filteredBranches = mindmap.branches.map((branch) => {
    if (!searchQuery) return branch;
    const q = searchQuery.toLowerCase();
    const branchMatches = branch.name.toLowerCase().includes(q) || (branch.summary && branch.summary.toLowerCase().includes(q));
    const matchingNodes = (branch.nodes || []).filter(
      (n) => n.name.toLowerCase().includes(q) || (n.detail && n.detail.toLowerCase().includes(q))
    );
    if (branchMatches || matchingNodes.length > 0) {
      return { ...branch, nodes: matchingNodes };
    }
    return null;
  }).filter(Boolean);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={20} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366f1', letterSpacing: '0.04em' }}>
              Semantic Concept Hierarchy
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {mindmap.title || 'Knowledge Graph'}
            </h2>
          </div>
        </div>

        {/* Controls: Search, Expand All, Collapse All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                width: 170,
              }}
            />
          </div>

          <button onClick={expandAll} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Expand All
          </button>
          <button onClick={collapseAll} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* ── VISUAL MINDMAP CANVAS ── */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          padding: '28px',
          minHeight: 400,
        }}
      >
        {/* Central Core Root Node */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 30,
              background: 'linear-gradient(135deg, #0b326f, #1e40af)',
              color: '#ffffff',
              boxShadow: '0 8px 24px -4px rgba(11, 50, 111, 0.4)',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Sparkles size={18} color="#93c5fd" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {mindmap.title || 'Central Video Lecture Theme'}
            </span>
          </div>
        </div>

        {/* Branches Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredBranches.map((branch, bIdx) => {
            const isExpanded = expandedBranches.has(bIdx);
            const branchColor = branch.color || '#3b82f6';

            return (
              <div
                key={bIdx}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1.5px solid var(--border)`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Branch Header */}
                <div
                  onClick={() => toggleBranch(bIdx)}
                  style={{
                    padding: '16px 20px',
                    borderLeft: `5px solid ${branchColor}`,
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    userSelect: 'none',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {branch.name}
                    </h3>
                    {branch.summary && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                        {branch.summary}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      {(branch.nodes || []).length} nodes
                    </span>
                    {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Sub-Nodes List */}
                {isExpanded && branch.nodes && branch.nodes.length > 0 && (
                  <div style={{ padding: '12px 18px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {branch.nodes.map((node, nIdx) => (
                      <div
                        key={nIdx}
                        onClick={() => setSelectedNode(node)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = branchColor;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {node.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: branchColor, fontWeight: 700 }}>
                            Details &rarr;
                          </span>
                        </div>
                        {node.detail && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            {node.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal / Drawer if a node is clicked */}
      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedNode(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '28px',
              maxWidth: 520,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="tag-badge">Concept Deep-Dive</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
              {selectedNode.name}
            </h3>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
              {selectedNode.detail || 'Detailed concept mechanism explored during this lecture section.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedNode(null)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
