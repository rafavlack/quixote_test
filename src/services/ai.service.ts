import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface AIResponse {
    content: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class AIService {
    static ALLOWED_MODELS = [
        'google/gemini-2.0-flash-lite-preview-02-05:free',
        'google/gemini-2.5-pro',
        'openai/gpt-3.5-turbo',
        'openai/gpt-4',
        'anthropic/claude-3-haiku',
        'liquid/lfm-2.5-1.2b-instruct:free'
    ];

    static async prompt(message: string, model: string = 'liquid/lfm-2.5-1.2b-instruct:free'): Promise<AIResponse> {
        try {
            if (!OPENROUTER_API_KEY) {
                throw new Error('OPENROUTER_API_KEY is missing');
            }

            if (!this.ALLOWED_MODELS.includes(model)) {
                throw new Error(`Model ${model} is not allowed.`);
            }

            const response = await axios.post(
                OPENROUTER_URL,
                {
                    model: model,
                    messages: [{ role: 'user', content: message }],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://github.com/rafavlack/quixote_test', // Optional for OpenRouter
                        'X-Title': 'Quixote AI Wrapper', // Optional for OpenRouter
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;

            return {
                content: data.choices[0].message.content,
                model: data.model,
                usage: {
                    prompt_tokens: data.usage.prompt_tokens,
                    completion_tokens: data.usage.completion_tokens,
                    total_tokens: data.usage.total_tokens,
                },
            };
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('Error in AIService:', error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error('Error in AIService:', error.message);
                throw error; // Rethrow allowlist or API key missing
            }
            throw new Error('Failed to fetch from LLM');
        }
    }
}
