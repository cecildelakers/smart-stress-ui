from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict

try:
    from google.adk.sessions import InMemorySessionService, SessionState
except ImportError:  # pragma: no cover - fallback for local linting

    class SessionState(dict):
        pass

    class InMemorySessionService:  # type: ignore
        def __init__(self) -> None:
            self._store: Dict[str, SessionState] = {}

        async def get(self, key: str) -> SessionState:
            return self._store.setdefault(key, SessionState())

        async def save(self, key: str, value: SessionState) -> None:
            self._store[key] = value


@dataclass
class SmartStressSessionState:
    user_id: str
    stress_prob: float | None = None
    last_agent: str | None = None
    journal: list[str] = field(default_factory=list)

    @classmethod
    def from_session(cls, session: SessionState, user_id: str) -> "SmartStressSessionState":
        return cls(
            user_id=user_id,
            stress_prob=session.get("stress_prob"),
            last_agent=session.get("last_agent"),
            journal=session.get("journal", []),
        )

    def to_session(self) -> SessionState:
        return SessionState(
            {
                "stress_prob": self.stress_prob,
                "last_agent": self.last_agent,
                "journal": self.journal,
            }
        )


class SmartStressSessionService(InMemorySessionService):
    """
    Thin wrapper that stores structured SmartStress state in the ADK session service.
    """

    async def get_state(self, user_id: str) -> SmartStressSessionState:
        session = await super().get(user_id)
        return SmartStressSessionState.from_session(session, user_id)

    async def update_state(self, state: SmartStressSessionState) -> None:
        await super().save(state.user_id, state.to_session())

