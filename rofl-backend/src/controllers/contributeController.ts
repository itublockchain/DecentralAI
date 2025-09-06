import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const contribute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
        }

        logger.info('Contribute request received', {
            walletAddress: user.walletAddress,
            email: user.email,
            sub: user.sub
        });

        res.status(200).json({
            message: 'Contribution received successfully',
            user: {
                walletAddress: user.walletAddress,
                email: user.email,
                name: user.name,
                sub: user.sub
            }
        });
    } catch (error) {
        logger.error('Error in contribute controller', { error });
        next(error);
    }
};