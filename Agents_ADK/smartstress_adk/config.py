from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Literal


@dataclass
class LlmGatewayConfig:
    project_id: str = os.getenv("SMARTSTRESS_PROJECT_ID", "smartstress-sandbox")
    location: str = os.getenv("SMARTSTRESS_LOCATION", "us-central1")
    supervisor_model: str = os.getenv(
        "SMARTSTRESS_SUPERVISOR_MODEL", "gemini-2.5-flash"
    )
    mindcare_model: str = os.getenv(
        "SMARTSTRESS_MINDCARE_MODEL", "gemini-2.5-flash-lite"
    )
    taskrelief_model: str = os.getenv(
        "SMARTSTRESS_TASKRELIEF_MODEL", "gemini-2.5-flash-lite"
    )


@dataclass
class ToolingConfig:
    rag_index_name: str = os.getenv(
        "SMARTSTRESS_RAG_INDEX", "projects/demo/locations/global/indexes/mindcare"
    )
    calendar_provider: Literal["google", "outlook"] = os.getenv(
        "SMARTSTRESS_CALENDAR_PROVIDER", "google"
    )
    wearable_model_path: str = os.getenv(
        "SMARTSTRESS_MODEL_PATH", "gs://smartstress-models/cnn_lstm/1"
    )
    hitl_timeout_seconds: int = int(os.getenv("SMARTSTRESS_HITL_TIMEOUT", "600"))


@dataclass
class SafetyConfig:
    crisis_keywords: tuple[str, ...] = (
        "suicide",
        "self harm",
        "kill myself",
        "hurt myself",
    )
    stress_alert_threshold: float = float(
        os.getenv("SMARTSTRESS_ALERT_THRESHOLD", "0.9")
    )
    max_turns_per_session: int = int(os.getenv("SMARTSTRESS_MAX_TURNS", "24"))


@dataclass
class Settings:
    llm: LlmGatewayConfig = field(default_factory=LlmGatewayConfig)
    tools: ToolingConfig = field(default_factory=ToolingConfig)
    safety: SafetyConfig = field(default_factory=SafetyConfig)
    telemetry_bucket: str = os.getenv(
        "SMARTSTRESS_TELEMETRY_BUCKET", "smartstress-telemetry"
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a memoized Settings instance. Import this at runtime
    to avoid repeatedly reading environment variables.
    """
    return Settings()

