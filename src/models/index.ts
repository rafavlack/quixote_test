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
