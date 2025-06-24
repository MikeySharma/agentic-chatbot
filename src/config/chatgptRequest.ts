import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
type chatgptRequestMessage = {
    role: "user" | "system",
    content: string
}
type ChatGPTRequestParams = {
    model?: string;
    messages: chatgptRequestMessage[];
    temperature?: number;
    max_tokens?: number;
} & Partial<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming>;

const chatgptRequest = async ({
    model = "gpt-4o-mini",
    messages,
    temperature = 0.7,
    max_tokens = 500,
    ...others
}: ChatGPTRequestParams): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model,
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            temperature,
            max_tokens,
            ...others
        });

        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error("Error in ChatGPT request:", error);
        throw new Error("ChatGPT request failed");
    }
};

export default chatgptRequest;
