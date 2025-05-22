import express, { Request, Response } from 'express';
import { runOpenAIAgent } from '../agents/openAIAgentSetup';
const router = express.Router();


router.get('/', (req, res) => {
    res.send('Chatbot API is working!');
});


router.post('/', async (req: Request, res: Response) => {
    const { question, threadId } = req.body;

    // Validate input
    if (!question || !threadId) {
        res.status(400).json({ error: 'Question and threadId are required.' });
        return;
    }

    try {
        // Call the agent function to get the response
        const response = await runOpenAIAgent(question, threadId);
        res.json({ response });
    } catch (error) {
        console.error('Error running agent:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
export default router;