import { logger } from '../config/logger';

// CommonJS require for pdf-parse compatibility
const pdfParse = require('pdf-parse');

export interface FileProcessingResult {
    content: string;
    metadata: {
        originalName: string;
        size: number;
        mimeType: string;
        encoding?: string;
    };
}

export class FileProcessor {
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static readonly ALLOWED_MIME_TYPES = [
        'text/plain',
        'application/pdf',
        'application/json',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    static validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new Error(`File type ${file.mimetype} is not allowed`);
        }
    }

    static async processForRAG(file: Express.Multer.File): Promise<FileProcessingResult> {
        try {
            this.validateFile(file);

            if (!file.buffer) {
                throw new Error('File buffer is empty');
            }

            let content: string;
            
            switch (file.mimetype) {
                case 'text/plain':
                case 'application/json':
                case 'text/csv':
                    content = file.buffer.toString('utf-8');
                    break;
                case 'application/pdf':
                    try {
                        const pdfData = await pdfParse(file.buffer);
                        content = pdfData.text;
                        logger.info('PDF parsed successfully', {
                            originalName: file.originalname,
                            pages: pdfData.numpages,
                            textLength: content.length
                        });
                    } catch (pdfError) {
                        logger.error('PDF parsing failed', { 
                            error: pdfError, 
                            fileName: file.originalname 
                        });
                        throw new Error(`Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
                    }
                    break;
                default:
                    // For unsupported formats, try UTF-8 as fallback
                    content = file.buffer.toString('utf-8');
                    logger.warn('Unsupported file type, using UTF-8 fallback', {
                        mimetype: file.mimetype,
                        originalName: file.originalname
                    });
                    break;
            }

            const result: FileProcessingResult = {
                content,
                metadata: {
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    encoding: 'utf-8'
                }
            };

            logger.info('File processed successfully for RAG', {
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
                contentLength: content.length
            });

            return result;
        } catch (error) {
            logger.error('Error processing file for RAG', { 
                error, 
                fileName: file?.originalname 
            });
            throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static extractTextContent(content: string): string {
        return content
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
    }

    static getFileInfo(file: Express.Multer.File) {
        return {
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            hasBuffer: !!file.buffer
        };
    }
}