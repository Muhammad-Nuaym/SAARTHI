import React, { useState } from 'react';
import { OptimizationResponse } from '../types';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface MetricsBoardProps {
  data: OptimizationResponse;
}

export const MetricsBoard: React.FC<MetricsBoardProps> = ({ data }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const b = data.baseline.metrics;
  const o = data.optimized.metrics;
  const d = data.delta;

  const kpis = [
    {
      id: 'block_hours',
      title: 'Total Corridor Possession Hours',
      baseline: `${b.total_block_hours} hrs`,
      optimized: `${o.total_block_hours} hrs`,
      delta: `-${d.block_hours_saved} hrs`,
      deltaPct: b.total_block_hours > 0 ? `${((d.block_hours_saved / b.total_block_hours) * 100).toFixed(1)}% reduction` : '0%',
      isPositive: d.block_hours_saved > 0,
      summary: 'Downtime saved via multi-department co-scheduling into integrated blocks.',
      formula: 'sum(block.end - block.start for block in scheduled_blocks)',
      traceability: 'Calculated directly over output block start/end intervals. Integrated blocks count shared possession hours only once.'
    },
    {
      id: 'train_conflicts',
      title: 'Train Path Infringements / Conflicts',
      baseline: `${b.train_conflict_count}`,
      optimized: `${o.train_conflict_count}`,
      delta: `-${d.conflict_reduction}`,
      deltaPct: b.train_conflict_count > 0 ? '100% eliminated' : '0 conflicts',
      isPositive: o.train_conflict_count === 0,
      summary: 'Physical overlaps between maintenance possession and scheduled train paths.',
      formula: 'count(where max(block.start, train.arrival) < min(block.end, train.departure) on same section)',
      traceability: 'Strict CP-SAT hard constraint disallows any temporal overlap between a line possession and train timetable interval.'
    },
    {
      id: 'lateness',
      title: 'Critical Task Lateness Score',
      baseline: `${b.critical_task_lateness}`,
      optimized: `${o.critical_task_lateness}`,
      delta: `-${d.lateness_reduction}`,
      deltaPct: b.critical_task_lateness > 0 ? `${((d.lateness_reduction / b.critical_task_lateness) * 100).toFixed(1)}% drop` : '0 penalty',
      isPositive: d.lateness_reduction >= 0,
      summary: 'Weighted overdue penalty on emergency and high-criticality assets.',
      formula: 'sum(max(0, completion_time - task.due_date) * task.criticality for critical tasks)',
      traceability: 'Derived from task due dates and actual block completion timestamps. High urgency (5.0) tasks are prioritized earliest.'
    },
    {
      id: 'availability',
      title: 'Corridor Availability Proxy',
      baseline: `${b.availability_proxy_pct}%`,
      optimized: `${o.availability_proxy_pct}%`,
      delta: `+${d.availability_gain_pct}%`,
      deltaPct: `+${d.availability_gain_pct} percentage points`,
      isPositive: d.availability_gain_pct > 0,
      summary: 'Percentage of total section-hours open for commercial train operations.',
      formula: '((Total Section Capacity - Total Block Hours) / Total Section Capacity) * 100',
      traceability: 'Total Capacity = num_sections * horizon_hours. Reflects net network throughput capacity gained.'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
          Performance Metrics & Mathematical Traceability
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
          Deterministic before-vs-after comparison. Every metric is computed strictly from raw scenario timestamps and parameters (no magic numbers).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {kpis.map((kpi) => {
          const isExpanded = expandedCard === kpi.id;

          return (
            <div
              key={kpi.id}
              style={{
                backgroundColor: '#131b2e',
                border: '1px solid #1e293b',
                borderRadius: 10,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{kpi.title}</div>

                {/* Before vs After Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '14px 0 8px 0' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>BEFORE (Baseline)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8' }}>
                      {kpi.baseline}
                    </div>
                  </div>

                  <div style={{ fontSize: '1.2rem', color: '#64748b' }}>➔</div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>AFTER (Optimized)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
                      {kpi.optimized}
                    </div>
                  </div>
                </div>

                {/* Delta Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: kpi.isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                  color: kpi.isPositive ? '#34d399' : '#cbd5e1',
                  border: `1px solid ${kpi.isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 4,
                  marginBottom: 10
                }}>
                  {kpi.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {kpi.delta} ({kpi.deltaPct})
                </div>

                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {kpi.summary}
                </p>
              </div>

              {/* Traceability Toggle */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                <button
                  onClick={() => toggleExpand(kpi.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: 0
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calculator size={13} /> Formula & Traceability
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '10px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Formula
                    </div>
                    <code style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'block', margin: '4px 0', fontFamily: 'monospace' }}>
                      {kpi.formula}
                    </code>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                      {kpi.traceability}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
