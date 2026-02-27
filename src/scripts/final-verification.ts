import { supabase } from '../config/supabase.js';

const TEST_USER_ID = process.env.TEST_USER_ID || '';

async function verifyFinalData() {
    if (!TEST_USER_ID) {
        throw new Error('TEST_USER_ID required in environment');
    }
    console.log('--- FINAL DATA VERIFICATION ---');

    try {
        // 1. Check Profile
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', TEST_USER_ID)
            .single() as { data: any, error: any };

        if (pError) {
            console.log('Profile fetch error (this is normal if RLS is strict):', pError.message);
        } else {
            console.log('✓ Profile found:', profile?.email);
        }

        // 2. Check Usage Logs
        const { data: logs, error: lError } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', TEST_USER_ID) as { data: any[], error: any };

        if (lError) {
            console.log('Logs fetch error (this is normal if RLS is strict):', lError.message);
        } else {
            console.log(`✓ Usage logs found: ${logs?.length || 0} entries`);

            // Calculate totals like the API would
            const totalTokens = logs?.reduce((sum, log) => sum + log.tokens_count, 0) || 0;
            const estimatedCost = (totalTokens / 1000) * 0.02;

            console.log('--- ANALYSIS ---');
            console.log('Total Tokens:', totalTokens);
            console.log('Estimated Cost:', `$${estimatedCost.toFixed(2)} USD`);
            console.log('----------------');
        }

        if ((logs?.length || 0) > 0) {
            console.log('SUCCESS: The backend can see the data. The Dashboard is ready to be powered by these endpoints.');
        } else {
            console.log('NOTE: If you see 0 entries, it might be due to Row Level Security (RLS). Ensure "Enable read for everyone" or a similar policy is active for debugging.');
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Test error:', error.message);
        }
    }
}

verifyFinalData();
