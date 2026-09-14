# SAARTHI — Smart AI-Assisted Railway Resource & Track Harmonization Interface
### SIH26027 Role 3: AI-Powered Automatic Block Planning Demonstrator

> **PROTOTYPE DEMONSTRATOR — SYNTHETIC SCENARIO DATA**  
> *Demonstrator of planning logic on Indian Railways high-density corridors. Not connected to live BDMS/COA/TMS/SMMS.*

[![Live Vercel Demo](https://img.shields.io/badge/Vercel-Live%20Demo-brightgreen?logo=vercel)](https://railsync-nu.vercel.app/)
[![Tests](https://img.shields.io/badge/Pytest-22%20Passed-success?logo=pytest)](03_build/tests/)
[![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python)](03_build/optimizer/)
[![React](https://img.shields.io/badge/React-19%20TypeScript-61dafb?logo=react)](03_build/web/)
[![Solver](https://img.shields.io/badge/Google%20OR--Tools-CP--SAT-red)](03_build/optimizer/cpsat_optimizer.py)

---

## 1. Overview & Problem Statement

**SAARTHI** (**S**mart **A**I-**A**ssisted **R**ailway Resource & **T**rack **H**armonization **I**nterface) addresses **SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**.

In current Indian Railways practice, maintenance departments operate in administrative silos:
- **Engineering (P-Way)**: Track tamping, ballast cleaning, rail renewals.
- **TRD (Traction Distribution)**: OHE catenary maintenance, insulator cleaning, contact wire adjustments.
- **S&T (Signal & Telecommunication)**: Point machines, electronic interlocking, axle counter testing.

Each department independently demands separate corridor line possession blocks from divisional section controllers. This results in:
1. Fragmented and excessive track closure hours.
2. Inadvertent clashes with scheduled passenger train paths (Rajdhani, Vande Bharat, Mail/Express).
3. Deferral of urgent and safety-critical track repairs.

**SAARTHI** replaces uncoordinated First-Come-First-Served (FCFS) bookings with a **mathematical constraint-programming engine (Google OR-Tools CP-SAT)** that bundles compatible tasks into unified **Integrated Blocks**, protects all train paths, and prioritizes critical repairs.

---

## 2. Live Demonstrator Views

The application provides 6 distinct interactive screens:
1. **Network View**: Abstracted schematic corridor diagram of Prayagraj–Kanpur–Etawah Up & Down lines, station nodes, and block windows.
2. **Demand Board**: Centralized multi-department maintenance backlog, filterable by department, urgency, and section.
3. **Current State (Baseline)**: Pre-optimization department silos side-by-side with visual conflict and train infringement warnings.
4. **Optimized State (AI)**: Integrated multi-department shadow blocks with explainability rationale drawers and downtime savings.
5. **Metrics Board**: Before-vs-After KPI comparison cards (Total Block Hours, Train Conflicts, Critical Lateness, Corridor Availability %) with raw mathematical traceability formulas.
6. **Replay & Benchmarks**: One-click scenario switcher across **Normal**, **Conflict-Heavy**, **Urgent-Critical**, and **Gold-Standard** cases.

---

## 3. Quickstart

### Live Demo URL
Access the deployed web interface: **[https://railsync-nu.vercel.app/](https://railsync-nu.vercel.app/)**

### Run Locally

#### 1. Run Automated Test Suite (22 tests)
```bash
python -m pytest -v 03_build/tests/
```

#### 2. Run the FastAPI Backend
```bash
python -m uvicorn 03_build.simulator.main:app --host 127.0.0.1 --port 8080 --reload
```

#### 3. Run the React Web UI
```bash
cd 03_build/web
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.
