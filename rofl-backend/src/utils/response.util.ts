import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export class ResponseUtil {

    static paginated<T>(
        data: T[],
        page: number,
        limit: number,
        total: number,
        message: string = 'Data retrieved successfully'
    ): PaginatedResponse<T[]> {
        const totalPages = Math.ceil(total / limit);
        
        return {
            success: true,
            message,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages
            },
            timestamp: new Date().toISOString()
        };
    }


    static formatErrorMessage(error: any): string {
        if (error instanceof Error) {
            return error.message;
        }
        
        if (typeof error === 'string') {
            return error;
        }
        
        return 'An unexpected error occurred';
    }

    // Express Response Helper Methods
    static badRequest(res: Response, message: string = 'Bad request', error?: string): Response {
        const response: ApiResponse = {
            success: false,
            message,
            error,
            timestamp: new Date().toISOString()
        };
        return res.status(400).json(response);
    }

    static success(res: Response, data?: any, message: string = 'Operation successful'): Response {
        const response: ApiResponse = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        return res.status(200).json(response);
    }

    static serviceUnavailable(res: Response, message: string = 'Service unavailable', data?: any): Response {
        const response: ApiResponse = {
            success: false,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        return res.status(503).json(response);
    }

    static internalServerError(res: Response, message: string = 'Internal server error'): Response {
        const response: ApiResponse = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };
        return res.status(500).json(response);
    }
}