"""
SIH26027 Data Contract Models.
Strict implementation of Role 3 data contract.
Departments: Engineering, TRD, S&T.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Department(str, Enum):
    ENGINEERING = "Engineering"
    TRD = "TRD"  # Traction Distribution
    ST = "S&T"  # Signal & Telecommunication


class BlockStatus(str, Enum):
    INTEGRATED = "Integrated"
    SINGLE_DEPARTMENT = "SingleDepartment"
    BASELINE_SILO = "BaselineSilo"
    REJECTED_CONFLICT = "RejectedConflict"


class ConstraintType(str, Enum):
    HARD_TRAIN_CONFLICT = "HardTrainConflict"
    SECTION_WINDOW_BOUNDARY = "SectionWindowBoundary"
    RESOURCE_MUTUAL_EXCLUSION = "ResourceMutualExclusion"
    MULTI_DEPT_SYNERGY = "MultiDeptSynergy"


class HardOrSoft(str, Enum):
    HARD = "hard"
    SOFT = "soft"


class Asset(BaseModel):
    asset_id: str
    asset_type: str  # e.g. Track, OHE_Catenary, Point_Machine, Signal_Aspect, Track_Circuit
    department: Department
    section_id: str
    criticality: float = Field(..., ge=1.0, le=5.0)  # 1.0 (lowest) to 5.0 (highest)


class MaintenanceTask(BaseModel):
    task_id: str
    department: Department
    asset_id: str
    section_id: str
    duration: int = Field(..., gt=0, description="Duration in hours")
    due_date: int = Field(..., description="Due date as hour offset from scenario start")
    urgency: float = Field(..., ge=1.0, le=5.0)
    criticality: float = Field(..., ge=1.0, le=5.0)
    required_resources: List[str] = Field(default_factory=list)
    description: Optional[str] = None


class TrainMovement(BaseModel):
    train_id: str
    section_id: str
    arrival: int = Field(..., description="Arrival hour offset")
    departure: int = Field(..., description="Departure hour offset")
    service_class: str = Field(default="Express", description="VandeBharat, Rajdhani_MailExpress, Freight, Passenger")


class AvailabilityWindow(BaseModel):
    window_id: str
    section_id: str
    start: int = Field(..., description="Window start hour")
    end: int = Field(..., description="Window end hour")
    reason: str = Field(..., description="Reason or source of availability window")


class Constraint(BaseModel):
    constraint_id: str
    type: ConstraintType
    entity_ids: List[str]
    hard_or_soft: HardOrSoft
    rule_text: str


class ScheduleBlock(BaseModel):
    block_id: str
    start: int
    end: int
    section_id: str
    tasks: List[str] = Field(..., description="List of task_ids assigned to this block")
    departments: List[Department] = Field(..., description="Unique departments participating in block")
    status: BlockStatus
    reason: Optional[str] = Field(default="", description="Explainable reason string for pitch & operator review")


class ScenarioBundle(BaseModel):
    scenario_id: str
    name: str
    description: str
    horizon_hours: int = 24  # 24, 168 (weekly), or 720 (monthly)
    is_synthetic: bool = True
    assets: List[Asset]
    tasks: List[MaintenanceTask]
    trains: List[TrainMovement]
    windows: List[AvailabilityWindow]
    constraints: List[Constraint]
