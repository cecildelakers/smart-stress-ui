// This file centralizes the future Dify API integration.
// The demo version exports mock helpers while the real HTTP calls remain commented out.

import axios from "axios";

export const client = axios.create({
    baseURL: "https://api.dify.ai/v1",
    headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_DIFY_API_KEY}`,
        "Content-Type": "application/json",
    },
});


// export async function sendChatMessageDemo(message) {
//   const lower = message.toLowerCase();
//   if (lower.includes('hello') || lower.includes('hi')) {
//     return "Hello! I'm here to walk you through Patient 1's latest signals.";
//   }
//   if (lower.includes('advice')) {
//     return "Recommendation: reinforce sleep hygiene and keep hydration above 2L per day.";
//   }
//   if (lower.includes('predict')) {
//     return "Forecast: low probability of stress escalation over the next 72 hours.";
//   }
//   return `Demo assistant note: I can react to keywords such as 'hello', 'advice', or 'predict'.`;
// }

export async function sendChatMessage(message) {
    const response = await client.post('/chat-messages', {
        query: message,              // 用户输入
        inputs: {},                  // 若无变量可留空对象
        response_mode: "blocking",   // 或 "streaming"
        user: "bmi5101_group1",    // 任意唯一字符串
    });

    return response.data.answer;
}


export async function sendChatMessageStream(message, onMessage, conversationIdRef) {
  const apiKey = import.meta.env.VITE_DIFY_API_KEY;
  const response = await fetch("https://api.dify.ai/v1/chat-messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: message,
      inputs: {},
      response_mode: "streaming",
      user: "bmi5101_group1",
      conversation_id: conversationIdRef.current || undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const part of parts) {
      if (!part.startsWith("data:")) continue;
      const jsonStr = part.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const event = JSON.parse(jsonStr);
        if (event.event === "message") {
          onMessage(event.answer);
        } else if (event.event === "message_end") {
          if (event.conversation_id)
            conversationIdRef.current = event.conversation_id;
        }
      } catch (err) {
        console.error("解析流事件失败：", err, jsonStr);
      }
    }
  }
}





export async function getPredictionDemo() {
    return {
        title: 'Forecast result',
        detail: 'Stable outlook for the upcoming week with low risk events.'
    };
}

export async function getPrediction() {
    const response = await client.post('/predictions', {patient_id: 'patient-1'});
    return response.data;
}
