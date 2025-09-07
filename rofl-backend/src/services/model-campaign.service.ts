import { v4 as uuidv4 } from 'uuid';
import { 
    FileProcessor, 
    LoggerUtil, 
    ValidationUtil, 
    RAGUtil, 
    FileStorageUtil,
    BlockchainUtil
} from '../utils';
import { 
    ModelCampaignRequest, 
    ModelCampaignResponse, 
    Category, 
    CreateCampaignContractArgs 
} from '../types/campaign.types';

export class ModelCampaignService {
    constructor() {
        // Initialize blockchain utilities
        BlockchainUtil.initialize();
    }

    /**
     * Process model campaign creation
     */
    async createModelCampaign(data: ModelCampaignRequest): Promise<ModelCampaignResponse> {
        const startTime = Date.now();
        
        try {
            // Validate input data
            this.validateModelCampaignData(data);

            const vectorStoreId = uuidv4();

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - started', {
                name: data.name,
                owner: data.owner,
                category: data.category,
                vectorStoreId,
                fileName: data.file.originalname
            });

            // Step 1: Process file and extract content
            const fileResult = await FileProcessor.processForRAG(data.file);
            const textContent = FileProcessor.extractTextContent(fileResult.content);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - file processed', {
                vectorStoreId,
                textLength: textContent.length,
                fileName: data.file.originalname
            });

            // Step 2: Split text into chunks
            const chunks = RAGUtil.splitIntoChunks(textContent, data.file.originalname, 0); // Use 0 as temporary campaign ID

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - chunks created', {
                vectorStoreId,
                totalChunks: chunks.length
            });

            // Step 3: Generate vector embeddings
            const embeddings = await RAGUtil.generateEmbeddings(chunks);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - embeddings generated', {
                vectorStoreId,
                totalEmbeddings: embeddings.length,
                vectorDimension: embeddings[0]?.vector.length || 0
            });

            // Step 4: Save vectors to file system with UUID
            await FileStorageUtil.saveVectorsByUUID(vectorStoreId, embeddings);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - vectors saved', {
                vectorStoreId,
                savedVectors: embeddings.length
            });

            // Step 5: Calculate initial data tokens
            const initialDataTokens = this.calculateDataTokens(textContent, chunks.length);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - tokens calculated', {
                vectorStoreId,
                initialDataTokens,
                textLength: textContent.length,
                chunkCount: chunks.length
            });

            // Step 6: Create campaign on blockchain
            const contractArgs: CreateCampaignContractArgs = {
                name: data.name,
                description: data.description,
                vector_db_cid: vectorStoreId, // Using UUID as CID
                owner: data.owner,
                category: data.category,
                in_token_price: BigInt(data.in_token_price),
                out_token_price: BigInt(data.out_token_price),
                initial_data_token: BigInt(initialDataTokens)
            };

            const transactionHash = await BlockchainUtil.createCampaign(contractArgs);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - blockchain created', {
                vectorStoreId,
                transactionHash,
                contractAddress: '0xF3CCd34F751Ef7777d8Fd4e76858c233Ac60fb23'
            });

            // Step 7: Get the campaign ID from blockchain
            const campaignId = await BlockchainUtil.getCampaignsLength() - 1; // Latest campaign

            const response: ModelCampaignResponse = {
                success: true,
                message: 'Model campaign created successfully',
                data: {
                    campaignId,
                    vectorStoreId,
                    transactionHash,
                    initialDataTokens,
                    processingInfo: {
                        totalChunks: chunks.length,
                        totalEmbeddings: embeddings.length,
                        vectorDimension: embeddings[0]?.vector.length || 0
                    }
                }
            };

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - completed', {
                campaignId,
                vectorStoreId,
                transactionHash,
                processingTimeMs: Date.now() - startTime,
                success: true
            });

            return response;

        } catch (error) {
            LoggerUtil.logServiceError('ModelCampaignService', 'createModelCampaign', error, {
                name: data?.name,
                owner: data?.owner,
                fileName: data?.file?.originalname
            });

            throw new Error(`Failed to create model campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate model campaign data
     */
    private validateModelCampaignData(data: ModelCampaignRequest): void {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Campaign name is required');
        }

        if (data.name.length > 100) {
            throw new Error('Campaign name must be less than 100 characters');
        }

        if (!data.description || data.description.trim().length === 0) {
            throw new Error('Campaign description is required');
        }

        if (data.description.length > 1000) {
            throw new Error('Campaign description must be less than 1000 characters');
        }

        if (!data.owner || !ValidationUtil.isValidAddress(data.owner)) {
            throw new Error('Valid owner address is required');
        }

        if (!Object.values(Category).includes(data.category)) {
            throw new Error('Valid category is required');
        }

        if (!data.in_token_price || !this.isValidPriceString(data.in_token_price)) {
            throw new Error('Valid in_token_price is required');
        }

        if (!data.out_token_price || !this.isValidPriceString(data.out_token_price)) {
            throw new Error('Valid out_token_price is required');
        }

        if (!data.file) {
            throw new Error('Initial data file is required');
        }

        // Validate file using existing FileProcessor validation
        FileProcessor.validateFile(data.file);
    }

    /**
     * Validate price string (should be valid ether format)
     */
    private isValidPriceString(price: string): boolean {
        try {
            const parsed = parseFloat(price);
            return parsed >= 0 && !isNaN(parsed);
        } catch {
            return false;
        }
    }

    /**
     * Calculate data tokens based on content
     * Currently using: 1 token per 100 characters + bonus for chunks
     */
    private calculateDataTokens(content: string, chunkCount: number): number {
        // Base calculation: 1 token per 100 characters
        const baseTokens = Math.ceil(content.length / 100);
        
        // Bonus for structure (chunks)
        const chunkBonus = Math.ceil(chunkCount / 10);
        
        // Minimum 1 token
        const totalTokens = Math.max(1, baseTokens + chunkBonus);

        LoggerUtil.logServiceOperation('ModelCampaignService', 'calculateDataTokens', {
            contentLength: content.length,
            chunkCount,
            baseTokens,
            chunkBonus,
            totalTokens
        });

        return totalTokens;
    }

    /**
     * Get campaign details from blockchain
     */
    async getCampaignDetails(campaignId: number) {
        try {
            return await BlockchainUtil.getCampaign(campaignId);
        } catch (error) {
            LoggerUtil.logServiceError('ModelCampaignService', 'getCampaignDetails', error, { campaignId });
            throw new Error(`Failed to get campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get total campaigns count
     */
    async getTotalCampaigns(): Promise<number> {
        try {
            return await BlockchainUtil.getCampaignsLength();
        } catch (error) {
            LoggerUtil.logServiceError('ModelCampaignService', 'getTotalCampaigns', error);
            throw new Error(`Failed to get total campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}