import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
    FileProcessor, 
    LoggerUtil, 
    ValidationUtil, 
    ResponseUtil,
    RAGUtil,
    VectorStore
} from '../utils';
import { BlockchainUtil } from '../utils/blockchain.util';
import type { DocumentChunk, VectorEmbedding } from '../utils';

interface ContributeData {
    walletAddress: string;
    email: string;
    name?: string;
    sub: string;
    campaignId: number;
    file?: Express.Multer.File;
}

interface ContributeResult {
    success: boolean;
    message: string;
    data: {
        walletAddress: string;
        email: string;
        name?: string;
        campaignId: number;
        fileInfo?: {
            originalName: string;
            size: number;
            mimeType: string;
        };
        ragInfo?: {
            totalChunks: number;
            totalEmbeddings: number;
            vectorDimension: number;
        };
    };
}

export class ContributeService {
    private genAI?: GoogleGenerativeAI;
    private models: Map<number, any> = new Map();
    private vectorStore: VectorStore;

    constructor() {
        const useLocalModel = process.env.USE_LOCAL_MODEL === 'true';
        
        if (useLocalModel) {
            // Use local Ollama model
            RAGUtil.initialize(undefined, true);
            LoggerUtil.logServiceOperation('ContributeService', 'constructor', {
                modelType: 'local-ollama',
                embeddingModel: 'nomic-embed-text',
                generationModel: 'llama3.1:8b'
            });
        } else {
            // Use Gemini API
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is required when not using local model');
            }
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            RAGUtil.initialize(process.env.GEMINI_API_KEY, false);
            LoggerUtil.logServiceOperation('ContributeService', 'constructor', {
                modelType: 'gemini-api',
                embeddingModel: 'text-embedding-004'
            });
        }
        
