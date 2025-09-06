import { Request, Response, NextFunction } from 'express';
import {
    UnauthorizedError,
    JwtError,
    WalletAuthenticationError,
} from '../types/errors';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../config/logger';
import { env } from '../config/env';

const DYNAMIC_JWKS_URL = env.JWKS_ENDPOINT;

const jwksClientInstance = jwksClient({
    jwksUri: DYNAMIC_JWKS_URL,
    cache: true,
    cacheMaxAge: 86400000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
});

const getSigningKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    jwksClientInstance.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }

        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
};

export const dynamicWalletAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authorization header missing or invalid');
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decodedToken) => {
            if (err) {
                logger.error('JWT verification failed', { error: err.message });
                return next(new JwtError('Invalid token'));
            }

            if (!decodedToken) {
                return next(new JwtError('Invalid token payload'));
            }

            const jwtDecodedToken = decodedToken as any;
            let walletAddress = null;

            if (
                jwtDecodedToken.verified_credentials &&
                Array.isArray(jwtDecodedToken.verified_credentials)
            ) {
                const blockchainCredential = jwtDecodedToken.verified_credentials.find(
                    (cred: any) => cred.format === 'blockchain'
                );

                if (blockchainCredential && blockchainCredential.address) {
                    walletAddress = blockchainCredential.address.toLowerCase();
                }
            }

            if (!walletAddress) {
                logger.warn('JWT wallet address not found in token');
                return next(new WalletAuthenticationError('Wallet address not found in token'));
            }

            if (!jwtDecodedToken.email) {
                logger.warn('JWT email not found in token');
                return next(new JwtError('Email not found in token'));
            }

            req.user = {
                sub: jwtDecodedToken.sub,
                email: jwtDecodedToken.email,
                name: jwtDecodedToken.verified_credentials.find(
                    (cred: any) => cred.format === 'oauth'
                )?.oauth_display_name,
                profile_photo_url: jwtDecodedToken.verified_credentials.find(
                    (cred: any) => cred.format === 'oauth'
                )?.oauth_account_photos?.[0],
                verified_credentials: jwtDecodedToken.verified_credentials,
                walletAddress,
                ...(decodedToken as object),
            };

            next();
        });
    } catch (error) {
        logger.error('Dynamic wallet authentication error', { error });
        next(new WalletAuthenticationError('Authentication failed'));
    }
};