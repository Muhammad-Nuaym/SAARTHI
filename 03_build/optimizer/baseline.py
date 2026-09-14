"""
Naive Baseline Scheduler (Uncoordinated Departmental Silos).
Reproducible representation of pre-optimization railway practice:
1. Departments (Engineering, TRD, S&T) operate in administrative silos.
2. First-Come-First-Served (FCFS) within and across departments.
3. Zero multi-department co-scheduling: each department demands its own dedicated line block.
4. Greedy allocation: Each task grabs the earliest window that fits on its section.
5. Inability to optimize or compress windows results in deferred critical tasks,
   potential train path infringements, and inflated corridor closure hours.
"""

from typing import List, Dict, Tuple
from optimizer.schema import (
    ScenarioBundle, ScheduleBlock, BlockStatus, Department, MaintenanceTask
)


def run_baseline_scheduler(bundle: ScenarioBundle) -> List[ScheduleBlock]:
    """
    Computes baseline schedule using naive greedy per-department FCFS.
    Returns list of ScheduleBlock objects representing siloed blocks.
    """
    blocks: List[ScheduleBlock] = []
    block_counter = 1

    # In Indian Railways pre-optimization practice, Engineering typically submits requests first,
    # followed by TRD (electrical), and then S&T (signalling).
    # Within each department, requests are processed FCFS as received.
    dept_order = [Department.ENGINEERING, Department.TRD, Department.ST]
    sorted_tasks: List[MaintenanceTask] = []
    for dept in dept_order:
        dept_tasks = [t for t in bundle.tasks if t.department == dept]
        sorted_tasks.extend(dept_tasks)

    # Track booked intervals per section: section_id -> list of (start, end)
    booked_intervals: Dict[str, List[Tuple[int, int]]] = {
        s: [] for s in set(w.section_id for w in bundle.windows)
    }

    # Group availability windows by section and sort chronologically
    windows_by_sec: Dict[str, list] = {}
    for w in bundle.windows:
        windows_by_sec.setdefault(w.section_id, []).append(w)
    for sec in windows_by_sec:
        windows_by_sec[sec].sort(key=lambda x: x.start)

    # Find train paths to detect conflicts
    trains_by_sec: Dict[str, list] = {}
    for trn in bundle.trains:
        trains_by_sec.setdefault(trn.section_id, []).append(trn)

    for task in sorted_tasks:
        sec = task.section_id
        sec_windows = windows_by_sec.get(sec, [])
        dur = task.duration
        scheduled = False

        for win in sec_windows:
            # Try to place task in this window without overlapping already booked blocks
            candidate_start = win.start
            while candidate_start + dur <= win.end:
                candidate_end = candidate_start + dur

                # Check if this overlaps with any previously booked departmental block on this section
                overlap = False
                for b_start, b_end in booked_intervals[sec]:
                    if max(candidate_start, b_start) < min(candidate_end, b_end):
                        overlap = True
                        candidate_start = b_end
                        break

                if not overlap:
                    # In naive baseline, no cross-checking with train paths during congested periods
                    # Baseline schedules greedily; if a train path happens to coincide, a conflict occurs!
                    booked_intervals[sec].append((candidate_start, candidate_end))
                    
                    # Detect if this block causes a train conflict
                    train_clash = any(
                        max(candidate_start, t.arrival) < min(candidate_end, t.departure)
                        for t in trains_by_sec.get(sec, [])
                    )

                    reason = (
                        f"Uncoordinated {task.department.value} block booked FCFS. "
                        f"{'CRITICAL WARNING: Train conflict detected!' if train_clash else 'Single-department exclusive line possession.'}"
                    )

                    blocks.append(ScheduleBlock(
                        block_id=f"BLK-BASE-{block_counter:04d}",
                        start=candidate_start,
                        end=candidate_end,
                        section_id=sec,
                        tasks=[task.task_id],
                        departments=[task.department],
                        status=BlockStatus.REJECTED_CONFLICT if train_clash else BlockStatus.BASELINE_SILO,
                        reason=reason
                    ))
                    block_counter += 1
                    scheduled = True
                    break

            if scheduled:
                break

    return blocks
