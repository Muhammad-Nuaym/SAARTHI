"""
Gold-Standard Hand-Checkable Verification Test.
Verifies baseline vs CP-SAT optimizer against the gold-standard scenario.
Checks:
1. Exact task assignment and co-scheduling
2. Zero train conflicts in CP-SAT
3. Urgent task prioritization (TSK-ST-01 completes before hour 10)
4. Total closure hours reduction (CP-SAT < Baseline)
5. Integrated block creation for compatible Engineering + TRD tasks
"""

import json
import os
import pytest

from optimizer.schema import ScenarioBundle, BlockStatus, Department
from optimizer.baseline import run_baseline_scheduler
from optimizer.cpsat_optimizer import RailwayBlockOptimizer
from optimizer.metrics import compute_all_metrics


@pytest.fixture
def gold_standard_bundle() -> ScenarioBundle:
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "gold_standard.json"))
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return ScenarioBundle.model_validate(data)


def test_baseline_on_gold_standard(gold_standard_bundle):
    """Verifies naive baseline behavior on gold standard."""
    baseline_blocks = run_baseline_scheduler(gold_standard_bundle)
    assert len(baseline_blocks) > 0

    metrics = compute_all_metrics(
        blocks=baseline_blocks,
        tasks=gold_standard_bundle.tasks,
        trains=gold_standard_bundle.trains,
        windows=gold_standard_bundle.windows,
        num_sections=2,
        horizon_hours=gold_standard_bundle.horizon_hours
    )

    # In baseline, no blocks are integrated (zero cross-department co-scheduling)
    for b in baseline_blocks:
        assert b.status in (BlockStatus.BASELINE_SILO, BlockStatus.REJECTED_CONFLICT)
        assert len(b.departments) == 1, "Baseline should never co-schedule departments"

    print("\n--- Baseline Metrics (Gold Standard) ---")
    print(f"Total Block Hours: {metrics['total_block_hours']}")
    print(f"Train Conflicts: {metrics['train_conflict_count']}")
    print(f"Critical Lateness: {metrics['critical_task_lateness']}")
    print(f"Availability %: {metrics['availability_proxy_pct']}%")


def test_cpsat_optimizer_on_gold_standard(gold_standard_bundle):
    """Verifies CP-SAT optimizer satisfies all mathematical constraints and demonstrates co-scheduling."""
    optimizer = RailwayBlockOptimizer(gold_standard_bundle)
    opt_blocks, metrics, solver_stats = optimizer.solve(time_limit_seconds=5.0)

    assert len(opt_blocks) > 0, "Optimizer should return a feasible schedule"

    # 1. HARD CONSTRAINT: ZERO Train Conflicts
    assert metrics["train_conflict_count"] == 0, f"Expected 0 train conflicts, got {metrics['train_conflict_count']}"

    # Verify no block intersects with any train on the same section
    for b in opt_blocks:
        for t in gold_standard_bundle.trains:
            if b.section_id == t.section_id:
                clash = max(b.start, t.arrival) < min(b.end, t.departure)
                assert not clash, f"Block {b.block_id} [{b.start}, {b.end}] intersects train {t.train_id} [{t.arrival}, {t.departure}] on {b.section_id}"

    # 2. HARD CONSTRAINT: All blocks within corridor availability windows
    for b in opt_blocks:
        sec_windows = [w for w in gold_standard_bundle.windows if w.section_id == b.section_id]
        enclosed = any(w.start <= b.start and b.end <= w.end for w in sec_windows)
        assert enclosed, f"Block {b.block_id} [{b.start}, {b.end}] on {b.section_id} is outside all designated windows"

    # 3. URGENT TASK PRIORITIZATION: TSK-ST-01 is due at hour 10
    st_task_blocks = [b for b in opt_blocks if "TSK-ST-01" in b.tasks]
    assert len(st_task_blocks) == 1
    assert st_task_blocks[0].end <= 10, f"Urgent task TSK-ST-01 finished at {st_task_blocks[0].end}, expected <= 10"

    # 4. MULTI-DEPARTMENT CO-SCHEDULING: TSK-ENG-01 and TSK-TRD-01 should form an Integrated Block
    integrated_blocks = [b for b in opt_blocks if b.status == BlockStatus.INTEGRATED]
    assert len(integrated_blocks) >= 1, "Expected at least one integrated block merging Engineering and TRD"
    
    int_block = integrated_blocks[0]
    assert "TSK-ENG-01" in int_block.tasks
    assert "TSK-TRD-01" in int_block.tasks
    assert Department.ENGINEERING in int_block.departments
    assert Department.TRD in int_block.departments
    assert "Integrated" in int_block.reason

    # 5. CLOSURE HOURS & AVAILABILITY IMPROVEMENT OVER BASELINE
    baseline_blocks = run_baseline_scheduler(gold_standard_bundle)
    baseline_metrics = compute_all_metrics(
        blocks=baseline_blocks,
        tasks=gold_standard_bundle.tasks,
        trains=gold_standard_bundle.trains,
        windows=gold_standard_bundle.windows,
        num_sections=2,
        horizon_hours=gold_standard_bundle.horizon_hours
    )

    print("\n--- Comparison: Baseline vs CP-SAT (Gold Standard) ---")
    print(f"Baseline Block Hours:  {baseline_metrics['total_block_hours']} h")
    print(f"Optimized Block Hours: {metrics['total_block_hours']} h")
    print(f"Baseline Availability: {baseline_metrics['availability_proxy_pct']}%")
    print(f"Optimized Availability: {metrics['availability_proxy_pct']}%")
    print(f"Integrated Blocks:     {len(integrated_blocks)}")
    print(f"Train Conflicts:       {metrics['train_conflict_count']} (Baseline had {baseline_metrics['train_conflict_count']})")

    # The integrated block saves 3 hours of line possession
    assert metrics["total_block_hours"] < baseline_metrics["total_block_hours"], (
        f"Optimized hours ({metrics['total_block_hours']}) should be strictly less than baseline ({baseline_metrics['total_block_hours']})"
    )
    assert metrics["availability_proxy_pct"] > baseline_metrics["availability_proxy_pct"]
