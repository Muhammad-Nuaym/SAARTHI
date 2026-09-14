import React from 'react';
import { Train, ShieldAlert, Cpu, Calendar, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedScenario: string;
  setSelectedScenario: (id: string) => void;
  selectedHorizon: string;
  setSelectedHorizon: (h: string) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedScenario,
  setSelectedScenario,
  selectedHorizon,
  setSelectedHorizon,
  isLoading
}) => {
  const tabs = [
    { id: 'network', label: '1. Network View' },
    { id: 'demand', label: '2. Demand Board' },
    { id: 'current', label: '3. Current State (Silos)' },
    { id: 'optimized', label: '4. Optimized State (AI)' },
    { id: 'metrics', label: '5. Metrics Board' },
    { id: 'replay', label: '6. Replay & Scenarios' }
  ];

  return (
    <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Title and Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Train size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>SAARTHI</span>
                <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 500, backgroundColor: '#312e8140', padding: '2px 8px', borderRadius: 4, border: '1px solid #4338ca50' }}>
                  SIH26027
                </span>
              </h1>
              {/* Mandatory Synthetic Data Badge */}
              <span style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <ShieldAlert size={12} />
                SYNTHETIC SCENARIO DATA
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              <strong style={{ color: '#cbd5e1' }}>Smart AI-Assisted Railway Resource &amp; Track Harmonization Interface</strong> • Indian Railways Corridor Operations
            </p>
          </div>
        </div>

        {/* Global Controls: Horizon + Scenario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 6, padding: '3px 4px' }}>
            <button
              onClick={() => setSelectedHorizon('weekly')}
              style={{
                backgroundColor: selectedHorizon === 'weekly' ? '#3b82f6' : 'transparent',
                color: selectedHorizon === 'weekly' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Weekly (7d)
            </button>
            <button
              onClick={() => setSelectedHorizon('monthly')}
              style={{
                backgroundColor: selectedHorizon === 'monthly' ? '#3b82f6' : 'transparent',
                color: selectedHorizon === 'monthly' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Monthly (30d)
            </button>
          </div>

          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="gold_standard">Gold-Standard (Hand-Checkable)</option>
            <option value="normal">Scenario 1: Normal Load</option>
            <option value="conflict">Scenario 2: Conflict-Heavy</option>
            <option value="urgent">Scenario 3: Urgent / Critical</option>
          </select>

          {isLoading && (
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={14} className="animate-spin" /> Solving...
            </span>
          )}
        </div>
      </div>

      {/* View Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '12px', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#f8fafc' : '#94a3b8',
                border: isActive ? '1px solid #334155' : '1px solid transparent',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
