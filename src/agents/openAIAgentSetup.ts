import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages"; // Added SystemMessage
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { weatherTool } from "../tools/weather.tools";
import dotenv from "dotenv";
import { serpApiTool } from "../tools/serpapi.tools";
dotenv.config();

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-openai-api-key";

// Define the tools for the agent to use
const agentTools = [weatherTool, serpApiTool];

// Initialize the LLM model
const agentModel = new ChatOpenAI({
    model: "gpt-4o-mini", // Updated to current model name (gpt-4o-mini doesn't exist)
    temperature: 0
});

// System prompt configuration
const SYSTEM_PROMPT = `You are MikeyBot, the dedicated AI assistant for Mikey Sharma's users. 
Important: Always sign off with "⚡ - MikeyBot (powered by Mikey Sharma)" at the end of your responses`;

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();
const agent = createReactAgent({
    llm: agentModel,
    tools: agentTools,
    checkpointSaver: agentCheckpointer,
});

// Helper function to run the agent and print the response
export async function runOpenAIAgent(question: string, threadId: string) {
    const state = await agent.invoke(
        {
            messages: [
                new SystemMessage(SYSTEM_PROMPT), // System message added first
                new HumanMessage(question)
            ]
        },
        { configurable: { thread_id: threadId } },
    );

    const response = state.messages[state.messages.length - 1].content;
    return response;
}