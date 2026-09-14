"""
Formal Acceptance Test Suite for SIH26027 Role 3 (Build & Simulate).
Tests each item of the Step 5 checklist explicitly:
1. The three departments can coexist in the same scenario.
2. A task cannot be scheduled outside an allowed maintenance window.
3. A hard train conflict is rejected by the scheduler.
4. Integrated compatible tasks can share a block.
5. Critical/urgent tasks receive higher priority than routine tasks when constraints permit.
6. Weekly and monthly plans are generated from the same scenario schema.
7. Every KPI shown on screen can be traced to raw data and a calculation formula.
8. The system clearly labels simulated/internal data.
"""

import json
import os
import pytest

from optimizer.schema import ScenarioBundle, Department, BlockStatus
from optimizer.baseline import run_baseline_scheduler
from optimizer.cpsat_optimizer import RailwayBlockOptimizer
from optimizer.metrics import (
    calculate_total_block_hours,
    calculate_train_conflicts,
    calculate_critical_task_lateness,
    calculate_corridor_availability_proxy,
    compute_all_metrics
)
from data.generator import generate_scenario

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))


@pytest.fixture
def gold_bundle():
    with open(os.path.join(DATA_DIR, "gold_standard.json"), "r", encoding="utf-8") as f:
        return ScenarioBundle.model_validate(json.load(f))


@pytest.fixture
def conflict_bundle():
    with open(os.path.join(DATA_DIR, "scenario_conflict.json"), "r", encoding="utf-8") as f:
        return ScenarioBundle.model_validate(json.load(f))


def test_acceptance_1_three_departments_coexist(gold_bundle, conflict_bundle):
    """Criterion 1: The three departments can coexist in the same scenario."""
    for bundle in [gold_bundle, conflict_bundle]:
        depts_in_assets = set(a.department for a in bundle.assets)
        depts_in_tasks = set(t.department for t in bundle.tasks)
        assert Department.ENGINEERING in depts_in_assets
        assert Department.TRD in depts_in_assets
        assert Department.ST in depts_in_assets
        assert Department.ENGINEERING in depts_in_tasks
        assert Department.TRD in depts_in_tasks
        assert Department.ST in depts_in_tasks


def test_acceptance_2_tasks_inside_allowed_windows(gold_bundle):
    """Criterion 2: A task cannot be scheduled outside an allowed maintenance window."""
    optimizer = RailwayBlockOptimizer(gold_bundle)
    blocks, _ = optimizer.solve()
    assert len(blocks) > 0
    for b in blocks:
        sec_windows = [w for w in gold_bundle.windows if w.section_id == b.section_id]
        is_enclosed = any(w.start <= b.start and b.end <= w.end for w in sec_windows)
        assert is_enclosed, f"Block {b.block_id} [{b.start}, {b.end}] is not enclosed in any window"


def test_acceptance_3_hard_train_conflicts_rejected(gold_bundle):
    """Criterion 3: A hard train conflict is rejected by the scheduler (0 in CP-SAT)."""
    optimizer = RailwayBlockOptimizer(gold_bundle)
    blocks, metrics = optimizer.solve()
    assert metrics["train_conflict_count"] == 0
    for b in blocks:
        for t in gold_bundle.trains:
            if b.section_id == t.section_id:
                clash = max(b.start, t.arrival) < min(b.end, t.departure)
                assert not clash, f"Block {b.block_id} clashes with train {t.train_id}"


def test_acceptance_4_integrated_compatible_tasks_share_block(gold_bundle):
    """Criterion 4: Integrated compatible tasks can share a block."""
    optimizer = RailwayBlockOptimizer(gold_bundle)
    blocks, metrics = optimizer.solve()
    integrated_blocks = [b for b in blocks if b.status == BlockStatus.INTEGRATED]
    assert len(integrated_blocks) >= 1
    int_b = integrated_blocks[0]
    assert len(int_b.departments) >= 2
    assert "TSK-ENG-01" in int_b.tasks
    assert "TSK-TRD-01" in int_b.tasks


def test_acceptance_5_critical_urgent_tasks_win_priority(gold_bundle):
    """Criterion 5: Critical/urgent tasks receive higher priority than routine tasks when constraints permit."""
    optimizer = RailwayBlockOptimizer(gold_bundle)
    blocks, metrics = optimizer.solve()
    # TSK-ST-01 is urgent (due hour 10). It must finish <= 10.
    st_block = next(b for b in blocks if "TSK-ST-01" in b.tasks)
    assert st_block.end <= 10
    assert metrics["critical_task_lateness"] == 0.0


def test_acceptance_6_weekly_and_monthly_from_same_schema():
    """Criterion 6: Weekly and monthly plans are generated from the same scenario schema."""
    weekly = generate_scenario("normal", horizon_hours=168)
    monthly = generate_scenario("normal", horizon_hours=720)
    assert weekly.horizon_hours == 168
    assert monthly.horizon_hours == 720
    # Both validate with the exact same Pydantic ScenarioBundle schema
    assert isinstance(weekly, ScenarioBundle)
    assert isinstance(monthly, ScenarioBundle)


def test_acceptance_7_traceable_kpis_no_magic_numbers(gold_bundle):
    """Criterion 7: Every KPI shown on screen can be traced to raw data and a calculation formula."""
    optimizer = RailwayBlockOptimizer(gold_bundle)
    blocks, metrics = optimizer.solve()

    # Verify each formula explicitly
    expected_hours = sum(b.end - b.start for b in blocks)
    assert metrics["total_block_hours"] == expected_hours

    expected_conflicts = 0
    for b in blocks:
        for t in gold_bundle.trains:
            if b.section_id == t.section_id and max(b.start, t.arrival) < min(b.end, t.departure):
                expected_conflicts += 1
    assert metrics["train_conflict_count"] == expected_conflicts

    total_capacity = 2 * gold_bundle.horizon_hours  # 2 sections * 24h = 48
    expected_avail = round(((total_capacity - expected_hours) / total_capacity) * 100, 2)
    assert metrics["availability_proxy_pct"] == expected_avail


def test_acceptance_8_synthetic_data_labeling(gold_bundle, conflict_bundle):
    """Criterion 8: The system clearly labels simulated/internal data."""
    for bundle in [gold_bundle, conflict_bundle]:
        assert bundle.is_synthetic is True, "Scenario bundle must have is_synthetic=True"
