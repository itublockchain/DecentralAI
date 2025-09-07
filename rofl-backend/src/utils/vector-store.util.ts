import { VectorEmbedding, DocumentChunk } from './rag.util';
import { LoggerUtil } from './logger.util';
import { FileStorageUtil } from './file-storage.util';
import { IPFSEncryptionUtil } from './ipfs-encryption.util';

export interface SearchResult {
    embedding: VectorEmbedding;
    similarity: number;
}

export class VectorStore {
    private static instance: VectorStore;
    private vectors: Map<string, VectorEmbedding[]> = new Map(); // vectorDbUuid -> embeddings (in-memory cache)
    private loadedCampaigns: Set<string> = new Set(); // Track which campaigns are loaded in memory
    private ipfsHashes: Map<string, string> = new Map(); // vectorDbUuid -> IPFS hash
    private useIPFS: boolean = false;

    private constructor() {
        // Initialize storage directory for local fallback
        FileStorageUtil.ensureStorageDir();
        
        // Check if IPFS should be used
        this.useIPFS = process.env.USE_IPFS_STORAGE === 'true';
        
        if (this.useIPFS) {
            try {
                IPFSEncryptionUtil.initialize();
                LoggerUtil.logServiceOperation('VectorStore', 'constructor', {
                    ipfsEnabled: true,
                    storageMode: 'ipfs-encrypted'
                });
            } catch (error) {
                LoggerUtil.logServiceError('VectorStore', 'constructor - IPFS init failed', error);
                this.useIPFS = false;
                LoggerUtil.logServiceOperation('VectorStore', 'constructor', {
                    ipfsEnabled: false,
                    storageMode: 'local-file',
                    fallbackReason: 'IPFS initialization failed'
                });
            }
        } else {
            LoggerUtil.logServiceOperation('VectorStore', 'constructor', {
                ipfsEnabled: false,
                storageMode: 'local-file'
            });
        }
    }

    static getInstance(): VectorStore {
        if (!VectorStore.instance) {
            VectorStore.instance = new VectorStore();
        }
        return VectorStore.instance;
    }

