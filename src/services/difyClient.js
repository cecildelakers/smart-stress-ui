// This file centralizes the future Dify API integration.
// The demo version exports mock helpers while the real HTTP calls remain commented out.

// import axios from 'axios';

// const client = axios.create({
//   baseURL: 'https://api.dify.ai/v1',
//   headers: {
//     Authorization: `Bearer ${import.meta.env.VITE_DIFY_API_KEY}`,
//     'Content-Type': 'application/json'
//   }
// });

export async function sendChatMessageDemo(message) {
  const lower = message.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! I'm here to walk you through Patient 1's latest signals.";
  }
  if (lower.includes('advice')) {
    return "Recommendation: reinforce sleep hygiene and keep hydration above 2L per day.";
  }
  if (lower.includes('predict')) {
    return "Forecast: low probability of stress escalation over the next 72 hours.";
  }
  return `Demo assistant note: I can react to keywords such as 'hello', 'advice', or 'predict'.`;
}

// export async function sendChatMessage(message) {
//   const response = await client.post('/chat-messages', {
//     inputs: { query: message }
//   });
//   return response.data.answer;
// }

export async function getPredictionDemo() {
  return {
    title: 'Forecast result',
    detail: 'Stable outlook for the upcoming week with low risk events.'
  };
}

// export async function getPrediction() {
//   const response = await client.post('/predictions', { patient_id: 'patient-1' });
//   return response.data;
// }
