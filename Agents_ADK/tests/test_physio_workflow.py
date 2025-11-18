import asyncio
from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from smartstress_adk.workflows.physio_workflow import build_physio_workflow_agent


def test_physio_workflow_formats_summary():
    agent = build_physio_workflow_agent()
    payload = {
        "user_id": "patient-002",
        "windows": [
            {
                "sensor": "ppg",
                "sampling_rate_hz": 32,
                "values": [0.2 * i for i in range(64)],
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
    result = asyncio.run(agent.invoke(payload))
    assert "stress_prob" in result
    assert "insights" in result
    assert result["agent"] if "agent" in result else True

