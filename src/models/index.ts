export interface UserProfile {
    id: string;
    email: string;
    stripe_customer_id?: string;
    is_active: boolean;
}

export interface UsageLog {
    id?: string;
    user_id: string;
    model_used: string;
    tokens_count: number;
    api_request_status: number;
    created_at?: string;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: UserProfile;
                Insert: Omit<UserProfile, 'is_active'> & { is_active?: boolean };
                Update: Partial<UserProfile>;
            };
            usage_logs: {
                Row: UsageLog;
                Insert: Omit<UsageLog, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<UsageLog>;
            };
        };
    };
}
