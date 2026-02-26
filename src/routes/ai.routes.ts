import { Router, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { UsageService } from '../services/usage.service.js';
import { BillingService } from '../services/billing.service.js';
import { supabase } from '../config/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// Apply auth middleware to all AI routes
router.use(authMiddleware);

// Validation schema (userId is no longer needed in body as it comes from Auth)
const promptSchema = z.object({
    message: z.string().min(1),
    model: z.string().optional()
});

/**
 * Endpoint to generate AI response and track usage
 */
router.post('/generate', async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = promptSchema.parse(req.body);
        const { message, model } = validatedData;
        const userId = req.user!.id; // Guaranteed by authMiddleware

        // 1. Proxy request to LLM
        const aiResponse = await AIService.prompt(message, model);

        // 2. Log usage to Supabase
        await UsageService.logUsage({
            user_id: userId,
            model_used: aiResponse.model,
            tokens_count: aiResponse.usage.total_tokens,
            api_request_status: 200,
        });

        // 3. Report usage to Stripe (Billing)
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (profile?.stripe_customer_id) {
            await BillingService.reportUsage(profile.stripe_customer_id, aiResponse.usage.total_tokens);
        }

        // 4. Return response to user
        res.json({
            success: true,
            data: aiResponse,
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Endpoint to get usage history
 */
router.get('/usage', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const { data, error } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Endpoint to get current billing info
 */
router.get('/billing', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const { data, error } = await supabase
            .from('usage_logs')
            .select('tokens_count')
            .eq('user_id', userId);

        if (error) throw error;

        const totalTokens = data.reduce((sum, log) => sum + log.tokens_count, 0);
        const estimatedCost = (totalTokens / 1000) * 0.02;

        res.json({
            success: true,
            data: {
                totalTokens,
                estimatedCost,
                currency: 'USD'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
