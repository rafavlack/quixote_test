import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

/**
 * Tests for auth middleware behaviour (unit-level via supertest).
 * We create a minimal express app that applies authMiddleware to a test route.
 */

// --- Mock Supabase auth ---
const mockGetUser = jest.fn();

jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        auth: {
            getUser: mockGetUser
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
    }
}));

describe('Auth Middleware', () => {
    let authMiddleware: any;
    let app: express.Express;

    beforeAll(async () => {
        const mod = await import('../src/middleware/auth.middleware.js');
        authMiddleware = mod.authMiddleware;
    });

    function buildApp() {
        const a = express();
        a.use(express.json());
        a.get('/protected', authMiddleware, (_req: express.Request, res: express.Response) => {
            res.json({ success: true, message: 'Authenticated' });
        });
        return a;
    }

    beforeEach(() => {
        jest.clearAllMocks();
        app = buildApp();
    });

    it('should return 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/protected');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 when token is invalid', async () => {
        (mockGetUser as any).mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } });
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer bad-token');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should call next() and attach user when token is valid', async () => {
        (mockGetUser as any).mockResolvedValue({
            data: { user: { id: 'user-abc', email: 'test@test.com' } },
            error: null
        });
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer valid-token');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
