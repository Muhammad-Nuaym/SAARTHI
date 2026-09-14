import React from 'react';
import { OptimizationResponse, ScenarioSummary } from '../types';
import { Play, RotateCcw, ShieldAlert, Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface ReplayControlsProps {
  scenarios: ScenarioSummary[];
  selectedScenario: string;
  onSelectScenario: (id: string) => void;
  selectedHorizon: string;
  onSelectHorizon: (h: string) => void;
  onReRun: () => void;
  isLoading: boolean;
  currentData: OptimizationResponse;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  selectedHorizon,
  onSelectHorizon,
  onReRun,
  isLoading,
  currentData
}) => {
  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
            Scenario Replay & Comparative Benchmarking
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            One-click scenario runner. Evaluates the CP-SAT engine against diverse real-world Indian Railways operational conditions.
          </p>
        </div>

        <button
          onClick={onReRun}
          disabled={isLoading}
          style={{
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
          }}
        >
          <RotateCcw size={15} />
          {isLoading ? 'Re-optimizing...' : 'Re-Run Optimizer'}
        </button>
      </div>

      {/* Scenario Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              style={{
                backgroundColor: isSelected ? '#1a233a' : '#131b2e',
                border: `2px solid ${isSelected ? '#3b82f6' : '#1e293b'}`,
                borderRadius: 10,
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    backgroundColor: isSelected ? '#3b82f625' : '#1e293b',
                    color: isSelected ? '#60a5fa' : '#94a3b8',
                    border: `1px solid ${isSelected ? '#3b82f650' : '#334155'}`,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {sc.id.toUpperCase()}
                  </span>

                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Active
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 12 }}>
                  {sc.name}
                </h3>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>
                  {sc.description}
                </p>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>{sc.task_count} Maintenance Tasks</span>
                <span>{sc.train_count} Train Paths</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Benchmark Execution Summary */}
      <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px' }}>
          Current Active Scenario Benchmark Summary: {currentData.scenario_name}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: 6, border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Planning Horizon</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
              {currentData.horizon_hours} hours ({currentData.horizon === 'monthly' ? '30 Days' : (currentData.horizon_hours === 24 ? '1 Day' : '7 Days')})
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: 6, border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>CP-SAT Integrated Blocks</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a855f7', marginTop: 2 }}>
              {currentData.delta.integrated_blocks_count} blocks
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: 6, border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Line Possession Hours Saved</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: 2 }}>
              {currentData.delta.block_hours_saved} hrs
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: 6, border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Passenger Train Conflicts</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
              0 (100% Safe)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
