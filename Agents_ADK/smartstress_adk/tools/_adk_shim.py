"""
Provides a tolerant shim for google.adk.tools so tests can run without the full
runtime. If google.adk lacks the `tool` decorator (older versions) we fallback
to lightweight stand-ins that mimic the minimal interface we rely on.
"""

from __future__ import annotations

try:
    from google.adk import tools as adk_tools  # type: ignore
except ImportError:  # pragma: no cover

    class _FunctionTool:
        def __init__(self, fn, **kwargs):
            self.fn = fn
            self.name = kwargs.get("name", fn.__name__)
            self.description = kwargs.get("description", fn.__doc__)
            self.confirm = kwargs.get("confirm", False)
            self.confirm_prompt = kwargs.get("confirm_prompt")

        def __call__(self, *args, **kwargs):
            return self.fn(*args, **kwargs)

    def _tool_decorator(*_args, **_kwargs):
        def decorator(fn):
            return fn

        if _args and callable(_args[0]):
            return _args[0]
        return decorator

    class _Shim:
        FunctionTool = _FunctionTool

        @staticmethod
        def tool(*args, **kwargs):
            return _tool_decorator(*args, **kwargs)

    adk_tools = _Shim()
else:
    if not hasattr(adk_tools, "tool"):

        def _default_tool_decorator(*_args, **_kwargs):
            def decorator(fn):
                return fn

            if _args and callable(_args[0]):
                return _args[0]
            return decorator

        adk_tools.tool = _default_tool_decorator

    _NativeFunctionTool = adk_tools.FunctionTool

    class _CompatFunctionTool(_NativeFunctionTool):  # type: ignore[misc]
        def __init__(
            self,
            *,
            fn=None,
            func=None,
            confirm: bool | None = None,
            confirm_prompt: str | None = None,
            require_confirmation=None,
            **_kwargs,
        ):
            target = fn or func
            if target is None:
                raise ValueError("FunctionTool requires a callable via fn/func.")
            if require_confirmation is None:
                require_confirmation = confirm or False
            super().__init__(
                target,
                require_confirmation=require_confirmation,
            )

    adk_tools.FunctionTool = _CompatFunctionTool  # type: ignore[attr-defined]

__all__ = ["adk_tools"]
