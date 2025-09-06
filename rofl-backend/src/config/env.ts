import dotenv from 'dotenv';

dotenv.config();

export const env = {
    PORT: process.env.PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWKS_ENDPOINT: process.env.JWKS_ENDPOINT || 'https://app.dynamic.xyz/.well-known/jwks'
};