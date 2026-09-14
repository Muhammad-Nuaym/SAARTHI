"""
SIH26027 Synthetic Scenario Generator.
Generates realistic Indian Railways corridor scenarios strictly matching the data contract:
1. Normal (SCN-NORMAL) - light load, few overlaps
2. Conflict-heavy (SCN-CONFLICT) - heavy contention across Engineering, TRD, and S&T
3. Urgent/critical (SCN-URGENT) - high-urgency/high-criticality tasks with tight deadlines
"""

import json
import os
import sys
import random
from typing import List, Dict, Any

# Ensure 03_build is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from optimizer.schema import (
    Asset, MaintenanceTask, TrainMovement, AvailabilityWindow,
    Constraint, ScenarioBundle, Department, ConstraintType, HardOrSoft
)

CORRIDOR_SECTIONS = [
    {"id": "SEC-ALD-CNB-UP", "name": "Prayagraj - Kanpur Up Line", "speed_limit": 130},
    {"id": "SEC-ALD-CNB-DN", "name": "Prayagraj - Kanpur Dn Line", "speed_limit": 130},
    {"id": "SEC-CNB-ETW-UP", "name": "Kanpur - Etawah Up Line", "speed_limit": 130},
    {"id": "SEC-CNB-ETW-DN", "name": "Kanpur - Etawah Dn Line", "speed_limit": 130},
]

ASSET_TEMPLATES = [
    {"type": "Track_Segment", "dept": Department.ENGINEERING, "resource": "Tamper_Machine"},
    {"type": "Ballast_Bed", "dept": Department.ENGINEERING, "resource": "BCM_BallastCleaner"},
    {"type": "Turnout_Switch", "dept": Department.ENGINEERING, "resource": "Tamping_Express"},
    {"type": "OHE_Catenary", "dept": Department.TRD, "resource": "Tower_Wagon"},
    {"type": "Traction_Substation_Bay", "dept": Department.TRD, "resource": "TRD_Testing_Van"},
    {"type": "OHE_Isolator", "dept": Department.TRD, "resource": "Tower_Wagon"},
    {"type": "Point_Machine", "dept": Department.ST, "resource": "Signal_Testing_Kit"},
    {"type": "Track_Circuit", "dept": Department.ST, "resource": "Axle_Counter_Kit"},
    {"type": "Electronic_Interlocking", "dept": Department.ST, "resource": "Signal_Testing_Kit"},
]

TRAIN_SCHEDULE_PATTERNS = [
    # (Name pattern, class, start_hour_modulo_24, run_hours, headway_hours)
    ("VandeBharat", "VandeBharat", 6, 2, 12),
    ("Rajdhani_Exp", "Rajdhani_MailExpress", 7, 2, 24),
    ("Superfast_Exp", "Rajdhani_MailExpress", 9, 2, 8),
    ("Container_Freight", "Freight", 15, 3, 12),
    ("Coal_Freight", "Freight", 21, 3, 12),
    ("Intercity_Exp", "Passenger", 18, 2, 24),
]


def generate_assets() -> List[Asset]:
    assets = []
    for sec in CORRIDOR_SECTIONS:
        for idx, tpl in enumerate(ASSET_TEMPLATES):
            asset_id = f"AST-{tpl['dept'].value[:3].upper()}-{sec['id']}-{idx+1:02d}"
            crit = 4.0 if "Interlocking" in tpl["type"] or "Track_Segment" in tpl["type"] else 3.0
            if "Substation" in tpl["type"]:
                crit = 4.5
            assets.append(Asset(
                asset_id=asset_id,
                asset_type=tpl["type"],
                department=tpl["dept"],
                section_id=sec["id"],
                criticality=crit
            ))
    return assets


def generate_timetable(horizon_hours: int) -> List[TrainMovement]:
    """Generates realistic train occupancy slots across sections."""
    trains = []
    counter = 1
    days = (horizon_hours + 23) // 24

    for day in range(days):
        day_offset = day * 24
        for sec in CORRIDOR_SECTIONS:
            # Each section has directionally alternating train runs
            for name, svc_class, start_mod, duration, headway in TRAIN_SCHEDULE_PATTERNS:
                # Add trains within day according to headway
                curr_hour = day_offset + start_mod
                while curr_hour + duration <= day_offset + 24 and curr_hour + duration <= horizon_hours:
                    train_id = f"TRN-{svc_class[:4].upper()}-{curr_hour:03d}-{counter:03d}"
                    trains.append(TrainMovement(
                        train_id=train_id,
                        section_id=sec["id"],
                        arrival=curr_hour,
                        departure=curr_hour + duration,
                        service_class=svc_class
                    ))
                    counter += 1
                    curr_hour += headway
    return trains


