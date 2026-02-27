import { AIService } from '../src/services/ai.service.js';

describe('AIService', () => {
    it('should reject non-allowed models', async () => {
        await expect(AIService.prompt('hello', 'unsupported-model/123')).rejects.toThrow('Model unsupported-model/123 is not allowed.');
    });

    it('should pass validation for allowed models (no allow-list error)', async () => {
        // 'liquid/lfm-2.5-1.2b-instruct:free' is in the allow-list.
        // It may throw a network/API key error, but NOT an allow-list error.
        try {
            await AIService.prompt('hello', 'liquid/lfm-2.5-1.2b-instruct:free');
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).not.toContain('is not allowed');
        }
    });

    it('ALLOWED_MODELS should include the default model', () => {
        expect(AIService.ALLOWED_MODELS).toContain('liquid/lfm-2.5-1.2b-instruct:free');
    });
});
