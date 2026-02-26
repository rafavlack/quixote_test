import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { UsageService } from '../services/usage.service.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const promptSchema = z.object({
    message: z.string().min(1),
    model: z.string().optional(),
    userId: z.string().uuid() // In a real app, this would come from Auth middleware
});

router.post('/generate', async (req: Request, res: Response) => {
    try {
        const validatedData = promptSchema.parse(req.body);
        const { message, model, userId } = validatedData;

        // 1. Proxy request to LLM
        const aiResponse = await AIService.prompt(message, model);

        // 2. Log usage to Supabase
        await UsageService.logUsage({
            user_id: userId,
            model_used: aiResponse.model,
            tokens_count: aiResponse.usage.total_tokens,
            api_request_status: 200,
        });

        // 3. Return response to user
        res.json({
            success: true,
            data: aiResponse,
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        });
    }
});

export default router;
