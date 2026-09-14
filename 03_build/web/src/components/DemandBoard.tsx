import React, { useState } from 'react';
import { MaintenanceTask, Department } from '../types';
import { Filter, AlertTriangle, Clock, Wrench, Search } from 'lucide-react';

interface DemandBoardProps {
  tasks: MaintenanceTask[];
}

export const DemandBoard: React.FC<DemandBoardProps> = ({ tasks }) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
              <th style={{ padding: '12px 16px' }}>Required Resource</th>
              <th style={{ padding: '12px 16px' }}>Scope & Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t, idx) => {
              const deptCol = getDeptColor(t.department);
              const isEmergency = t.urgency >= 4.8;
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
    </div>
  );
};
