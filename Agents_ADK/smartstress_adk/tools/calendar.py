from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from ..schemas import CalendarEvent
from ._adk_shim import adk_tools


_CALENDAR_EVENTS: Dict[str, CalendarEvent] = {}


def _parse_datetime(value: str | datetime) -> datetime:
    return value if isinstance(value, datetime) else datetime.fromisoformat(value)


@adk_tools.tool
def get_calendar_events(
    user_id: str, start_time: str, end_time: str
) -> List[dict]:
    """
    Returns all events intersecting the provided window.
    """
    start = _parse_datetime(start_time)
    end = _parse_datetime(end_time)
    results: list[CalendarEvent] = []
    for event in _CALENDAR_EVENTS.values():
        if event.start_time <= end and event.end_time >= start:
            results.append(event)
    return [event.model_dump() for event in results]


@adk_tools.tool
def create_calendar_event(payload: dict) -> dict:
    """
    Creates a new calendar event (requires HITL confirmation).
    """
    event = CalendarEvent(**payload)
    _CALENDAR_EVENTS[event.event_id] = event
    return event.model_dump()


@adk_tools.tool
def update_calendar_event(event_id: str, updates: dict) -> dict:
    """
    Updates attributes on an existing calendar event.
    """
    event = _CALENDAR_EVENTS.get(event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found.")
    data = event.model_dump()
    data.update(updates)
    updated = CalendarEvent(**data)
    _CALENDAR_EVENTS[event_id] = updated
    return updated.model_dump()


get_calendar_events_tool = adk_tools.FunctionTool(
    fn=get_calendar_events,
    name="get_calendar_events",
    description="List calendar events for a user within a time range.",
)

create_calendar_event_tool = adk_tools.FunctionTool(
    fn=create_calendar_event,
    name="create_calendar_event",
    description="Create a new calendar event on behalf of the user.",
    confirm=True,
    confirm_prompt=(
        "需要为用户新建此日程吗？请确认之后我才会调用日历 API。"
    ),
)

update_calendar_event_tool = adk_tools.FunctionTool(
    fn=update_calendar_event,
    name="update_calendar_event",
    description="Update an existing calendar event (time, attendees, etc.).",
    confirm=True,
    confirm_prompt="确认后我会修改指定的会议。",
)

