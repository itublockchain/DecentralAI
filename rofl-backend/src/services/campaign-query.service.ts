import { 
    VectorStore, 
    OllamaService, 
    LoggerUtil, 
    SearchResult, 
    ResponseUtil 
} from '../utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface QueryRequest {
    query: string;
    campaignId: number;
    vectorDbUuid: string;
    topK?: number;
    minSimilarity?: number;
}

export interface QueryResponse {
    answer: string;
    sources: Array<{
        chunkId: string;
        content: string;
        fileName: string;
        similarity: number;
        chunkIndex: number;
    }>;
    metadata: {
        campaignId: number;
        totalSourcesFound: number;
        processingTimeMs: number;
        modelUsed: string;
    };
}

export class CampaignQueryService {
    private vectorStore: VectorStore;
    private ollamaService?: OllamaService;
    private geminiAI?: GoogleGenerativeAI;
    private useLocalModel: boolean;

    constructor() {
        this.useLocalModel = process.env.USE_LOCAL_MODEL === 'true';
        this.vectorStore = VectorStore.getInstance();

        if (this.useLocalModel) {
            this.ollamaService = new OllamaService();
            LoggerUtil.logServiceOperation('CampaignQueryService', 'constructor', {
                modelType: 'local-ollama',
                generationModel: 'llama3.1:8b'
            });
        } else {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is required when not using local model');
            }
            this.geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            LoggerUtil.logServiceOperation('CampaignQueryService', 'constructor', {
                modelType: 'gemini-api',
                generationModel: 'gemini-1.5-pro'
            });
        }
    }

    /**
     * Process a query against a specific campaign's knowledge base
     */
    async queryWithRAG(queryData: QueryRequest): Promise<QueryResponse> {
        const startTime = Date.now();
        
        try {
            const { query, campaignId, vectorDbUuid, topK = 5, minSimilarity = 0.1 } = queryData;

            // Validate input
            if (!query || query.trim().length === 0) {
                throw new Error('Query cannot be empty');
            }

            if (!Number.isInteger(campaignId) || campaignId < 0) {
                throw new Error('Valid campaign ID is required');
            }

            if (!vectorDbUuid || vectorDbUuid.trim().length === 0) {
                throw new Error('Vector DB UUID is required');
            }

            LoggerUtil.logServiceOperation('CampaignQueryService', 'queryWithRAG - started', {
                campaignId,
                vectorDbUuid,
                queryLength: query.length,
                topK,
                minSimilarity,
                modelType: this.useLocalModel ? 'local' : 'remote'
            });

            // Step 1: Generate embedding for the query
            const queryEmbedding = await this.generateQueryEmbedding(query);

            LoggerUtil.logServiceOperation('CampaignQueryService', 'queryWithRAG - query embedded', {
                campaignId,
                vectorDimension: queryEmbedding.length
            });

            // Step 2: Search for relevant chunks in the vector store
            const searchResults = await this.vectorStore.searchSimilar(
                vectorDbUuid,
                queryEmbedding,
                topK,
                minSimilarity
            );

            if (searchResults.length === 0) {
                LoggerUtil.logServiceOperation('CampaignQueryService', 'queryWithRAG - no relevant sources', {
                    campaignId,
                    queryLength: query.length
                });

                return {
                    answer: "I don't have enough relevant information in the knowledge base to answer your question. Please try rephrasing your question or ensure that relevant documents have been uploaded to this campaign.",
                    sources: [],
                    metadata: {
                        campaignId,
                        totalSourcesFound: 0,
                        processingTimeMs: Date.now() - startTime,
                        modelUsed: this.useLocalModel ? 'ollama-local' : 'gemini-api'
                    }
                };
            }

            LoggerUtil.logServiceOperation('CampaignQueryService', 'queryWithRAG - sources found', {
                campaignId,
                sourcesFound: searchResults.length,
                topSimilarity: searchResults[0]?.similarity || 0
            });

            // Step 3: Generate answer using the relevant context
            const answer = await this.generateAnswer(query, searchResults);

            const response: QueryResponse = {
                answer,
                sources: [], // Sources removed as requested
                metadata: {
                    campaignId,
                    totalSourcesFound: searchResults.length,
                    processingTimeMs: Date.now() - startTime,
                    modelUsed: this.useLocalModel ? 'ollama-local' : 'gemini-api'
                }
            };

            LoggerUtil.logServiceOperation('CampaignQueryService', 'queryWithRAG - completed', {
                campaignId,
                answerLength: answer.length,
                sourcesFound: searchResults.length,
                processingTimeMs: response.metadata.processingTimeMs,
                success: true
            });

            return response;

        } catch (error) {
            LoggerUtil.logServiceError('CampaignQueryService', 'queryWithRAG', error, {
                campaignId: queryData?.campaignId,
                queryLength: queryData?.query?.length
            });
            
            throw new Error(`Failed to process query: ${ResponseUtil.formatErrorMessage(error)}`);
        }
    }

    /**
     * Generate embedding for the user's query
     */
    private async generateQueryEmbedding(query: string): Promise<number[]> {
        try {
            if (this.useLocalModel && this.ollamaService) {
                return await this.ollamaService.createEmbedding(query);
            } else if (this.geminiAI) {
                const model = this.geminiAI.getGenerativeModel({ model: 'text-embedding-004' });
                const result = await model.embedContent(query);
                return result.embedding.values;
            } else {
                throw new Error('No embedding service available');
            }
        } catch (error) {
            LoggerUtil.logServiceError('CampaignQueryService', 'generateQueryEmbedding', error, {
                queryLength: query.length,
                modelType: this.useLocalModel ? 'local' : 'remote'
            });
            throw error;
        }
    }

    /**
     * Generate answer using RAG context
     */
    private async generateAnswer(query: string, searchResults: SearchResult[]): Promise<string> {
        try {
            // Build context from search results
            const context = searchResults
                .map((result, index) => {
                    const chunk = result.embedding.chunk;
                    return `Source ${index + 1} (from ${chunk.metadata.originalFileName}, similarity: ${result.similarity.toFixed(3)}):\n${chunk.content}`;
                })
                .join('\n\n---\n\n');

            const systemPrompt = `You are a helpful AI assistant that answers questions based on provided context. 

INSTRUCTIONS:
- Use ONLY the information provided in the context below to answer the question
- If the context doesn't contain enough information to answer the question, say so clearly
- Be concise but comprehensive in your answer
- Reference specific sources when possible (e.g., "According to Source 1...")
- Do not make up information that isn't in the context

CONTEXT:
${context}`;

            const userPrompt = `Question: ${query}

Please answer based on the context provided above.`;

            let answer: string;

            if (this.useLocalModel && this.ollamaService) {
                answer = await this.ollamaService.generateResponse(userPrompt, systemPrompt);
            } else if (this.geminiAI) {
                const model = this.geminiAI.getGenerativeModel({ 
                    model: 'gemini-1.5-pro',
                    systemInstruction: systemPrompt
                });
                const result = await model.generateContent(userPrompt);
                answer = result.response.text();
            } else {
                throw new Error('No generation service available');
            }

            return answer.trim();

        } catch (error) {
            LoggerUtil.logServiceError('CampaignQueryService', 'generateAnswer', error, {
                queryLength: query.length,
                contextSources: searchResults.length,
                modelType: this.useLocalModel ? 'local' : 'remote'
            });
            throw error;
        }
    }

    /**
     * Get campaign knowledge base statistics
     */
    async getCampaignStats(vectorDbUuid: string) {
        try {
            return await this.vectorStore.getCampaignStats(vectorDbUuid);
        } catch (error) {
            LoggerUtil.logServiceError('CampaignQueryService', 'getCampaignStats', error, { vectorDbUuid });
            throw error;
        }
    }

    /**
     * Check if service is ready to handle queries
     */
    async isServiceReady(): Promise<boolean> {
        try {
            if (this.useLocalModel && this.ollamaService) {
                return await this.ollamaService.isServiceRunning();
            }
            return true; // Gemini is always available if API key is valid
        } catch (error) {
            LoggerUtil.logServiceError('CampaignQueryService', 'isServiceReady', error);
            return false;
        }
    }
}