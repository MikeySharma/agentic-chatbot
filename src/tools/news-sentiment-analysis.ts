import { DynamicStructuredTool } from "@langchain/core/tools";
import { tavily } from '@tavily/core';
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import dotenv from "dotenv";
import { NewsArticle } from "../types/news-sentiment.types";
import chatgptRequest from "../config/chatgptRequest";
import { CHATBOT_SYSTEM_PROMPTS } from "../constants/ai.constants";
import { fetchAllFinancialData } from "../service/financial-data.service";
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
                fetchFromTavily(userQuery),
                fetchAllFinancialData(symbol)
            ]);

            if (!resultsFromTavily) {
                return "No data found from searching on web.";
            }

            const filteredResults = await sortAndRemoveDuplicate(resultsFromTavily);

            const analyzedSentiment = await analyzeSentiment(allFinancialData, filteredResults, userQuery);


            //save to dump
            saveToDumps({ refinedQuery: userQuery, counts: { filtered: filteredResults.length, total: resultsFromTavily.length }, analyzedSentiment, allFinancialData, filteredResults, resultsFromTavily }, symbol);
            //return the final results
            return JSON.stringify(analyzedSentiment);

        } catch (error) {
            console.error("❌ Stock sentiment analysis failed:", error);
            return "Unable to complete sentiment analysis at this time. Please try again later.";
        }
    },
});


export const fetchFromTavily = async (query: string): Promise<NewsArticle[] | null> => {
    try {

        const response = await tvly.search(query, {
            searchDepth: "advanced",
            includeRawContent: false,
            includeImages: false,
            maxResults: 5
        })
        const data = response.results.map(result => ({
            title: result.title,
            rawContent: result.rawContent,
            text: result.content,
            publishedDate: result.publishedDate,
            url: result.url,
            score: result.score
        }));
        return data;
    } catch (error) {
        console.error('Error', error);
        return null;
    }
}


export const sortAndRemoveDuplicate = async (allResults: NewsArticle[]) => {
    try {
        if (!Array.isArray(allResults)) {
            console.error('Invalid input: expected an array');
            return [];
        }

        // First, remove exact URL duplicates
        const urlSeen = new Set<string>();
        const uniqueArticles = allResults.filter(article => {
            if (urlSeen.has(article.url)) {
                return false;
            }
            urlSeen.add(article.url);
            return true;
        });

        //second, remove those search results which doesn't have enough data or rawContent
        // const filteredArticles = uniqueArticles.filter(article => article.rawContent !== null);

        // Finally, sort by score (descending)
        return uniqueArticles.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error in sortAndRemoveDuplicate:', error);
        return allResults; // Return original if error occurs
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
export const analyzeSentiment = async (currentFinancialData: any, news: any, userQuery: string) => {
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

                        Financial & Stock Latest Data: ${currentFinancialData}

                        Recent News & Sentiment: ${news}

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