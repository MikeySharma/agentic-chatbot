import { DynamicStructuredTool } from "@langchain/core/tools";
import { tavily } from '@tavily/core';
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import dotenv from "dotenv";
import chatgptRequest from "../config/chatgptRequest";
import { NewsArticle } from "../types/news-sentiment.types";
dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


export const stockSentimentAnalysisTool = new DynamicStructuredTool({
    name: "stock_sentiment_analysis",
    description: "Returns comprehensive stock sentiment analysis including current position recommendation, price targets, key strengths/weaknesses, news sentiment breakdown, trending themes, and overall financial health assessment.",
    schema: z.object({
        symbol: z.string().describe("The stock ticker symbol (e.g., AAPL, MSFT, TSLA)"),
        userQuery: z.string().describe("The user's original query about the stock")
    }),

    func: async ({ symbol, userQuery }) => {
        try {
            // Validate inputs
            if (!symbol.match(/^[A-Za-z]{1,5}$/)) {
                return "Invalid ticker symbol format (1-5 letters).";
            }
            // Generate multiple related queries combining the symbol and user's query
            const relatedQueries = await generateRelatedQueries(symbol, userQuery);

            // Fetch results for all queries in parallel
            const allResultsArrays = await Promise.all(
                relatedQueries.map(query => fetchFromTavily(query))
            );
            const allResults = allResultsArrays
                .filter((results): results is NewsArticle[] => results !== null)
                .flat();

            const filteredResults = await sortAndRemoveDuplicate(allResults);

            // Create a directory for the dumps if it doesn't exist
            const dumpDir = path.join(process.cwd(), 'tavily_dumps');
            await fs.mkdir(dumpDir, { recursive: true });

            // Create a filename with timestamp and symbol
            const filename = `tavily_${symbol}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filePath = path.join(dumpDir, filename);

            // Write the JSON file
            await fs.writeFile(filePath, JSON.stringify({ relatedQueries, counts: { filtered: filteredResults.length, total: allResults.length }, filteredResults, allResults }, null, 2));

            //return the final results
            return JSON.stringify(filteredResults);

        } catch (error) {
            console.error("❌ Stock sentiment analysis failed:", error);
            return "Unable to complete sentiment analysis at this time. Please try again later.";
        }
    },
});

// Generate multiple related queries combining symbol and user's query
async function generateRelatedQueries(symbol: string, userQuery: string): Promise<string[]> {

    const response = await chatgptRequest({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that creates effective search engine queries for financial sentiment analysis. Your goal is to help users discover useful news articles based on their interest."
            },
            {
                role: "user",
                content: `Given the user's input: "${userQuery}", user current Date and Time with exact date in query "${new Date()}", generate multiple (max 3) varied and highly relevant search queries that would help find recent news articles for financial or market sentiment analysis. Focus on diversity and relevance. Return ONLY a JSON array of query strings.  Answer Format: {"queries" : ["", "",...]}`
            }
        ],
        temperature: 0.8,
        max_tokens: 200,
        frequency_penalty: 0.5,
        response_format: { type: "json_object" }
    });


    try {
        const queries = JSON.parse(response).queries;
        return Array.isArray(queries) ? queries : getFallbackQueries(symbol, userQuery);
    } catch {
        return getFallbackQueries(symbol, userQuery);
    }
}

function getFallbackQueries(symbol: string, userQuery: string): string[] {
    return [
        `${symbol} ${userQuery}`,
        `${symbol} stock ${userQuery}`,
        `${symbol} company ${userQuery}`
    ];
}

export const fetchFromTavily = async (query: string): Promise<NewsArticle[] | null> => {
    try {

        const response = await tvly.search(query, {
            searchDepth: "advanced",
            includeRawContent: "text",
            includeImages: false,
            maxResults: 3
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
        const filteredArticles = uniqueArticles.filter(article => article.rawContent !== undefined);

        // Finally, sort by score (descending)
        return filteredArticles.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error in sortAndRemoveDuplicate:', error);
        return allResults; // Return original if error occurs
    }
};