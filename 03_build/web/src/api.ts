import { OptimizationResponse, ScenarioSummary } from './types';
import precomputedData from './data/precomputed.json';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8080/api';

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API unreachable, using resilient precomputed scenario list:', err);
  }

  return [
    {
      id: 'gold_standard',
      name: 'Gold-Standard Mini Case (Hand-Checkable)',
      description: 'Representative simulated operational condition: 24-hour verification scenario on Kanpur-Prayagraj trunk corridor. Demonstrates multi-department co-scheduling, urgent task prioritization, and 0 simulated train conflicts.',
      horizon_hours: 24,
      task_count: 4,
      train_count: 3,
      window_count: 3,
      asset_count: 4,
      is_synthetic: true
    },
    {
      id: 'normal',
      name: 'Corridor Normal Operations',
      description: 'Representative simulated operational condition: balanced maintenance load with ample scheduled traffic windows and minimal section contention across 4 corridor lines.',
      horizon_hours: 168,
      task_count: 35,
      train_count: 224,
      window_count: 56,
      asset_count: 36,
      is_synthetic: true
    },
    {
      id: 'conflict',
      name: 'Corridor High-Contention Operations',
      description: 'Representative simulated operational condition: heavy overlapping maintenance demand across Engineering, TRD, and S&T departments competing for identical corridor possession windows.',
      horizon_hours: 168,
      task_count: 84,
      train_count: 224,
      window_count: 56,
      asset_count: 36,
      is_synthetic: true
    },
    {
      id: 'urgent',
      name: 'Corridor Critical & Emergency Operations',
      description: 'Representative simulated operational condition: high-urgency emergency repairs with tight due dates requiring dynamic block preemption without disrupting express passenger trains.',
      horizon_hours: 168,
      task_count: 56,
      train_count: 224,
      window_count: 56,
      asset_count: 36,
      is_synthetic: true
    }
  ];
}

export async function runOptimization(scenarioId: string, horizon: string): Promise<OptimizationResponse> {
  try {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, horizon })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API unreachable, serving precomputed CP-SAT solution:', err);
  }

  // Instant fallback for Vercel static demo
  const key = `${scenarioId}_${horizon}`;
  const pre = (precomputedData as Record<string, any>)[key] ||
              (precomputedData as Record<string, any>)[`${scenarioId}_weekly`] ||
              (precomputedData as Record<string, any>)[`gold_standard_weekly`];

  return pre as OptimizationResponse;
}
