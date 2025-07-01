import { DynamicStructuredTool } from "@langchain/core/tools";
import { tavily } from '@tavily/core';
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import dotenv from "dotenv";
import { NewsArticle } from "../types/news-sentiment.types";
import chatgptRequest from "../config/chatgptRequest";
import { CHATBOT_SYSTEM_PROMPTS } from "../constants/ai.constants";
import { fetchCompanyProfile } from "../service/financial-data.service";
import { extractKeyPoints } from "../service/news-sentiment.service";
dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


export const stockSentimentAnalysisTool = new DynamicStructuredTool({
    name: "stock_sentiment_analysis",
    description: "Returns comprehensive stock sentiment analysis including current position recommendation, price targets, key strengths/weaknesses, news sentiment breakdown, trending themes, and overall financial health assessment.",
    schema: z.object({
        symbol: z.string().describe("The stock ticker symbol (e.g., AAPL, MSFT, TSLA)"),
        userQuery: z.string().describe(`Refined search query including context about the analysis needed. Current date: ${new Date().toISOString()}`)
    }),

    func: async ({ symbol, userQuery }) => {
        try {
            // Validate inputs
            if (!symbol.match(/^[A-Za-z]{1,5}$/)) {
                return "Invalid ticker symbol format (1-5 letters).";
            }
            const [resultsFromTavily, allFinancialData] = await Promise.all([
                fetchFromTavily(userQuery, symbol),
                fetchCompanyProfile(symbol),
            ]);

            if (!resultsFromTavily) {
                return "No data found from searching on web.";
            }

            const keyPoints = resultsFromTavily.map(extractKeyPoints)
            const analyzedSentiment = await analyzeSentiment(allFinancialData, userQuery);


            //save to dump
            saveToDumps({ refinedQuery: userQuery, counts: { total: resultsFromTavily.length }, keyPoints, analyzedSentiment, allFinancialData, resultsFromTavily }, symbol);
            //return the final results
            return JSON.stringify(analyzedSentiment);

        } catch (error) {
            console.error("❌ Stock sentiment analysis failed:", error);
            return "Unable to complete sentiment analysis at this time. Please try again later.";
        }
    },
});

export const fetchFromTavily = async (query: string, symbol: string): Promise<NewsArticle[] | null> => {
    try {
        // 1. Time-bound Query Enhancement
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 3); // Only last 72h news

        const enhancedQuery = `${query} about ${symbol} stock ${dateFilter.toISOString().split('T')[0]}..`;

        // 2. Multi-Parameter Search Configuration
        const response = await tvly.search(enhancedQuery, {
            search_depth: "advanced",
            include_raw_content: false, // Critical for sentiment analysis
            include_images: false,
            max_results: 15, // Increased from 5 for better coverage
            sort: "newest", // Ensures chronological freshness
            filters: {
                max_age: "72h" // Hard freshness cutoff
            }
        });



        // 4. Dynamic Sorting (relevance + freshness)
        return response.results.filter((value) => (value.content.length > 50)).sort((a, b) => (b.score - a.score)).slice(0, 10).map((value) => {
            return ({
                title: value.title,
                publishedDate: value.publishedDate,
                content: value.content,
                score: value.score,
                url: value.url
            })
        }); // Return top 10 most relevant

    } catch (error) {
        console.error('Tavily fetch error:', error);
        // Fallback to cached data if available
        return null;
    }
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveToDumps = async (data: any, symbol: string) => {

    // Create a directory for the dumps if it doesn't exist
    const dumpDir = path.join(process.cwd(), 'tavily_dumps');
    await fs.mkdir(dumpDir, { recursive: true });

    // Create a filename with timestamp and symbol
    const filename = `tavily_${symbol}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(dumpDir, filename);

    // Write the JSON file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const analyzeSentiment = async (data: any, userQuery: string) => {
    try {
        const response = await chatgptRequest({
            messages: [
                {
                    role: "system",
                    content: CHATBOT_SYSTEM_PROMPTS.STOCK_SENTIMENT_ANALYSIS
                },
                {
                    role: "system",
                    content: `REQUEST: Comprehensive Stock Sentiment Analysis

                        OBJECTIVE:
                        Provide a thorough analysis of the stock using structured financial and news data.

                        DATA PROVIDED:
                        Financial Data & news: ${data}

                        INSTRUCTIONS:

                        Analyze and cross-reference the financial data with recent news sentiment.

                        Identify any discrepancies or conflicting signals between the company’s fundamentals and the prevailing market sentiment.

                        Highlight the 2–3 most impactful news events or narratives influencing sentiment.

                        Maintain a neutral, analytical tone while objectively outlining both key risks and potential opportunities based on current inputs.
                    `
                },
                {
                    role: "user",
                    content: userQuery
                }
            ],
            max_tokens: 2000,
            response_format: { type: "json_object" }
        })
        return response;
    } catch (error) {
        console.error('Failed to analyze sentiment of stock', error);
        return 'Failed to analyze sentiment of stock';
    }

}