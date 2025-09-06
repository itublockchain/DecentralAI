import { logger } from '../config/logger';

interface ContributeData {
    walletAddress: string;
    email: string;
    name?: string;
    sub: string;
    file?: Express.Multer.File;
}

interface ContributeResult {
    success: boolean;
    message: string;
    data: {
        walletAddress: string;
        email: string;
        name?: string;
        fileInfo?: {
            originalName: string;
            size: number;
            mimeType: string;
        };
    };
}

export class ContributeService {
    async processContribution(contributionData: ContributeData): Promise<ContributeResult> {
        try {
            const { walletAddress, email, name, sub, file } = contributionData;

            logger.info('Processing contribution', {
                walletAddress,
                email,
                sub,
                hasFile: !!file,
                fileSize: file?.size
            });

            const result: ContributeResult = {
                success: true,
                message: 'Contribution processed successfully',
                data: {
                    walletAddress,
                    email,
                    name,
                    ...(file && {
                        fileInfo: {
                            originalName: file.originalname,
                            size: file.size,
                            mimeType: file.mimetype
                        }
                    })
                }
            };

            logger.info('Contribution processing completed', {
                walletAddress,
                success: true,
                fileProcessed: !!file
            });

            return result;
        } catch (error) {
            logger.error('Error processing contribution', {
                error,
                walletAddress: contributionData.walletAddress
            });

            throw new Error('Failed to process contribution');
        }
    }
}