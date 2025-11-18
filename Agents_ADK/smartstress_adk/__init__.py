"""
SmartStress multi-agent package built on Google ADK.
"""

from .agents.supervisor import build_supervisor_stack


def get_app():
    from .services.api import app

    return app


__all__ = [
    "build_supervisor_stack",
    "get_app",
]