    /**
     * Stores vector embeddings for a campaign (memory + IPFS/file system)
     */
    async storeEmbeddings(vectorDbUuid: string, embeddings: VectorEmbedding[]): Promise<void> {
        try {
            if (!embeddings || embeddings.length === 0) {
                throw new Error('No embeddings provided');
            }

            // Ensure campaign is loaded in memory
            await this.ensureCampaignLoaded(vectorDbUuid);

            // Get existing embeddings for campaign or initialize empty array
            const existingEmbeddings = this.vectors.get(vectorDbUuid) || [];
            
            // Add new embeddings
            const updatedEmbeddings = [...existingEmbeddings, ...embeddings];
            
            // Update in-memory cache
            this.vectors.set(vectorDbUuid, updatedEmbeddings);
            
            // Save to storage (IPFS or local file)
            if (this.useIPFS) {
                try {
                    const ipfsHash = await IPFSEncryptionUtil.uploadVectorsToIPFS(vectorDbUuid, updatedEmbeddings);
                    this.ipfsHashes.set(vectorDbUuid, ipfsHash);
                    
                    LoggerUtil.logServiceOperation('VectorStore', 'storeEmbeddings', {
                        vectorDbUuid,
                        newEmbeddings: embeddings.length,
                        totalEmbeddings: updatedEmbeddings.length,
                        vectorDimension: embeddings[0]?.vector.length || 0,
                        persistedToIPFS: true,
                        ipfsHash: ipfsHash
                    });
                } catch (ipfsError) {
                    LoggerUtil.logServiceError('VectorStore', 'storeEmbeddings - IPFS failed, using local fallback', ipfsError, {
                        vectorDbUuid
                    });
                    // Fallback to local storage
                    await FileStorageUtil.saveCampaignVectors(vectorDbUuid, updatedEmbeddings);
                    
                    LoggerUtil.logServiceOperation('VectorStore', 'storeEmbeddings', {
                        vectorDbUuid,
                        newEmbeddings: embeddings.length,
                        totalEmbeddings: updatedEmbeddings.length,
                        vectorDimension: embeddings[0]?.vector.length || 0,
                        persistedToFile: true,
                        fallbackUsed: true
                    });
                }
            } else {
                // Use local file storage
                await FileStorageUtil.saveCampaignVectors(vectorDbUuid, updatedEmbeddings);
                
                LoggerUtil.logServiceOperation('VectorStore', 'storeEmbeddings', {
                    vectorDbUuid,
                    newEmbeddings: embeddings.length,
                    totalEmbeddings: updatedEmbeddings.length,
                    vectorDimension: embeddings[0]?.vector.length || 0,
                    persistedToFile: true
                });
            }
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'storeEmbeddings', error, {
                vectorDbUuid,
                embeddingCount: embeddings?.length
            });
            throw new Error(`Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Ensure campaign vectors are loaded in memory
     */
    private async ensureCampaignLoaded(vectorDbUuid: string): Promise<void> {
        if (!this.loadedCampaigns.has(vectorDbUuid)) {
            try {
                let vectors: VectorEmbedding[] = [];
                
                if (this.useIPFS) {
                    // Try to load from IPFS first
                    const ipfsHash = this.ipfsHashes.get(vectorDbUuid);
                    if (ipfsHash) {
                        try {
                            vectors = await IPFSEncryptionUtil.downloadVectorsFromIPFS(ipfsHash);
                            LoggerUtil.logServiceOperation('VectorStore', 'ensureCampaignLoaded', {
                                vectorDbUuid,
                                loadedVectors: vectors.length,
                                source: 'ipfs',
                                ipfsHash
                            });
                        } catch (ipfsError) {
                            LoggerUtil.logServiceError('VectorStore', 'ensureCampaignLoaded - IPFS failed, trying local', ipfsError, {
                                vectorDbUuid,
                                ipfsHash
                            });
                            // Fallback to local storage
                            vectors = await FileStorageUtil.loadCampaignVectors(vectorDbUuid);
                            LoggerUtil.logServiceOperation('VectorStore', 'ensureCampaignLoaded', {
                                vectorDbUuid,
                                loadedVectors: vectors.length,
                                source: 'local-fallback'
                            });
                        }
                    } else {
                        // No IPFS hash, try local storage
                        vectors = await FileStorageUtil.loadCampaignVectors(vectorDbUuid);
                        LoggerUtil.logServiceOperation('VectorStore', 'ensureCampaignLoaded', {
                            vectorDbUuid,
                            loadedVectors: vectors.length,
                            source: 'local'
                        });
                    }
                } else {
                    // Use local file storage
                    vectors = await FileStorageUtil.loadCampaignVectors(vectorDbUuid);
                    LoggerUtil.logServiceOperation('VectorStore', 'ensureCampaignLoaded', {
                        vectorDbUuid,
                        loadedVectors: vectors.length,
                        source: 'local'
                    });
                }
                
                this.vectors.set(vectorDbUuid, vectors);
                this.loadedCampaigns.add(vectorDbUuid);
                
            } catch (error) {
                LoggerUtil.logServiceError('VectorStore', 'ensureCampaignLoaded', error, {
                    vectorDbUuid
                });
                // Set empty array if loading fails
                this.vectors.set(vectorDbUuid, []);
                this.loadedCampaigns.add(vectorDbUuid);
            }
        }
    }

    /**
     * Searches for similar vectors using cosine similarity
     */
    async searchSimilar(
        vectorDbUuid: string, 
        queryVector: number[], 
        topK: number = 5,
        minSimilarity: number = 0.1
    ): Promise<SearchResult[]> {
        try {
            // Ensure campaign is loaded in memory
            await this.ensureCampaignLoaded(vectorDbUuid);
            
            const campaignEmbeddings = this.vectors.get(vectorDbUuid);
            
            if (!campaignEmbeddings || campaignEmbeddings.length === 0) {
                LoggerUtil.logServiceOperation('VectorStore', 'searchSimilar - no embeddings', {
                    vectorDbUuid,
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
                vectorDbUuid,
                totalEmbeddings: campaignEmbeddings.length,
                matchingResults: results.length,
                topKResults: topResults.length,
                topSimilarity: topResults[0]?.similarity || 0
            });

            return topResults;
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'searchSimilar', error, {
                vectorDbUuid,
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
    async getCampaignEmbeddings(vectorDbUuid: string): Promise<VectorEmbedding[]> {
        await this.ensureCampaignLoaded(vectorDbUuid);
        return this.vectors.get(vectorDbUuid) || [];
    }

    /**
     * Gets statistics for a campaign's embeddings
     */
    async getCampaignStats(vectorDbUuid: string): Promise<{
        totalEmbeddings: number;
        totalChunks: number;
        avgVectorDimension: number;
        files: string[];
    }> {
        await this.ensureCampaignLoaded(vectorDbUuid);
        const embeddings = this.vectors.get(vectorDbUuid) || [];
        
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
     * Set IPFS hash for a campaign (when loaded from external source)
     */
    setIPFSHash(vectorDbUuid: string, ipfsHash: string): void {
        this.ipfsHashes.set(vectorDbUuid, ipfsHash);
        LoggerUtil.logServiceOperation('VectorStore', 'setIPFSHash', {
            vectorDbUuid,
            ipfsHash
        });
    }

    /**
     * Get IPFS hash for a campaign
     */
    getIPFSHash(vectorDbUuid: string): string | undefined {
        return this.ipfsHashes.get(vectorDbUuid);
    }

    /**
     * Load campaign from IPFS hash
     */
    async loadFromIPFS(vectorDbUuid: string, ipfsHash: string): Promise<void> {
        try {
            if (!this.useIPFS) {
                throw new Error('IPFS is not enabled');
            }

            const vectors = await IPFSEncryptionUtil.downloadVectorsFromIPFS(ipfsHash);
            
            // Update cache
            this.vectors.set(vectorDbUuid, vectors);
            this.loadedCampaigns.add(vectorDbUuid);
            this.ipfsHashes.set(vectorDbUuid, ipfsHash);

            LoggerUtil.logServiceOperation('VectorStore', 'loadFromIPFS', {
                vectorDbUuid,
                ipfsHash,
                loadedVectors: vectors.length
            });
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'loadFromIPFS', error, {
                vectorDbUuid,
                ipfsHash
            });
            throw new Error(`Failed to load campaign from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Clears all embeddings for a campaign (memory and storage)
     */
    async clearCampaign(vectorDbUuid: string): Promise<void> {
        try {
            // Clear from memory
            this.vectors.delete(vectorDbUuid);
            this.loadedCampaigns.delete(vectorDbUuid);
            this.ipfsHashes.delete(vectorDbUuid);
            
            // Delete from local file system (IPFS files are immutable, so no deletion needed)
            await FileStorageUtil.deleteCampaignVectors(vectorDbUuid);
            
            LoggerUtil.logServiceOperation('VectorStore', 'clearCampaign', { 
                vectorDbUuid,
                clearedFromMemory: true,
                clearedFromFile: true,
                clearedIPFSHash: true
            });
        } catch (error) {
            LoggerUtil.logServiceError('VectorStore', 'clearCampaign', error, { vectorDbUuid });
            throw new Error(`Failed to clear campaign ${vectorDbUuid}`);
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