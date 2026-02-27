import { Router, Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service.js';
import { UsageService } from '../services/usage.service.js';
import { BillingService } from '../services/billing.service.js';
import { supabase } from '../config/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// Apply auth middleware to all AI routes
router.use(authMiddleware as any);

// Validation schema (userId is no longer needed in body as it comes from Auth)
const promptSchema = z.object({
    message: z.string().min(1),
    model: z.string().optional()
});

/**
 * Endpoint to generate AI response and track usage
 */
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const validatedData = promptSchema.parse(req.body);
        const { message, model } = validatedData;
        const authReq = req as AuthRequest;
        const userId = authReq.user.id; // Guaranteed by authMiddleware
        const userEmail = authReq.user.email || '';

        // 1. Proxy request to LLM
        const aiResponse = await AIService.prompt(message, model);

        // 2. Log usage to Supabase
        await UsageService.logUsage({
            user_id: userId,
            model_used: aiResponse.model,
            tokens_count: aiResponse.usage.total_tokens,
            api_request_status: 200,
        });

        // 3. Auto-provision Stripe customer and report usage (fire-and-forget style, doesn't block response)
        (async () => {
            try {
                let { data: profile } = await supabase
                    .from('profiles')
                    .select('stripe_customer_id')
                    .eq('id', userId)
                    .single<{ stripe_customer_id: string | null }>();

                let stripeCustomerId = profile?.stripe_customer_id ?? null;

                // If no stripe_customer_id, auto-provision one
                if (!stripeCustomerId) {
                    const newCustomerId = await BillingService.ensureCustomerExists(userEmail, userId);
                    if (newCustomerId) {
                        // Persist the new stripe_customer_id back to the profile
                        (supabase
                            .from('profiles') as any)
                            .update({ stripe_customer_id: newCustomerId })
                            .eq('id', userId);
                        stripeCustomerId = newCustomerId;
                    }
                }

                if (stripeCustomerId) {
                    await BillingService.reportUsage(stripeCustomerId, aiResponse.usage.total_tokens);
                }
            } catch (billingError: unknown) {
                if (billingError instanceof Error) {
                    console.error('Async billing error (non-blocking):', billingError.message);
                }
            }
        })();

        // 4. Return response to user
        res.json({
            success: true,
            data: aiResponse,
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors });
        }
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }

    }
});

/**
 * Endpoint to get usage history
 */
router.get('/usage', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0
            }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

/**
 * Endpoint to get current billing info
 */
router.get('/billing', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user.id;

        // 1. Get stripe customer id
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single<{ stripe_customer_id: string }>();

        let stripeBilling = null;
        if (profile?.stripe_customer_id) {
            stripeBilling = await BillingService.getUpcomingInvoice(profile.stripe_customer_id);
        }

        const { data, error } = await supabase
            .from('usage_logs')
            .select('tokens_count')
            .eq('user_id', userId) as { data: any[], error: any };

        if (error) throw error;

        const totalTokens = (data || []).reduce((sum, log) => sum + log.tokens_count, 0);
        const estimatedCost = (totalTokens / 1000) * 0.02;

        res.json({
            success: true,
            data: {
                totalTokens,
                estimatedCostLocal: estimatedCost,
                currency: 'USD',
                stripeBilling: stripeBilling || 'Stripe API not configured or upcoming invoice unavailable'
            }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

export default router;
