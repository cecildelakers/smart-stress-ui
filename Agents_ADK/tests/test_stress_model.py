from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from smartstress_adk.tools.stress_model import run_stress_model


def _build_payload():
    base_time = datetime.now(timezone.utc).replace(microsecond=0)
    return {
        "user_id": "patient-001",
        "windows": [
            {
                "sensor": "ppg",
                "sampling_rate_hz": 32,
                "values": [0.1 * i for i in range(64)],
                "timestamp_utc": base_time.isoformat(),
            },
            {
                "sensor": "eda",
                "sampling_rate_hz": 8,
                "values": [0.05 * i for i in range(64)],
                "timestamp_utc": (base_time - timedelta(seconds=5)).isoformat(),
            },
        ],
    }


def test_run_stress_model_returns_probabilities():
    payload = _build_payload()
    result = run_stress_model(payload)
    assert 0.0 <= result["stress_prob"] <= 1.0
    assert result["recommended_action"] in {"monitor", "reach_out", "escalate"}
    assert "features" in result and len(result["features"]) > 0

