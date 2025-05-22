import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { config } from "dotenv";
config(); // Load environment variables from .env file


// Configuration - get your API key from https://serpapi.com/
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY || "your_api_key_here";
const BASE_URL = "https://serpapi.com/search";

export const serpApiTool = new DynamicStructuredTool({
    name: "google_search",
    description: "Perform a Google search and retrieve results. Useful for finding current information, news, or websites about a topic.",
    schema: z.object({
        query: z.string().describe("The search query to look up on Google"),
        num_results: z.number().optional().default(5).describe("Number of results to return (1-20)"),
        recent: z.boolean().optional().default(false).describe("Whether to prioritize recent results")
    }),
    func: async ({ query, num_results = 3, recent = false }) => {
        try {
            // Validate num_results
            const limit = Math.min(Math.max(num_results, 1), 20);

            // Make API call to SERP API
            const response = await axios.get(BASE_URL, {
                params: {
                    q: query,
                    api_key: SERPAPI_API_KEY,
                    num: limit,
                    ...(recent ? { tbs: "qdr:d" } : {}) // 'qdr:d' means last day if recent=true
                }
            });

            const searchData = response.data;

            // Process the results
            let output = `Google search results for "${query}":\n\n`;

            if (searchData.organic_results && searchData.organic_results.length > 0) {
                searchData.organic_results.slice(0, limit).forEach((result: { title: string, link: string, snippet: string }, index: number) => {
                    output += `${index + 1}. ${result.title}\n`;
                    output += `   ${result.link}\n`;
                    if (result.snippet) {
                        output += `   ${result.snippet}\n`;
                    }
                    output += "\n";
                });
            } else {
                output += "No results found for this query.";
            }

            return output;

        } catch (error) {
            console.error("Error fetching search results:", error);
            return "Unable to fetch search results at the moment. Please try again later.";
        }
    },
});