import express, { Request, Response } from 'express';
import { runOpenAIAgent } from '../agents/openAIAgentSetup';

const router = express.Router();

// Health check or base route
router.get('/', (_req: Request, res: Response) => {
    res.send('Chatbot API is working!');
});

// Handle chatbot questions via POST
router.post('/', async (req: Request, res: Response) => {
    const { question, threadId } = req.body;

    // Input validation
    if (!question || !threadId) {
        res.status(400).json({
            error: 'Question and threadId are required.',
        });
        return;
    }

    try {
        // Get response from the OpenAI agent
        const response = await runOpenAIAgent(question, threadId);
        res.json({ response });
    } catch (error) {
        console.error('Error running agent:', error);
        res.status(500).json({
            error: 'An error occurred while processing your request.',
        });
    }
});

export default router;
