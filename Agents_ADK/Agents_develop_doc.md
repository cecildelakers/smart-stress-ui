以下是为您团队准备的一份框架技术文档，作为使用 ADK 开发 SmartStress 项目的参考。

-----

# SmartStress 多智能体架构技术文档 (基于 Google ADK)

## 1\. 简介

### 1.1 目的

本文档旨在为 SmartStress 项目的后端迁移提供一个清晰的技术蓝图。该方案将取代原有的 Dify 原型 [1]，转而采用 Google 的 Agent Development Kit (ADK) 来构建一个健壮、可扩展且符合医疗安全标准的多智能体系统 (MAS)。

### 1.2 核心理念

我们将遵循 ADK 的核心设计哲学：**分层多智能体系统**。我们将 SmartStress 的三个核心功能（PhysioSense, MindCare, TaskRelief）[1] 实现为三个独立的、可专业协作的**专业智能体 (Specialist Agents)**。

这三个智能体将由一个**根智能体/协调器 (Root Agent / Orchestrator)** 来管理，该协调器作为系统的统一入口点，负责路由任务、管理状态和确保交互流程的连贯性。

## 2\. 核心架构：分层多智能体系统

我们将构建一个四智能体的分层架构：

1.  **`SmartStressSupervisor` (协调器)：**

      * **角色：** 系统的“大脑”和总路由。
      * **职责：** 接收所有外部输入（来自可穿戴设备的 API 调用、用户的聊天消息），将其分派给相应的专业智能体，并管理跨会话的用户状态（例如 `current_stress_level`）。

2.  **`PhysioSenseAgent` (专业智能体)：**

      * **角色：** 生理数据分析器 [1]。
      * **职责：** 执行确定性的数据处理工作流。它接收原始生理信号，调用深度学习模型，并返回结构化的压力分析结果。

3.  **`MindCareAgent` (专业智能体)：**

      * **角色：** 对话式心理支持 [1]。
      * **职责：** 处理所有与用户的情感交流和心理疏导。利用 RAG (检索增强生成) 提供循证建议。

4.  **`TaskReliefAgent` (专业智能体)：**

      * **角色：** 现实世界行动执行器 [1]。
      * **职责：** 解析用户意图，并通过调用外部工具（API）来执行减轻工作负载的任务（例如，管理日历、任务列表）。

## 3\. 智能体定义与实现 (ADK)

### 3.1 `SmartStressSupervisor` (协调器)

  * **ADK 类型：** `adk.agents.LlmAgent`。
  * **核心逻辑：**
      * 作为 FastAPI 或 Cloud Run 端点的主要处理程序。
      * **提示 (Prompt) 设计：** 其系统提示（System Prompt）至关重要，必须包含路由逻辑：“你是一个顶级的医疗助手协调员。你的工作是理解输入并将其路由给三个专家之一：`PhysioSense` (用于生理数据分析), `MindCare` (用于对话支持), 或 `TaskRelief` (用于执行任务)。"
      * **工具：** 它的“工具”就是其他三个智能体。ADK 允许将一个智能体注册为另一个智能体的工具。
  * **状态管理：** 负责维护一个持久化的会话状态，例如使用 ADK 的 `InMemorySessionService` 或集成外部记忆库（如 Mem0），以跟踪 `user_id` 及其 `current_stress_prob`。

### 3.2 `PhysioSenseAgent` (生理感知智能体)

  * **ADK 类型：** `adk.agents.WorkflowAgent` (或 `SequentialAgent`)。
  * **核心逻辑：**
      * 这是一个**非 LLM** 智能体，用于执行确定性任务。
      * 它包含一个单步工作流：调用 `run_stress_model` 工具。
  * **关键工具 (Tools)：**
      * **`@tool` (Python 函数)：** `run_stress_model(signal_data: list) -> dict`
          * 此函数将加载您在第一部分中训练的 CNN-LSTM 模型。
          * 它接收传感器数据作为输入，执行模型推理。
          * 返回一个标准化的 JSON 对象：`{"status": "success", "stress_prob": 0.92, "confidence": 0.99}`。

### 3.3 `MindCareAgent` (心理支持智能体)

  * **ADK 类型：** `adk.agents.LlmAgent`。
  * **核心逻辑：**
      * 一个强大的对话式智能体，专注于同理心、安全性和循证响应。
      * 其提示应包含安全护栏（例如，“绝不提供医疗诊断，始终建议用户寻求专业帮助”）。
  * **关键工具 (Tools)：**
      * **RAG 工具：** 使用 ADK 的内置 `VertexAIEngine` 工具，连接到您的向量数据库（包含临床指南、CBT 练习、呼吸技巧等）。
      * **记忆工具 (可选)：** `retrieve_patient_info(query: str)`。允许智能体“记住”用户之前的偏好和压力源。

### 3.4 `TaskReliefAgent` (任务缓解智能体)

  * **ADK 类型：** `adk.agents.LlmAgent`。
  * **核心逻辑：**
      * 这是一个以行动为导向的智能体。它的主要工作是理解自然语言请求并将其转换为 API 调用。
  * **关键工具 (Tools)：**
      * `get_calendar_events(start_time: str, end_time: str)`
      * `create_calendar_event(summary: str, start_time: str, end_time: str, attendees: list)` [2, 3, 4]
      * `get_asana_tasks(project_id: str)` [5, 6]
      * `create_asana_task(project_id: str, task_name: str)` [5, 6]
  * **安全实现：** 所有执行**写入**操作（create, update, delete）的工具**必须**启用 ADK 的“人在回路中”(HITL) 功能。

## 4\. 关键实现：交互流程与安全 (HITL)

这是 SmartStress 区别于普通应用的核心闭环，ADK 的架构使其得以实现。

