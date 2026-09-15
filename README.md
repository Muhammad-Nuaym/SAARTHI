# SAARTHI — Smart AI-Assisted Railway Resource & Track Harmonization Interface
### SIH26027 Role 3: AI-Powered Automatic Block Planning Demonstrator

> **PROTOTYPE DEMONSTRATOR — SYNTHETIC SCENARIO DATA**  
> *Demonstrator of planning logic on Indian Railways high-density corridors. Not connected to live BDMS/COA/TMS/SMMS.*

[![Live Vercel Demo](https://img.shields.io/badge/Vercel-Live%20Demo-brightgreen?logo=vercel)](https://saarthi-sand.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SAARTHI-blue?logo=github)](https://github.com/Muhammad-Nuaym/SAARTHI)
[![Tests](https://img.shields.io/badge/Pytest-22%20Passed-success?logo=pytest)](03_build/tests/)
[![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python)](03_build/optimizer/)
[![React](https://img.shields.io/badge/React-19%20TypeScript-61dafb?logo=react)](03_build/web/)
[![Solver](https://img.shields.io/badge/Google%20OR--Tools-CP--SAT-red)](03_build/optimizer/cpsat_optimizer.py)

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Mathematical Formulation (Google CP-SAT)](#3-mathematical-formulation-google-cp-sat)
4. [Live Demonstrator Views](#4-live-demonstrator-views)
5. [Scenarios & The 24h Hand-Checkable Gold Standard](#5-scenarios--the-24h-hand-checkable-gold-standard)
6. [Acceptance Test Suite (22/22 Passing)](#6-acceptance-test-suite-2222-passing)
7. [Quickstart & Local Setup](#7-quickstart--local-setup)
8. [Data Contract Specification](#8-data-contract-specification)
9. [Regulatory & Operational Disclaimer](#9-regulatory--operational-disclaimer)

---

## 1. Executive Summary & Problem Statement

**SAARTHI** (**S**mart **A**I-**A**ssisted **R**ailway Resource & **T**rack **H**armonization **I**nterface) addresses **SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**.

On high-density trunk corridors of Indian Railways (e.g., Kanpur–Prayagraj), infrastructure maintenance is carried out by three distinct departments:
- **Engineering (P-Way)**: Track tamping, ballast cleaning, rail renewals, turnout overhauls.
- **TRD (Traction Distribution)**: Overhead 25 kV AC catenary maintenance, insulator cleaning, contact wire adjustments.
- **S&T (Signal & Telecommunication)**: Electronic interlocking, point machines, track circuits, axle counters.

### The Silo Bottleneck
Historically, each department requests line possession ("traffic blocks") independently through sectional controllers via uncoordinated First-Come-First-Served (FCFS) manual applications. This creates:
1. **Fragmented Track Closures**: Multiple successive single-department line closures throughout the day, drastically reducing commercial path capacity for passenger (Vande Bharat, Rajdhani, Mail/Express) and freight services.
2. **Uncoordinated Clashes**: Unsynchronized blocks that lead to severe train speed restrictions, loop-line stabling, and cascading sectional delay.
3. **Deferred Critical Safety Maintenance**: Routine work booked ahead of urgent safety-critical defects due to lack of cross-department priority weighting.

### The SAARTHI Solution
**SAARTHI** introduces an intelligent constraint-programming orchestration engine powered by **Google OR-Tools CP-SAT**:
- **Multi-Department Co-Scheduling**: Harmonizes Engineering, TRD, and S&T tasks into single, high-efficiency **Integrated Blocks** during authorized maintenance windows.
- **Strict Inviolability of Train Paths**: Hard mathematical constraints guarantee zero disruption to scheduled passenger and freight paths (0 train clashes).
- **Transparent Explainability**: Every schedule recommendation exposes its mathematical objective score, solver runtime, constraint counts, and priority rationale.
- **Human-in-the-Loop Workflow**: Section controllers can review, approve, or adjust AI-generated plans with real-time feedback.

---

## 2. System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │      Scenario Data Generator / Bundles       │
                                  │ (Kanpur-Prayagraj Corridor: Assets, Windows, │
                                  │   Maintenance Tasks, Scheduled Train Paths)  │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                   ┌─────────────────────┴─────────────────────┐
                                   ▼                                           ▼
                    ┌────────────────────────────┐              ┌─────────────────────────────┐
                    │   Baseline FCFS Engine     │              │     Google OR-Tools CP-SAT  │
                    │  (Uncoordinated Department │              │     Multi-Objective Solver  │
                    │      Silo Booking)         │              │  (Integrated Multi-Dept)    │
                    └──────────────┬─────────────┘              └──────────────┬──────────────┘
                                   │                                           │
                                   └─────────────────────┬─────────────────────┘
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │     Traceable Metrics Engine      │
                                       │ (Zero magic numbers; deterministic│
                                       │    formulas for availability,     │
                                       │  lateness, conflict, and savings) │
                                       └─────────────────┬─────────────────┘
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │     FastAPI Simulator Service     │
                                       │   (/api/scenarios, /api/optimize) │
                                       └─────────────────┬─────────────────┘
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │       React 19 + TypeScript SPA   │
                                       │ (Network, Demand, Current, AI,    │
                                       │   KPIs, Replay & Solver Telemetry)│
                                       └───────────────────────────────────┘
```

---

## 3. Mathematical Formulation (Google CP-SAT)

The optimization problem is formulated as an exact Constraint Programming / Mixed-Integer model using Google OR-Tools CP-SAT.

### Decision Variables
- $x_{i,w} \in \{0, 1\}$: Binary variable indicating if maintenance task $i$ is assigned to maintenance window $w$.
- $s_i \in [0, H]$: Scheduled start time of task $i$.
- $e_i \in [0, H]$: Scheduled end time ($e_i = s_i + d_i$, where $d_i$ is task duration).
- $lat_i \ge 0$: Lateness variable measuring delay past task due date.
- $u_w \in \{0, 1\}$: Binary variable indicating if maintenance window $w$ is active.
- $y_{w,d} \in \{0, 1\}$: Binary variable indicating if department $d \in \{\text{Engineering}, \text{TRD}, \text{S\&T}\}$ operates in window $w$.
- $syn_w \in \{0, 1\}$: Synergy indicator activated when 2 or more distinct departments share window $w$.

### Hard Constraints
1. **Corridor Window Containment**:
   $$x_{i,w} = 1 \implies s_i \ge \text{start}_w \quad \text{and} \quad e_i \le \text{end}_w$$
2. **Inviolable Train Paths**:
   For any scheduled train path $T$ traversing section $S$ during $[t_{\text{arr}}, t_{\text{dep}}]$:
   $$\forall i \text{ on section } S: \quad [s_i, e_i] \cap [t_{\text{arr}}, t_{\text{dep}}] = \emptyset$$
3. **No Inter-Task Section Collision**:
   Incompatible tasks on the same physical track segment cannot overlap in time.
4. **Shared Asset Exclusivity**:
   Mutually exclusive resources (e.g., track tamper machine or heavy OHE tower wagon) allow at most one task at any point in time.

### Multi-Objective Function
$$\max \quad \sum_{i} \left( 500 + 20 \cdot \text{urgency}_i + 20 \cdot \text{criticality}_i \right) \cdot \sum_w x_{i,w} \;+\; \sum_w 400 \cdot syn_w \;-\; \sum_i (15 \cdot \text{criticality}_i) \cdot lat_i \;-\; \sum_w 50 \cdot (\text{span}_w)$$

- **Scheduling Incentive**: Rewards scheduling high-urgency and critical tasks promptly.
- **Synergy Bonus ($+400$)**: Strongly rewards co-scheduling multiple departments into a single block.
- **Lateness Penalty**: Penalizes postponing safety-critical repairs past their operational deadlines.
- **Span Penalty**: Minimizes total block duration to preserve track availability.

---

## 4. Live Demonstrator Views

| View | Purpose & Key Features |
| :--- | :--- |
| **1. Network View** | Schematic corridor view of the Prayagraj–Kanpur–Etawah trunk lines (UP/DOWN mainlines, stations, crossovers, and real-time maintenance window indicators). |
| **2. Demand Board** | Centralized multi-department work backlog. Features the **AI Priority Explainability Modal** detailing exact weight contributions: $\text{Urgency} \times 10 + \text{Criticality} \times 10$ and lateness risk. |
| **3. Current State (Baseline)** | Uncoordinated departmental silos. Highlights visual train clashes, duplicate track closures, and unmanaged possession hours. |
| **4. Optimized State (AI)** | Unified **Integrated Blocks** where Engineering, TRD, and S&T work concurrently. Displays live **CP-SAT Solver Trace** (Status, Runtime, Objective Value, Constraints) and **Section Controller Sign-Off Workflow** (`PENDING`, `APPROVED`, `MODIFIED`). |
| **5. Metrics Board** | Complete Before-vs-After KPI cards with zero magic numbers. Direct links to mathematical calculation formulas for Total Block Hours Saved, Conflict Count, Critical Lateness, and Availability %. |
| **6. Replay & Scenarios** | Switch seamlessly between different simulated operational environments (Gold-Standard, Normal, High-Contention, and Emergency) across Weekly (168h) and Monthly (720h) horizons. |

---

## 5. Scenarios & The 24h Hand-Checkable Gold Standard

SAARTHI includes four operational test scenarios:
1. **Gold-Standard Mini-Case (`gold_standard.json`)**:
   - 24-hour verification case on Kanpur–Prayagraj sections `SEC-01` and `SEC-02`.
   - 4 multi-department tasks, 3 train movements (including Vande Bharat Express), 3 available maintenance windows.
   - **Hand-checkable mathematical proof**: Verifies that the CP-SAT engine successfully pairs an Engineering rail overhaul with a TRD catenary inspection into a single integrated block, yields 0 train conflicts, and preserves urgent S&T maintenance.
2. **Corridor Normal Operations (`scenario_normal.json`)**:
   - 168-hour weekly operations with balanced maintenance load and ample scheduled traffic windows.
3. **Corridor High-Contention Operations (`scenario_conflict.json`)**:
   - Heavy overlapping demand across all 3 departments competing for identical line possessions.
4. **Corridor Critical & Emergency Operations (`scenario_urgent.json`)**:
   - Emergency rail fracture and signal failure remediation requiring immediate block preemption.

---

## 6. Acceptance Test Suite (22/22 Passing)

The project includes an automated test suite verifying data contracts, solver constraints, and acceptance criteria:

```bash
$ python -m pytest -v 03_build/tests/
============================= test session starts =============================
03_build/tests/test_acceptance.py ........                               [ 36%]
03_build/tests/test_api.py ....                                          [ 54%]
03_build/tests/test_gold_standard.py ..                                  [ 63%]
03_build/tests/test_optimizer.py ....                                    [ 81%]
03_build/tests/test_schema.py ....                                       [100%]
======================= 22 passed in 39.95s ====================================
```

### Verified Acceptance Criteria:
- [x] **Criterion 1**: Engineering, TRD, and S&T coexist within the same operational scenario.
- [x] **Criterion 2**: Tasks are scheduled strictly inside authorized corridor maintenance windows.
- [x] **Criterion 3**: Train conflicts are strictly rejected by the CP-SAT scheduler (0 train clashes).
- [x] **Criterion 4**: Compatible multi-department tasks share integrated possession blocks.
- [x] **Criterion 5**: Critical and urgent tasks win scheduling priority over routine cyclic jobs.
- [x] **Criterion 6**: Weekly (168h) and Monthly (720h) horizons generate from the identical schema.
- [x] **Criterion 7**: Every KPI shown on screen is traceable to raw data and a defined mathematical formula (no magic numbers).
- [x] **Criterion 8**: Human-in-the-loop operator approval and modification workflow supported.

---

## 7. Quickstart & Local Setup

### Live Production Deployment
Experience the demonstrator online: **[https://saarthi-sand.vercel.app/](https://saarthi-sand.vercel.app/)**

### Local Environment Setup

#### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm

#### 1. Clone the Repository
```bash
git clone https://github.com/Muhammad-Nuaym/SAARTHI.git
cd SAARTHI
```

#### 2. Install Python Dependencies & Run Tests
```bash
pip install -r 03_build/requirements.txt   # or pip install fastapi uvicorn ortools pydantic pytest
python -m pytest -v 03_build/tests/
```

#### 3. Start the FastAPI Backend Simulator
```bash
python -m uvicorn 03_build.simulator.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API Swagger Docs: `http://127.0.0.1:8000/docs`

#### 4. Start the React 19 Frontend
```bash
cd 03_build/web
npm.cmd install
npm.cmd run dev
```
Open your browser at `http://localhost:5173`.

---

## 8. Data Contract Specification

All inputs and outputs strictly follow validated Pydantic v2 schemas (`03_build/optimizer/schema.py`):

| Entity | Fields | Description |
| :--- | :--- | :--- |
| **Asset** | `asset_id, asset_type, department, section_id, criticality` | Physical railway asset under maintenance. |
| **MaintenanceTask** | `task_id, department, asset_id, section_id, duration, due_date, urgency, criticality, required_resources` | Work order issued by a department. |
| **TrainMovement** | `train_id, section_id, arrival, departure, service_class` | Scheduled commercial passenger or freight movement. |
| **AvailabilityWindow** | `window_id, section_id, start, end, reason` | Designated corridor traffic gap for engineering works. |
| **ScheduleBlock** | `block_id, start, end, section_id, tasks, departments, status, reason` | Issued track possession window (Single or Integrated). |

---

## 9. Regulatory & Operational Disclaimer

> **DISCLAIMER**: SAARTHI is a research prototype and algorithmic demonstrator created for Smart India Hackathon (Problem SIH26027). All operational scenarios, train timetables, and network topologies are synthetic representations based on Indian Railways operating characteristics. The demonstrator does not interface with live Indian Railways production systems (BDMS, COA, TMS, or SMMS). Any real-world deployment requires integration with official railway signaling protocols, interlocking interlocks, and safety rulebooks.
