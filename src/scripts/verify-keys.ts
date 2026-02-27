import axios from 'axios';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env correctamente al ejecutarse con tsx desde la raiz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;

async function verifyKeys() {
    console.log('--- API KEYS VERIFICATION ---');

    console.log('\n1. Verifying OpenRouter API Key...');
    if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY is missing');
    } else {
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'liquid/lfm-2.5-1.2b-instruct:free',
                    messages: [{ role: 'user', content: 'Say strictly "Hello"' }],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                console.log('✅ OpenRouter Verification Passed! Model responded:', response.data.choices[0].message.content);
            } else {
                console.error('⚠️ OpenRouter Responded, but structure was unexpected:', response.data);
            }
        } catch (error: any) {
            console.error('❌ OpenRouter Verification Failed:', error.response?.data || error.message);
        }
    }

    console.log('\n2. Verifying Stripe API Key...');
    if (!STRIPE_API_KEY) {
        console.error('❌ STRIPE_API_KEY is missing');
    } else if (STRIPE_API_KEY.startsWith('pk_')) {
        console.error('❌ STRIPE_API_KEY is a Publishable Key (starts with pk_). You need a Secret Key (starts with sk_).');
    } else {
        try {
            const stripe = new Stripe(STRIPE_API_KEY);
            // Hacer un listado simple de clientes o productos para verificar auth
            const customers = await stripe.customers.list({ limit: 1 });
            console.log('✅ Stripe Verification Passed! Successfully authenticated. Customer count in page:', customers.data.length);
        } catch (error: any) {
            console.error('❌ Stripe Verification Failed:', error.message);
        }
    }

    console.log('\n--- VERIFICATION FINISHED ---');
}

verifyKeys();
