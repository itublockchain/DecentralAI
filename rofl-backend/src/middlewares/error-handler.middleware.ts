import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, JwtError, WalletAuthenticationError } from '../types/errors';
import { logger } from '../config/logger';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(`Error occurred: ${error.message}`, { 
        stack: error.stack,
        url: req.url,
        method: req.method
    });

    if (error instanceof UnauthorizedError) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: error.message
        });
    }

    if (error instanceof JwtError || error instanceof WalletAuthenticationError) {
        return res.status(401).json({
            error: 'Authentication Failed',
            message: error.message
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
};