### 4.1 流程 1：被动压力检测与主动干预

1.  **[设备]** 用户的可穿戴设备通过 App 向 `SmartStressSupervisor` 的 API 端点发送生理数据。
2.  \*\*\*\* `Supervisor` 识别出这是生理数据，将任务和数据委托给 `PhysioSenseAgent`。
3.  \*\*\*\* `PhysioSenseAgent` 执行其工作流，调用 `run_stress_model` 工具，并向 `Supervisor` 返回 `{ "stress_prob": 0.92 }`。
4.  \*\*\*\* `Supervisor` 接收此结果，更新该用户的会话状态。
5.  \*\*\*\* `Supervisor` 评估状态（`stress_prob > 0.9`），并决定**主动发起**一个新任务。
6.  \*\*\*\* `Supervisor` **转移 (transfer)** 控制权给 `MindCareAgent`，并附带一个内部指令：“用户当前压力值很高 (0.92)。请主动与用户发起对话，询问他们的感受，并提供初步的安抚。”

### 4.2 流程 2：从对话到行动 (安全 HITL)

1.  **[MindCare]** 用户在聊天中回复：“我感到压力很大，因为我有一个关于 BM15101 的作业，而且我 15:00 还有一个会议。”
2.  **[MindCare]** `MindCareAgent` (LLM) 解析此对话。它使用 RAG 工具提供安抚，并识别出一个**可操作的压力源**（“15:00的会议”）。
3.  **[MindCare]** `MindCareAgent` 决定此任务超出了其对话范围，于是向 `Supervisor` 报告：“我已安抚用户。用户似乎需要帮助处理 15:00 的会议。请将此任务转交给 `TaskReliefAgent`。”
4.  \*\*\*\* `Supervisor` 接收到请求，**转移**控制权给 `TaskReliefAgent`，并附带指令：“检查用户 15:00 的会议，并寻找重新安排的方案。”
5.  \*\*\*\* `TaskReliefAgent` 激活。它首先调用（只读）工具 `get_calendar_events()` 来分析情况。
6.  \*\*\*\* 它制定一个计划（例如，“将 15:00 的会议推迟到明天 10:00”）。
7.  \*\*\*\* 智能体决定调用 `update_calendar_event(...)` 工具。
8.  \*\*\*\* 因为此工具被标记为需要确认，ADK **自动暂停 (pause)** 执行。
9.  \*\*\*\* ADK 向用户前端返回一个**确认请求**：
    ```json
    {
      "type": "tool_confirmation_request",
      "tool_name": "update_calendar_event",
      "tool_params": {
        "summary": "BM15101 会议",
        "new_start_time": "..."
      },
      "message": "我发现您可以将'BM15101 会议'推迟到明天上午10点。需要我为您执行此操作吗？"
    }
    ```
10. **[用户]** 用户在前端点击“确认”按钮。
11. \*\*\*\* ADK 接收到确认后，**恢复 (resume)** `TaskReliefAgent` 的执行。
12. \*\*\*\* `update_calendar_event` 工具被**安全执行**，用户的日历被更新。
13. \*\*\*\* 智能体向用户报告：“操作已完成。您的会议已重新安排。”

## 5\. 示例代码框架 (Python)

以下是使用 ADK 定义 `TaskReliefAgent` 及其安全工具的简化示例：

```python
import google.adk.agents as agents
import google.adk.tools as tools
from my_calendar_api import calendar_service # 您的日历 API 逻辑

# 1. 安装 ADK
# pip install google-adk

# 2. 定义您的自定义工具 (Python 函数)
@tools.tool
def update_calendar_event(event_id: str, new_start_time: str) -> dict:
    """
    更新 Google 日历上的一个现有事件。
    """
    try:
        #... (调用 calendar_service.update(...) 的逻辑)...
        return {"status": "success", "event_id": event_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 3. 定义一个需要“人在回路中”(HITL) 确认的工具
#    这是通过在工具注册时设置 `confirm=True` 来实现的
hitl_safe_update_tool = tools.FunctionTool(
    fn=update_calendar_event,
    confirm=True, # 关键！启用 ADK 的工具确认功能
    confirm_prompt="您确定要更新这个日历事件吗？" # 可选的默认提示
)

# 4. 创建 TaskReliefAgent
#    我们使用 LlmAgent，因为它需要 LLM 的推理能力来决定使用哪个工具
task_relief_agent = agents.LlmAgent(
    tools=[
        hitl_safe_update_tool,
        #... (注册 get_calendar_events, get_asana_tasks 等其他工具)
    ],
    #... (配置您的 LLM, e.g., Gemini)
    instructions="你是一个任务助手，专门通过调用工具来帮用户分担工作。"
)

# 5. (在 Supervisor 中) 调用智能体
#    当 Supervisor 将任务路由到 TaskReliefAgent 时：
#
#    response = await task_relief_agent.invoke(
#        "帮我把下午3点的会议推迟到明天"
#    )
#
#    如果 response.is_tool_confirmation_request():
#        # 将确认请求发送到前端
#        #...
#
#    (等待用户响应后)
#    response = await task_relief_agent.invoke(
#        user_confirmation_response
#    )
```

## 6\. 部署与扩展

ADK 的一个主要优势是其生产就绪性。

  * **容器化：** ADK 智能体可以被轻松容器化（使用 Docker）。
  * **部署：** 您可以将容器化的智能体作为微服务部署到任何地方，例如 Google Cloud Run（用于无服务器自动扩展）或 Vertex AI Agent Engine（用于完全托管的智能体部署和扩展）。

此架构将 SmartStress 从一个原型转变为一个模块化的、可测试的、可扩展的、且最重要的是——**临床安全的**——数字健康平台。