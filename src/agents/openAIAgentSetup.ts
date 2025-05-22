import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { weatherTool } from "../tools/weather.tools";
import { serpApiTool } from "../tools/serpapi.tools";

// Load environment variables
dotenv.config();
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-openai-api-key";

// 🔧 Define tools the agent can use
const agentTools = [weatherTool, serpApiTool];

// 💬 Initialize the LLM model
const agentModel = new ChatOpenAI({
  model: "gpt-4o-mini",  // Recommended model (update as needed)
  temperature: 0,   // Low temperature for deterministic responses
});

// 🧠 System prompt to define behavior and tone
const SYSTEM_PROMPT = `You are MikeyBot, the dedicated AI assistant for Mikey Sharma's users. 
Important: Always sign off with "⚡ - MikeyBot (powered by Mikey Sharma)" at the end of your responses.`;

// 🧾 Memory management to preserve context across sessions
const agentCheckpointer = new MemorySaver();

// 🧠 Create the reactive agent
const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentCheckpointer,
});

// 🚀 Function to run the agent
export async function runOpenAIAgent(question: string, threadId: string) {
  const state = await agent.invoke(
    {
      messages: [
        new SystemMessage(SYSTEM_PROMPT), // Sets system context
        new HumanMessage(question),       // User input
      ],
    },
    {
      configurable: { thread_id: threadId }, // Thread-specific memory
    }
  );

  // Get the assistant's reply
  const response = state.messages[state.messages.length - 1].content;
  return response;
}