        this.vectorStore = VectorStore.getInstance();
    }

    private async processFileForRAG(file: Express.Multer.File, campaignId: number): Promise<{
        chunks: DocumentChunk[];
        embeddings: VectorEmbedding[];
        newIPFSCid: string;
    }> {
        try {
            // Step 1: Process file and extract text content
            const result = await FileProcessor.processForRAG(file);
            const textContent = FileProcessor.extractTextContent(result.content);

            LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - text extracted', {
                fileName: file.originalname,
                campaignId,
                textLength: textContent.length
            });

            // Step 2: Split text into chunks
            const chunks = RAGUtil.splitIntoChunks(textContent, file.originalname, campaignId);

            LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - chunks created', {
                fileName: file.originalname,
                campaignId,
                totalChunks: chunks.length
            });

            // Step 3: Generate vector embeddings for chunks
            const embeddings = await RAGUtil.generateEmbeddings(chunks);

            LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - embeddings generated', {
                fileName: file.originalname,
                campaignId,
                totalEmbeddings: embeddings.length,
                vectorDimension: embeddings[0]?.vector.length || 0
            });

            // Step 4: Get current IPFS CID from blockchain
            const campaignData = await BlockchainUtil.getCampaign(campaignId);
            const currentIPFSCid = campaignData.vectorDbCid;

            if (!currentIPFSCid) {
                throw new Error(`Campaign ${campaignId} has no associated IPFS CID`);
            }

            // Step 5: Load existing vectors from IPFS and append new ones
            const { IPFSEncryptionUtil } = await import('../utils');
            let existingVectors: VectorEmbedding[] = [];
            
            try {
                // Download existing vectors from IPFS
                existingVectors = await IPFSEncryptionUtil.downloadVectorsFromIPFS(currentIPFSCid);
                
                LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - existing vectors loaded', {
                    fileName: file.originalname,
                    campaignId,
                    existingVectorCount: existingVectors.length,
                    currentIPFSCid
                });
            } catch (error) {
                LoggerUtil.logServiceError('ContributeService', 'processFileForRAG - failed to load existing vectors', error, {
                    fileName: file.originalname,
                    campaignId,
                    currentIPFSCid
                });
                // Continue with empty array if IPFS load fails
            }

            // Combine existing and new embeddings
            const allEmbeddings = [...existingVectors, ...embeddings];
            
            // Generate new UUID for internal tracking only
            const { v4: uuidv4 } = await import('uuid');
            const internalUuid = uuidv4();

            // Upload combined vectors to IPFS and get new CID
            const newIPFSCid = await IPFSEncryptionUtil.uploadVectorsToIPFS(internalUuid, allEmbeddings);

            // Store in vector store cache using CID as key
            await this.vectorStore.storeEmbeddings(newIPFSCid, allEmbeddings);
            this.vectorStore.setIPFSHash(newIPFSCid, newIPFSCid); // CID maps to itself

            LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - completed', {
                fileName: file.originalname,
                campaignId,
                chunks: chunks.length,
                newEmbeddings: embeddings.length,
                totalEmbeddings: allEmbeddings.length,
                newIPFSCid,
                storedSuccessfully: true
            });

            return { 
                chunks, 
                embeddings: allEmbeddings, // Return all embeddings (existing + new)
                newIPFSCid 
            };
        } catch (error) {
            LoggerUtil.logServiceError('ContributeService', 'processFileForRAG', error, {
                fileName: file?.originalname,
                campaignId
            });
            throw error;
        }
    }

    private async getCampaignModel(campaignId: number) {
        if (!this.models.has(campaignId)) {
            if (!this.genAI) {
                throw new Error('Gemini AI not initialized - using local model mode');
            }
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            this.models.set(campaignId, model);
        }
        const model = this.models.get(campaignId);
        if (!model) {
            throw new Error('Failed to get campaign model');
        }
        return model;
    }

    /**
     * Gets RAG statistics for a campaign
     */
    async getCampaignRAGStats(campaignId: number) {
        // Get campaign IPFS CID from blockchain
        const campaignData = await BlockchainUtil.getCampaign(campaignId);
        const vectorDbCid = campaignData.vectorDbCid;

        if (!vectorDbCid) {
            throw new Error(`Campaign ${campaignId} has no associated vector database CID`);
        }

        return await this.vectorStore.getCampaignStats(vectorDbCid);
    }

    private calculateDataTokenAmount(chunks: DocumentChunk[], embeddings: VectorEmbedding[]): number {
        // Calculate token amount based on contribution size
        // Base amount + bonus for chunk count + bonus for embedding quality
        const baseAmount = 10;
        const chunkBonus = chunks.length * 2;
        const embeddingBonus = embeddings.length * 1;
        
        return baseAmount + chunkBonus + embeddingBonus;
    }

    async processContribution(contributionData: ContributeData): Promise<ContributeResult> {
        try {
            // Validate input data
            const validation = ValidationUtil.validateContributionData(contributionData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const { walletAddress, email, name, sub, campaignId, file } = contributionData;

            LoggerUtil.logServiceOperation('ContributeService', 'processContribution', {
                walletAddress: ValidationUtil.sanitizeString(walletAddress),
                email: ValidationUtil.sanitizeEmail(email),
                campaignId,
                hasFile: !!file,
                fileSize: file?.size
            });

            if (!file) {
                throw new Error('File is required for contribution');
            }

            // Process file through RAG pipeline: chunk -> embed -> store
            const { chunks, embeddings, newIPFSCid } = await this.processFileForRAG(file, campaignId);

            // Calculate data token amount based on NEW contribution only
            const dataTokenAmount = this.calculateDataTokenAmount(chunks, embeddings.slice(-chunks.length)); // Only new embeddings

            if (!newIPFSCid) {
                throw new Error('New IPFS CID not generated after storing vectors');
            }

            // Record contribution on blockchain with updated IPFS hash
            await BlockchainUtil.recordContribution(campaignId, walletAddress, dataTokenAmount, newIPFSCid);

            const result: ContributeResult = {
                success: true,
                message: 'Contribution processed successfully, vectorized for RAG, and recorded on blockchain',
                data: {
                    walletAddress,
                    email,
                    name: name ? ValidationUtil.sanitizeName(name) : undefined,
                    campaignId,
                    fileInfo: {
                        originalName: file.originalname,
                        size: file.size,
                        mimeType: file.mimetype
                    },
                    ragInfo: {
                        totalChunks: chunks.length,
                        totalEmbeddings: embeddings.length,
                        vectorDimension: embeddings[0]?.vector.length || 0
                    }
                }
            };

            LoggerUtil.logServiceOperation('ContributeService', 'processContribution - completed', {
                walletAddress: ValidationUtil.sanitizeString(walletAddress),
                campaignId,
                success: true,
                chunksCreated: chunks.length,
                embeddingsGenerated: embeddings.length,
                dataTokenAmount,
                vectorizedForRAG: true,
                recordedOnBlockchain: true
            });

            return result;
        } catch (error) {
            LoggerUtil.logServiceError('ContributeService', 'processContribution', error, {
                walletAddress: contributionData?.walletAddress,
                campaignId: contributionData?.campaignId
            });

            throw new Error(`Failed to process contribution: ${ResponseUtil.formatErrorMessage(error)}`);
        }
    }
}