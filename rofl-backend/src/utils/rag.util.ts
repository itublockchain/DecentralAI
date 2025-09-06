import { GoogleGenerativeAI } from '@google/generative-ai';
import { LoggerUtil } from './logger.util';
import { OllamaService } from './ollama.util';

export interface DocumentChunk {
    id: string;
    content: string;
    startIndex: number;
    endIndex: number;
    metadata: {
        originalFileName: string;
        chunkIndex: number;
        totalChunks: number;
        campaignId: number;
    };
}

export interface VectorEmbedding {
    id: string;
    vector: number[];
    chunk: DocumentChunk;
    timestamp: Date;
}

export class RAGUtil {
    private static readonly CHUNK_SIZE = 1000; // characters
    private static readonly OVERLAP_SIZE = 200; // character overlap between chunks
    private static genAI: GoogleGenerativeAI;
    private static ollamaService: OllamaService;
    private static useLocal: boolean = false;

    static initialize(apiKey?: string, useLocalModel: boolean = false) {
        this.useLocal = useLocalModel;
        
        if (useLocalModel) {
            this.ollamaService = new OllamaService();
        } else if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else {
            throw new Error('Either API key or local model flag must be provided');
        }
    }

    /**
     * Splits text into overlapping chunks for better context preservation
     */
    static splitIntoChunks(
        text: string, 
        originalFileName: string, 
        campaignId: number
    ): DocumentChunk[] {
        if (!text || text.trim().length === 0) {
            throw new Error('Text content is empty');
        }

        const chunks: DocumentChunk[] = [];
        const cleanText = text.trim();
        let startIndex = 0;
        let chunkIndex = 0;

        while (startIndex < cleanText.length) {
            let endIndex = Math.min(startIndex + this.CHUNK_SIZE, cleanText.length);
            
            // Try to end at a sentence boundary if possible
            if (endIndex < cleanText.length) {
                const sentenceEnd = cleanText.lastIndexOf('.', endIndex);
                const questionEnd = cleanText.lastIndexOf('?', endIndex);
                const exclamationEnd = cleanText.lastIndexOf('!', endIndex);
                
                const maxSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
                
                // If we found a sentence boundary within reasonable range, use it
                if (maxSentenceEnd > startIndex + (this.CHUNK_SIZE * 0.7)) {
                    endIndex = maxSentenceEnd + 1;
                }
            }

            const chunkContent = cleanText.substring(startIndex, endIndex).trim();
            
            if (chunkContent.length > 0) {
                const chunkId = `chunk_${campaignId}_${chunkIndex}_${Date.now()}`;
                
                chunks.push({
                    id: chunkId,
                    content: chunkContent,
                    startIndex,
                    endIndex,
                    metadata: {
                        originalFileName,
                        chunkIndex,
                        totalChunks: 0, // Will be updated after all chunks are created
                        campaignId
                    }
                });
                
                chunkIndex++;
            }

            // Move start position with overlap
            startIndex = endIndex - this.OVERLAP_SIZE;
            
            // Ensure we don't go backwards
            const lastChunk = chunks[chunks.length - 1];
            if (lastChunk && startIndex <= lastChunk.startIndex) {
                startIndex = endIndex;
            }
        }

        // Update totalChunks in metadata
        const totalChunks = chunks.length;
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = totalChunks;
        });

        LoggerUtil.logServiceOperation('RAGUtil', 'splitIntoChunks', {
            originalFileName,
            campaignId,
            totalChunks: chunks.length,
            textLength: cleanText.length,
            avgChunkSize: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length
        });

        return chunks;
    }

    /**
     * Generates vector embeddings for document chunks using local or remote model
     */
    static async generateEmbeddings(chunks: DocumentChunk[]): Promise<VectorEmbedding[]> {
        if (!this.useLocal && !this.genAI) {
            throw new Error('RAGUtil not initialized. Call initialize() first.');
        }
        
        if (this.useLocal && !this.ollamaService) {
            throw new Error('Ollama service not initialized. Call initialize() with useLocalModel=true first.');
        }

        try {
            const embeddings: VectorEmbedding[] = [];

            const firstChunk = chunks[0];
            if (!firstChunk) {
                throw new Error('No chunks provided for embedding generation');
            }

            LoggerUtil.logServiceOperation('RAGUtil', 'generateEmbeddings', {
                chunkCount: chunks.length,
                campaignId: firstChunk.metadata.campaignId,
                usingLocalModel: this.useLocal
            });

            if (this.useLocal) {
                // Use Ollama local model for embeddings
                const chunkTexts = chunks.map(chunk => chunk.content);
                const vectors = await this.ollamaService.createEmbeddings(chunkTexts);
                
                chunks.forEach((chunk, index) => {
                    const vector = vectors[index];
                    if (!vector) {
                        throw new Error(`Missing vector for chunk ${index}`);
                    }
                    embeddings.push({
                        id: `embedding_${chunk.id}`,
                        vector,
                        chunk,
                        timestamp: new Date()
                    });
                });
            } else {
                // Use Gemini for embeddings
                const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
                
                // Process chunks in batches to avoid rate limits
                const batchSize = 5;
                for (let i = 0; i < chunks.length; i += batchSize) {
                    const batch = chunks.slice(i, i + batchSize);
                    
                    const batchPromises = batch.map(async (chunk) => {
                        try {
                            const result = await model.embedContent(chunk.content);
                            const vector = result.embedding.values;

                            return {
                                id: `embedding_${chunk.id}`,
                                vector,
                                chunk,
                                timestamp: new Date()
                            } as VectorEmbedding;
                        } catch (error) {
                            LoggerUtil.logServiceError('RAGUtil', 'generateEmbedding', error, {
                                chunkId: chunk.id,
                                campaignId: chunk.metadata.campaignId
                            });
                            throw error;
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);
                    embeddings.push(...batchResults);

                    // Small delay between batches to respect rate limits
                    if (i + batchSize < chunks.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }

            LoggerUtil.logServiceOperation('RAGUtil', 'generateEmbeddings - completed', {
                generatedEmbeddings: embeddings.length,
                campaignId: firstChunk.metadata.campaignId,
                avgVectorDimension: embeddings[0]?.vector.length || 0
            });

            return embeddings;
        } catch (error) {
            const firstChunk = chunks[0];
            LoggerUtil.logServiceError('RAGUtil', 'generateEmbeddings', error, {
                chunkCount: chunks.length,
                campaignId: firstChunk?.metadata.campaignId
            });
            throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Calculates cosine similarity between two vectors
     */
    static calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
        if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
            throw new Error('Vectors must be defined and have the same dimension');
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
}