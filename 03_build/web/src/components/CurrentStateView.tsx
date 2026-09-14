import React from 'react';
import { OptimizationResponse, ScheduleBlock } from '../types';
import { AlertOctagon, ArrowRight, ShieldAlert, Clock, Layers } from 'lucide-react';

interface CurrentStateViewProps {
  data: OptimizationResponse;
  onSwitchToOptimized: () => void;
}

export const CurrentStateView: React.FC<CurrentStateViewProps> = ({ data, onSwitchToOptimized }) => {
  const blocks = data.baseline.blocks;
  const horizon = data.horizon_hours;
  const maxDisplayHours = Math.min(horizon, 48); // Show first 24-48h on visual strip for high clarity

  const departments: ('Engineering' | 'TRD' | 'S&T')[] = ['Engineering', 'TRD', 'S&T'];

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Engineering': return '#f59e0b';
      case 'TRD': return '#3b82f6';
      case 'S&T': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Banner & Switcher CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>Current State: Departmental Silos (Baseline)</h2>
            <span style={{ backgroundColor: '#ef444420', color: '#f87171', border: '1px solid #ef444440', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Pre-Optimization
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Siloed First-Come-First-Served (FCFS) bookings. Zero multi-department co-scheduling creates redundant corridor closures and deadline violations.
          </p>
        </div>

        <button
          onClick={onSwitchToOptimized}
          style={{
            backgroundColor: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          View AI Optimized Schedule
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Line Closure Hours</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {data.baseline.metrics.total_block_hours} hrs
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Uncoordinated individual blocks</div>
        </div>

        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Train Path Infringements</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: data.baseline.metrics.train_conflict_count > 0 ? '#f87171' : '#10b981', marginTop: 4 }}>
            {data.baseline.metrics.train_conflict_count}
          </div>
          <div style={{ fontSize: '0.72rem', color: data.baseline.metrics.train_conflict_count > 0 ? '#f87171' : '#64748b', marginTop: 4 }}>
            {data.baseline.metrics.train_conflict_count > 0 ? 'High passenger train risk' : 'Pushed late or rejected'}
          </div>
        </div>

        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Critical Task Lateness</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>
            {data.baseline.metrics.critical_task_lateness}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Weighted delay penalty score</div>
        </div>

        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Track Availability Proxy</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#cbd5e1', marginTop: 4 }}>
            {data.baseline.metrics.availability_proxy_pct}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Corridor commercial availability</div>
        </div>
      </div>

      {/* Side-by-Side Department Lanes */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="#6366f1" /> Departmental Block Allocation Timeline (First {maxDisplayHours} Hours)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Grid scale: 1 tick = 2 hours
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

        {/* Department Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {departments.map((dept) => {
            const deptCol = getDeptColor(dept);
            const deptBlocks = blocks.filter(b => b.departments.includes(dept));

            return (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', minHeight: 48 }}>
                {/* Lane Label */}
                <div style={{ width: 120, paddingRight: 12 }}>
                  <span style={{
                    color: deptCol,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'block'
                  }}>
                    {dept}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {deptBlocks.length} blocks booked
                  </span>
                </div>

                {/* Lane Track Strip */}
                <div style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#0f172a',
                  borderRadius: 6,
                  border: '1px solid #1e293b',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {deptBlocks.map((b) => {
                    if (b.start >= maxDisplayHours) return null;
                    const leftPct = (b.start / maxDisplayHours) * 100;
                    const widthPct = Math.min(((b.end - b.start) / maxDisplayHours) * 100, 100 - leftPct);
                    const isConflict = b.status === 'RejectedConflict';

                    return (
                      <div
                        key={b.block_id}
                        className={isConflict ? 'clash-pulse' : ''}
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 2)}%`,
                          top: 4,
                          bottom: 4,
                          backgroundColor: isConflict ? '#dc2626' : `${deptCol}35`,
                          border: `1.5px solid ${isConflict ? '#ef4444' : deptCol}`,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 6px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          boxShadow: isConflict ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                          cursor: 'pointer'
                        }}
                        title={b.reason || `${dept} Block ${b.block_id}`}
                      >
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isConflict ? '#ffffff' : '#f8fafc' }}>
                          {b.tasks[0] || b.block_id} ({b.end - b.start}h)
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

      {/* Log of baseline allocations */}
      <div style={{ marginTop: '20px', backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 8, padding: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
          Departmental Possession Requests & Dispatcher Log
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
          {blocks.slice(0, 8).map((b) => (
            <div key={b.block_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: 6 }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>{b.block_id}</strong> on {b.section_id} ({b.start}:00 - {b.end}:00)
                <span style={{ marginLeft: 8, color: '#64748b' }}>• {b.reason}</span>
              </div>
              <span style={{ color: b.status === 'RejectedConflict' ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
                {b.end - b.start}h closure
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
