import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { CHATBOT_SYSTEM_PROMPTS } from "../constants/ai.constants";
import { stockSentimentAnalysisTool } from "../tools/news-sentiment-analysis";

// Load environment variables
dotenv.config();
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-openai-api-key";

// 🔧 Define tools the agent can use
const agentTools = [stockSentimentAnalysisTool];

// 💬 Initialize the LLM model
const agentModel = new ChatOpenAI({
  model: "gpt-4o-mini",  // Recommended model (update as needed)
  temperature: 0,   // Low temperature for deterministic responses
});


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
  try {
    const state = await agent.invoke(
      {
        messages: [
          new SystemMessage(CHATBOT_SYSTEM_PROMPTS.GENERAL_ASSISTANT), // Sets system context
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
  } catch (error) {
    console.error("Error running agent:", error);
    throw error;
  }
}