def generate_availability_windows(horizon_hours: int) -> List[AvailabilityWindow]:
    """Generates standard corridor block windows (night & mid-day traffic valleys)."""
    windows = []
    days = (horizon_hours + 23) // 24
    win_idx = 1

    for day in range(days):
        day_offset = day * 24
        for sec in CORRIDOR_SECTIONS:
            # Window 1: Night Maintenance Valley (00:30 - 04:30 -> hours 1 to 5)
            w1_start = day_offset + 1
            w1_end = min(day_offset + 5, horizon_hours)
            if w1_start < horizon_hours:
                windows.append(AvailabilityWindow(
                    window_id=f"WIN-{win_idx:04d}",
                    section_id=sec["id"],
                    start=w1_start,
                    end=w1_end,
                    reason="Scheduled Night Traffic Calve (01:00 - 05:00)"
                ))
                win_idx += 1

            # Window 2: Afternoon Traffic Lull (12:00 - 15:00 -> hours 12 to 15)
            w2_start = day_offset + 12
            w2_end = min(day_offset + 15, horizon_hours)
            if w2_start < horizon_hours:
                windows.append(AvailabilityWindow(
                    window_id=f"WIN-{win_idx:04d}",
                    section_id=sec["id"],
                    start=w2_start,
                    end=w2_end,
                    reason="Afternoon Non-Peak Corridor Slot (12:00 - 15:00)"
                ))
                win_idx += 1

    return windows


def generate_tasks_for_scenario(
    scenario_type: str,
    assets: List[Asset],
    horizon_hours: int
) -> List[MaintenanceTask]:
    rng = random.Random(42 if scenario_type == "normal" else (101 if scenario_type == "conflict" else 777))
    tasks = []
    task_counter = 1

    # Task density based on scenario type
    if scenario_type == "normal":
        target_task_count = max(8, int(horizon_hours / 24 * 5))
    elif scenario_type == "conflict":
        target_task_count = max(18, int(horizon_hours / 24 * 12))
    else:  # urgent
        target_task_count = max(12, int(horizon_hours / 24 * 8))

    # In urgent scenario, reserve slots for immediate emergency tasks
    emergency_count = 4 if scenario_type == "urgent" else 0

    for i in range(emergency_count):
        # Emergency tasks have urgency 5.0, crit 5.0, tight due date (< 18 hours)
        sec = CORRIDOR_SECTIONS[i % len(CORRIDOR_SECTIONS)]["id"]
        sec_assets = [a for a in assets if a.section_id == sec]
        ast = rng.choice(sec_assets)
        tasks.append(MaintenanceTask(
            task_id=f"TSK-EMERG-{task_counter:03d}",
            department=ast.department,
            asset_id=ast.asset_id,
            section_id=sec,
            duration=rng.choice([2, 3]),
            due_date=rng.randint(6, 18),
            urgency=5.0,
            criticality=5.0,
            required_resources=["Emergency_Breakdown_Cranes" if ast.department == Department.ENGINEERING else "Special_Rescue_Van"],
            description=f"Emergency breakdown remediation on {ast.asset_type} ({sec})"
        ))
        task_counter += 1

    # Generate remaining routine and planned tasks
    while len(tasks) < target_task_count:
        ast = rng.choice(assets)
        dur = rng.choice([2, 3, 4])
        
        if scenario_type == "normal":
            urgency = round(rng.uniform(1.5, 3.5), 1)
            crit = ast.criticality
            due_date = rng.randint(dur + 12, horizon_hours)
        elif scenario_type == "conflict":
            # Conflict scenario: multiple departments on same section due on same day!
            urgency = round(rng.uniform(2.5, 4.5), 1)
            crit = round(rng.uniform(3.0, 4.8), 1)
            # Group due dates tightly around day 1 and 2
            day_slot = rng.choice([1, 2, 3]) if horizon_hours >= 72 else 1
            due_date = min(horizon_hours, day_slot * 24 - rng.randint(0, 8))
        else:  # urgent
            urgency = round(rng.uniform(3.0, 4.5), 1)
            crit = round(rng.uniform(3.5, 5.0), 1)
            due_date = rng.randint(dur + 6, min(horizon_hours, 48))

        res = []
        if ast.department == Department.ENGINEERING:
            res = [rng.choice(["Tamper_Machine", "BCM_BallastCleaner", "Track_Jack_Set"])]
        elif ast.department == Department.TRD:
            res = [rng.choice(["Tower_Wagon", "TRD_Testing_Van"])]
        else:
            res = [rng.choice(["Signal_Testing_Kit", "Axle_Counter_Kit"])]

        tasks.append(MaintenanceTask(
            task_id=f"TSK-{ast.department.value[:3].upper()}-{task_counter:03d}",
            department=ast.department,
            asset_id=ast.asset_id,
            section_id=ast.section_id,
            duration=dur,
            due_date=max(dur + 2, due_date),
            urgency=urgency,
            criticality=crit,
            required_resources=res,
            description=f"Planned {ast.department.value} maintenance on {ast.asset_type} ({ast.section_id})"
        ))
        task_counter += 1

    return tasks


