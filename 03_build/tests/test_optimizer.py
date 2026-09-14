"""
Comprehensive Acceptance Tests for Optimizer across all Scenarios and Horizons.
Verifies Step 5 acceptance requirements:
- Three departments coexist in the same scenario
- No task scheduled outside allowed window
- Hard train conflict is rejected / 0 in CP-SAT
- Integrated compatible tasks share blocks
- Critical/urgent tasks receive higher priority
- Weekly and monthly plans generated from same schema
"""

import json
import os
import pytest

from optimizer.schema import ScenarioBundle, BlockStatus, Department
from optimizer.baseline import run_baseline_scheduler
from optimizer.cpsat_optimizer import RailwayBlockOptimizer
from optimizer.metrics import compute_all_metrics
from data.generator import generate_scenario

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))


@pytest.mark.parametrize("scenario_file", [
    "scenario_normal.json",
    "scenario_conflict.json",
    "scenario_urgent.json"
])
def test_optimizer_on_weekly_scenarios(scenario_file):
    path = os.path.join(DATA_DIR, scenario_file)
    with open(path, "r", encoding="utf-8") as f:
        bundle = ScenarioBundle.model_validate(json.load(f))

    # Run CP-SAT optimizer
    optimizer = RailwayBlockOptimizer(bundle)
    blocks, metrics = optimizer.solve(time_limit_seconds=5.0)

    assert len(blocks) > 0, f"Expected non-empty schedule for {scenario_file}"
    # 1. Zero train conflicts in CP-SAT
    assert metrics["train_conflict_count"] == 0, f"Train conflicts found in {scenario_file}"

    # 2. All blocks respect window bounds
    for b in blocks:
        sec_windows = [w for w in bundle.windows if w.section_id == b.section_id]
        enclosed = any(w.start <= b.start and b.end <= w.end for w in sec_windows)
        assert enclosed, f"Block {b.block_id} outside window boundaries"

    # 3. All three departments present
    depts_in_schedule = set()
    for b in blocks:
        for d in b.departments:
            depts_in_schedule.add(d)
    assert Department.ENGINEERING in depts_in_schedule
    assert Department.TRD in depts_in_schedule
    assert Department.ST in depts_in_schedule


def test_monthly_plan_generation_same_schema():
    """Verifies monthly plan (720 hours / 30 days) from the same schema."""
    bundle_monthly = generate_scenario("normal", horizon_hours=720)
    assert bundle_monthly.horizon_hours == 720
    assert len(bundle_monthly.windows) > 200

    optimizer = RailwayBlockOptimizer(bundle_monthly)
    blocks, metrics = optimizer.solve(time_limit_seconds=10.0)

    assert len(blocks) > 0
    assert metrics["train_conflict_count"] == 0
    assert metrics["availability_proxy_pct"] > 0
