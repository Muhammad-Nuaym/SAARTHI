import React, { useState } from 'react';
import { MaintenanceTask, Department } from '../types';
import { Filter, AlertTriangle, Clock, Wrench, Search, Sparkles, HelpCircle, X, CheckCircle2 } from 'lucide-react';

interface DemandBoardProps {
  tasks: MaintenanceTask[];
}

export interface AIPriorityDetails {
  score: number;
  criticalityScore: number;
  urgencyScore: number;
  assetImpactScore: number;
  duePressureScore: number;
  why: string;
}

export const computeAIPriority = (t: MaintenanceTask): AIPriorityDetails => {
  // Criticality: 40% (max 40)
  const criticalityScore = Math.round((t.criticality / 5.0) * 40);
  // Urgency: 30% (max 30)
  const urgencyScore = Math.round((t.urgency / 5.0) * 30);
  // Asset Impact: 20% (max 20) -> based on critical assets (Interlocking/Catenary/Track)
  const isHighImpactAsset = t.criticality >= 4.0 || t.task_id.includes('EMERG') || t.task_id.includes('ST-01');
  const assetImpactScore = isHighImpactAsset ? 20 : 12;
  // Due-time pressure: 10% (max 10) -> earlier due date = higher pressure
  const duePressureScore = Math.max(0, Math.min(10, Math.round((1.0 - Math.min(t.due_date, 48) / 48) * 10)));
  const score = Math.min(100, criticalityScore + urgencyScore + assetImpactScore + duePressureScore);

  let why = '';
  if (t.urgency >= 4.8) {
    why = `Emergency breakdown remediation on ${t.department} asset (${t.asset_id}). Maximum priority score (${score}/100) assigned to avert mainline train disruption.`;
  } else if (t.criticality >= 4.0) {
    why = `High priority (${score}/100) because the task affects a critical ${t.department} asset and is approaching its operational deadline within ${t.due_date}h.`;
  } else {
    why = `Routine cyclical maintenance (${score}/100) on ${t.department} asset. Scheduled flexibly within designated corridor maintenance valleys.`;
  }

  return { score, criticalityScore, urgencyScore, assetImpactScore, duePressureScore, why };
};

