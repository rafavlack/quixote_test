import { supabase } from '../config/supabase.js';

const TEST_USER_ID = process.env.TEST_USER_ID || '';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || '';

async function runDetailedTest() {
    if (!TEST_USER_ID || !TEST_USER_EMAIL) {
        throw new Error('TEST_USER_ID and TEST_USER_EMAIL required in environment');
    }
    console.log('--- STARTING DETAILED SUPABASE TEST ---');

    // 1. Check Profile
    console.log('1. Upserting profile...');
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .upsert({ id: TEST_USER_ID, email: TEST_USER_EMAIL } as any)
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
        }] as any)
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
