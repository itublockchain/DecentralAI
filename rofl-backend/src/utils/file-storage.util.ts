import * as fs from 'fs';
import * as path from 'path';
import { VectorEmbedding } from './rag.util';
import { LoggerUtil } from './logger.util';

export class FileStorageUtil {
    private static readonly STORAGE_DIR = path.join(process.cwd(), 'storage', 'vectors');
    
    /**
     * Ensure storage directory exists
     */
    static ensureStorageDir(): void {
        try {
            if (!fs.existsSync(this.STORAGE_DIR)) {
                fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
                LoggerUtil.logServiceOperation('FileStorageUtil', 'ensureStorageDir', {
                    storageDir: this.STORAGE_DIR,
                    created: true
                });
            }
        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'ensureStorageDir', error);
            throw new Error('Failed to create storage directory');
        }
    }

    /**
     * Save vectors to file with UUID-based naming
     */
    static async saveVectorsByUUID(uuid: string, vectors: VectorEmbedding[]): Promise<void> {
        try {
            this.ensureStorageDir();
            
            const filename = `${uuid}.json`;
            const filepath = path.join(this.STORAGE_DIR, filename);
            
            // Serialize vectors to JSON with metadata
            const data = {
                uuid,
                vectorCount: vectors.length,
                lastUpdated: new Date().toISOString(),
                vectors: vectors.map(v => ({
                    id: v.id,
                    vector: v.vector,
                    chunk: {
                        id: v.chunk.id,
                        content: v.chunk.content,
                        startIndex: v.chunk.startIndex,
                        endIndex: v.chunk.endIndex,
                        metadata: v.chunk.metadata
                    },
                    timestamp: v.timestamp
                }))
            };

            const jsonData = JSON.stringify(data, null, 2);
            await fs.promises.writeFile(filepath, jsonData, 'utf8');

            LoggerUtil.logServiceOperation('FileStorageUtil', 'saveVectorsByUUID', {
                uuid,
                vectorCount: vectors.length,
                filepath,
                fileSizeKB: Math.round(jsonData.length / 1024)
            });

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'saveVectorsByUUID', error, {
                uuid,
                vectorCount: vectors?.length
            });
            throw new Error(`Failed to save vectors for UUID ${uuid}`);
        }
    }

    /**
     * Load vectors by UUID
     */
    static async loadVectorsByUUID(uuid: string): Promise<VectorEmbedding[]> {
        try {
            const filename = `${uuid}.json`;
            const filepath = path.join(this.STORAGE_DIR, filename);

            // Check if file exists
            if (!fs.existsSync(filepath)) {
                LoggerUtil.logServiceOperation('FileStorageUtil', 'loadVectorsByUUID - file not found', {
                    uuid,
                    filepath
                });
                return [];
            }

            const jsonData = await fs.promises.readFile(filepath, 'utf8');
            const data = JSON.parse(jsonData);

            // Validate data structure
            if (!data.vectors || !Array.isArray(data.vectors)) {
                throw new Error('Invalid vector data structure');
            }

            // Reconstruct VectorEmbedding objects
            const vectors: VectorEmbedding[] = data.vectors.map((v: any) => ({
                id: v.id,
                vector: v.vector,
                chunk: {
                    id: v.chunk.id,
                    content: v.chunk.content,
                    startIndex: v.chunk.startIndex,
                    endIndex: v.chunk.endIndex,
                    metadata: v.chunk.metadata
                },
                timestamp: new Date(v.timestamp)
            }));

            LoggerUtil.logServiceOperation('FileStorageUtil', 'loadVectorsByUUID', {
                uuid,
                vectorCount: vectors.length,
                filepath,
                lastUpdated: data.lastUpdated
            });

            return vectors;

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'loadVectorsByUUID', error, {
                uuid
            });
            
            // If file is corrupted, log warning and return empty array
            if (error instanceof SyntaxError) {
                LoggerUtil.logServiceError('FileStorageUtil', 'loadVectorsByUUID - corrupted file', error, {
                    uuid
                });
                return [];
            }
            
            throw new Error(`Failed to load vectors for UUID ${uuid}`);
        }
    }

    /**
     * Save campaign vectors to file (UUID-based)
     */
    static async saveCampaignVectors(vectorDbUuid: string, vectors: VectorEmbedding[]): Promise<void> {
        return this.saveVectorsByUUID(vectorDbUuid, vectors);
    }

    /**
     * Load campaign vectors from file (UUID-based)
     */
    static async loadCampaignVectors(vectorDbUuid: string): Promise<VectorEmbedding[]> {
        return this.loadVectorsByUUID(vectorDbUuid);
    }

    /**
     * Delete campaign vectors file (UUID-based)
     */
    static async deleteCampaignVectors(vectorDbUuid: string): Promise<void> {
        try {
            const filename = `${vectorDbUuid}.json`;
            const filepath = path.join(this.STORAGE_DIR, filename);

            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
                LoggerUtil.logServiceOperation('FileStorageUtil', 'deleteCampaignVectors', {
                    vectorDbUuid,
                    filepath,
                    deleted: true
                });
            }

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'deleteCampaignVectors', error, {
                vectorDbUuid
            });
            throw new Error(`Failed to delete vectors for UUID ${vectorDbUuid}`);
        }
    }

    /**
     * Load campaign vectors from file (legacy campaignId-based)
     */
    static async loadCampaignVectorsLegacy(campaignId: number): Promise<VectorEmbedding[]> {
        try {
            const filename = `campaign_${campaignId}_vectors.json`;
            const filepath = path.join(this.STORAGE_DIR, filename);

            // Check if file exists
            if (!fs.existsSync(filepath)) {
                LoggerUtil.logServiceOperation('FileStorageUtil', 'loadCampaignVectors - file not found', {
                    campaignId,
                    filepath
                });
                return [];
            }

            const jsonData = await fs.promises.readFile(filepath, 'utf8');
            const data = JSON.parse(jsonData);

            // Validate data structure
            if (!data.vectors || !Array.isArray(data.vectors)) {
                throw new Error('Invalid vector data structure');
            }

            // Reconstruct VectorEmbedding objects
            const vectors: VectorEmbedding[] = data.vectors.map((v: any) => ({
                id: v.id,
                vector: v.vector,
                chunk: {
                    id: v.chunk.id,
                    content: v.chunk.content,
                    startIndex: v.chunk.startIndex,
                    endIndex: v.chunk.endIndex,
                    metadata: v.chunk.metadata
                },
                timestamp: new Date(v.timestamp)
            }));

            LoggerUtil.logServiceOperation('FileStorageUtil', 'loadCampaignVectors', {
                campaignId,
                vectorCount: vectors.length,
                filepath,
                lastUpdated: data.lastUpdated
            });

            return vectors;

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'loadCampaignVectors', error, {
                campaignId
            });
            
            // If file is corrupted, log warning and return empty array
            if (error instanceof SyntaxError) {
                LoggerUtil.logServiceError('FileStorageUtil', 'loadCampaignVectors - corrupted file', error, {
                    campaignId
                });
                return [];
            }
            
            throw new Error(`Failed to load vectors for campaign ${campaignId}`);
        }
    }

    /**
     * Delete campaign vectors file (legacy campaignId-based)
     */
    static async deleteCampaignVectorsLegacy(campaignId: number): Promise<void> {
        try {
            const filename = `campaign_${campaignId}_vectors.json`;
            const filepath = path.join(this.STORAGE_DIR, filename);

            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
                LoggerUtil.logServiceOperation('FileStorageUtil', 'deleteCampaignVectorsLegacy', {
                    campaignId,
                    filepath,
                    deleted: true
                });
            }

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'deleteCampaignVectorsLegacy', error, {
                campaignId
            });
            throw new Error(`Failed to delete vectors for campaign ${campaignId}`);
        }
    }

    /**
     * List all campaign vector files
     */
    static async listCampaignFiles(): Promise<Array<{ campaignId: number; filename: string; size: number; lastModified: Date }>> {
        try {
            this.ensureStorageDir();
            
            const files = await fs.promises.readdir(this.STORAGE_DIR);
            const vectorFiles = files.filter(file => file.startsWith('campaign_') && file.endsWith('_vectors.json'));
            
            const fileInfos = await Promise.all(
                vectorFiles.map(async (filename) => {
                    const filepath = path.join(this.STORAGE_DIR, filename);
                    const stats = await fs.promises.stat(filepath);
                    
                    // Extract campaign ID from filename
                    const match = filename.match(/campaign_(\d+)_vectors\.json/);
                    const campaignId = match ? parseInt(match[1] || '0', 10) : 0;
                    
                    return {
                        campaignId,
                        filename,
                        size: stats.size,
                        lastModified: stats.mtime
                    };
                })
            );

            return fileInfos.sort((a, b) => a.campaignId - b.campaignId);

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'listCampaignFiles', error);
            throw new Error('Failed to list campaign files');
        }
    }

    /**
     * Get storage directory info
     */
    static async getStorageInfo(): Promise<{
        storageDir: string;
        totalFiles: number;
        totalSizeBytes: number;
        campaigns: number[];
    }> {
        try {
            const files = await this.listCampaignFiles();
            const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
            const campaigns = files.map(file => file.campaignId);

            return {
                storageDir: this.STORAGE_DIR,
                totalFiles: files.length,
                totalSizeBytes,
                campaigns
            };

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'getStorageInfo', error);
            throw new Error('Failed to get storage info');
        }
    }

    /**
     * Backup campaign vectors with timestamp (legacy campaignId-based)
     */
    static async backupCampaignVectorsLegacy(campaignId: number): Promise<string> {
        try {
            const vectors = await this.loadCampaignVectorsLegacy(campaignId);
            if (vectors.length === 0) {
                throw new Error('No vectors to backup');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `campaign_${campaignId}_vectors_backup_${timestamp}.json`;
            const backupPath = path.join(this.STORAGE_DIR, 'backups');
            
            // Ensure backup directory exists
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            const backupFilepath = path.join(backupPath, backupFilename);
            
            const data = {
                campaignId,
                vectorCount: vectors.length,
                backupDate: new Date().toISOString(),
                vectors: vectors.map(v => ({
                    id: v.id,
                    vector: v.vector,
                    chunk: v.chunk,
                    timestamp: v.timestamp
                }))
            };

            await fs.promises.writeFile(backupFilepath, JSON.stringify(data, null, 2), 'utf8');

            LoggerUtil.logServiceOperation('FileStorageUtil', 'backupCampaignVectors', {
                campaignId,
                backupFilepath,
                vectorCount: vectors.length
            });

            return backupFilepath;

        } catch (error) {
            LoggerUtil.logServiceError('FileStorageUtil', 'backupCampaignVectors', error, {
                campaignId
            });
            throw new Error(`Failed to backup vectors for campaign ${campaignId}`);
        }
    }
}