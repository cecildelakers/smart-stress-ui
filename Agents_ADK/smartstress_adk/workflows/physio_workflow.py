from __future__ import annotations

from typing import Any, Dict

import numpy as np

from ..schemas import SignalWindow, StressInferenceRequest
from ..tools.stress_model import run_stress_model

try:
    from google.adk.workflows import WorkflowAgent, WorkflowContext, WorkflowStep
    from google.adk import agents
except ImportError:  # pragma: no cover

    class WorkflowContext(dict):
        pass

    class WorkflowStep:
        def __init__(self, name: str, fn):
            self.name = name
            self.fn = fn

        async def __call__(self, context: WorkflowContext) -> WorkflowContext:
            context[self.name] = await self.fn(context)
            return context

    class WorkflowAgent:  # type: ignore
        def __init__(self, *, name: str, steps: list[WorkflowStep], description: str):
            self.name = name
            self.steps = steps
            self.description = description

        async def invoke(self, payload):
            context = WorkflowContext(input=payload)
            for step in self.steps:
                await step(context)
            return context["format_result"]

    class agents:  # type: ignore
        WorkflowAgent = WorkflowAgent


async def _normalize_signals(context: WorkflowContext) -> Dict[str, Any]:
    request = StressInferenceRequest(**context["input"])
    normalized: list[SignalWindow] = []
    for window in request.windows:
        arr = np.asarray(window.values, dtype=np.float32)
        arr = (arr - arr.mean()) / (arr.std() + 1e-6)
        normalized.append(
            SignalWindow(
                sensor=window.sensor,
                sampling_rate_hz=window.sampling_rate_hz,
                values=arr.tolist(),
                timestamp_utc=window.timestamp_utc,
            )
        )
    context["request"] = StressInferenceRequest(
        user_id=request.user_id, windows=normalized, metadata=request.metadata
    ).model_dump()
    return context["request"]


async def _run_inference(context: WorkflowContext) -> Dict[str, Any]:
    result = run_stress_model(context["request"])
    context["inference"] = result
    return result


async def _format_result(context: WorkflowContext) -> Dict[str, Any]:
    inference = context["inference"]
    summary = {
        "user_id": inference["user_id"],
        "stress_prob": inference["stress_prob"],
        "confidence": inference["confidence"],
        "recommended_action": inference["recommended_action"],
        "insights": {
            "top_features": sorted(
                inference["features"].items(), key=lambda item: abs(item[1]), reverse=True
            )[:5]
        },
    }
    context["format_result"] = summary
    return summary


def build_physio_workflow_agent() -> WorkflowAgent:
    """
    Constructs the WorkflowAgent responsible for deterministic physiology inference.
    """
    steps = [
        WorkflowStep(name="normalize_signals", fn=_normalize_signals),
        WorkflowStep(name="run_inference", fn=_run_inference),
        WorkflowStep(name="format_result", fn=_format_result),
    ]
    return WorkflowAgent(
        name="PhysioSenseAgent",
        description="Deterministic physiology workflow for SmartStress.",
        steps=steps,
    )