def generate_scenario(scenario_type: str, horizon_hours: int = 168) -> ScenarioBundle:
    """Creates a full self-contained scenario bundle."""
    assets = generate_assets()
    trains = generate_timetable(horizon_hours)
    windows = generate_availability_windows(horizon_hours)
    tasks = generate_tasks_for_scenario(scenario_type, assets, horizon_hours)

    titles = {
        "normal": ("SCN-NORMAL", "Corridor Normal Operations", "Balanced maintenance demand with ample scheduled traffic windows and minimal section conflict."),
        "conflict": ("SCN-CONFLICT", "Corridor High-Contention Operations", "Heavy overlapping maintenance demand across Engineering, TRD, and S&T competing for identical corridor windows."),
        "urgent": ("SCN-URGENT", "Corridor Critical & Emergency Operations", "High-urgency emergency repairs with tight due dates requiring dynamic block preemption without disrupting express trains.")
    }
    sc_id, name, desc = titles[scenario_type]

    constraints = [
        Constraint(
            constraint_id="CST-TRN-HARD",
            type=ConstraintType.HARD_TRAIN_CONFLICT,
            entity_ids=[t.train_id for t in trains[:20]],
            hard_or_soft=HardOrSoft.HARD,
            rule_text="Zero physical overlap permitted between maintenance possession and scheduled train movements."
        ),
        Constraint(
            constraint_id="CST-WIN-BOUND",
            type=ConstraintType.SECTION_WINDOW_BOUNDARY,
            entity_ids=[w.window_id for w in windows[:20]],
            hard_or_soft=HardOrSoft.HARD,
            rule_text="All maintenance tasks must fit strictly within permitted section corridor availability windows."
        ),
        Constraint(
            constraint_id="CST-SYNERGY-MULTI",
            type=ConstraintType.MULTI_DEPT_SYNERGY,
            entity_ids=["Engineering", "TRD", "S&T"],
            hard_or_soft=HardOrSoft.SOFT,
            rule_text="Co-schedule compatible multi-department maintenance tasks into unified integrated blocks to minimize net line possession hours."
        )
    ]

    return ScenarioBundle(
        scenario_id=sc_id,
        name=name,
        description=desc,
        horizon_hours=horizon_hours,
        is_synthetic=True,
        assets=assets,
        tasks=tasks,
        trains=trains,
        windows=windows,
        constraints=constraints
    )


def save_all_scenarios(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    for s_type, fname in [
        ("normal", "scenario_normal.json"),
        ("conflict", "scenario_conflict.json"),
        ("urgent", "scenario_urgent.json")
    ]:
        bundle = generate_scenario(s_type, horizon_hours=168)  # default weekly 7-day
        path = os.path.join(output_dir, fname)
        with open(path, "w", encoding="utf-8") as f:
            f.write(bundle.model_dump_json(indent=2))
        print(f"Generated {fname}: {len(bundle.tasks)} tasks, {len(bundle.trains)} trains, {len(bundle.windows)} windows.")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    save_all_scenarios(out)
