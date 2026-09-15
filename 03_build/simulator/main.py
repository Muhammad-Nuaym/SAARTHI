"""
FastAPI Backend Simulator for SIH26027.
AI-Powered Automatic Block Planning Demonstrator.
Exposes scenarios, optimizer run, and before-vs-after traceable metrics.
"""

import os
import sys
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure 03_build is in sys.path
build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if build_dir not in sys.path:
    sys.path.insert(0, build_dir)

from optimizer.schema import ScenarioBundle, ScheduleBlock
from optimizer.baseline import run_baseline_scheduler
from optimizer.cpsat_optimizer import RailwayBlockOptimizer
from optimizer.metrics import compute_all_metrics
from data.generator import generate_scenario

app = FastAPI(
    title="SAARTHI — Smart AI-Assisted Railway Resource & Track Harmonization Interface API",
    description="Backend service demonstrating AI-Powered Automatic Block Planning on Indian Railways (SIH26027).",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(build_dir, "data")
SCENARIO_MAP = {
    "gold_standard": "gold_standard.json",
    "normal": "scenario_normal.json",
    "conflict": "scenario_conflict.json",
    "urgent": "scenario_urgent.json"
}


def load_bundle(scenario_key: str, horizon: str = "weekly") -> ScenarioBundle:
    """Loads scenario bundle from file or regenerates if horizon is monthly."""
    if horizon == "monthly" and scenario_key in ("normal", "conflict", "urgent"):
        return generate_scenario(scenario_key, horizon_hours=720)
    
    filename = SCENARIO_MAP.get(scenario_key)
    if not filename:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_key}' not found.")
    
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Scenario file '{filename}' missing on disk.")
    
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return ScenarioBundle.model_validate(data)


class OptimizeRequest(BaseModel):
    scenario_id: str = "normal"  # "gold_standard", "normal", "conflict", "urgent"
    horizon: str = "weekly"      # "weekly" (168h), "monthly" (720h), or "gold" (24h)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SAARTHI: Smart AI-Assisted Railway Resource & Track Harmonization Interface",
        "problem_code": "SIH26027",
        "environment": "Prototype / Demonstrator",
        "data_mode": "Synthetic Scenario Data (No live TMS/COA connection)"
    }


@app.get("/api/scenarios")
def list_scenarios():
    """Returns available scenarios with high-level summary metadata."""
    scenarios_summary = []
    for key, filename in SCENARIO_MAP.items():
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            scenarios_summary.append({
                "id": key,
                "name": data.get("name"),
                "description": data.get("description"),
                "horizon_hours": data.get("horizon_hours"),
                "task_count": len(data.get("tasks", [])),
                "train_count": len(data.get("trains", [])),
                "window_count": len(data.get("windows", [])),
                "asset_count": len(data.get("assets", [])),
                "is_synthetic": True
            })
    return scenarios_summary


@app.get("/api/scenarios/{scenario_id}")
def get_scenario_details(scenario_id: str, horizon: str = Query("weekly")):
    """Returns the full raw scenario bundle."""
    bundle = load_bundle(scenario_id, horizon)
    return bundle.model_dump()


@app.post("/api/optimize")
def run_optimization(req: OptimizeRequest):
    """
    Executes both Baseline and CP-SAT Optimizer for comparison.
    Returns:
      - Raw scenario details
      - Baseline schedule blocks + metrics
      - Optimized schedule blocks + metrics
      - Performance deltas & explainability
    """
    bundle = load_bundle(req.scenario_id, req.horizon)

    # 1. Run naive baseline
    baseline_blocks = run_baseline_scheduler(bundle)
    num_sections = len(set(w.section_id for w in bundle.windows))
    baseline_metrics = compute_all_metrics(
        blocks=baseline_blocks,
        tasks=bundle.tasks,
        trains=bundle.trains,
        windows=bundle.windows,
        num_sections=num_sections,
        horizon_hours=bundle.horizon_hours
    )

    # 2. Run CP-SAT AI optimizer
    optimizer = RailwayBlockOptimizer(bundle)
    opt_blocks, opt_metrics, solver_stats = optimizer.solve(time_limit_seconds=10.0)

    # 3. Calculate deltas
    hours_saved = max(0, baseline_metrics["total_block_hours"] - opt_metrics["total_block_hours"])
    avail_gain = round(opt_metrics["availability_proxy_pct"] - baseline_metrics["availability_proxy_pct"], 2)
    conflict_reduction = baseline_metrics["train_conflict_count"] - opt_metrics["train_conflict_count"]
    lateness_reduction = round(baseline_metrics["critical_task_lateness"] - opt_metrics["critical_task_lateness"], 2)

    return {
        "scenario_id": req.scenario_id,
        "horizon": req.horizon,
        "horizon_hours": bundle.horizon_hours,
        "is_synthetic": True,
        "scenario_name": bundle.name,
        "scenario_description": bundle.description,
        "network": {
            "sections": list(set(w.section_id for w in bundle.windows)),
            "windows": [w.model_dump() for w in bundle.windows],
            "trains": [t.model_dump() for t in bundle.trains[:40]]  # representative subset for frontend rendering
        },
        "tasks": [t.model_dump() for t in bundle.tasks],
        "baseline": {
            "blocks": [b.model_dump() for b in baseline_blocks],
            "metrics": baseline_metrics
        },
        "optimized": {
            "blocks": [b.model_dump() for b in opt_blocks],
            "metrics": opt_metrics,
            "solver_stats": solver_stats
        },
        "delta": {
            "block_hours_saved": hours_saved,
            "availability_gain_pct": avail_gain,
            "conflict_reduction": conflict_reduction,
            "lateness_reduction": lateness_reduction,
            "integrated_blocks_count": sum(1 for b in opt_blocks if b.status.value == "Integrated")
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
