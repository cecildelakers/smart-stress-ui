from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SignalWindow(BaseModel):
    sensor: Literal["ppg", "eda", "acc"]
    sampling_rate_hz: float = Field(gt=0)
    values: list[float] = Field(min_length=32)
    timestamp_utc: datetime
    model_config = ConfigDict(extra="forbid")

    @field_validator("values")
    @classmethod
    def ensure_numeric(cls, values: list[float]) -> list[float]:
        for val in values:
            if not isinstance(val, (int, float)):
                raise ValueError("SignalWindow values must be numeric.")
        return values


class StressInferenceRequest(BaseModel):
    user_id: str
    windows: list[SignalWindow] = Field(min_length=1)
    metadata: dict[str, str] | None = None


class StressInferenceResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    user_id: str
    stress_prob: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    interpretation: str
    recommended_action: Literal["monitor", "reach_out", "escalate"]
    model_version: str
    features: dict[str, float]


class MindcareExchange(BaseModel):
    user_id: str
    role: Literal["user", "agent"]
    message: str
    timestamp_utc: datetime = Field(default_factory=datetime.utcnow)


class PatientPreference(BaseModel):
    user_id: str
    prefers_voice: bool = False
    favorite_technique: Optional[str] = None
    recent_triggers: list[str] = Field(default_factory=list)


class CalendarEvent(BaseModel):
    event_id: str
    title: str
    start_time: datetime
    end_time: datetime
    attendees: list[str] = Field(default_factory=list)
    location: Optional[str] = None


class CalendarActionProposal(BaseModel):
    action: Literal["create", "update", "delete"]
    description: str
    payload: dict
    rationale: str


class TaskRecommendation(BaseModel):
    channel: Literal["calendar", "asana", "todoist"]
    summary: str
    deadline: Optional[datetime]
    requires_confirmation: bool = True

