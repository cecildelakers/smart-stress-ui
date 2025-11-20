// API client for smart-stress-agent backend
import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL || "";

export const client = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
});

/**
 * Send a chat message and receive a blocking response
 * @param {string} message - The user's message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise<string>} The assistant's response
 */
export async function sendChatMessage(message, conversationId = null) {
    const response = await client.post('/chat', {
        message: message,
        conversation_id: conversationId,
    });

    return response.data.response || response.data.answer || response.data.message;
}

/**
 * Send a chat message with streaming response
 * @param {string} message - The user's message
 * @param {Function} onMessage - Callback function to handle each chunk
 * @param {Object} conversationIdRef - Ref object to store conversation ID
 */
export async function sendChatMessageStream(message, onMessage, conversationIdRef) {
    const response = await fetch(`${baseURL}/chat/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: message,
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

        // Handle different streaming formats
        // Format 1: Server-Sent Events (SSE)
        if (buffer.includes("data:")) {
            const parts = buffer.split("\n\n");
            buffer = parts.pop();

            for (const part of parts) {
                if (!part.startsWith("data:")) continue;
                const jsonStr = part.slice(5).trim();
                if (!jsonStr || jsonStr === "[DONE]") continue;

                try {
                    const event = JSON.parse(jsonStr);
                    // Handle different response formats
                    if (event.chunk || event.delta || event.content) {
                        onMessage(event.chunk || event.delta || event.content);
                    } else if (event.message) {
                        onMessage(event.message);
                    }
                    if (event.conversation_id) {
                        conversationIdRef.current = event.conversation_id;
                    }
                } catch (err) {
                    console.error("Failed to parse streaming event:", err, jsonStr);
                }
            }
        }
        // Format 2: Newline-delimited JSON
        else if (buffer.includes("\n")) {
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const event = JSON.parse(line);
                    if (event.chunk || event.delta || event.content) {
                        onMessage(event.chunk || event.delta || event.content);
                    } else if (event.message) {
                        onMessage(event.message);
                    }
                    if (event.conversation_id) {
                        conversationIdRef.current = event.conversation_id;
                    }
                } catch (err) {
                    console.error("Failed to parse JSON line:", err, line);
                }
            }
        }
    }
}

/**
 * Get stress prediction for a patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Object>} Prediction data
 */
export async function getPrediction(patientId = 'patient-1') {
    const response = await client.post('/predict', {
        patient_id: patientId
    });
    return response.data;
}

/**
 * Demo prediction function (fallback)
 * @returns {Promise<Object>}
 */
export async function getPredictionDemo() {
    return {
        title: 'Forecast result',
        detail: 'Stable outlook for the upcoming week with low risk events.'
    };
}
