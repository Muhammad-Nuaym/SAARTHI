"""
Test suite for Data Contract and Schema validation.
Verifies all scenario JSON files against Pydantic models.
"""

import json
import os
import pytest
from optimizer.schema import ScenarioBundle, Department, BlockStatus

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
SCENARIO_FILES = [
    "gold_standard.json",
    "scenario_normal.json",
    "scenario_conflict.json",
    "scenario_urgent.json",
]


@pytest.mark.parametrize("filename", SCENARIO_FILES)
def test_scenario_conforms_to_data_contract(filename):
    path = os.path.join(DATA_DIR, filename)
    assert os.path.exists(path), f"File {filename} does not exist"
    
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Must validate against ScenarioBundle without raising ValidationError
    bundle = ScenarioBundle.model_validate(data)
    assert bundle.scenario_id
    assert bundle.name
    assert len(bundle.assets) > 0
    assert len(bundle.tasks) > 0
    assert len(bundle.trains) > 0
    assert len(bundle.windows) > 0
    assert bundle.is_synthetic is True, "Must be clearly labeled synthetic"
    
    # Ensure departments are strictly Engineering, TRD, or S&T
    valid_depts = {Department.ENGINEERING, Department.TRD, Department.ST}
    for asset in bundle.assets:
        assert asset.department in valid_depts
    for task in bundle.tasks:
        assert task.department in valid_depts
