import { NewsArticle } from "../types/news-sentiment.types";


// Lightweight extractor using regex and heuristics
export const extractKeyPoints = (article: NewsArticle) => {
    const points: string[] = [];

    // 1. Price and Targets
    const priceMatch = article.content.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatch) points.push(`Price: ${priceMatch[0]}`);

    // 2. Analyst Ratings (Buy/Hold/Sell counts)
    const ratingsMatch = article.content.match(/(\d+)\s*(Buy|Hold|Sell)/gi);
    if (ratingsMatch) points.push(`Analysts: ${ratingsMatch.join(', ')}`);

    // 3. Bullish/Bearish Indicators
    const bullish = ["growth", "buy", "strong", "upside"].filter(t =>
        article.content.toLowerCase().includes(t));
    const bearish = ["sell", "risk", "miss", "concern"].filter(t =>
        article.content.toLowerCase().includes(t));

    if (bullish.length) points.push(`Bullish: ${bullish.join(', ')}`);
    if (bearish.length) points.push(`Bearish: ${bearish.join(', ')}`);

    return points.slice(0, 5); // Keep only top 5 points
};

