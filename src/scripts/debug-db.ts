import { supabase } from '../config/supabase.js';

const TEST_USER_ID = '77ea745d-40ba-4fdb-9194-705096d77ca0';

async function runDetailedTest() {
    console.log('--- STARTING DETAILED SUPABASE TEST ---');

    // 1. Check Profile
    console.log('1. Upserting profile...');
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .upsert({ id: TEST_USER_ID, email: 'rafavlack@gmail.com' })
        .select();

    if (pError) console.error('Profile Error:', pError);
    else console.log('Profile Success:', profile);

    // 2. Insert Log
    console.log('2. Inserting usage log...');
    const { data: log, error: lError } = await supabase
        .from('usage_logs')
        .insert([{
            user_id: TEST_USER_ID,
            model_used: 'test-model',
            tokens_count: 100,
            api_request_status: 200
        }])
        .select();

    if (lError) console.error('Log Error:', lError);
    else console.log('Log Success:', log);

    // 3. Final Fetch
    console.log('3. Verifying with select...');
    const { data: final, error: fError } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', TEST_USER_ID);

    console.log('Final Data in DB:', final);
}

runDetailedTest();
