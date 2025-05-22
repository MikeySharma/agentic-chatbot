

import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { weatherTool } from "../tools/weather.tools";
import dotenv from "dotenv";
dotenv.config();

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-openai-api-key";
// Define the tools for the agent to use
const agentTools = [weatherTool];
const agentModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0
});

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();
const agent = createReactAgent({
    llm: agentModel,
    tools: agentTools,
    checkpointSaver: agentCheckpointer,
});

// Helper function to run the agent and print the response
async function runAgent(question: string, threadId: string) {
    const state = await agent.invoke(
        { messages: [new HumanMessage(question)] },
        { configurable: { thread_id: threadId } },
    );

    const response = state.messages[state.messages.length - 1].content;
    console.log(`Q: ${question}`);
    console.log(`A: ${response}\n`);
    return response;
}

// Main execution
export const executeQns = async () => {
    try {
        // First question
        await runAgent("what is the current weather in London?", "42");

        // Follow-up question (using same thread ID for memory)
        // await runAgent("what about New York?", "42");

        // // New question in a different thread
        // await runAgent("what's the weather in Tokyo?", "43");
    } catch (error) {
        console.error("An error occurred:", error);
    }
};