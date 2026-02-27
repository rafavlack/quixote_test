import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export interface AuthRequest extends Request {
    user: {
        id: string;
        email?: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
        };

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};
