from __future__ import annotations

from ..workflows.physio_workflow import build_physio_workflow_agent


def build_physio_agent():
    """
    Factory that exposes the PhysioSense WorkflowAgent.
    """
    return build_physio_workflow_agent()

