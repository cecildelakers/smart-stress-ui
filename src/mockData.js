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

// Generate yesterday's date for 24h time series
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

function generate24hTimeSeries() {
  const yesterday = getYesterdayDate();
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');

  // Helper to add natural variation
  const randomInRange = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // We generate 24 hourly points from 00:00Z to 23:00Z.
  // In UTC+8 (e.g., China/Singapore), this renders as local 08:00 → 07:00 next day.
  const timeSeries = [];
  for (let hour = 0; hour < 24; hour++) {
    const dateStr = `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00:00Z`;

    // Treat array index as local hour offset starting at 08:00.
    // index 0 => 08:00, 1 => 09:00, ..., 16 => 00:00, ..., 23 => 07:00
    const localIndex = hour; // 0..23 mapped to 08..07 visually
    let bpm;

    if (localIndex === 0) {
      // 08:00 - start rising from high-70s
      bpm = randomInRange(76, 80);
    } else if (localIndex === 1) {
      // 09:00
      bpm = randomInRange(80, 85);
    } else if (localIndex === 2) {
      // 10:00
      bpm = randomInRange(84, 88);
    } else if (localIndex >= 3 && localIndex <= 9) {
      // 11:00 - 17:00 daytime activity with variation
      bpm = randomInRange(82, 100);
    } else if (localIndex === 10) {
      // 18:00 sudden peak > 110
      bpm = randomInRange(110, 114);
    } else if (localIndex === 11) {
      // 19:00 peak sustained (about 20min represented within the hour)
      bpm = randomInRange(105, 110);
    } else if (localIndex === 12) {
      // 20:00 start returning
      bpm = randomInRange(92, 98);
    } else if (localIndex >= 13 && localIndex <= 15) {
      // 21:00 - 23:00 evening cool down
      bpm = randomInRange(80, 92);
    } else {
      // 00:00 - 07:00 resting heart rate
      bpm = randomInRange(50, 60);
    }

    timeSeries.push({
      timestamp: dateStr,
      bpm
    });
  }

  return timeSeries;
}

export const TIME_SERIES = {
  "24h": generate24hTimeSeries(),
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

export const DOCTOR_OVERVIEW = {
  stressBreakdown: [
    { id: "high", label: "High stress", value: 38, color: "#FF8A8A" },
    { id: "moderate", label: "Medium stress", value: 34, color: "#FFD37A" },
    { id: "low", label: "Low stress", value: 28, color: "#9DDCC1" }
  ],
  totals: {
    patients: 126,
    surveys: 15
  },
  detection: {
    label: "Instant detection",
    metric: "HRV",
    series: [
      { time: "08:00", value: 64 },
      { time: "09:00", value: 68 },
      { time: "10:00", value: 74 },
      { time: "11:00", value: 88 },
      { time: "12:00", value: 95 },
      { time: "13:00", value: 90 },
      { time: "14:00", value: 82 },
      { time: "15:00", value: 78 },
      { time: "16:00", value: 73 },
      { time: "17:00", value: 70 }
    ]
  },
  patientTable: [
    {
      id: PATIENT_PROFILE.id,
      patient: PATIENT_PROFILE.name,
      status: "Stable",
      program: "Stress reduction",
      avgBpm: 78,
      avgHrv: 54,
      stressScore: 0.32,
      lastSurvey: "2024-05-04"
    },
    {
      id: "patient-2",
      patient: "Patient 2",
      status: "Needs follow-up",
      program: "Sleep support",
      avgBpm: 92,
      avgHrv: 48,
      stressScore: 0.67,
      lastSurvey: "2024-05-02"
    },
    {
      id: "patient-3",
      patient: "Patient 3",
      status: "Improving",
      program: "Mindfulness pilot",
      avgBpm: 74,
      avgHrv: 57,
      stressScore: 0.44,
      lastSurvey: "2024-05-05"
    },
    {
      id: "patient-4",
      patient: "Patient 4",
      status: "High priority",
      program: "Intensive CBT",
      avgBpm: 104,
      avgHrv: 42,
      stressScore: 0.81,
      lastSurvey: "2024-04-30"
    },
    {
      id: "patient-5",
      patient: "Patient 5",
      status: "Stable",
      program: "Lifestyle coaching",
      avgBpm: 80,
      avgHrv: 59,
      stressScore: 0.38,
      lastSurvey: "2024-05-03"
    },
    {
      id: "patient-6",
      patient: "Patient 6",
      status: "Monitoring",
      program: "Stress reduction",
      avgBpm: 86,
      avgHrv: 50,
      stressScore: 0.55,
      lastSurvey: "2024-05-01"
    },
    {
      id: "patient-7",
      patient: "Patient 7",
      status: "Improving",
      program: "Sleep support",
      avgBpm: 72,
      avgHrv: 60,
      stressScore: 0.29,
      lastSurvey: "2024-05-06"
    }
  ],
  quickActions: [
    "Monitor high stress cohort",
    "Schedule multidisciplinary huddle",
    "Request updated compliance reports"
  ]
};

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
