import axios from "axios";

// 自动判断环境：如果是开发模式用 localhost:8000，如果是生产模式(被Python托管)用相对路径
const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "";

export const client = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

/**
 * 1. 启动新会话 (对应 /api/start_session)
 * 用于 ChatPanel 初始化
 */
export async function startSession(userId = "web-user", sessionId = "session-" + Date.now()) {
    try {
        const response = await client.post('/api/start_session', {
            user: {
                user_id: userId,
                session_id: sessionId,
                traits: {}
            },
            // 可选：传入初始传感器数据
            initial_sensor_data: {
                timestamp: new Date().toISOString(),
                values: { hr: 75 }
            }
        });
        // 返回 session handle (凭证) 和初始视图
        return {
            handle: response.data.handle,
            state: response.data.view
        };
    } catch (error) {
        console.error("Start session failed:", error);
        throw error;
    }
}

/**
 * 2. 发送消息并获取回复 (对应 /api/continue_session)
 * 用于 ChatPanel 发送消息
 */
export async function sendMessage(sessionHandle, message) {
    try {
        const response = await client.post('/api/continue_session', {
            session_handle: sessionHandle, // 必须带上凭证
            user_message: {
                role: "user",
                content: message
            }
        });

        // 解析后端返回的最新状态
        const history = response.data.view.conversation_history;
        // 获取最后一条 AI 的回复
        const lastMessage = history.length > 0 ? history[history.length - 1] : null;

        return {
            handle: response.data.handle, // 更新 handle
            response: lastMessage ? lastMessage.content : "No response",
            fullState: response.data.view
        };
    } catch (error) {
        console.error("Send message failed:", error);
        throw error;
    }
}

/**
 * Get stress prediction for a patient
 * 用于 QuickActions 组件
 */
export async function getPrediction(patientId = 'patient-1') {
    // 注意：目前的后端 server.py 似乎没有暴露 /predict 接口。
    // 为了防止报错，这里直接返回 Mock 数据。
    // 如果未来后端实现了该接口，可以取消注释下面的代码：
    /*
    const response = await client.post('/predict', {
        patient_id: patientId
    });
    return response.data;
    */

    return {
        title: 'Forecast result',
        detail: 'Stable outlook (Mocked on frontend as backend API is pending).'
    };
}

/**
 * Demo prediction function (fallback)
 * 用于 QuickActions 组件在请求失败时的回退
 */
export async function getPredictionDemo() {
    return {
        title: 'Forecast result',
        detail: 'Stable outlook for the upcoming week with low risk events.'
    };
}