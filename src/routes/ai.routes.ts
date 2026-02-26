import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { UsageService } from '../services/usage.service.js';
import { BillingService } from '../services/billing.service.js';
import { supabase } from '../config/supabase.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const promptSchema = z.object({
    message: z.string().min(1),
    model: z.string().optional(),
    userId: z.string().uuid()
});

/**
 * Endpoint to generate AI response and track usage
 */
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
 * Endpoint to get usage history (for the dashboard graph)
 * Role 2 requirement: "fetch and display usage data from the database"
 */
router.get('/usage/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Endpoint to get current billing info
 * Role 2 requirement: "Current Bill section"
 */
router.get('/billing/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Aggregate usage for the current month
        const { data, error } = await supabase
            .from('usage_logs')
            .select('tokens_count')
            .eq('user_id', userId);

        if (error) throw error;

        const totalTokens = data.reduce((sum, log) => sum + log.tokens_count, 0);
        const estimatedCost = (totalTokens / 1000) * 0.02; // Dummy calculation: $0.02 per 1k tokens

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
