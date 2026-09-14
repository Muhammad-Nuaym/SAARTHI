import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NetworkView } from './components/NetworkView';
import { DemandBoard } from './components/DemandBoard';
import { CurrentStateView } from './components/CurrentStateView';
import { OptimizedStateView } from './components/OptimizedStateView';
import { MetricsBoard } from './components/MetricsBoard';
import { ReplayControls } from './components/ReplayControls';
import { fetchScenarios, runOptimization } from './api';
import { OptimizationResponse, ScenarioSummary } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('current');
  const [selectedScenario, setSelectedScenario] = useState<string>('gold_standard');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('weekly');
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [data, setData] = useState<OptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load scenarios list on mount
  useEffect(() => {
    fetchScenarios().then(res => setScenarios(res));
  }, []);

  // Fetch optimization data on scenario or horizon change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    runOptimization(selectedScenario, selectedHorizon).then(res => {
      if (isMounted) {
        setData(res);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedScenario, selectedHorizon]);

  const handleReRun = () => {
    setIsLoading(true);
    runOptimization(selectedScenario, selectedHorizon).then(res => {
      setData(res);
      setIsLoading(false);
    });
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0b0f19', color: '#94a3b8' }}>
        <div>Loading Corridor Simulation & CP-SAT Engine...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f8fafc', paddingBottom: '60px' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedScenario={selectedScenario}
        setSelectedScenario={setSelectedScenario}
        selectedHorizon={selectedHorizon}
        setSelectedHorizon={setSelectedHorizon}
        isLoading={isLoading}
      />

      <main style={{ marginTop: '12px' }}>
        {activeTab === 'network' && <NetworkView data={data} />}
        {activeTab === 'demand' && <DemandBoard tasks={data.tasks} />}
        {activeTab === 'current' && (
          <CurrentStateView
            data={data}
            onSwitchToOptimized={() => setActiveTab('optimized')}
          />
        )}
        {activeTab === 'optimized' && <OptimizedStateView data={data} />}
        {activeTab === 'metrics' && <MetricsBoard data={data} />}
        {activeTab === 'replay' && (
          <ReplayControls
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            onSelectScenario={(id) => setSelectedScenario(id)}
            selectedHorizon={selectedHorizon}
            onSelectHorizon={(h) => setSelectedHorizon(h)}
            onReRun={handleReRun}
            isLoading={isLoading}
            currentData={data}
          />
        )}
      </main>
    </div>
  );
};

export default App;
