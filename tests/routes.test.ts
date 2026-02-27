import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

/**
 * Tests for the Zod validation layer on POST /api/generate
 * and pagination on GET /api/usage.
 */

// --- Mock Supabase ---
jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        auth: {
            getUser: jest.fn().mockImplementation(() => Promise.resolve({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            }))
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation(() => Promise.resolve({ data: [], error: null, count: 0 })),
        single: jest.fn().mockImplementation(() => Promise.resolve({ data: { stripe_customer_id: null }, error: null })),
    }
}));

// --- Mock AIService ---
jest.unstable_mockModule('../src/services/ai.service.js', () => ({
    AIService: {
        ALLOWED_MODELS: ['liquid/lfm-2.5-1.2b-instruct:free'],
        prompt: jest.fn().mockImplementation(() => Promise.resolve({
            content: 'Hello',
            model: 'liquid/lfm-2.5-1.2b-instruct:free',
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        }))
    }
}));

// --- Mock BillingService ---
jest.unstable_mockModule('../src/services/billing.service.js', () => ({
    BillingService: {
        ensureCustomerExists: jest.fn().mockImplementation(() => Promise.resolve(null)),
        reportUsage: jest.fn().mockImplementation(() => Promise.resolve({ success: false, reason: 'No active subscription' }))
    }
}));

// --- Mock UsageService ---
jest.unstable_mockModule('../src/services/usage.service.js', () => ({
    UsageService: {
        logUsage: jest.fn().mockImplementation(() => Promise.resolve(null))
    }
}));

describe('Routes', () => {
    let aiRoutes: express.Router;
    let app: express.Express;

    beforeAll(async () => {
        const mod = await import('../src/routes/ai.routes.js');
        aiRoutes = mod.default;
    });

    function buildApp() {
        const a = express();
        a.use(express.json());
        a.use('/api', aiRoutes);
        return a;
    }

    beforeEach(() => {
        app = buildApp();
    });

    describe('POST /api/generate - Zod Validation', () => {
        it('should return 400 when message is missing', async () => {
            const res = await request(app)
                .post('/api/generate')
                .set('Authorization', 'Bearer valid-token')
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when message is empty string', async () => {
            const res = await request(app)
                .post('/api/generate')
                .set('Authorization', 'Bearer valid-token')
                .send({ message: '' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 200 with valid message', async () => {
            const res = await request(app)
                .post('/api/generate')
                .set('Authorization', 'Bearer valid-token')
                .send({ message: 'Hello world' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/usage - Pagination', () => {
        it('should return pagination metadata', async () => {
            const res = await request(app)
                .get('/api/usage?page=1&limit=10')
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(200);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
        });
    });
});
