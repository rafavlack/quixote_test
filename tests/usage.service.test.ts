import { jest } from '@jest/globals';
import { UsageService } from '../src/services/usage.service.js';

// Mock the Supabase client
jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null } as never),
    },
}));

describe('UsageService', () => {
    it('should successfully log usage', async () => {
        const logData = {
            user_id: 'user-123',
            model_used: 'gpt-4',
            tokens_count: 100,
            api_request_status: 200,
        };

        const result = await UsageService.logUsage(logData);

        expect(result).toBeDefined();
        expect(result).toEqual({ id: '123' });
    });

    it('should throw an error if logging fails', async () => {
        const { supabase } = await import('../src/config/supabase.js');
        (supabase.from('usage_logs').insert as any).mockResolvedValueOnce({
            data: null,
            error: { message: 'DB Error' }
        });

        await expect(UsageService.logUsage({} as any)).rejects.toThrow('Failed to log usage to database');
    });
});
