from __future__ import annotations

from fastapi import FastAPI, HTTPException

from ..agents.supervisor import build_supervisor_stack
from ..schemas import StressInferenceRequest

app = FastAPI(
    title="SmartStress ADK Agents",
    version="0.1.0",
    description="FastAPI surface that exposes the SmartStressSupervisor orchestrator.",
)

stack = build_supervisor_stack()


@app.post("/agents/invoke")
async def invoke_agents(payload: dict):
    """
    Generic endpoint that routes wearable data vs. conversational inputs
    to the appropriate agent via SmartStressSupervisor.
    """
    try:
        return await stack.route(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/healthz")
async def healthcheck():
    return {"status": "ok"}


SAMPLE_CURL = r"""
curl -X POST http://localhost:8085/agents/invoke ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\": \"patient-001\", \"message\": \"我今天压力很大，需要一些呼吸练习\"}"
"""

