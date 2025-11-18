from __future__ import annotations

from math import exp
from statistics import mean, pstdev
from typing import Any, Dict

import numpy as np

from ..schemas import SignalWindow, StressInferenceRequest, StressInferenceResult
from ._adk_shim import adk_tools


def _extract_features(window: SignalWindow) -> dict[str, float]:
    arr = np.asarray(window.values, dtype=np.float32)
    arr = (arr - arr.mean()) / (arr.std() + 1e-6)

    feature_map = {
        f"{window.sensor}_mean": float(arr.mean()),
        f"{window.sensor}_std": float(arr.std()),
        f"{window.sensor}_max": float(arr.max()),
        f"{window.sensor}_min": float(arr.min()),
        f"{window.sensor}_slope": float((arr[-1] - arr[0]) / len(arr)),
    }
    return feature_map


def _logistic(x: float) -> float:
    return 1 / (1 + exp(-x))


@adk_tools.tool
def run_stress_model(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic placeholder for the CNN-LSTM physiology model.
    Accepts payload serialized as StressInferenceRequest and
    returns StressInferenceResult for downstream agents.
    """
    request = StressInferenceRequest(**payload)
    combined_features: dict[str, float] = {}
    amplitudes: list[float] = []

    for window in request.windows:
        features = _extract_features(window)
        combined_features.update(features)
        amplitudes.append(abs(features[f"{window.sensor}_max"]))

    stress_signal = mean(amplitudes)
    variability = pstdev(amplitudes) if len(amplitudes) > 1 else 0.1
    logits = 1.3 * stress_signal + 0.6 * variability
    stress_prob = max(0.01, min(0.99, _logistic(logits)))
    confidence = 0.6 + min(0.39, variability)

    recommended_action = "monitor"
    if stress_prob >= 0.9:
        recommended_action = "escalate"
    elif stress_prob >= 0.7:
        recommended_action = "reach_out"

    result = StressInferenceResult(
        user_id=request.user_id,
        stress_prob=stress_prob,
        confidence=confidence,
        interpretation=(
            "Elevated sympathetic arousal detected based on recent wearable samples."
            if stress_prob >= 0.7
            else "Stress markers remain within acceptable bounds."
        ),
        recommended_action=recommended_action,  # type: ignore[arg-type]
        model_version="cnn_lstm_synthetic_v0",
        features=combined_features,
    )
    return result.model_dump()


run_stress_model_tool = adk_tools.FunctionTool(
    fn=run_stress_model,
    name="run_stress_model",
    description=(
        "Runs the SmartStress CNN-LSTM model on cleaned physiology windows and "
        "returns structured stress probability outputs."
    ),
)

