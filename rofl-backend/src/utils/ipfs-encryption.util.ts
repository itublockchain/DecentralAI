import fs from "fs";
import crypto from "crypto";
import { PinataSDK } from "pinata";
import { LoggerUtil } from './logger.util';
import { VectorEmbedding } from './rag.util';

export interface EncryptedBlob {
    v: number;
    iv: string;
    ct: string;
    tag: string;
}

export interface IPFSVectorData {
    uuid: string;
    vectorCount: number;
    lastUpdated: string;
    vectors: Array<{
        id: string;
        vector: number[];
        chunk: {
            id: string;
            content: EncryptedBlob;
            startIndex: number;
            endIndex: number;
            metadata: {
                originalFileName: EncryptedBlob;
                chunkIndex: number;
                totalChunks: number;
                campaignId: number;
            };
        };
        timestamp: string;
    }>;
}

export class IPFSEncryptionUtil {
    private static pinata: PinataSDK;
    private static encryptionKey: Buffer;

    static initialize() {
        if (!process.env.PINATA_JWT) {
            throw new Error('PINATA_JWT environment variable is required');
        }

        if (!process.env.PINATA_GATEWAY) {
            throw new Error('PINATA_GATEWAY environment variable is required');
        }

        if (!process.env.PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY environment variable is required for encryption');
        }

        this.pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT,
            pinataGateway: process.env.PINATA_GATEWAY,
        });

        // Create encryption key from ROFL private key
        this.encryptionKey = crypto.createHash("sha256").update(process.env.PRIVATE_KEY).digest();

        LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'initialize', {
            pinataInitialized: true,
            gatewayConfigured: !!process.env.PINATA_GATEWAY,
            encryptionKeyGenerated: true
        });
    }

    /**
     * Encrypt a string using AES-256-GCM
     */
    private static encrypt(plaintext: string): EncryptedBlob {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);
        const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        
        return {
            v: 1,
            iv: iv.toString("base64"),
            ct: ct.toString("base64"),
            tag: tag.toString("base64"),
        };
    }

    /**
     * Decrypt an encrypted blob using AES-256-GCM
     */
    private static decrypt(blob: EncryptedBlob): string {
        const iv = Buffer.from(blob.iv, "base64");
        const ct = Buffer.from(blob.ct, "base64");
        const tag = Buffer.from(blob.tag, "base64");
        const decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey, iv);
        decipher.setAuthTag(tag);
        const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
        return pt.toString("utf8");
    }

    /**
     * Encrypt vector embeddings before IPFS upload
     */
    private static encryptVectors(vectors: VectorEmbedding[]): IPFSVectorData['vectors'] {
        return vectors.map(vector => ({
            id: vector.id,
            vector: vector.vector, // Vector numbers don't need encryption
            chunk: {
                id: vector.chunk.id,
                content: this.encrypt(vector.chunk.content), // Encrypt sensitive content
                startIndex: vector.chunk.startIndex,
                endIndex: vector.chunk.endIndex,
                metadata: {
                    originalFileName: this.encrypt(vector.chunk.metadata.originalFileName), // Encrypt filename
                    chunkIndex: vector.chunk.metadata.chunkIndex,
                    totalChunks: vector.chunk.metadata.totalChunks,
                    campaignId: vector.chunk.metadata.campaignId
                }
            },
            timestamp: vector.timestamp.toISOString()
        }));
    }

    /**
     * Decrypt vector embeddings after IPFS download
     */
    private static decryptVectors(encryptedVectors: IPFSVectorData['vectors']): VectorEmbedding[] {
        return encryptedVectors.map(vector => ({
            id: vector.id,
            vector: vector.vector,
            chunk: {
                id: vector.chunk.id,
                content: this.decrypt(vector.chunk.content), // Decrypt content
                startIndex: vector.chunk.startIndex,
                endIndex: vector.chunk.endIndex,
                metadata: {
                    originalFileName: this.decrypt(vector.chunk.metadata.originalFileName), // Decrypt filename
                    chunkIndex: vector.chunk.metadata.chunkIndex,
                    totalChunks: vector.chunk.metadata.totalChunks,
                    campaignId: vector.chunk.metadata.campaignId
                }
            },
            timestamp: new Date(vector.timestamp)
        }));
    }

    /**
     * Upload encrypted vector embeddings to IPFS
     */
    static async uploadVectorsToIPFS(vectorDbUuid: string, vectors: VectorEmbedding[]): Promise<string> {
        try {
            if (!this.pinata) {
                throw new Error('IPFSEncryptionUtil not initialized');
            }

            LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'uploadVectorsToIPFS - started', {
                vectorDbUuid,
                vectorCount: vectors.length
            });

            // Encrypt sensitive data
            const encryptedVectors = this.encryptVectors(vectors);

            // Prepare IPFS data structure
            const ipfsData: IPFSVectorData = {
                uuid: vectorDbUuid,
                vectorCount: vectors.length,
                lastUpdated: new Date().toISOString(),
                vectors: encryptedVectors
            };

            // Upload JSON directly to IPFS
            const upload = await this.pinata.upload.public.json(ipfsData);

            LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'uploadVectorsToIPFS - completed', {
                vectorDbUuid,
                vectorCount: vectors.length,
                ipfsHash: upload.cid,
                dataSize: JSON.stringify(ipfsData).length
            });

            return upload.cid;

        } catch (error) {
            LoggerUtil.logServiceError('IPFSEncryptionUtil', 'uploadVectorsToIPFS', error, {
                vectorDbUuid,
                vectorCount: vectors?.length
            });
            throw new Error(`Failed to upload vectors to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Download and decrypt vector embeddings from IPFS
     */
    static async downloadVectorsFromIPFS(ipfsHash: string): Promise<VectorEmbedding[]> {
        try {
            if (!this.pinata) {
                throw new Error('IPFSEncryptionUtil not initialized');
            }

            LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'downloadVectorsFromIPFS - started', {
                ipfsHash
            });

            // Download from IPFS
            const response = await this.pinata.gateways.public.get(ipfsHash);
            const ipfsData: IPFSVectorData = JSON.parse(response.data as string);

            // Validate data structure
            if (!ipfsData.vectors || !Array.isArray(ipfsData.vectors)) {
                throw new Error('Invalid IPFS vector data structure');
            }

            // Decrypt sensitive data
            const decryptedVectors = this.decryptVectors(ipfsData.vectors);

            LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'downloadVectorsFromIPFS - completed', {
                ipfsHash,
                vectorDbUuid: ipfsData.uuid,
                vectorCount: decryptedVectors.length,
                lastUpdated: ipfsData.lastUpdated
            });

            return decryptedVectors;

        } catch (error) {
            LoggerUtil.logServiceError('IPFSEncryptionUtil', 'downloadVectorsFromIPFS', error, {
                ipfsHash
            });
            throw new Error(`Failed to download vectors from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if IPFS hash exists and is accessible
     */
    static async verifyIPFSHash(ipfsHash: string): Promise<boolean> {
        try {
            if (!this.pinata) {
                throw new Error('IPFSEncryptionUtil not initialized');
            }

            const response = await this.pinata.gateways.public.get(ipfsHash);
            return !!response.data;

        } catch (error) {
            LoggerUtil.logServiceOperation('IPFSEncryptionUtil', 'verifyIPFSHash - not accessible', {
                ipfsHash,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Get IPFS hash metadata without downloading full content
     */
    static async getIPFSMetadata(ipfsHash: string): Promise<{
        uuid: string;
        vectorCount: number;
        lastUpdated: string;
    } | null> {
        try {
            if (!this.pinata) {
                throw new Error('IPFSEncryptionUtil not initialized');
            }

            const response = await this.pinata.gateways.public.get(ipfsHash);
            const ipfsData: IPFSVectorData = JSON.parse(response.data as string);

            return {
                uuid: ipfsData.uuid,
                vectorCount: ipfsData.vectorCount,
                lastUpdated: ipfsData.lastUpdated
            };

        } catch (error) {
            LoggerUtil.logServiceError('IPFSEncryptionUtil', 'getIPFSMetadata', error, {
                ipfsHash
            });
            return null;
        }
    }
}