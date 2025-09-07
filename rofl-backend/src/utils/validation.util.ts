export class ValidationUtil {
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidWalletAddress(address: string): boolean {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // Ethereum address validation (42 characters, starts with 0x)
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethAddressRegex.test(address);
    }

    static isValidCampaignId(campaignId: any): boolean {
        return Number.isInteger(campaignId) && campaignId > 0;
    }

    static isValidString(value: any, minLength: number = 1): boolean {
        return typeof value === 'string' && value.trim().length >= minLength;
    }

    static isValidSubject(sub: string): boolean {
        return this.isValidString(sub) && sub.length <= 500;
    }

    static validateContributionData(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.isValidWalletAddress(data.walletAddress)) {
            errors.push('Invalid wallet address format');
        }

        if (!this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }

        if (!this.isValidSubject(data.sub)) {
            errors.push('Invalid subject - must be a string with max 500 characters');
        }

        if (!this.isValidCampaignId(data.campaignId)) {
            errors.push('Invalid campaign ID - must be a positive integer');
        }

        if (data.name !== undefined && !this.isValidString(data.name)) {
            errors.push('Name must be a valid string if provided');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static sanitizeString(input: string): string {
        if (!input || typeof input !== 'string') {
            return '';
        }
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000); // Limit length
    }

    static sanitizeEmail(email: string): string {
        return email?.toLowerCase().trim() || '';
    }

    static sanitizeName(name: string): string {
        return name?.trim().replace(/[^\w\s.-]/g, '') || '';
    }

    static isNumeric(value: any): boolean {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    static isValidFileSize(size: number, maxSizeInMB: number = 10): boolean {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return size > 0 && size <= maxSizeInBytes;
    }

    static isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
        return allowedTypes.includes(mimeType);
    }

    /**
     * Validate Ethereum address format
     */
    static isValidAddress(address: string): boolean {
        // Basic Ethereum address validation
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        return addressRegex.test(address);
    }
}