export const DemandBoard: React.FC<DemandBoardProps> = ({ tasks }) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('PRIORITY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [explainTask, setExplainTask] = useState<{ task: MaintenanceTask; details: AIPriorityDetails } | null>(null);

  const filteredTasks = tasks.filter(t => {
    if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;
    if (selectedPriority === 'EMERGENCY' && t.urgency < 4.8) return false;
    if (selectedPriority === 'HIGH' && (t.criticality < 4.0 || t.urgency >= 4.8)) return false;
    if (selectedPriority === 'ROUTINE' && (t.criticality >= 4.0 || t.urgency >= 4.8)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.task_id.toLowerCase().includes(q) ||
                    t.section_id.toLowerCase().includes(q) ||
                    (t.description && t.description.toLowerCase().includes(q)) ||
                    t.required_resources.some(r => r.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'PRIORITY') {
      return computeAIPriority(b).score - computeAIPriority(a).score;
    } else if (sortBy === 'DUE_DATE') {
      return a.due_date - b.due_date;
    } else if (sortBy === 'DURATION') {
      return b.duration - a.duration;
    }
    return 0;
  });

  const getDeptColor = (dept: Department) => {
    switch (dept) {
      case 'Engineering': return '#f59e0b';
      case 'TRD': return '#3b82f6';
      case 'S&T': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>Maintenance Demand Board</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Consolidated maintenance task backlog from Engineering, TRD, and S&T. Showing {filteredTasks.length} of {tasks.length} tasks.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <div style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: 6, padding: '3px' }}>
            {['ALL', 'Engineering', 'TRD', 'S&T'].map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  backgroundColor: selectedDept === dept ? '#334155' : 'transparent',
                  color: selectedDept === dept ? '#f8fafc' : '#94a3b8',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">Emergency (Urgency 5.0)</option>
            <option value="HIGH">High Criticality (4.0+)</option>
            <option value="ROUTINE">Routine Maintenance</option>
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="PRIORITY">Sort: AI Priority (High → Low)</option>
            <option value="DUE_DATE">Sort: Due Date (Earliest)</option>
            <option value="DURATION">Sort: Duration (Longest)</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search tasks, section, kit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '6px 12px 6px 30px',
                fontSize: '0.8rem',
                outline: 'none',
                width: 210
              }}
            />
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: 9 }} />
          </div>
        </div>
      </div>

      {/* Task Intake Table */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px' }}>Task ID</th>
              <th style={{ padding: '12px 16px' }}>Department</th>
              <th style={{ padding: '12px 16px' }}>Section / Location</th>
              <th style={{ padding: '12px 16px' }}>Duration</th>
              <th style={{ padding: '12px 16px' }}>Due By (Hour)</th>
              <th style={{ padding: '12px 16px' }}>Urgency / Crit</th>
              <th style={{ padding: '12px 16px' }}>AI Priority Score</th>
              <th style={{ padding: '12px 16px' }}>Required Resource</th>
              <th style={{ padding: '12px 16px' }}>Scope & Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t, idx) => {
              const deptCol = getDeptColor(t.department);
              const isEmergency = t.urgency >= 4.8;
              const ai = computeAIPriority(t);
              const isHigh = ai.score >= 75 && ai.score < 90;
              const badgeBg = ai.score >= 90 ? '#ef444425' : (isHigh ? '#f59e0b25' : '#3b82f620');
              const badgeColor = ai.score >= 90 ? '#f87171' : (isHigh ? '#fbbf24' : '#60a5fa');
              const borderCol = ai.score >= 90 ? '#ef444450' : (isHigh ? '#f59e0b50' : '#3b82f640');

              return (
                <tr
                  key={t.task_id}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#f1f5f9' }}>
                    {t.task_id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: `${deptCol}20`,
                      color: deptCol,
                      border: `1px solid ${deptCol}50`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {t.department}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {t.section_id}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 600 }}>
                    {t.duration} hrs
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    Hour +{t.due_date}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isEmergency && <AlertTriangle size={14} color="#f87171" />}
                      <span style={{
                        color: isEmergency ? '#f87171' : (t.criticality >= 4.0 ? '#fbbf24' : '#94a3b8'),
                        fontWeight: 600
                      }}>
                        {t.urgency.toFixed(1)} / {t.criticality.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${borderCol}`,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Sparkles size={11} />
                        {ai.score}/100
                      </span>
                      <button
                        onClick={() => setExplainTask({ task: t, details: ai })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '0.72rem',
                          textDecoration: 'underline'
                        }}
                        title="Why this score?"
                      >
                        Why?
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {t.required_resources.length > 0 ? t.required_resources.join(', ') : 'Standard Gang'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1', maxWidth: 320 }}>
                    {t.description || `${t.department} track maintenance`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Priority Scoring Explainability Modal / Drawer */}
      {explainTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
            maxWidth: 540,
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  AI Priority Score: {explainTask.details.score}/100
                </h3>
              </div>
              <button
                onClick={() => setExplainTask(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '16px' }}>
              Task <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{explainTask.task.task_id}</strong> ({explainTask.task.department}) on section <strong style={{ color: '#ffffff' }}>{explainTask.task.section_id}</strong>
            </div>

            {/* Score Factor Breakdown */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em' }}>
                Deterministic Mathematical Weighting
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Criticality (Asset Impact Level):</span>
                  <strong style={{ color: '#fbbf24' }}>{explainTask.details.criticalityScore} / 40 pts (40%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Urgency (Operational Fault Risk):</span>
                  <strong style={{ color: '#f87171' }}>{explainTask.details.urgencyScore} / 30 pts (30%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Asset Corridor Weight (Trunk Mainline):</span>
                  <strong style={{ color: '#60a5fa' }}>{explainTask.details.assetImpactScore} / 20 pts (20%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Due-Time Pressure (Deadline Proximity):</span>
                  <strong style={{ color: '#a78bfa' }}>{explainTask.details.duePressureScore} / 10 pts (10%)</strong>
                </div>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: '12px 14px', marginBottom: '20px', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              <strong style={{ color: '#38bdf8' }}>Operational Rationale: </strong>
              {explainTask.details.why}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setExplainTask(null)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
