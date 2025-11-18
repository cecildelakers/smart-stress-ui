from __future__ import annotations

from typing import Any, Dict

try:
    from google.adk import agents as adk_agents
    import google.adk.models  # noqa: F401  # Ensure model registry is populated.
except ImportError:  # pragma: no cover

    class _BaseAgent:
        def __init__(self, **kwargs):
            self.config = kwargs

        async def invoke(self, payload, **kwargs):
            """
            Minimal placeholder implementation that simply echoes the payload.
            Real executions will be handled by Google ADK when available.
            """
            return {
                "agent": self.config.get("name", self.__class__.__name__),
                "status": "placeholder",
                "payload": payload,
            }

    class _AgentTool:
        def __init__(self, agent, name: str, description: str):
            self.agent = agent
            self.name = name
            self.description = description

        async def __call__(self, *args, **kwargs):
            return await self.agent.invoke(*args, **kwargs)  # type: ignore

    class _AgentsModule:
        LlmAgent = _BaseAgent
        WorkflowAgent = _BaseAgent

        class AgentTool(_AgentTool):
            pass

    adk_agents = _AgentsModule()

try:  # pragma: no cover - optional dependency
    from google.genai import types as genai_types
except ImportError:  # pragma: no cover - fall back to None when offline
    genai_types = None


def _llm_model_fields() -> set[str] | None:
    fields = getattr(adk_agents.LlmAgent, "model_fields", None)
    if isinstance(fields, dict):
        return set(fields.keys())
    return None


def llm_agent_supports_field(field_name: str) -> bool:
    """
    Returns whether the underlying ADK LlmAgent accepts a given field.
    """
    fields = _llm_model_fields()
    if fields is None:
        return True
    return field_name in fields


def set_instruction_param(params: Dict[str, Any], instructions: str) -> None:
    """
    Adds the correct instruction parameter depending on the ADK version.
    """
    if llm_agent_supports_field("instructions"):
        params["instructions"] = instructions
    else:
        params["instruction"] = instructions


def _build_generate_content_config(**config_kwargs):
    if not config_kwargs or genai_types is None:
        return None
    try:
        return genai_types.GenerateContentConfig(**config_kwargs)
    except Exception:  # pragma: no cover - defensive fallback
        return None


def apply_generation_params(
    params: Dict[str, Any],
    *,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
) -> None:
    """
    Applies generation parameters, translating to GenerateContentConfig when
    the new ADK interface is detected.
    """
    if temperature is None and max_output_tokens is None:
        return

    has_temp_field = llm_agent_supports_field("temperature")
    has_max_tokens_field = llm_agent_supports_field("max_output_tokens")
    has_gen_config = llm_agent_supports_field("generate_content_config")

    if has_temp_field and temperature is not None:
        params["temperature"] = temperature
    if has_max_tokens_field and max_output_tokens is not None:
        params["max_output_tokens"] = max_output_tokens

    missing_temp = temperature is not None and not has_temp_field
    missing_max = max_output_tokens is not None and not has_max_tokens_field

    if not has_gen_config or (not missing_temp and not missing_max):
        return

    config_kwargs: Dict[str, Any] = {}
    if missing_temp:
        config_kwargs["temperature"] = temperature
    if missing_max:
        config_kwargs["max_output_tokens"] = max_output_tokens

    generate_config = _build_generate_content_config(**config_kwargs)
    if generate_config is not None:
        params["generate_content_config"] = generate_config


__all__ = [
    "adk_agents",
    "apply_generation_params",
    "llm_agent_supports_field",
    "set_instruction_param",
]
