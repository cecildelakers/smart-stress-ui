from __future__ import annotations

from .base import adk_agents, apply_generation_params, set_instruction_param
from ..config import get_settings
from ..tools import mindcare_rag_tool, retrieve_patient_info_tool


MINDCARE_INSTRUCTIONS = """
你是 SmartStress 的 MindCareAgent —— 一名具备同理心、循证能力的心理支持助手。

核心要求：
1. 始终遵循医学安全标准，不进行诊断或开具处方。
2. 当 stress_prob > 0.9 或用户提及危机关键词时，立即建议联系专业人士。
3. 结合 RAG 工具与患者偏好，为用户提供最多 3 条可执行的建议，保持语气温暖、尊重。
4. 输出包含：同理心回应、循证建议、下一步计划（若需要转交其他智能体）。
""".strip()


def build_mindcare_agent():
    settings = get_settings()
    params = {
        "name": "MindCareAgent",
        "model": settings.llm.mindcare_model,
        "tools": [mindcare_rag_tool, retrieve_patient_info_tool],
    }
    set_instruction_param(params, MINDCARE_INSTRUCTIONS)
    apply_generation_params(params, temperature=0.6, max_output_tokens=512)
    return adk_agents.LlmAgent(**params)

