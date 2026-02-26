import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getToken() {
    const email = `test_user_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Creating user: ${email}...`);

    // 1. Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('Error signing up:', signUpError.message);
        return;
    }

    console.log('User created successfully!');

    // 2. Sign In to get the token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.error('Error signing in:', signInError.message);
        return;
    }

    console.log('\n--- TEST CREDENTIALS ---');
    console.log('User ID:', signInData.user?.id);
    console.log('Access Token (JWT):');
    console.log(signInData.session?.access_token);
    console.log('------------------------\n');
}

getToken();
