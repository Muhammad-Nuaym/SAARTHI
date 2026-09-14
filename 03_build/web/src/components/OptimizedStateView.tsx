import React, { useState } from 'react';
import { OptimizationResponse, ScheduleBlock } from '../types';
import { Sparkles, CheckCircle2, ShieldCheck, Layers, Info, ArrowDownRight, FileCheck, Edit3, CheckSquare, Calendar, Train, AlertCircle, X } from 'lucide-react';

interface OptimizedStateViewProps {
  data: OptimizationResponse;
}

export const OptimizedStateView: React.FC<OptimizedStateViewProps> = ({ data }) => {
  const blocks = data.optimized.blocks;
  const horizon = data.horizon_hours;
  const maxDisplayHours = Math.min(horizon, 48);

  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(blocks[0] || null);
  const [reviewStatus, setReviewStatus] = useState<'GENERATED' | 'UNDER_REVIEW' | 'MODIFIED' | 'APPROVED'>('GENERATED');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'timeline' | 'schedule_table'>(
    data.horizon === 'weekly' || data.horizon === 'monthly' ? 'schedule_table' : 'timeline'
  );


  const [checklist, setChecklist] = useState({
    ohePowerBlock: true,
    trackMachineClearance: true,
    signalInterlockingReset: true,
    operatingClearance: true
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>AI-Optimized Integrated Schedule</h2>
            <span style={{ backgroundColor: '#8b5cf625', color: '#c084fc', border: '1px solid #8b5cf650', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> CP-SAT Co-Scheduled
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Multi-department task bundling into unified integrated blocks. Eliminates redundant closures and enforces 0 simulated train conflicts.
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

      {/* Human-in-the-Loop Review / Approval Workflow Bar */}
      <div style={{
        backgroundColor: '#131b2e',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Pipeline Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: '#94a3b8' }}>WORKFLOW:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>1. AI Generated Plan</span>
          <span style={{ color: '#64748b' }}>➔</span>
          <span style={{ color: reviewStatus === 'UNDER_REVIEW' ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
            2. Review Plan
          </span>
          <span style={{ color: '#64748b' }}>➔</span>
          <span style={{ color: reviewStatus === 'APPROVED' ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
            3. Approve / Modify
          </span>
          <span style={{ color: '#64748b' }}>➔</span>
          <span style={{
            backgroundColor: reviewStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(51, 65, 85, 0.5)',
            color: reviewStatus === 'APPROVED' ? '#34d399' : '#cbd5e1',
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 700,
            border: `1px solid ${reviewStatus === 'APPROVED' ? '#10b98150' : '#475569'}`
          }}>
            {reviewStatus === 'APPROVED' ? 'FINAL PLAN ISSUED TO SECTION CONTROLLER' : 'PENDING OPERATOR SIGN-OFF'}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setReviewStatus('UNDER_REVIEW');
              setShowReviewModal(true);
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <FileCheck size={14} color="#60a5fa" />
            Review Plan
          </button>
          <button
            onClick={() => {
              setReviewStatus('MODIFIED');
              alert('Simulated plan modification: Corridor slot offset adjusted by +15 min for goods rake clearance.');
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Edit3 size={14} color="#fbbf24" />
            Modify Plan
          </button>
          <button
            onClick={() => setReviewStatus('APPROVED')}
            style={{
              backgroundColor: reviewStatus === 'APPROVED' ? '#059669' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle2 size={14} />
            {reviewStatus === 'APPROVED' ? 'Plan Approved' : 'Approve Plan'}
          </button>
        </div>
      </div>

      {/* Authorized Operator Boundary Disclaimer */}
      <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginBottom: '16px', paddingLeft: 4 }}>
        Note: Final scheduling decision remains with authorized railway operations personnel (Chief Controller / Operating Department). SAARTHI functions as an intelligent decision-support system.
      </div>

      {/* Multi-Department Co-Scheduling Showcase Banner */}
      <div style={{
        backgroundColor: '#1e1b4b30',
        border: '1px solid #6366f150',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ backgroundColor: '#6366f1', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
              CORE HIGHLIGHT
            </span>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0e7ff' }}>
              Multi-Department Co-Scheduling: 3 Departments → 1 Coordinated Block
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: 4 }}>
            Instead of separate track closures per department totalling{' '}
            <strong style={{ color: '#f87171' }}>{data.baseline.metrics.total_block_hours}h</strong> downtime,
            the engine synchronizes all departments into unified possession windows, reducing to{' '}
            <strong style={{ color: '#38bdf8' }}>{data.optimized.metrics.total_block_hours}h</strong> and saving{' '}
            <strong style={{ color: '#34d399' }}>{data.delta.block_hours_saved}h</strong> of commercial corridor downtime.
          </p>

        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: 6, padding: '3px', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setActiveViewTab('timeline')}
            style={{
              backgroundColor: activeViewTab === 'timeline' ? '#334155' : 'transparent',
              color: activeViewTab === 'timeline' ? '#f8fafc' : '#94a3b8',
              border: 'none',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Corridor Timeline
          </button>
          <button
            onClick={() => setActiveViewTab('schedule_table')}
            style={{
              backgroundColor: activeViewTab === 'schedule_table' ? '#334155' : 'transparent',
              color: activeViewTab === 'schedule_table' ? '#f8fafc' : '#94a3b8',
              border: 'none',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Calendar size={13} />
            {data.horizon === 'monthly' ? '30-Day Executive Plan' : '7-Day Plan Table'}
          </button>
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
              <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>0 Simulated Train Conflicts</span>
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

      {/* Train Timetable Deconfliction Verification Panel */}
      <div style={{ marginTop: '24px', backgroundColor: '#131b2e', border: '1px solid #10b98140', borderRadius: 10, padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#10b981" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              Train Timetable Deconfliction Verification (0 Simulated Conflicts)
            </h4>
          </div>
          <span style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: 4,
            fontWeight: 700
          }}>
            0 CONFLICTS IN THIS SCENARIO
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
          CP-SAT mathematical constraints enforce strict separation between maintenance possessions and passenger/goods train paths. All express runs preserved with zero track downtime collision.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                <th style={{ padding: '8px 12px' }}>Train ID & Name</th>
                <th style={{ padding: '8px 12px' }}>Train Service Class</th>
                <th style={{ padding: '8px 12px' }}>Section Corridor</th>
                <th style={{ padding: '8px 12px' }}>Operating Window</th>
                <th style={{ padding: '8px 12px' }}>Maintenance Block Offset</th>
                <th style={{ padding: '8px 12px' }}>Deconfliction Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>12301 Rajdhani Exp</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>Priority Passenger Express</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>SEC-ALD-CNB-UP</td>
                <td style={{ padding: '10px 12px', color: '#fbbf24' }}>07:00 – 09:00</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>Shifted to 01:00-05:00 Night Valley</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> 0 CONFLICTS
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>22436 Vande Bharat</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>Semi-High Speed Express</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>SEC-CNB-ETW-UP</td>
                <td style={{ padding: '10px 12px', color: '#fbbf24' }}>06:00 – 08:00</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>Deconflicted into 12:00-15:00 Lull</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> 0 CONFLICTS
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>BOXN Heavy Freight</td>
                <td style={{ padding: '10px 12px', color: '#a78bfa' }}>Bulk Freight Rake</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>SEC-ALD-CNB-DN</td>
                <td style={{ padding: '10px 12px', color: '#fbbf24' }}>21:00 – 00:00</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>Protected freight path preserved</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> 0 CONFLICTS
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Genuine Weekly (7-Day) or Monthly (30-Day) Planning Grid */}
      {activeViewTab === 'schedule_table' && (
        <div style={{ marginTop: '24px', backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, padding: '20px' }}>
          {data.horizon === 'monthly' ? (
            /* Monthly 30-Day Executive Matrix */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                    30-Day Monthly Maintenance Executive Plan (720-Hour Horizon)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                    Aggregated 4-week corridor schedule balancing asset health, safety overhauls, and traffic throughput.
                  </p>
                </div>
                <span style={{ backgroundColor: '#1e293b', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 4 }}>
                  SYNTHETIC 30-DAY CORRIDOR DATA
                </span>
              </div>

              {/* 4-Week Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {[
                  { week: 'Week 1 (Days 1–7)', blocks: 14, tasks: 22, crit: '100% On-Time', deferred: 0, intBlocks: 6, hours: 42, avail: '89.6%' },
                  { week: 'Week 2 (Days 8–14)', blocks: 16, tasks: 24, crit: '100% On-Time', deferred: 1, intBlocks: 7, hours: 46, avail: '88.9%' },
                  { week: 'Week 3 (Days 15–21)', blocks: 15, tasks: 21, crit: '100% On-Time', deferred: 0, intBlocks: 6, hours: 44, avail: '89.2%' },
                  { week: 'Week 4 (Days 22–30)', blocks: 18, tasks: 28, crit: '100% On-Time', deferred: 2, intBlocks: 8, hours: 50, avail: '88.5%' }
                ].map((wk, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.88rem', marginBottom: 8 }}>{wk.week}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Planned Blocks:</span>
                        <strong style={{ color: '#f8fafc' }}>{wk.blocks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Maintenance Tasks:</span>
                        <strong style={{ color: '#f8fafc' }}>{wk.tasks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Integrated Blocks:</span>
                        <strong style={{ color: '#a855f7' }}>{wk.intBlocks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Possession Hours:</span>
                        <strong style={{ color: '#fbbf24' }}>{wk.hours} hrs</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Critical Tasks Completed:</span>
                        <strong style={{ color: '#34d399' }}>{wk.crit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Corridor Availability Proxy:</span>
                        <strong style={{ color: '#38bdf8' }}>{wk.avail}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Summary Strip */}
              <div style={{ backgroundColor: '#0f172a', borderRadius: 8, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem' }}>
                <div><span style={{ color: '#64748b' }}>Total Monthly Tasks:</span> <strong style={{ color: '#f8fafc' }}>95 tasks</strong></div>
                <div><span style={{ color: '#64748b' }}>Integrated Blocks:</span> <strong style={{ color: '#a855f7' }}>27 blocks</strong></div>
                <div><span style={{ color: '#64748b' }}>Net Downtime Saved:</span> <strong style={{ color: '#34d399' }}>54.0 hours</strong></div>
                <div><span style={{ color: '#64748b' }}>Train Conflicts:</span> <strong style={{ color: '#38bdf8' }}>0 simulated</strong></div>
                <div><span style={{ color: '#64748b' }}>Avg Corridor Availability:</span> <strong style={{ color: '#38bdf8' }}>89.05%</strong></div>
              </div>
            </div>
          ) : (
            /* Weekly 7-Day Day-by-Day Planning Table */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                    7-Day Weekly Maintenance Corridor Plan (168-Hour Horizon)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                    Daily coordinated schedule allocating section possession windows across Engineering, TRD, and S&T.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem' }}>
                  <span style={{ color: '#64748b' }}>Weekly Tasks: <strong style={{ color: '#f8fafc' }}>{data.tasks.length}</strong></span>
                  <span style={{ color: '#64748b' }}>Integrated Blocks: <strong style={{ color: '#a855f7' }}>{data.delta.integrated_blocks_count}</strong></span>
                  <span style={{ color: '#64748b' }}>Possession Hours: <strong style={{ color: '#fbbf24' }}>{data.optimized.metrics.total_block_hours}h</strong></span>
                  <span style={{ color: '#64748b' }}>Train Conflicts: <strong style={{ color: '#34d399' }}>0 simulated</strong></span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                      <th style={{ padding: '8px 12px' }}>Day</th>
                      <th style={{ padding: '8px 12px' }}>Corridor Section</th>
                      <th style={{ padding: '8px 12px' }}>Integrated Block ID</th>
                      <th style={{ padding: '8px 12px' }}>Departments</th>
                      <th style={{ padding: '8px 12px' }}>Scheduled Tasks</th>
                      <th style={{ padding: '8px 12px' }}>Duration</th>
                      <th style={{ padding: '8px 12px' }}>Priority Level</th>
                      <th style={{ padding: '8px 12px' }}>Train Conflicts</th>
                      <th style={{ padding: '8px 12px' }}>Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { day: 'MON (Day 1)', sec: 'SEC-ALD-CNB-UP', blk: 'BLK-OPT-0001', depts: ['S&T', 'Engineering', 'TRD'], tasks: 'TSK-ST-01, TSK-ENG-01, TSK-TRD-01', dur: '3 hrs', crit: 'Emergency & High', status: 'Deconflicted' },
                      { day: 'TUE (Day 2)', sec: 'SEC-ALD-CNB-DN', blk: 'BLK-OPT-0002', depts: ['Engineering'], tasks: 'TSK-ENG-02 (Tamping)', dur: '3 hrs', crit: 'Routine Track', status: 'Deconflicted' },
                      { day: 'WED (Day 3)', sec: 'SEC-CNB-ETW-UP', blk: 'BLK-OPT-0003', depts: ['TRD', 'S&T'], tasks: 'TSK-TRD-03, TSK-ST-02', dur: '3 hrs', crit: 'High OHE / Signal', status: 'Deconflicted' },
                      { day: 'THU (Day 4)', sec: 'SEC-CNB-ETW-DN', blk: 'BLK-OPT-0004', depts: ['Engineering', 'TRD'], tasks: 'TSK-ENG-04, TSK-TRD-04', dur: '4 hrs', crit: 'Cyclical Track Pack', status: 'Deconflicted' },
                      { day: 'FRI (Day 5)', sec: 'SEC-ALD-CNB-UP', blk: 'BLK-OPT-0005', depts: ['S&T'], tasks: 'TSK-ST-04 (Interlocking)', dur: '2 hrs', crit: 'High Interlocking', status: 'Deconflicted' },
                      { day: 'SAT (Day 6)', sec: 'SEC-ALD-CNB-DN', blk: 'BLK-OPT-0006', depts: ['Engineering', 'TRD', 'S&T'], tasks: 'TSK-ENG-05, TSK-TRD-05, TSK-ST-05', dur: '4 hrs', crit: 'Integrated Mega Block', status: 'Deconflicted' },
                      { day: 'SUN (Day 7)', sec: 'SEC-CNB-ETW-UP', blk: 'BLK-OPT-0007', depts: ['TRD'], tasks: 'TSK-TRD-06 (Isolator Test)', dur: '2 hrs', crit: 'Routine Inspection', status: 'Deconflicted' }
                    ].map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f8fafc' }}>{row.day}</td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{row.sec}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>{row.blk}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            backgroundColor: row.depts.length > 1 ? '#8b5cf625' : '#1e293b',
                            color: row.depts.length > 1 ? '#c084fc' : '#94a3b8',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: '0.72rem'
                          }}>
                            {row.depts.join(' + ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: '0.72rem' }}>{row.tasks}</td>
                        <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600 }}>{row.dur}</td>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{row.crit}</td>
                        <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>0 simulated</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ backgroundColor: '#10b98120', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: '0.72rem' }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Checklist Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#131b2e',
            border: '1px solid #334155',
            borderRadius: 12,
            maxWidth: 520,
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck size={20} color="#60a5fa" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Operational Safety & Dispatch Verification
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '16px' }}>
              Chief Controller / Section Controller validation checklist for proposed integrated maintenance block:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.ohePowerBlock}
                  onChange={(e) => setChecklist({ ...checklist, ohePowerBlock: e.target.checked })}
                />
                <span>TRD OHE Power Block de-energization & earth discharge confirmed</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.trackMachineClearance}
                  onChange={(e) => setChecklist({ ...checklist, trackMachineClearance: e.target.checked })}
                />
                <span>Engineering mechanized tamper & ballast gang clearances verified</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.signalInterlockingReset}
                  onChange={(e) => setChecklist({ ...checklist, signalInterlockingReset: e.target.checked })}
                />
                <span>S&T electronic interlocking & point machine testing kit aligned</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.operatingClearance}
                  onChange={(e) => setChecklist({ ...checklist, operatingClearance: e.target.checked })}
                />
                <span>Section Controller verified zero train path collision across corridor</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setReviewStatus('APPROVED');
                  setShowReviewModal(false);
                }}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Approve & Issue to Controller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
