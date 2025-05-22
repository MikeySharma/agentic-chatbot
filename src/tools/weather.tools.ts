import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { config } from "dotenv";
config();

// Configuration - you'll need to get an API key from OpenWeatherMap
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "your_api_key_here";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export const weatherTool = new DynamicStructuredTool({
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    schema: z.object({
        location: z.string().describe("The city and state/country, e.g. San Francisco, CA or London, UK"),
    }),
    func: async ({ location }) => {
        try {
            // Make API call to OpenWeatherMap
            const response = await axios.get(BASE_URL, {
                params: {
                    q: location,
                    appid: OPENWEATHER_API_KEY,
                    units: "imperial" // Use "metric" for Celsius
                }
            });

            const weatherData = response.data;

            // Extract relevant information
            const city = weatherData.name;
            const country = weatherData.sys?.country || "";
            const temp = Math.round(weatherData.main.temp);
            const description = weatherData.weather[0].description;
            const humidity = weatherData.main.humidity;
            const windSpeed = Math.round(weatherData.wind.speed);

            return `Current weather in ${city}, ${country}:
- Temperature: ${temp}°F
- Conditions: ${description}
- Humidity: ${humidity}%
- Wind: ${windSpeed} mph`;

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return `Could not find weather data for location: ${location}. Please check the spelling or try a nearby city.`;
            }
            console.error("Error fetching weather data:", error);
            return "Unable to fetch weather data at the moment. Please try again later.";
        }
    },
});