import { supabase } from '../config/supabase.js';
import { UsageService } from '../services/usage.service.js';

const TEST_USER_ID = process.env.TEST_USER_ID || '';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || '';

async function runIntegrationTest() {
    if (!TEST_USER_ID || !TEST_USER_EMAIL) {
        throw new Error('TEST_USER_ID and TEST_USER_EMAIL required in environment');
    }
    console.log('--- STARTING INTEGRATION TEST ---');

    try {
        // 1. Ensure profile exists for the user
        console.log(`Checking/Creating profile for ${TEST_USER_ID}...`);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: TEST_USER_ID,
                email: TEST_USER_EMAIL,
                is_active: true
            } as any)
            .select();

        if (profileError) {
            console.error('Error with profiles table:', profileError.message);
            console.log('TIP: Have you run the SQL migration I provided to create the "profiles" table?');
        } else {
            console.log('Profile integration: OK');
        }

        // 2. Test Usage Logging
        console.log('Testing usage logging...');
        const logData = {
            user_id: TEST_USER_ID,
            model_used: 'test-model-123',
            tokens_count: 500,
            api_request_status: 200,
        };

        const result = await UsageService.logUsage(logData);
        console.log('Usage log integration: OK');

        // 3. Verify data was saved
        console.log('Verifying data in Supabase...');
        const { data: logs, error: fetchError } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .limit(1) as { data: any[], error: any };

        if (fetchError || !logs || logs.length === 0) {
            throw new Error('Could not find the logged data in Supabase');
        }

        console.log('Verification: SUCCESS');
        console.log('--- INTEGRATION TEST PASSED ---');

    } catch (error: unknown) {
        console.error('--- INTEGRATION TEST FAILED ---');
        if (error instanceof Error) {
            console.error('Error:', error.message);
        }
    }
}

runIntegrationTest();
