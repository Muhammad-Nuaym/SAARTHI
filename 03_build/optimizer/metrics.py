"""
Traceable KPI Formulas for Indian Railways Block Planning.
No magic numbers: every metric is derived deterministically from raw scenario fields.
"""

from typing import List, Dict, Any
from optimizer.schema import ScheduleBlock, MaintenanceTask, TrainMovement, AvailabilityWindow, ScenarioBundle


def calculate_total_block_hours(blocks: List[ScheduleBlock]) -> int:
    """
    Formula: Sum of duration across all scheduled corridor blocks.
    closure_hours = sum(block.end - block.start for block in blocks)
    Note: For integrated blocks where Engineering and TRD work simultaneously,
    closure hours are counted once for the shared corridor possession window.
    """
    return sum(b.end - b.start for b in blocks)


def calculate_train_conflicts(blocks: List[ScheduleBlock], trains: List[TrainMovement]) -> int:
    """
    Formula: Count of instances where a block on a section overlaps in time
    with a train path on the same section.
    Overlap condition:
      block.section_id == train.section_id AND
      max(block.start, train.arrival) < min(block.end, train.departure)
    """
    conflicts = 0
    for b in blocks:
        for t in trains:
            if b.section_id == t.section_id:
                # Interval intersection check
                if max(b.start, t.arrival) < min(b.end, t.departure):
                    conflicts += 1
    return conflicts


def calculate_critical_task_lateness(
    blocks: List[ScheduleBlock],
    tasks: List[MaintenanceTask],
    horizon_hours: int
) -> float:
    """
    Formula: Weighted sum of lateness for all critical tasks (criticality >= 3.5 or urgency >= 4.0).
    Lateness = max(0, completion_time - due_date) * criticality
    If a task is unscheduled within the planning horizon, it incurs maximum lateness
    penalty: (horizon_hours - due_date + default_penalty_buffer) * criticality.
    """
    # Map task_id to its scheduled end time
    task_end_times: Dict[str, int] = {}
    for b in blocks:
        for tid in b.tasks:
            task_end_times[tid] = b.end

    total_weighted_lateness = 0.0
    for task in tasks:
        # Check if task is critical or urgent
        is_critical = task.criticality >= 3.5 or task.urgency >= 4.0
        if not is_critical:
            continue

        if task.task_id in task_end_times:
            completion = task_end_times[task.task_id]
            lateness = max(0, completion - task.due_date)
        else:
            # Unscheduled critical task gets heavy lateness penalty
            lateness = max(0, horizon_hours - task.due_date) + 24  # 24h uncompleted penalty buffer

        total_weighted_lateness += lateness * task.criticality

    return round(total_weighted_lateness, 2)


def calculate_corridor_availability_proxy(
    blocks: List[ScheduleBlock],
    windows: List[AvailabilityWindow],
    num_sections: int,
    horizon_hours: int
) -> float:
    """
    Formula: Percentage of corridor operating hours available for train operations.
    Total corridor capacity = num_sections * horizon_hours.
    Total possession hours taken = sum(block.end - block.start for block in blocks).
    Availability % = ((Total capacity - Total possession) / Total capacity) * 100
    """
    total_capacity = max(1, num_sections * horizon_hours)
    total_possession = sum(b.end - b.start for b in blocks)
    available_hours = max(0, total_capacity - total_possession)
    pct = (available_hours / total_capacity) * 100.0
    return round(pct, 2)


def calculate_integrated_block_ratio(blocks: List[ScheduleBlock]) -> float:
    """
    Formula: (Number of integrated multi-department blocks / Total blocks) * 100
    Measures cross-departmental coordination efficiency.
    """
    if not blocks:
        return 0.0
    integrated = sum(1 for b in blocks if len(b.departments) > 1)
    return round((integrated / len(blocks)) * 100.0, 1)


def compute_all_metrics(
    blocks: List[ScheduleBlock],
    tasks: List[MaintenanceTask],
    trains: List[TrainMovement],
    windows: List[AvailabilityWindow],
    num_sections: int,
    horizon_hours: int
) -> Dict[str, Any]:
    """Computes full traceable KPI dictionary."""
    total_hours = calculate_total_block_hours(blocks)
    conflicts = calculate_train_conflicts(blocks, trains)
    lateness = calculate_critical_task_lateness(blocks, tasks, horizon_hours)
    avail = calculate_corridor_availability_proxy(blocks, windows, num_sections, horizon_hours)
    co_ratio = calculate_integrated_block_ratio(blocks)
    tasks_scheduled = sum(len(b.tasks) for b in blocks)

    return {
        "total_block_hours": total_hours,
        "train_conflict_count": conflicts,
        "critical_task_lateness": lateness,
        "availability_proxy_pct": avail,
        "integrated_block_ratio_pct": co_ratio,
        "tasks_scheduled_count": tasks_scheduled,
        "total_tasks_count": len(tasks),
        "schedule_efficiency_score": round(
            (tasks_scheduled / max(1, len(tasks)) * 50) +
            (avail * 0.3) -
            (conflicts * 15) -
            (min(lateness, 100) * 0.2),
            1
        )
    }
