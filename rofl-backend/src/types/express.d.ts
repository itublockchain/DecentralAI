import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                sub: string;
                email: string;
                name?: string;
                profile_photo_url?: string;
                verified_credentials: any[];
                walletAddress: string;
                [key: string]: any;
            };
        }
    }
}