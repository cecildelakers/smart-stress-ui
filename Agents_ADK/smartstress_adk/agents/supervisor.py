from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .base import adk_agents, apply_generation_params, set_instruction_param
from .mindcare import build_mindcare_agent
from .physio import build_physio_agent
from .taskrelief import build_taskrelief_agent
from ..config import Settings, get_settings
from ..schemas import StressInferenceRequest
from ..services.session import SmartStressSessionService, SmartStressSessionState


SUPERVISOR_INSTRUCTIONS = """
You are SmartStressSupervisor, the orchestrator for a clinical-grade multi-agent system.

Responsibilities:
1. Classify every incoming request into one of three intents:
   - physiology_analysis -> delegate to PhysioSense
   - psychological_support -> delegate to MindCare
   - task_execution -> delegate to TaskRelief
2. Maintain per-user session state (stress probability, recent plans).
3. When stress_prob >= 0.9, proactively brief MindCareAgent with context
   and ask it to initiate an outreach conversation.
4. Propagate only the minimum required PHI to downstream agents.
5. Return concise JSON with `chosen_agent`, `reasoning`, and either a final response
   or a tool invocation result.
""".strip()


MAX_JOURNAL_ENTRIES = 50


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass
class SupervisorStack:
    supervisor: adk_agents.LlmAgent
    physio: object
    mindcare: object
    taskrelief: object
    session_service: SmartStressSessionService
    settings: Settings

    async def route(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("user_id is required.")
        if "windows" in payload:
            return await self._handle_wearable_payload(user_id, payload)
        return await self._handle_conversational_payload(user_id, payload)

    async def _handle_wearable_payload(
        self, user_id: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        StressInferenceRequest(**payload)  # validation
        result = await self.physio.invoke(payload)
        state = await self.session_service.get_state(user_id)
        stress_prob = float(result.get("stress_prob") or 0.0)
        state.stress_prob = stress_prob
        state.last_agent = "PhysioSense"
        self._append_journal(
            state,
            f"{_utc_timestamp()} wearable inference -> stress_prob={stress_prob:.2f}",
        )
        await self.session_service.update_state(state)

        response: Dict[str, Any] = {"agent": "PhysioSense", "result": result}
        follow_up = await self._maybe_trigger_mindcare(user_id, state, result)
        if follow_up:
            response["follow_up"] = follow_up
        return response

    async def _handle_conversational_payload(
        self, user_id: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        supervisor_result = await self.supervisor.invoke(payload)
        state = await self.session_service.get_state(user_id)
        state.last_agent = "SmartStressSupervisor"
        self._append_journal(
            state,
            f"{_utc_timestamp()} conversational routing via SmartStressSupervisor",
        )
        await self.session_service.update_state(state)
        return {"agent": "SmartStressSupervisor", "result": supervisor_result}

    async def _maybe_trigger_mindcare(
        self,
        user_id: str,
        state: SmartStressSessionState,
        inference: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        stress_prob = float(inference.get("stress_prob") or 0.0)
        threshold = self.settings.safety.stress_alert_threshold
        if stress_prob < threshold:
            return None

        prompt = self._build_outreach_prompt(user_id, inference, threshold)
        try:
            mindcare_result = await self.mindcare.invoke(
                {
                    "user_id": user_id,
                    "mode": "proactive_outreach",
                    "message": prompt,
                    "stress_prob": stress_prob,
                    "recommended_action": inference.get("recommended_action"),
                }
            )
        except Exception as exc:  # pragma: no cover - best effort logging
            self._append_journal(
                state,
                f"{_utc_timestamp()} proactive outreach failed: {exc}",
            )
            await self.session_service.update_state(state)
            return {"agent": "MindCareAgent", "error": str(exc)}

        state.last_agent = "MindCareAgent"
        self._append_journal(
            state,
            f"{_utc_timestamp()} proactive outreach triggered at p={stress_prob:.2f}",
        )
        await self.session_service.update_state(state)
        return {"agent": "MindCareAgent", "result": mindcare_result}

    def _build_outreach_prompt(
        self,
        user_id: str,
        inference: Dict[str, Any],
        threshold: float,
    ) -> str:
        stress_prob = float(inference.get("stress_prob") or 0.0)
        confidence = float(inference.get("confidence") or 0.0)
        recommended = inference.get("recommended_action", "monitor")
        interpretation = inference.get("interpretation", "")
        return (
            "PROACTIVE_OUTREACH\n"
            f"user_id: {user_id}\n"
            f"stress_prob: {stress_prob:.2f} (threshold {threshold:.2f})\n"
            f"confidence: {confidence:.2f}\n"
            f"recommended_action: {recommended}\n"
            f"interpretation: {interpretation}\n"
            "Please initiate a compassionate outreach as MindCareAgent, explain the "
            "wearable observations in user-friendly language, invite the user to "
            "describe how they feel right now, and offer up to three evidence-backed "
            "coping suggestions (ground them in retrieve_patient_info and RAG context)."
        )

    def _append_journal(self, state: SmartStressSessionState, entry: str) -> None:
        state.journal.append(entry)
        if len(state.journal) > MAX_JOURNAL_ENTRIES:
            state.journal[:] = state.journal[-MAX_JOURNAL_ENTRIES:]


def build_supervisor_stack() -> SupervisorStack:
    settings = get_settings()
    session_service = SmartStressSessionService()

    physio_agent = build_physio_agent()
    mindcare_agent = build_mindcare_agent()
    taskrelief_agent = build_taskrelief_agent()

    physio_tool = adk_agents.AgentTool(
        agent=physio_agent,
        name="PhysioSense",
        description="Deterministic physiology workflow for wearable signals.",
    )
    mindcare_tool = adk_agents.AgentTool(
        agent=mindcare_agent,
        name="MindCare",
        description="Empathetic conversational support with RAG plus safety guardrails.",
    )
    taskrelief_tool = adk_agents.AgentTool(
        agent=taskrelief_agent,
        name="TaskRelief",
        description="Action-oriented agent for calendar/task automations with HITL.",
    )

    supervisor_params = {
        "name": "SmartStressSupervisor",
        "model": settings.llm.supervisor_model,
        "tools": [physio_tool, mindcare_tool, taskrelief_tool],
        "session_service": session_service,
    }
    set_instruction_param(supervisor_params, SUPERVISOR_INSTRUCTIONS)
    apply_generation_params(
        supervisor_params, temperature=0.2, max_output_tokens=512
    )
    supervisor_agent = adk_agents.LlmAgent(**supervisor_params)

    return SupervisorStack(
        supervisor=supervisor_agent,
        physio=physio_agent,
        mindcare=mindcare_agent,
        taskrelief=taskrelief_agent,
        session_service=session_service,
        settings=settings,
    )

