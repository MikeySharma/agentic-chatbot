export interface NewsArticle {
    title: string;
    rawContent: string | undefined;
    text: string;
    publishedDate: string;
    url: string;
    score: number;
}