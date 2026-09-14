import React from 'react';
import { OptimizationResponse } from '../types';
import { MapPin, Clock, Info, ShieldCheck, Zap } from 'lucide-react';

interface NetworkViewProps {
  data: OptimizationResponse;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ data }) => {
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

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>Corridor Network & Block Windows</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Abstracted railway schematic of North Central Railway (NCR) trunk corridor. Simplified line topology (non-GIS).
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
            S&T (Signals)
          </span>
        </div>
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

              {/* Windows available on this section */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> Scheduled Block Windows:
                </span>
                {windows.slice(0, 3).map((w, wIdx) => (
                  <span
                    key={wIdx}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}
                  >
                    {w.reason} ({w.start}:00 - {w.end}:00)
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
