import { jest } from '@jest/globals';

/**
 * Tests for UsageService.logUsage() with a fully mocked Supabase client.
 */

// Mock the ENTIRE supabase module before importing UsageService
const mockInsert = jest.fn();

jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        from: jest.fn().mockReturnValue({
            insert: mockInsert
        })
    }
}));

describe('UsageService', () => {
    let UsageService: any;

    beforeAll(async () => {
        const mod = await import('../src/services/usage.service.js');
        UsageService = mod.UsageService;
    });

    const validLog = {
        user_id: '550e8400-e29b-41d4-a716-446655440000', // valid UUID
        model_used: 'gpt-4',
        tokens_count: 100,
        api_request_status: 200,
    };

    it('should successfully log usage', async () => {
        mockInsert.mockImplementation(() => Promise.resolve({ data: [{ id: 'log-123' }], error: null }));
        const result = await UsageService.logUsage(validLog);
        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
    });

    it('should throw when Supabase returns an error', async () => {
        mockInsert.mockImplementation(() => Promise.resolve({ data: null, error: { message: 'DB Error' } }));
        await expect(UsageService.logUsage(validLog)).rejects.toThrow('Failed to log usage to database');
    });
});
