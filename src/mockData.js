export const PATIENT_PROFILE = {
  id: "patient-1",
  name: "Patient 1",
  age: 39,
  primaryCondition: "Generalized Anxiety Disorder",
  careTeam: "Dr. Lee (Psychiatry)",
  lastRefresh: "2024-05-04 10:30"
};

export const VITAL_SNAPSHOT = [
  { id: "ecg", label: "ECG", value: "Sinus", note: "Normal rhythm" },
  { id: "bpm", label: "BPM", value: "78 bpm", note: "+3 vs baseline" },
  { id: "hrv", label: "HRV", value: "54 ms", note: "Stable" },
  { id: "stress", label: "Stress Index", value: "0.32", note: "Low" }
];

export const TIME_SERIES = {
  "24h": [
    { timestamp: "2024-05-03T11:00:00Z", bpm: 72 },
    { timestamp: "2024-05-03T12:00:00Z", bpm: 73 },
    { timestamp: "2024-05-03T13:00:00Z", bpm: 72 },
    { timestamp: "2024-05-03T14:00:00Z", bpm: 74 },
    { timestamp: "2024-05-03T15:00:00Z", bpm: 75 },
    { timestamp: "2024-05-03T16:00:00Z", bpm: 76 },
    { timestamp: "2024-05-03T17:00:00Z", bpm: 77 },
    { timestamp: "2024-05-03T18:00:00Z", bpm: 79 },
    { timestamp: "2024-05-03T19:00:00Z", bpm: 82 },
    { timestamp: "2024-05-03T20:00:00Z", bpm: 85 },
    { timestamp: "2024-05-03T21:00:00Z", bpm: 84 },
    { timestamp: "2024-05-03T22:00:00Z", bpm: 83 },
    { timestamp: "2024-05-03T23:00:00Z", bpm: 81 },
    { timestamp: "2024-05-04T00:00:00Z", bpm: 79 },
    { timestamp: "2024-05-04T01:00:00Z", bpm: 77 },
    { timestamp: "2024-05-04T02:00:00Z", bpm: 76 },
    { timestamp: "2024-05-04T03:00:00Z", bpm: 75 },
    { timestamp: "2024-05-04T04:00:00Z", bpm: 74 },
    { timestamp: "2024-05-04T05:00:00Z", bpm: 73 },
    { timestamp: "2024-05-04T06:00:00Z", bpm: 74 },
    { timestamp: "2024-05-04T07:00:00Z", bpm: 75 },
    { timestamp: "2024-05-04T08:00:00Z", bpm: 76 },
    { timestamp: "2024-05-04T09:00:00Z", bpm: 77 },
    { timestamp: "2024-05-04T10:00:00Z", bpm: 78 }
  ],
  "7d": [
    { day: "Mon", bpm: 78 },
    { day: "Tue", bpm: 79 },
    { day: "Wed", bpm: 77 },
    { day: "Thu", bpm: 76 },
    { day: "Fri", bpm: 80 },
    { day: "Sat", bpm: 81 },
    { day: "Sun", bpm: 79 }
  ]
};

export const EXPLANATIONS = {
  "24h": {
    summary:
      "24-hour trend remains stable with a mild midday peak aligned with questionnaire feedback.",
    actions: [
      "Encourage a guided breathing session before lunch.",
      "Monitor hydration to reduce midday spikes."
    ]
  },
  "7d": {
    summary:
      "Weekly average sits within the expected window. Mid-week increase resolved within 36 hours.",
    actions: [
      "Continue CBT module cadence (3x per week).",
      "Schedule follow-up check-in next Tuesday."
    ]
  }
};

export const STATUS_UPDATES = [
  "09:00 - Patient reported 7h restful sleep, mood 4/5.",
  "Yesterday - Completed CBT module 3 and 10 min breathing exercise.",
  "2 days ago - Short walk logged; no irregular ECG events detected."
];

export const CHAT_RESPONSES = {
  hello: "Hello! I'm here to walk you through Patient 1's latest signals.",
  advice:
    "Recommendation: reinforce sleep hygiene and keep hydration above 2L per day. Refer to the Explainability panel for specific triggers.",
  predict:
    "Forecast: low probability of stress escalation over the next 72 hours. Confidence interval remains within the stable band."
};

export const SURVEY_QUESTIONS = [
  "How would you rate your current stress level?",
  "Did you complete your mindfulness exercise today?",
  "Any new symptoms to report?"
];
