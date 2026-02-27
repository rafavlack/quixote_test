import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../models/index.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from .env file');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
