"""
Google OR-Tools CP-SAT Optimization Engine for Indian Railways Block Planning.
SIH26027 Role 3 (Build & Simulate).

Features:
1. Hard constraints:
   - Zero train conflicts (train paths are inviolable).
   - Tasks must lie entirely within allowed availability windows.
   - Resource mutual exclusion (same physical equipment cannot be in two places).
   - Departmental intra-clash: Same department cannot overlap on the same section track.
2. Soft constraints & Explainable Multi-Objective Function:
   - Prioritize high-criticality and urgent tasks.
   - Penalize overdue completion past due_date.
   - Co-scheduling synergy bonus: Bundles compatible tasks from Engineering, TRD, S&T
     into unified Integrated Blocks, minimizing corridor downtime.
   - Minimize total corridor closure hours.
3. Supports arbitrary horizon (weekly = 168h, monthly = 720h, gold standard = 24h).
"""

from typing import List, Dict, Tuple, Optional, Any
from ortools.sat.python import cp_model

from optimizer.schema import (
    ScenarioBundle, ScheduleBlock, BlockStatus, Department,
    MaintenanceTask, TrainMovement, AvailabilityWindow
)
from optimizer.metrics import compute_all_metrics


class RailwayBlockOptimizer:
    def __init__(self, bundle: ScenarioBundle):
        self.bundle = bundle
        self.horizon_hours = bundle.horizon_hours
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def solve(self, time_limit_seconds: float = 10.0) -> Tuple[List[ScheduleBlock], Dict[str, Any], Dict[str, Any]]:
        model = self.model
        tasks = self.bundle.tasks
        trains = self.bundle.trains
        windows = self.bundle.windows

        # Index windows by section
        windows_by_sec: Dict[str, List[AvailabilityWindow]] = {}
        for w in windows:
            windows_by_sec.setdefault(w.section_id, []).append(w)

        # Variables:
        # task_win[i, w_idx] = 1 if task i is assigned to window w_idx
        task_win: Dict[Tuple[int, int], cp_model.IntVar] = {}
        # is_scheduled[i] = 1 if task i is scheduled
        is_scheduled: Dict[int, cp_model.IntVar] = {}
        # start_var[i], end_var[i], duration_var[i]
        start_var: Dict[int, cp_model.IntVar] = {}
        end_var: Dict[int, cp_model.IntVar] = {}
        lateness_var: Dict[int, cp_model.IntVar] = {}
        interval_var: Dict[int, cp_model.IntervalVar] = {}

        # 1. Create task variables
        for i, task in enumerate(tasks):
            is_sched = model.NewBoolVar(f"sched_t{i}")
            is_scheduled[i] = is_sched

            # Start time within [0, horizon_hours]
            s = model.NewIntVar(0, self.horizon_hours, f"start_t{i}")
            e = model.NewIntVar(0, self.horizon_hours, f"end_t{i}")
            start_var[i] = s
            end_var[i] = e

            # Link end = start + duration
            model.Add(e == s + task.duration).OnlyEnforceIf(is_sched)

            # Optional interval variable for scheduling constraints
            interval = model.NewOptionalIntervalVar(s, task.duration, e, is_sched, f"interval_t{i}")
            interval_var[i] = interval

            # Window candidate assignment
            sec_windows = windows_by_sec.get(task.section_id, [])
            candidate_win_vars = []

            for w_idx, win in enumerate(sec_windows):
                # Filter out windows too short for this task or outside horizon
                # and keep candidate windows within realistic horizon of due_date
                if (win.end - win.start >= task.duration and 
                    win.start < self.horizon_hours and
                    (win.start <= task.due_date + 48 or len(sec_windows) <= 12)):
                    w_var = model.NewBoolVar(f"task_{i}_win_{w_idx}")
                    task_win[(i, w_idx)] = w_var
                    candidate_win_vars.append(w_var)

                    # If assigned to this window, bounds must be strictly obeyed
                    model.Add(s >= win.start).OnlyEnforceIf(w_var)
                    model.Add(e <= win.end).OnlyEnforceIf(w_var)

            # Task can be assigned to at most 1 window
            if candidate_win_vars:
                model.Add(sum(candidate_win_vars) == is_sched)
            else:
                model.Add(is_sched == 0)

            # Lateness variable: lateness >= end - due_date
            # The + 24 is to match metrics.py unscheduled penalty buffer.
            lat = model.NewIntVar(0, self.horizon_hours + 24, f"late_t{i}")
            lateness_var[i] = lat
            model.Add(lat >= e - task.due_date).OnlyEnforceIf(is_sched)
            # If not scheduled, apply max lateness
            model.Add(lat == (max(0, self.horizon_hours - task.due_date) + 24)).OnlyEnforceIf(is_sched.Not())

        # 2. HARD CONSTRAINT: Zero train conflicts
        # Train paths are inviolable. A task scheduled in window w must not intersect
        # any train on the same section whose interval intersects that window.
        for (i, w_idx), w_var in task_win.items():
            task = tasks[i]
            win = windows_by_sec[task.section_id][w_idx]
            
            # Find only trains on this section that overlap this window
            overlapping_trains = [
                t for t in trains
                if t.section_id == task.section_id and
                max(win.start, t.arrival) < min(win.end, t.departure)
            ]
            
            for trn in overlapping_trains:
                # If assigned to this window, task must either finish before train arrival OR start after train departure
                before = model.NewBoolVar(f"t{i}_w{w_idx}_bef_{trn.train_id}")
                after = model.NewBoolVar(f"t{i}_w{w_idx}_aft_{trn.train_id}")

                model.Add(end_var[i] <= trn.arrival).OnlyEnforceIf([w_var, before])
                model.Add(start_var[i] >= trn.departure).OnlyEnforceIf([w_var, after])
                model.AddBoolOr([before, after]).OnlyEnforceIf(w_var)

        # 3. HARD CONSTRAINT: Resource Mutual Exclusion
        # Tasks requiring identical specific equipment (e.g. specific Tamper or Tower Wagon) cannot overlap
        resource_map: Dict[str, List[int]] = {}
        for i, task in enumerate(tasks):
            for res in task.required_resources:
                resource_map.setdefault(res, []).append(i)

        for res, t_indices in resource_map.items():
            if len(t_indices) > 1:
                # Disjunctive constraint on resource
                res_intervals = [interval_var[idx] for idx in t_indices]
                model.AddNoOverlap(res_intervals)

        # 4. HARD CONSTRAINT: Intra-Department Section Mutual Exclusion
        # Tasks of the SAME department on the same section cannot overlap (one track gang at a time)
        dept_sec_tasks: Dict[Tuple[str, Department], List[int]] = {}
        for i, task in enumerate(tasks):
            dept_sec_tasks.setdefault((task.section_id, task.department), []).append(i)

        for (sec, dept), t_indices in dept_sec_tasks.items():
            if len(t_indices) > 1:
                model.AddNoOverlap([interval_var[idx] for idx in t_indices])

        # 5. MULTI-DEPARTMENT CO-SCHEDULING (Synergy Bonus)
        # Compatible tasks from different departments (Engineering, TRD, S&T) on the same section
        # can share an integrated block when aligned in time.
        synergy_vars = []
        n_tasks = len(tasks)
        for i in range(n_tasks):
            for j in range(i + 1, n_tasks):
                t1, t2 = tasks[i], tasks[j]
                if t1.section_id == t2.section_id and t1.department != t2.department and abs(t1.due_date - t2.due_date) <= 48:
                    # Check resource compatibility (ensure disjoint resource sets)
                    res_conflict = bool(set(t1.required_resources) & set(t2.required_resources))
                    if not res_conflict:
                        # Synergy boolean: active if both scheduled and start together
                        syn_var = model.NewBoolVar(f"synergy_{i}_{j}")
                        # If syn_var is 1, both must be scheduled and starts must be aligned
                        model.Add(is_scheduled[i] == 1).OnlyEnforceIf(syn_var)
                        model.Add(is_scheduled[j] == 1).OnlyEnforceIf(syn_var)
                        model.Add(start_var[i] == start_var[j]).OnlyEnforceIf(syn_var)
                        synergy_vars.append(syn_var)

        # 6. DOCUMENTED EXPLAINABLE OBJECTIVE FUNCTION
        # Weights:
        # - W_COMPLETION: Incentive to schedule tasks, scaled by urgency (1-5) and criticality (1-5)
        # - W_SYNERGY: Bonus for co-scheduling multi-department tasks (integrated blocks)
        # - W_LATENESS: Penalty for completing tasks after their due date
        # - W_CLOSURE: Penalty for taking later or longer hours, promoting corridor availability
        objective_terms = []

        # Task completion reward & urgency prioritization
        for i, task in enumerate(tasks):
            priority_weight = int(task.urgency * 20 + task.criticality * 20)
            objective_terms.append(is_scheduled[i] * (500 + priority_weight))

        # Synergy bonus for multi-department integration
        for syn_var in synergy_vars:
            objective_terms.append(syn_var * 400)

        # Lateness penalty
        for i, task in enumerate(tasks):
            late_penalty_weight = int(task.criticality * 15)
            objective_terms.append(-lateness_var[i] * late_penalty_weight)

        # Earliest completion / availability preference (small pressure on end time)
        for i, task in enumerate(tasks):
            objective_terms.append(-end_var[i] * 2)

        model.Maximize(sum(objective_terms))

        # Solve
        self.solver.parameters.max_time_in_seconds = time_limit_seconds
        self.solver.parameters.num_search_workers = 4
        status = self.solver.Solve(model)

        status_str = "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE" if status == cp_model.FEASIBLE else "INFEASIBLE"
        solver_stats = {
            "status": status_str,
            "runtime_seconds": self.solver.WallTime(),
            "objective_value": self.solver.ObjectiveValue() if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0,
            "num_variables": len(model.Proto().variables),
            "num_constraints": len(model.Proto().constraints)
        }

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Fallback empty schedule
            return [], {}, solver_stats

        # 7. Reconstruct Integrated Schedule Blocks
        scheduled_tasks_info = []
        for i, task in enumerate(tasks):
            if self.solver.Value(is_scheduled[i]) == 1:
                s_val = self.solver.Value(start_var[i])
                e_val = self.solver.Value(end_var[i])
                scheduled_tasks_info.append({
                    "task": task,
                    "start": s_val,
                    "end": e_val,
                    "section_id": task.section_id
                })

        # Cluster into schedule blocks (group overlapping or co-scheduled tasks on same section)
        blocks = self._cluster_into_blocks(scheduled_tasks_info)

        # Compute full traceable KPIs
        metrics = compute_all_metrics(
            blocks=blocks,
            tasks=self.bundle.tasks,
            trains=self.bundle.trains,
            windows=self.bundle.windows,
            num_sections=len(set(w.section_id for w in self.bundle.windows)),
            horizon_hours=self.horizon_hours
        )

        return blocks, metrics, solver_stats

    def _cluster_into_blocks(self, scheduled_info: List[Dict[str, Any]]) -> List[ScheduleBlock]:
        """
        Merges concurrent or co-scheduled tasks on the same section into unified Integrated Blocks.
        """
        blocks: List[ScheduleBlock] = []
        block_counter = 1

        # Group by section
        by_sec: Dict[str, List[Dict[str, Any]]] = {}
        for item in scheduled_info:
            by_sec.setdefault(item["section_id"], []).append(item)

        for sec, items in by_sec.items():
            # Sort items by start time, then end time
            items.sort(key=lambda x: (x["start"], x["end"]))

            # Group overlapping tasks into clusters
            clusters: List[List[Dict[str, Any]]] = []
            for itm in items:
                placed = False
                for cl in clusters:
                    cl_start = min(x["start"] for x in cl)
                    cl_end = max(x["end"] for x in cl)
                    # Check if overlaps or coincides
                    if max(itm["start"], cl_start) < min(itm["end"], cl_end) or itm["start"] == cl_start:
                        cl.append(itm)
                        placed = True
                        break
                if not placed:
                    clusters.append([itm])

            for cl in clusters:
                b_start = min(x["start"] for x in cl)
                b_end = max(x["end"] for x in cl)
                task_ids = [x["task"].task_id for x in cl]
                depts = list(dict.fromkeys(x["task"].department for x in cl))
                
                is_integrated = len(depts) > 1
                status = BlockStatus.INTEGRATED if is_integrated else BlockStatus.SINGLE_DEPARTMENT

                # Generate explainable reason string
                if is_integrated:
                    dept_str = " + ".join(d.value for d in depts)
                    dur_saved = sum(x["task"].duration for x in cl) - (b_end - b_start)
                    reason = (
                        f"AI Integrated Block: Co-scheduled {dept_str} on {sec} "
                        f"during hours {b_start:02d}:00-{b_end:02d}:00. "
                        f"Saved {dur_saved:.1f}h of track possession downtime while protecting all train paths."
                    )
                else:
                    d_name = depts[0].value
                    urg = max(x["task"].urgency for x in cl)
                    crit = max(x["task"].criticality for x in cl)
                    reason = (
                        f"Optimized {d_name} Block: Prioritized {', '.join(task_ids)} "
                        f"(Criticality {crit:.1f}, Urgency {urg:.1f}) in designated corridor window."
                    )

                blocks.append(ScheduleBlock(
                    block_id=f"BLK-OPT-{block_counter:04d}",
                    start=b_start,
                    end=b_end,
                    section_id=sec,
                    tasks=task_ids,
                    departments=depts,
                    status=status,
                    reason=reason
                ))
                block_counter += 1

        blocks.sort(key=lambda b: (b.start, b.section_id))
        return blocks
