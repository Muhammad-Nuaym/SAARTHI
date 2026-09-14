# SAARTHI — Smart AI-Assisted Railway Resource & Track Harmonization Interface
### SIH26027 Role 3: AI-Powered Automatic Block Planning Demonstrator

> **PROTOTYPE DEMONSTRATOR — SYNTHETIC SCENARIO DATA**  
> *Demonstrator of planning logic on Indian Railways high-density corridors. Not connected to live BDMS/COA/TMS/SMMS.*

---

## 1. Overview & Mission

**SAARTHI** (**S**mart **A**I-**A**ssisted **R**ailway Resource & **T**rack **H**armonization **I**nterface) is the complete **Role 3 (Build & Simulate)** deliverable for **SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**.

It demonstrates the transition from current Indian Railways practice (**uncoordinated departmental silos** submitting ad-hoc line possession requests to section controllers) to an **AI-optimized constraint programming model (Google OR-Tools CP-SAT)** that:
1. Protects all passenger and freight train movements (**0 hard train conflicts**).
2. Prioritizes urgent and high-criticality repairs (e.g. rail fractures, signal interlocking faults).
3. Co-schedules compatible multi-department maintenance tasks (**Engineering + TRD + S&T**) into unified **Integrated Blocks**, drastically reducing net track closure hours and maximizing corridor commercial throughput.

---

## 2. Directory Layout

```
03_build/
├── data/                  # Synthetic scenario bundles & generator script
│   ├── generator.py       # Parametric generator (Normal, Conflict, Urgent, Weekly/Monthly)
│   ├── gold_standard.json # Hand-checkable 24h mini-case verification bundle
│   ├── scenario_normal.json
│   ├── scenario_conflict.json
│   └── scenario_urgent.json
├── optimizer/             # Constraint programming & baseline logic
│   ├── schema.py          # Strict Pydantic models matching the prompt Data Contract
│   ├── baseline.py        # Naive greedy per-department FCFS scheduler (uncoordinated)
│   ├── cpsat_optimizer.py # Google OR-Tools CP-SAT multi-objective optimization engine
│   └── metrics.py         # Deterministic traceable formulas (no magic numbers)
├── simulator/             # FastAPI backend service
│   └── main.py            # REST endpoints: /api/scenarios, /api/optimize, /api/health
├── web/                   # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Permanent synthetic badge, scenario & horizon switcher
│   │   │   ├── NetworkView.tsx        # View 1: Abstracted line diagram of corridor sections
│   │   │   ├── DemandBoard.tsx        # View 2: Filterable maintenance task backlog
│   │   │   ├── CurrentStateView.tsx   # View 3: Siloed department tracks with visual clash tags
│   │   │   ├── OptimizedStateView.tsx # View 4: Integrated shadow blocks & explainability drawer
│   │   │   ├── MetricsBoard.tsx       # View 5: Before-vs-After KPI cards & math formulas
│   │   │   └── ReplayControls.tsx     # View 6: One-click scenario switcher & benchmark runner
│   │   ├── types.ts                   # Frontend interfaces mirroring backend schema
│   │   ├── api.ts                     # REST client with built-in resilient fallback
│   │   └── App.tsx                    # Shell orchestrating the 6 views
└── tests/                 # Automated test suite (22 tests passing)
    ├── test_schema.py     # Data contract validation
    ├── test_gold_standard.py # Hand-checked mathematical proof on 24h mini-case
    ├── test_optimizer.py  # Multi-scenario and monthly horizon stress tests
    ├── test_api.py        # FastAPI endpoint integration tests
    └── test_acceptance.py # Explicit verification of all 8 Step 5 acceptance criteria
```

---

## 3. Data Contract Compliance

Strict implementation of prompt contract:
- **Asset**: `asset_id, asset_type, department, section_id, criticality`
- **Maintenance task**: `task_id, department, asset_id, section_id, duration, due_date, urgency, criticality, required_resources`
- **Train / movement**: `train_id, section_id, arrival, departure, service_class`
- **Availability window**: `window_id, section_id, start, end, reason`
- **Constraint**: `constraint_id, type, entity_ids, hard_or_soft, rule_text`
- **Schedule block**: `block_id, start, end, section_id, tasks, departments, status, reason`
- **Departments**: Strictly `Engineering`, `TRD`, `S&T`.

---

## 4. How to Run

### Automated Acceptance Tests (Pytest)
```bash
python -m pytest -v 03_build/tests/
```

### Start the Backend (FastAPI)
```bash
python -m uvicorn 03_build.simulator.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger docs available at: `http://127.0.0.1:8000/docs`

### Start the Frontend (React + Vite)
```bash
cd 03_build/web
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Acceptance Test Results (8 of 8 Passed)

- [x] The three departments coexist in the same scenario (`test_acceptance_1_three_departments_coexist`)
- [x] A task cannot be scheduled outside an allowed maintenance window (`test_acceptance_2_tasks_inside_allowed_windows`)
- [x] A hard train conflict is rejected by the scheduler (`test_acceptance_3_hard_train_conflicts_rejected`)
- [x] Integrated compatible tasks can share a block (`test_acceptance_4_integrated_compatible_tasks_share_block`)
- [x] Critical/urgent tasks receive higher priority than routine tasks (`test_acceptance_5_critical_urgent_tasks_win_priority`)
- [x] Weekly and monthly plans are generated from the same scenario schema (`test_acceptance_6_weekly_and_monthly_from_same_schema`)
- [x] Every KPI shown on screen can be traced to raw data and a calculation formula (`test_acceptance_7_traceable_kpis_no_magic_numbers`)
- [x] The system clearly labels simulated/internal data (`test_acceptance_8_synthetic_data_labeling`)
