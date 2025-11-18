from __future__ import annotations

from .base import adk_agents, apply_generation_params, set_instruction_param
from ..config import get_settings
from ..tools import (
    create_calendar_event_tool,
    get_calendar_events_tool,
    update_calendar_event_tool,
)


TASKRELIEF_INSTRUCTIONS = """
You are the TaskReliefAgent. Translate high-level stressors into concrete calendar or task
updates. Before taking any action:
- Clarify the intent and required constraints.
- Generate a short plan in natural language.
- If a write operation is required, call the relevant tool and rely on HITL confirmation.
- Never fabricate availability; inspect the calendar first.
""".strip()


def build_taskrelief_agent():
    settings = get_settings()
    params = {
        "name": "TaskReliefAgent",
        "model": settings.llm.taskrelief_model,
        "tools": [
            get_calendar_events_tool,
            create_calendar_event_tool,
            update_calendar_event_tool,
        ],
    }
    set_instruction_param(params, TASKRELIEF_INSTRUCTIONS)
    apply_generation_params(params, temperature=0.4, max_output_tokens=512)
    return adk_agents.LlmAgent(**params)

