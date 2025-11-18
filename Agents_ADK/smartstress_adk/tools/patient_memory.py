from __future__ import annotations

from typing import Dict

from ..schemas import PatientPreference
from ._adk_shim import adk_tools


_PREFERENCE_STORE: Dict[str, PatientPreference] = {
    "patient-001": PatientPreference(
        user_id="patient-001",
        prefers_voice=False,
        favorite_technique="Box breathing",
        recent_triggers=["tight deadlines", "public speaking"],
    )
}


@adk_tools.tool
def retrieve_patient_info(user_id: str) -> dict:
    """
    Fetches persisted user preferences for enhanced personalization.
    """
    preference = _PREFERENCE_STORE.get(user_id) or PatientPreference(user_id=user_id)
    return preference.model_dump()


retrieve_patient_info_tool = adk_tools.FunctionTool(
    fn=retrieve_patient_info,
    name="retrieve_patient_info",
    description="Retrieves stored user preferences (triggers, coping favorites, modality).",
)

