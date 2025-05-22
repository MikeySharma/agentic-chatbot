import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Define a simple weather tool
export const weatherTool = new DynamicStructuredTool({
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    schema: z.object({
        location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    }),
    func: async ({ location }) => {
        // In a real implementation, you would call a weather API here
        // For this example, we'll return mock data
        const mockWeatherData: Record<string, string> = {
            "san francisco": "Sunny, 72°F",
            "new york": "Cloudy, 65°F",
            "london, uk": "Rainy, 58°F",
            "tokyo": "Clear, 75°F",
        };

        const normalizedLocation = location.toLowerCase();
        console.log(`Fetching weather for: ${normalizedLocation}`);
        const weather = mockWeatherData[normalizedLocation] ||
            "Weather information not available for this location";

        return `The current weather in ${location} is ${weather}`;
    },
});
