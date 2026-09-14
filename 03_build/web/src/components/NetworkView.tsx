import React, { useState } from 'react';
import { OptimizationResponse } from '../types';
import { MapPin, Clock, Info, ShieldCheck, Zap, Database, Train, CheckCircle2, ChevronDown, ChevronUp, GitMerge } from 'lucide-react';

interface NetworkViewProps {
  data: OptimizationResponse;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ data }) => {
  const [showDataSources, setShowDataSources] = useState<boolean>(true);
  const [showArchitecture, setShowArchitecture] = useState<boolean>(false);

  const sections = [
    {
      id: 'SEC-ALD-CNB-UP',
      name: 'Prayagraj Jn (ALD) → Kanpur Central (CNB) Up Main',
      stations: ['Prayagraj Jn', 'Sirathu', 'Fatehpur', 'Kanpur Central'],
      speed: '130 km/h',
      signalling: 'Automatic Block (ABS)',
      traction: '25 kV AC OHE'
    },
    {
      id: 'SEC-ALD-CNB-DN',
      name: 'Kanpur Central (CNB) → Prayagraj Jn (ALD) Down Main',
      stations: ['Kanpur Central', 'Fatehpur', 'Sirathu', 'Prayagraj Jn'],
      speed: '130 km/h',
      signalling: 'Automatic Block (ABS)',
      traction: '25 kV AC OHE'
    },
    {
      id: 'SEC-CNB-ETW-UP',
      name: 'Kanpur Central (CNB) → Etawah Jn (ETW) Up Main',
      stations: ['Kanpur Central', 'Panki', 'Rura', 'Phaphund', 'Etawah Jn'],
      speed: '130 km/h',
      signalling: 'Automatic Block (ABS)',
      traction: '25 kV AC OHE'
    },
    {
      id: 'SEC-CNB-ETW-DN',
      name: 'Etawah Jn (ETW) → Kanpur Central (CNB) Down Main',
      stations: ['Etawah Jn', 'Phaphund', 'Rura', 'Panki', 'Kanpur Central'],
      speed: '130 km/h',
      signalling: 'Automatic Block (ABS)',
      traction: '25 kV AC OHE'
    }
  ];

  // Map tasks to sections for visual indicators
  const tasksBySec: { [sec: string]: number } = {};
  data.tasks.forEach(t => {
    tasksBySec[t.section_id] = (tasksBySec[t.section_id] || 0) + 1;
  });

  // Simulated enterprise railway systems
  const dataSources = [
    { code: 'TMS',  name: 'Track Management System',             dept: 'Engineering',         desc: 'Track geometry defects, tamping cycles & rail renewal backlogs' },
    { code: 'TDMS', name: 'Traction Distribution Management System', dept: 'TRD (Electrical)', desc: 'OHE catenary inspections, contact wire wear & power block requests' },
    { code: 'SMMS', name: 'Signal Maintenance Management System', dept: 'S&T (Signals)',       desc: 'Electronic interlocking health, point machines & axle counters' },
    { code: 'BDMS', name: 'Block Demand Management System',       dept: 'Operating Dept',      desc: 'Section possession requisitions & inter-departmental quotas' },
    { code: 'COA',  name: 'Control Office Application',           dept: 'Traffic / Punctuality', desc: 'Live train timetables, passenger express paths & goods train forecasts' },
  ];

  // Architecture pipeline steps
  const pipelineSteps = [
    { label: 'MAINTENANCE DEMANDS',          sub: 'TMS · TDMS · SMMS · BDMS',                color: '#f59e0b' },
    { label: 'AI PRIORITY / RISK SCORING',  sub: 'Deterministic weighted scoring engine',     color: '#f97316' },
    { label: 'TRAIN TIMETABLE INPUT',        sub: 'COA — passenger & goods train paths',      color: '#3b82f6' },
    { label: 'CORRIDOR AVAILABILITY',        sub: 'Block availability windows per section',    color: '#8b5cf6' },
    { label: 'CONFLICT DETECTION',           sub: 'Temporal overlap check (same section)',     color: '#ef4444' },
    { label: 'CP-SAT OPTIMIZATION',          sub: 'Constraint programming solver',            color: '#6366f1' },
    { label: 'INTEGRATED MULTI-DEPT BLOCKS', sub: 'Eng + TRD + S&T co-scheduled possessions', color: '#10b981' },
    { label: 'BEFORE vs AFTER METRICS',      sub: 'Possession hrs · Availability · Lateness', color: '#34d399' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>Corridor Network &amp; Block Windows</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Abstracted railway schematic of North Central Railway (NCR) trunk corridor. Simplified line topology with multi-layer train traffic demand.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            Engineering
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
            TRD (Electrical)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            S&amp;T (Signals)
          </span>
        </div>
      </div>

      {/* AI + Optimization Architecture Pipeline (collapsible) */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #6366f140', borderRadius: 10, padding: '16px 20px', marginBottom: '20px' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowArchitecture(!showArchitecture)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitMerge size={18} color="#818cf8" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
              AI + Optimization Architecture Pipeline
            </h3>
            <span style={{
              backgroundColor: '#6366f120',
              color: '#a5b4fc',
              border: '1px solid #6366f150',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4
            }}>
              AI-assisted prioritization + CP-SAT constraint optimization
            </span>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            {showArchitecture ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showArchitecture && (
          <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' }}>
              SAARTHI uses a two-stage approach: <strong style={{ color: '#a5b4fc' }}>AI-assisted prioritization</strong> (deterministic scoring engine) feeds into a <strong style={{ color: '#a5b4fc' }}>CP-SAT constraint optimization solver</strong>. The CP-SAT solver itself is a mathematical optimizer — not a neural network. Together they form the "AI Priority Engine + CP-SAT Scheduling Engine."
            </p>

            {/* Pipeline steps horizontal flow */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto', paddingBottom: 6 }}>
              {pipelineSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    backgroundColor: '#0f172a',
                    border: `1px solid ${step.color}50`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    textAlign: 'center',
                    minWidth: 130,
                    boxShadow: `0 0 8px ${step.color}15`
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: step.color, letterSpacing: '0.04em' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 3, lineHeight: 1.3 }}>
                      {step.sub}
                    </div>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <div style={{ color: '#4338ca', fontSize: '1.1rem', padding: '0 4px', flexShrink: 0 }}>↓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical fallback for narrow screens */}
            <div style={{ display: 'none' }}>
              {/* hidden mobile-friendly version */}
            </div>

            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 12, fontStyle: 'italic' }}>
              Note: CP-SAT is a mathematical constraint programming solver, not a neural AI model. The AI component is the priority scoring engine that ranks tasks before feeding them to CP-SAT.
            </p>
          </div>
        )}
      </div>

      {/* Integrated Data Sources Panel (Simulated Inputs) */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDataSources(!showDataSources)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={18} color="#6366f1" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
              Integrated Railway Data Sources (Simulated Input Feeds)
            </h3>
            <span style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4
            }}>
              SYNTHETIC / SIMULATED PROTOTYPE DATA
            </span>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            {showDataSources ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showDataSources && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
              SAARTHI consumes simulated input feeds modeled after Indian Railways operational data architectures. No live connection to production railway networks.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {dataSources.map((ds) => (
                <div key={ds.code} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {ds.code}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> Feed Ready
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {ds.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
                    {ds.dept}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>
                    {ds.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schematic Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sections.map((sec) => {
          const taskCount = tasksBySec[sec.id] || (sec.id.includes('01') ? 3 : 1);
          const windows = data.network.windows.filter(w => w.section_id === sec.id || w.section_id === 'SEC-01');

          return (
            <div
              key={sec.id}
              style={{
                backgroundColor: '#131b2e',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '20px'
              }}
            >
              {/* Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9' }}>{sec.name}</h3>
                    <span style={{ backgroundColor: '#1e293b', color: '#cbd5e1', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {sec.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Max Speed: <strong style={{ color: '#94a3b8' }}>{sec.speed}</strong></span>
                    <span>Signalling: <strong style={{ color: '#94a3b8' }}>{sec.signalling}</strong></span>
                    <span>Traction: <strong style={{ color: '#94a3b8' }}>{sec.traction}</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: taskCount > 4 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: taskCount > 4 ? '#f87171' : '#60a5fa',
                    border: `1px solid ${taskCount > 4 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6
                  }}>
                    {taskCount} Pending Maintenance Tasks
                  </span>
                </div>
              </div>

              {/* Linear Track Schematic */}
              <div style={{ position: 'relative', margin: '24px 0 16px 0', padding: '0 20px' }}>
                {/* Track Line */}
                <div style={{ height: 4, backgroundColor: '#334155', borderRadius: 2, position: 'relative', top: 12 }}></div>

                {/* Station Nodes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {sec.stations.map((stn, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#0f172a',
                        border: '3px solid #6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)'
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ffffff' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', marginTop: 6 }}>
                        {stn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visible Train & Corridor Demand Layer */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                    <Train size={15} color="#38bdf8" />
                    <span>Train &amp; Corridor Demand Layer (Synthetic Traffic Analysis)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Evaluated before allocating maintenance possessions
                  </span>
                </div>

                {/* Window Demand Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {windows.slice(0, 2).map((w, wIdx) => {
                    const isNightValley = w.start <= 5;
                    const passCount = isNightValley ? 2 : 3;
                    const goodsCount = isNightValley ? 1 : 2;
                    const congestion = isNightValley ? 'LOW' : 'MODERATE';
                    const availability = isNightValley ? 'HIGH (91.7%)' : 'HIGH (87.5%)';
                    const suitability = isNightValley ? 'OPTIMAL FOR MULTI-DEPT BLOCK' : 'SECONDARY WINDOW';
                    const isBest = isNightValley;

                    return (
                      <div
                        key={w.window_id || wIdx}
                        style={{
                          backgroundColor: '#0f172a',
                          border: isBest ? '1px solid #6366f1' : '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '14px',
                          boxShadow: isBest ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} color="#a5b4fc" />
                            <strong style={{ color: '#f8fafc', fontSize: '0.82rem' }}>
                              WINDOW {String(w.start).padStart(2, '0')}:00 – {String(w.end).padStart(2, '0')}:00
                            </strong>
                          </div>
                          {isBest && (
                            <span style={{
                              backgroundColor: '#4338ca30',
                              color: '#a5b4fc',
                              border: '1px solid #6366f150',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              ★ BEST MAINTENANCE WINDOW
                            </span>
                          )}
                        </div>

                        {/* Metrics table */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.72rem', color: '#94a3b8', margin: '8px 0' }}>
                          <div>Passenger trains: <strong style={{ color: '#f1f5f9' }}>{passCount}</strong></div>
                          <div>Goods trains: <strong style={{ color: '#f1f5f9' }}>{goodsCount}</strong></div>
                          <div>Forecast congestion: <strong style={{ color: isNightValley ? '#34d399' : '#fbbf24' }}>{congestion}</strong></div>
                          <div>Corridor availability: <strong style={{ color: '#38bdf8' }}>{availability}</strong></div>
                          <div>Train conflicts: <strong style={{ color: '#34d399' }}>0 simulated</strong></div>
                          <div>Block suitability: <strong style={{ color: '#a78bfa' }}>{suitability}</strong></div>
                        </div>

                        {/* AI Recommendation Callout */}
                        <div style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          backgroundColor: '#131b2e',
                          borderRadius: 6,
                          border: '1px solid #1e293b',
                          fontSize: '0.72rem',
                          color: '#cbd5e1',
                          lineHeight: 1.4
                        }}>
                          <span style={{ color: '#818cf8', fontWeight: 600 }}>Why this window? </span>
                          {isNightValley
                            ? 'Low passenger traffic + low goods traffic + high corridor availability makes this the preferred window for combined Engineering, TRD, and S&T possession.'
                            : 'Mid-day traffic lull allows secondary routine inspections without encroaching on trunk passenger timetable.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
