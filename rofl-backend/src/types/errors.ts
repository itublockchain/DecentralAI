export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class JwtError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JwtError';
    }
}

export class WalletAuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WalletAuthenticationError';
    }
}