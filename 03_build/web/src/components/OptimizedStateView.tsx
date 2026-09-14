import React, { useState } from 'react';
import { OptimizationResponse, ScheduleBlock } from '../types';
import { Sparkles, CheckCircle2, ShieldCheck, Layers, Info, ArrowDownRight } from 'lucide-react';

interface OptimizedStateViewProps {
  data: OptimizationResponse;
}

export const OptimizedStateView: React.FC<OptimizedStateViewProps> = ({ data }) => {
  const blocks = data.optimized.blocks;
  const horizon = data.horizon_hours;
  const maxDisplayHours = Math.min(horizon, 48);

  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(blocks[0] || null);

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Engineering': return '#f59e0b';
      case 'TRD': return '#3b82f6';
      case 'S&T': return '#10b981';
      default: return '#8b5cf6';
    }
  };

  return (
    <div className="animate-slide-merge" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>AI-Optimized Integrated Schedule</h2>
            <span style={{ backgroundColor: '#8b5cf625', color: '#c084fc', border: '1px solid #8b5cf650', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> CP-SAT Co-Scheduled
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Multi-department task bundling into unified integrated blocks. Eliminates redundant closures and enforces zero train conflicts.
          </p>
        </div>

        {/* Delta Badges */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ backgroundColor: '#10b98115', border: '1px solid #10b98140', borderRadius: 8, padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>Possession Hours Saved</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
              +{data.delta.block_hours_saved} hrs
            </div>
          </div>
          <div style={{ backgroundColor: '#8b5cf615', border: '1px solid #8b5cf640', borderRadius: 8, padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#c084fc' }}>Integrated Blocks</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a855f7' }}>
              {data.delta.integrated_blocks_count}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Timeline Visualization */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="#8b5cf6" /> Corridor Possession Schedule (First {maxDisplayHours} Hours)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Click any block below to inspect explainability rationale
          </span>
        </div>

        {/* Time Axis Ruler */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155', paddingBottom: 6, marginBottom: 12, paddingLeft: 120 }}>
          {Array.from({ length: Math.ceil(maxDisplayHours / 2) + 1 }).map((_, i) => {
            const h = i * 2;
            return (
              <div key={i} style={{ flex: 1, fontSize: '0.7rem', color: '#64748b', textAlign: 'left' }}>
                {String(h).padStart(2, '0')}:00
              </div>
            );
          })}
        </div>

        {/* Section Rows with Integrated Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.network.sections.map((sec) => {
            const secBlocks = blocks.filter(b => b.section_id === sec);

            return (
              <div key={sec} style={{ display: 'flex', alignItems: 'center', minHeight: 52 }}>
                {/* Section Name */}
                <div style={{ width: 120, paddingRight: 12 }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 700, display: 'block', fontFamily: 'monospace' }}>
                    {sec}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {secBlocks.length} planned blocks
                  </span>
                </div>

                {/* Section Corridor Track */}
                <div style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#0f172a',
                  borderRadius: 6,
                  border: '1px solid #1e293b',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {secBlocks.map((b) => {
                    if (b.start >= maxDisplayHours) return null;
                    const leftPct = (b.start / maxDisplayHours) * 100;
                    const widthPct = Math.min(((b.end - b.start) / maxDisplayHours) * 100, 100 - leftPct);
                    const isIntegrated = b.status === 'Integrated';
                    const isSelected = selectedBlock?.block_id === b.block_id;

                    const bg = isIntegrated
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.45), rgba(79, 70, 229, 0.55))'
                      : `${getDeptColor(b.departments[0])}30`;
                    const borderCol = isIntegrated ? '#a855f7' : getDeptColor(b.departments[0]);

                    return (
                      <div
                        key={b.block_id}
                        onClick={() => setSelectedBlock(b)}
                        className="timeline-block"
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 2.5)}%`,
                          top: 4,
                          bottom: 4,
                          background: bg,
                          border: `2px solid ${isSelected ? '#ffffff' : borderCol}`,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 8px',
                          cursor: 'pointer',
                          boxShadow: isIntegrated ? '0 0 12px rgba(139, 92, 246, 0.35)' : 'none',
                          transform: isSelected ? 'scale(1.02)' : 'none',
                          zIndex: isSelected ? 10 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
                            {isIntegrated ? '⚡ INTEGRATED' : b.departments[0]}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {b.end - b.start}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainability Drawer / Card */}
      {selectedBlock && (
        <div style={{
          backgroundColor: '#131b2e',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Block Details & AI Explainability: {selectedBlock.block_id}
                </h4>
                <span style={{
                  backgroundColor: selectedBlock.status === 'Integrated' ? '#8b5cf625' : '#1e293b',
                  color: selectedBlock.status === 'Integrated' ? '#c084fc' : '#94a3b8',
                  border: `1px solid ${selectedBlock.status === 'Integrated' ? '#8b5cf650' : '#334155'}`,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 600
                }}>
                  {selectedBlock.status === 'Integrated' ? 'Integrated Multi-Department Block' : 'Single Department Block'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
                <span>Section: <strong style={{ color: '#f1f5f9' }}>{selectedBlock.section_id}</strong></span>
                <span>Time: <strong style={{ color: '#f1f5f9' }}>{String(selectedBlock.start).padStart(2, '0')}:00 – {String(selectedBlock.end).padStart(2, '0')}:00 ({selectedBlock.end - selectedBlock.start} hrs)</strong></span>
                <span>Departments: <strong style={{ color: '#f1f5f9' }}>{selectedBlock.departments.join(', ')}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', padding: '6px 12px', borderRadius: 6, border: '1px solid #1e293b' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>Zero Train Conflict Protected</span>
            </div>
          </div>

          {/* Reason string */}
          <div style={{ marginTop: '16px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>
              Optimization Rationale
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {selectedBlock.reason}
            </p>
          </div>

          {/* Tasks in this block */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled Tasks:</span>
            {selectedBlock.tasks.map((tid) => (
              <span
                key={tid}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                {tid}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
