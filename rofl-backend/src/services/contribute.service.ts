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

            // Step 6: Check domain relevance before accepting contribution
            const relevanceCheck = await this.checkDomainRelevance(embeddings, existingVectors);
            
            if (!relevanceCheck.isRelevant) {
                LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - contribution rejected', {
                    fileName: file.originalname,
                    campaignId,
                    averageSimilarity: relevanceCheck.averageSimilarity,
                    threshold: relevanceCheck.threshold,
                    reason: relevanceCheck.reason
                });
                
                throw new Error(`Contribution rejected: ${relevanceCheck.reason}. Average relevance: ${(relevanceCheck.averageSimilarity * 100).toFixed(1)}% (minimum required: ${(relevanceCheck.threshold * 100)}%)`);
            }

            LoggerUtil.logServiceOperation('ContributeService', 'processFileForRAG - relevance check passed', {
                fileName: file.originalname,
                campaignId,
                averageSimilarity: relevanceCheck.averageSimilarity,
                threshold: relevanceCheck.threshold
            });

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

    /**
     * Check if new contribution is relevant to the existing domain/topic
     */
    private async checkDomainRelevance(
        newEmbeddings: VectorEmbedding[], 
        existingEmbeddings: VectorEmbedding[]
    ): Promise<{
        isRelevant: boolean;
        averageSimilarity: number;
        threshold: number;
        reason?: string;
    }> {
        try {
            // Configurable threshold - can be adjusted per campaign category
            const RELEVANCE_THRESHOLD = parseFloat(process.env.DOMAIN_RELEVANCE_THRESHOLD || '0.15'); // 15% minimum similarity
            
            // If no existing embeddings, accept (first contribution)
            if (existingEmbeddings.length === 0) {
                LoggerUtil.logServiceOperation('ContributeService', 'checkDomainRelevance', {
                    result: 'accepted',
                    reason: 'first-contribution',
                    existingCount: 0,
                    newCount: newEmbeddings.length
                });
                
                return {
                    isRelevant: true,
                    averageSimilarity: 1.0,
                    threshold: RELEVANCE_THRESHOLD,
                    reason: 'First contribution - automatically accepted'
                };
            }

            // Calculate average similarity between new and existing embeddings
            let totalSimilarity = 0;
            let comparisons = 0;
            
            // Sample-based comparison for performance (max 100 comparisons)
            const maxComparisons = Math.min(100, newEmbeddings.length * Math.min(10, existingEmbeddings.length));
            const existingSample = this.sampleEmbeddings(existingEmbeddings, Math.min(10, existingEmbeddings.length));
            
            for (const newEmbedding of newEmbeddings) {
                for (const existingEmbedding of existingSample) {
                    if (comparisons >= maxComparisons) break;
                    
                    const similarity = this.calculateCosineSimilarity(
                        newEmbedding.vector, 
                        existingEmbedding.vector
                    );
                    totalSimilarity += similarity;
                    comparisons++;
                }
                if (comparisons >= maxComparisons) break;
            }
            
            const averageSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
            const isRelevant = averageSimilarity >= RELEVANCE_THRESHOLD;
            
            LoggerUtil.logServiceOperation('ContributeService', 'checkDomainRelevance', {
                result: isRelevant ? 'accepted' : 'rejected',
                averageSimilarity: averageSimilarity.toFixed(4),
                threshold: RELEVANCE_THRESHOLD,
                comparisons,
                newEmbeddingsCount: newEmbeddings.length,
                existingEmbeddingsCount: existingEmbeddings.length
            });
            
            return {
                isRelevant,
                averageSimilarity,
                threshold: RELEVANCE_THRESHOLD,
                reason: isRelevant 
                    ? 'Content is relevant to existing domain' 
                    : 'Content appears unrelated to existing domain - contribution may be off-topic'
            };
            
        } catch (error) {
            LoggerUtil.logServiceError('ContributeService', 'checkDomainRelevance', error, {
                newEmbeddingsCount: newEmbeddings?.length,
                existingEmbeddingsCount: existingEmbeddings?.length
            });
            
            // On error, accept the contribution (fail-open approach)
            return {
                isRelevant: true,
                averageSimilarity: 0,
                threshold: 0.15,
                reason: 'Relevance check failed - contribution accepted by default'
            };
        }
    }

    /**
     * Sample embeddings for performance optimization
     */
    private sampleEmbeddings(embeddings: VectorEmbedding[], count: number): VectorEmbedding[] {
        if (embeddings.length <= count) {
            return embeddings;
        }
        
        const step = Math.floor(embeddings.length / count);
        const sampled: VectorEmbedding[] = [];
        
        for (let i = 0; i < embeddings.length; i += step) {
            sampled.push(embeddings[i]);
            if (sampled.length >= count) break;
        }
        
        return sampled;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
        if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vectorA.length; i++) {
            const aVal = vectorA[i] || 0;
            const bVal = vectorB[i] || 0;
            dotProduct += aVal * bVal;
            normA += aVal * aVal;
            normB += bVal * bVal;
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
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