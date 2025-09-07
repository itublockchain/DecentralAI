import { v4 as uuidv4 } from 'uuid';
import { 
    FileProcessor, 
    LoggerUtil, 
    ValidationUtil, 
    RAGUtil, 
    FileStorageUtil,
    BlockchainUtil,
    VectorStore,
    IPFSEncryptionUtil
} from '../utils';
import { 
    ModelCampaignRequest, 
    ModelCampaignResponse, 
    Category, 
    CreateCampaignContractArgs 
} from '../types/campaign.types';

export class ModelCampaignService {
    private useIPFS: boolean;

    constructor() {
        // Initialize blockchain utilities
        BlockchainUtil.initialize();
        
        // Check if IPFS is enabled
        this.useIPFS = process.env.USE_IPFS_STORAGE === 'true';
        
        if (this.useIPFS) {
            try {
                IPFSEncryptionUtil.initialize();
                LoggerUtil.logServiceOperation('ModelCampaignService', 'constructor', {
                    ipfsEnabled: true
                });
            } catch (error) {
                LoggerUtil.logServiceError('ModelCampaignService', 'constructor - IPFS init failed', error);
                this.useIPFS = false;
                LoggerUtil.logServiceOperation('ModelCampaignService', 'constructor', {
                    ipfsEnabled: false,
                    reason: 'IPFS initialization failed'
                });
            }
        }
    }

    /**
     * Process model campaign creation
     */
    async createModelCampaign(data: ModelCampaignRequest): Promise<ModelCampaignResponse> {
        const startTime = Date.now();
        
        try {
            // Validate input data
            this.validateModelCampaignData(data);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - started', {
                name: data.name,
                owner: data.owner,
                category: data.category,
                fileName: data.file.originalname
            });

            // Step 1: Process file and extract content
            const fileResult = await FileProcessor.processForRAG(data.file);
            const textContent = FileProcessor.extractTextContent(fileResult.content);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - file processed', {
                textLength: textContent.length,
                fileName: data.file.originalname
            });

            // Step 2: Split text into chunks
            const chunks = RAGUtil.splitIntoChunks(textContent, data.file.originalname, 0); // Use 0 as temporary campaign ID

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - chunks created', {
                totalChunks: chunks.length
            });

            // Step 3: Generate vector embeddings
            const embeddings = await RAGUtil.generateEmbeddings(chunks);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - embeddings generated', {
                totalEmbeddings: embeddings.length,
                vectorDimension: embeddings[0]?.vector.length || 0
            });

            // Step 4: Save vectors and get IPFS CID
            let vectorDbCid: string;
            let vectorStoreId: string;
            
            if (this.useIPFS) {
                // Generate UUID for internal tracking
                vectorStoreId = uuidv4();
                
                // Upload vectors to IPFS and get CID
                vectorDbCid = await IPFSEncryptionUtil.uploadVectorsToIPFS(vectorStoreId, embeddings);
                
                // Store in VectorStore for caching with IPFS CID as key
                const vectorStore = VectorStore.getInstance();
                await vectorStore.storeEmbeddings(vectorDbCid, embeddings);
                vectorStore.setIPFSHash(vectorDbCid, vectorDbCid); // CID maps to itself

                LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - vectors saved to IPFS', {
                    vectorStoreId,
                    savedVectors: embeddings.length,
                    vectorDbCid
                });
            } else {
                // Fallback to local storage with UUID as CID
                vectorStoreId = uuidv4();
                vectorDbCid = vectorStoreId; // Use UUID as CID for local storage
                await FileStorageUtil.saveVectorsByUUID(vectorStoreId, embeddings);

                LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - vectors saved locally', {
                    vectorStoreId,
                    savedVectors: embeddings.length
                });
            }

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
                vector_db_cid: vectorDbCid, // Using IPFS CID or UUID
                owner: data.owner,
                category: data.category,
                in_token_price: BigInt(data.in_token_price),
                out_token_price: BigInt(data.out_token_price),
                initial_data_token: BigInt(initialDataTokens)
            };

            const transactionHash = await BlockchainUtil.createCampaign(contractArgs);

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - blockchain created', {
                vectorDbCid,
                transactionHash,
                ipfsEnabled: this.useIPFS
            });

            // Step 7: Get the campaign ID from blockchain
            const campaignId = await BlockchainUtil.getCampaignsLength() - 1; // Latest campaign

            const response: ModelCampaignResponse = {
                success: true,
                message: 'Model campaign created successfully',
                data: {
                    campaignId,
                    vectorStoreId: vectorDbCid, // Use CID as primary identifier
                    vectorDbCid,
                    transactionHash,
                    initialDataTokens,
                    processingInfo: {
                        totalChunks: chunks.length,
                        totalEmbeddings: embeddings.length,
                        vectorDimension: embeddings[0]?.vector.length || 0
                    },
                    ipfsEnabled: this.useIPFS
                }
            };

            LoggerUtil.logServiceOperation('ModelCampaignService', 'createModelCampaign - completed', {
                campaignId,
                vectorDbCid,
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