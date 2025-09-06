import { logger } from '../config/logger';

export interface LogContext {
    [key: string]: any;
}

export class LoggerUtil {
    static info(message: string, context?: LogContext): void {
        logger.info(message, context);
    }

    static error(message: string, error?: any, context?: LogContext): void {
        const logContext = {
            ...context,
            ...(error && { 
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error 
            })
        };
        logger.error(message, logContext);
    }

    static warn(message: string, context?: LogContext): void {
        logger.warn(message, context);
    }

    static debug(message: string, context?: LogContext): void {
        logger.debug(message, context);
    }

    static logApiRequest(method: string, path: string, context?: LogContext): void {
        this.info(`API Request: ${method} ${path}`, {
            method,
            path,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static logApiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
        this.info(`API Response: ${method} ${path}`, {
            method,
            path,
            statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static logServiceOperation(service: string, operation: string, context?: LogContext): void {
        this.info(`Service Operation: ${service}.${operation}`, {
            service,
            operation,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static logServiceError(service: string, operation: string, error: any, context?: LogContext): void {
        this.error(`Service Error: ${service}.${operation}`, error, {
            service,
            operation,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static logControllerOperation(controller: string, operation: string, context?: LogContext): void {
        this.info(`Controller Operation: ${controller}.${operation}`, {
            controller,
            operation,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static logControllerError(controller: string, operation: string, error: any, context?: LogContext): void {
        this.error(`Controller Error: ${controller}.${operation}`, error, {
            controller,
            operation,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static sanitizeForLogging(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'privateKey'];
        const sanitized = { ...data };

        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
        }

        return sanitized;
    }
}