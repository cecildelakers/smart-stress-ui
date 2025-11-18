# SmartStress ADK Agent Stack

This directory contains the reference implementation of the SmartStress multi-agent system rebuilt on top of Google's [Agent Development Kit (ADK)](https://google.github.io/adk-docs/). The code mirrors the architecture described in `Agents_develop_doc.md` and can run independently from the existing web UI.

## Contents

```
Agents_ADK/
├── Agents_develop_doc.md       # Original high-level brief (read-only)
├── README.md                   # You are here
├── requirements.txt            # Python dependencies
├── smartstress_adk/            # ADK agents, tools, workflows, services
│   ├── agents/                 # SmartStressSupervisor, PhysioSense, MindCare, TaskRelief
│   ├── tools/                  # Deterministic + HITL tool definitions
│   ├── workflows/              # WorkflowAgent definitions (PhysioSense)
│   ├── services/               # Runtime/bootstrap utilities (FastAPI entrypoint, sessions)
│   └── *.py                    # Shared config, schemas, state helpers
└── tests/                      # Minimal regression tests for tools & workflows
```

## Prerequisites

- Python 3.11+
- Access to Google Cloud Vertex AI (for Gemini models) and any external APIs you plan to call (calendar, task managers, wearable data streams, etc.)
- Service account JSON with the following roles: `Vertex AI User`, `Storage Object Viewer` (for model artifacts), plus any target API scopes (Calendar, Asana, etc.)

Set the credentials file path before running anything that talks to Google Cloud:

```
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
```

## Installation

```
cd Agents_ADK
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

Key dependencies:

- `google-adk`: core multi-agent runtime
- `google-cloud-aiplatform`: Gemini + vector search access
- `fastapi` + `uvicorn`: lightweight HTTP surface for the supervisor agent
- `pydantic`, `numpy`, `scikit-learn`: deterministic physiology workflows and structured outputs

## Configuration

All runtime knobs live in `smartstress_adk/config.py`. Environment variables follow the `SMARTSTRESS_*` prefix (e.g., `SMARTSTRESS_SUPERVISOR_MODEL`, `SMARTSTRESS_VECTOR_STORE`). Each agent exposes explicit instruction strings and guardrails that can be tuned here.

## Running the Service

1. Ensure the virtual environment is activated and dependencies installed.
2. Start the orchestrator API:

```
uvicorn smartstress_adk.services.api:app --reload --host 0.0.0.0 --port 8085
```

3. Send requests to `POST /agents/invoke` with either wearable telemetry payloads or chat messages. The FastAPI layer delegates all reasoning to `SmartStressSupervisor`, which then routes work to the specialist agents.

A sample `curl` request is included in `smartstress_adk/services/api.py`.

API responses always include the `agent` that handled the request plus its `result`.
When passive physiology ingestion pushes the latest `stress_prob` above
`SMARTSTRESS_ALERT_THRESHOLD`, the supervisor automatically triggers MindCare for a
proactive check-in and the HTTP response will include a `follow_up` block that surfaces
the outreach payload.

## Testing

```
pytest Agents_ADK/tests
```

Current tests focus on deterministic pieces (physiology workflow + tool schema validation). Extend these as you add new tools or safety rules.

## Architectural Highlights

- **SmartStressSupervisor (LlmAgent):** single entry point with routing logic. The supervisor mounts each specialist agent as an ADK `AgentTool`, tracks session state, and enforces escalation rules (`stress_prob > 0.9` triggers proactive outreach).
- **PhysioSenseAgent (WorkflowAgent):** deterministic pipeline that validates wearable signals, runs the CNN-LSTM inference tool, and normalizes stress scores. Produces structured payloads consumable by downstream agents.
- **MindCareAgent (LlmAgent):** empathetic dialogue agent leveraging RAG over curated psychosocial interventions. Integrates a `retrieve_patient_info` tool to maintain personalization while upholding clinical safety guardrails.
- **TaskReliefAgent (LlmAgent):** action executor with calendar/task APIs. Every write operation (create/update) is wrapped by ADK's HITL confirmation to satisfy medical governance requirements.

## Safety & Compliance

- HITL enforcement is configured via `confirm=True` on all mutating tools (`update_calendar_event`, `create_asana_task`, etc.).
- Session context is filtered to remove PHI before logging. Only aggregated stress metrics are persisted to the `InMemorySessionService`; swap with an external FHIR-compliant store as needed.
- MindCareAgent instructions include explicit boundaries (no diagnoses, always defer to clinicians, escalate crisis keywords).

## Extending the Stack

- **New sensors:** implement another deterministic tool and register it inside `PhysioSenseAgent`'s workflow.
- **Additional care paths:** create new specialist agents under `smartstress_adk/agents/` and expose them to the supervisor via `make_supervisor_agent()`.
- **Deploy to Cloud Run:** wrap `uvicorn` startup in a container (Dockerfile not provided here) and configure workload identity for secure access to Gemini + downstream APIs.

For deeper reference, consult the upstream ADK docs: https://google.github.io/adk-docs/ and the tool catalog: https://google.github.io/adk-docs/tools/.

