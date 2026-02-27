import { supabase } from '../config/supabase.js';
import { UsageLog } from '../models/index.js';

export class UsageService {
    static async logUsage(log: UsageLog) {
        const { data, error } = await supabase
            .from('usage_logs')
            .insert([log] as any);

        if (error) {
            console.error('Error logging usage:', error);
            throw new Error('Failed to log usage to database');
        }

        return data;
    }
}
