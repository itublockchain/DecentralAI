import { VectorEmbedding, DocumentChunk } from './rag.util';
import { LoggerUtil } from './logger.util';
import { FileStorageUtil } from './file-storage.util';

export interface SearchResult {
    embedding: VectorEmbedding;
    similarity: number;
}

export class VectorStore {
    private static instance: VectorStore;
    private vectors: Map<number, VectorEmbedding[]> = new Map(); // campaignId -> embeddings (in-memory cache)
    private loadedCampaigns: Set<number> = new Set(); // Track which campaigns are loaded in memory

    private constructor() {
        // Initialize storage directory
        FileStorageUtil.ensureStorageDir();
    }

    static getInstance(): VectorStore {
        if (!VectorStore.instance) {
            VectorStore.instance = new VectorStore();
        }
        return VectorStore.instance;
    }

    /**
     * Stores vector embeddings for a campaign (both memory and file system)
     */
    async storeEmbeddings(campaignId: number, embeddings: VectorEmbedding[]): Promise<void> {
        try {
            if (!embeddings || embeddings.length === 0) {
                throw new Error('No embeddings provided');
            }

            // Ensure campaign is loaded in memory
            await this.ensureCampaignLoaded(campaignId);

            // Get existing embeddings for campaign or initialize empty array
            const existingEmbeddings = this.vectors.get(campaignId) || [];
            
            // Add new embeddings
            const updatedEmbeddings = [...existingEmbeddings, ...embeddings];
            
            // Update in-memory cache
            this.vectors.set(campaignId, updatedEmbeddings);
            
            // Save to file system
            await FileStorageUtil.saveCampaignVectors(campaignId, updatedEmbeddings);

            LoggerUtil.logServiceOperation('VectorStore', 'storeEmbeddings', {
                campaignId,
                newEmbeddings: embeddings.length,
                totalEmbeddings: updatedEmbeddings.length,
                vectorDimension: embeddings[0]?.vector.length || 0,
                persistedToFile: true
            });
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'storeEmbeddings', error, {
                campaignId,
                embeddingCount: embeddings?.length
            });
            throw new Error(`Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Ensure campaign vectors are loaded in memory
     */
    private async ensureCampaignLoaded(campaignId: number): Promise<void> {
        if (!this.loadedCampaigns.has(campaignId)) {
            try {
                const vectors = await FileStorageUtil.loadCampaignVectors(campaignId);
                this.vectors.set(campaignId, vectors);
                this.loadedCampaigns.add(campaignId);
                
                LoggerUtil.logServiceOperation('VectorStore', 'ensureCampaignLoaded', {
                    campaignId,
                    loadedVectors: vectors.length
                });
            } catch (error) {
                LoggerUtil.logServiceError('VectorStore', 'ensureCampaignLoaded', error, {
                    campaignId
                });
                // Set empty array if loading fails
                this.vectors.set(campaignId, []);
                this.loadedCampaigns.add(campaignId);
            }
        }
    }

    /**
     * Searches for similar vectors using cosine similarity
     */
    async searchSimilar(
        campaignId: number, 
        queryVector: number[], 
        topK: number = 5,
        minSimilarity: number = 0.1
    ): Promise<SearchResult[]> {
        try {
            // Ensure campaign is loaded in memory
            await this.ensureCampaignLoaded(campaignId);
            
            const campaignEmbeddings = this.vectors.get(campaignId);
            
            if (!campaignEmbeddings || campaignEmbeddings.length === 0) {
                LoggerUtil.logServiceOperation('VectorStore', 'searchSimilar - no embeddings', {
                    campaignId,
                    queryVectorLength: queryVector.length
                });
                return [];
            }

            const results: SearchResult[] = [];

            // Calculate similarity for each embedding
            for (const embedding of campaignEmbeddings) {
                const similarity = this.calculateCosineSimilarity(queryVector, embedding.vector);
                
                if (similarity >= minSimilarity) {
                    results.push({
                        embedding,
                        similarity
                    });
                }
            }

            // Sort by similarity (highest first) and take top K
            results.sort((a, b) => b.similarity - a.similarity);
            const topResults = results.slice(0, topK);

            LoggerUtil.logServiceOperation('VectorStore', 'searchSimilar', {
                campaignId,
                totalEmbeddings: campaignEmbeddings.length,
                matchingResults: results.length,
                topKResults: topResults.length,
                topSimilarity: topResults[0]?.similarity || 0
            });

            return topResults;
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'searchSimilar', error, {
                campaignId,
                queryVectorLength: queryVector.length,
                topK,
                minSimilarity
            });
            throw new Error(`Failed to search similar vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets all embeddings for a campaign
     */
    async getCampaignEmbeddings(campaignId: number): Promise<VectorEmbedding[]> {
        await this.ensureCampaignLoaded(campaignId);
        return this.vectors.get(campaignId) || [];
    }

    /**
     * Gets statistics for a campaign's embeddings
     */
    async getCampaignStats(campaignId: number): Promise<{
        totalEmbeddings: number;
        totalChunks: number;
        avgVectorDimension: number;
        files: string[];
    }> {
        await this.ensureCampaignLoaded(campaignId);
        const embeddings = this.vectors.get(campaignId) || [];
        
        const uniqueFiles = new Set<string>();
        let totalDimensions = 0;

        embeddings.forEach(embedding => {
            uniqueFiles.add(embedding.chunk.metadata.originalFileName);
            totalDimensions += embedding.vector.length;
        });

        return {
            totalEmbeddings: embeddings.length,
            totalChunks: embeddings.length, // Each embedding corresponds to one chunk
            avgVectorDimension: embeddings.length > 0 ? totalDimensions / embeddings.length : 0,
            files: Array.from(uniqueFiles)
        };
    }

    /**
     * Clears all embeddings for a campaign (memory and file system)
     */
    async clearCampaign(campaignId: number): Promise<void> {
        try {
            // Clear from memory
            this.vectors.delete(campaignId);
            this.loadedCampaigns.delete(campaignId);
            
            // Delete from file system
            await FileStorageUtil.deleteCampaignVectors(campaignId);
            
            LoggerUtil.logServiceOperation('VectorStore', 'clearCampaign', { 
                campaignId,
                clearedFromMemory: true,
                clearedFromFile: true
            });
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'clearCampaign', error, { campaignId });
            throw new Error(`Failed to clear campaign ${campaignId}`);
        }
    }

    /**
     * Gets total storage statistics
     */
    getStorageStats(): {
        totalCampaigns: number;
        totalEmbeddings: number;
        memoryUsageEstimate: string;
    } {
        let totalEmbeddings = 0;
        let totalVectorElements = 0;

        this.vectors.forEach(embeddings => {
            totalEmbeddings += embeddings.length;
            embeddings.forEach(embedding => {
                totalVectorElements += embedding.vector.length;
            });
        });

        // Rough memory estimate (each float ~8 bytes + object overhead)
        const memoryBytes = totalVectorElements * 8 + totalEmbeddings * 1000; // 1KB overhead per embedding
        const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

        return {
            totalCampaigns: this.vectors.size,
            totalEmbeddings,
            memoryUsageEstimate: `${memoryMB} MB`
        };
    }

    private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
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