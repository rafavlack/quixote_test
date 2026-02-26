import { supabase } from '../config/supabase.js';
import { UsageService } from '../services/usage.service.js';

const TEST_USER_ID = '77ea745d-40ba-4fdb-9194-705096d77ca0';

async function runIntegrationTest() {
    console.log('--- STARTING INTEGRATION TEST ---');

    try {
        // 1. Ensure profile exists for the user
        console.log(`Checking/Creating profile for ${TEST_USER_ID}...`);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: TEST_USER_ID,
                email: 'rafavlack@gmail.com',
                is_active: true
            })
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
            .limit(1);

        if (fetchError || !logs || logs.length === 0) {
            throw new Error('Could not find the logged data in Supabase');
        }

        console.log('Verification: SUCCESS');
        console.log('--- INTEGRATION TEST PASSED ---');

    } catch (error: any) {
        console.error('--- INTEGRATION TEST FAILED ---');
        console.error('Error:', error.message);
    }
}

runIntegrationTest();
