from __future__ import annotations

from typing import Any, Dict, List

from ..config import get_settings
from ._adk_shim import adk_tools


@adk_tools.tool
def retrieve_mindcare_context(query: str, top_k: int = 3) -> Dict[str, Any]:
    """
    Lightweight placeholder RAG tool. In production this should
    issue a Vertex AI Vector Search request. For now we return
    curated interventions keyed by intent.
    """
    settings = get_settings()
    curated_library: Dict[str, List[str]] = {
        "breathing": [
            "Box breathing for 2 minutes",
            "4-7-8 breathing cycle",
            "Tactical breathing (inhale 4, hold 4, exhale 8)",
        ],
        "cognitive": [
            "Label emotions without judgment",
            "Reframe stressor as challenge",
            "Use evidence log to dispute catastrophic thoughts",
        ],
        "physical": [
            "Progressive muscle relaxation",
            "Short mobility routine",
            "Hydration reminder",
        ],
    }
    query_lower = query.lower()
    if any(keyword in query_lower for keyword in ("breath", "respir", "lungs")):
        key = "breathing"
    elif any(keyword in query_lower for keyword in ("think", "ruminate", "worry")):
        key = "cognitive"
    else:
        key = "physical"

    candidates = curated_library[key][:top_k]
    return {
        "index": settings.tools.rag_index_name,
        "query": query,
        "key": key,
        "contexts": candidates,
    }


mindcare_rag_tool = adk_tools.FunctionTool(
    fn=retrieve_mindcare_context,
    name="retrieve_mindcare_context",
    description="Retrieves evidence-based coping techniques from the MindCare vector index.",
)

