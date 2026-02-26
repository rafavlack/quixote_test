import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FIXED_EMAIL = 'test@quixote.com';
const FIXED_PASSWORD = 'Password123!';

async function getAuth() {
    console.log(`Attempting login for: ${FIXED_EMAIL}...`);

    // 1. Intentar iniciar sesión
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: FIXED_EMAIL,
        password: FIXED_PASSWORD,
    });

    // 2. Si el usuario no existe, crearlo
    if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
            console.log('User not found. Creating fixed test user...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: FIXED_EMAIL,
                password: FIXED_PASSWORD,
            });

            if (signUpError) {
                console.error('Error creating user:', signUpError.message);
                return;
            }

            console.log('User created! Logging in...');
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: FIXED_EMAIL,
                password: FIXED_PASSWORD,
            });

            if (retryError) {
                console.error('Login failed after signup:', retryError.message);
                return;
            }
            signInData = retryData;
        } else {
            console.error('Error during sign in:', signInError.message);
            return;
        }
    }

    console.log('\n✅ AUTHENTICATION SUCCESSFUL');
    console.log('--------------------------------------------------');
    console.log('Email:', FIXED_EMAIL);
    console.log('User ID:', signInData.user?.id);
    console.log('\nACCESS TOKEN (JWT) - Copy this for Postman:');
    console.log(signInData.session?.access_token);
    console.log('--------------------------------------------------\n');
}

getAuth();
