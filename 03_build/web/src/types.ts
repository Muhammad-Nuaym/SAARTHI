/**
 * Types mirroring backend schema and API response contracts.
 */

export type Department = 'Engineering' | 'TRD' | 'S&T';

export type BlockStatus = 'Integrated' | 'SingleDepartment' | 'BaselineSilo' | 'RejectedConflict';

export interface Asset {
  asset_id: string;
  asset_type: string;
  department: Department;
  section_id: string;
  criticality: number;
}

export interface MaintenanceTask {
  task_id: string;
  department: Department;
  asset_id: string;
  section_id: string;
  duration: number;
  due_date: number;
  urgency: number;
  criticality: number;
  required_resources: string[];
  description?: string;
}

export interface TrainMovement {
  train_id: string;
  section_id: string;
  arrival: number;
  departure: number;
  service_class: string;
}

export interface AvailabilityWindow {
  window_id: string;
  section_id: string;
  start: number;
  end: number;
  reason: string;
}

export interface ScheduleBlock {
  block_id: string;
  start: number;
  end: number;
  section_id: string;
  tasks: string[];
  departments: Department[];
  status: BlockStatus;
  reason?: string;
}

export interface Metrics {
  total_block_hours: number;
  train_conflict_count: number;
  critical_task_lateness: number;
  availability_proxy_pct: number;
  integrated_block_ratio_pct: number;
  tasks_scheduled_count: number;
  total_tasks_count: number;
  schedule_efficiency_score: number;
}

export interface OptimizationResponse {
  scenario_id: string;
  horizon: string;
  horizon_hours: number;
  is_synthetic: boolean;
  scenario_name: string;
  scenario_description: string;
  network: {
    sections: string[];
    windows: AvailabilityWindow[];
    trains: TrainMovement[];
  };
  tasks: MaintenanceTask[];
  baseline: {
    blocks: ScheduleBlock[];
    metrics: Metrics;
  };
  optimized: {
    blocks: ScheduleBlock[];
    metrics: Metrics;
  };
  delta: {
    block_hours_saved: number;
    availability_gain_pct: number;
    conflict_reduction: number;
    lateness_reduction: number;
    integrated_blocks_count: number;
  };
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  horizon_hours: number;
  task_count: number;
  train_count: number;
  window_count: number;
  asset_count: number;
  is_synthetic: boolean;
}
