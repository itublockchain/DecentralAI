import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ContributeService } from '../services/contribute.service';

const contributeService = new ContributeService();

export const contribute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'File is required'
            });
        }

        const result = await contributeService.processContribution({
            walletAddress: user.walletAddress,
            email: user.email,
            name: user.name,
            sub: user.sub,
            file
        });

        res.status(200).json(result);
    } catch (error) {
        logger.error('Error in contribute controller', { error });
        next(error);
    }
};