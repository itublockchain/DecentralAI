import { LoggerUtil } from './logger.util';

export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaEmbedResponse {
    embedding: number[];
}

export class OllamaService {
    private baseUrl: string;
    private generationModel: string;
    private embeddingModel: string;

    constructor(
        baseUrl: string = 'http://localhost:11434',
        generationModel: string = 'llama3.1:8b',
        embeddingModel: string = 'nomic-embed-text'
    ) {
        this.baseUrl = baseUrl;
        this.generationModel = generationModel;
        this.embeddingModel = embeddingModel;
    }

    /**
     * Check if Ollama service is running
     */
    async isServiceRunning(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            LoggerUtil.logServiceError('OllamaService', 'isServiceRunning', error);
            return false;
        }
    }

    /**
     * Generate text response using local model
     */
    async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const isRunning = await this.isServiceRunning();
            if (!isRunning) {
                throw new Error('Ollama service is not running. Please start it with: brew services start ollama');
            }

            const requestBody = {
                model: this.generationModel,
                prompt: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:` : prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 2048
                }
            };

            LoggerUtil.logServiceOperation('OllamaService', 'generateResponse', {
                model: this.generationModel,
                promptLength: prompt.length,
                hasSystemPrompt: !!systemPrompt
            });

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json() as OllamaGenerateResponse;

            LoggerUtil.logServiceOperation('OllamaService', 'generateResponse - completed', {
                model: this.generationModel,
                responseLength: result.response.length,
                totalDuration: result.total_duration,
                evalCount: result.eval_count
            });

            return result.response.trim();
        } catch (error) {
            LoggerUtil.logServiceError('OllamaService', 'generateResponse', error, {
                model: this.generationModel,
                promptLength: prompt.length
            });
            throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embedding for text using local embedding model
     */
    async createEmbedding(text: string): Promise<number[]> {
        try {
            const isRunning = await this.isServiceRunning();
            if (!isRunning) {
                throw new Error('Ollama service is not running. Please start it with: brew services start ollama');
            }

            const requestBody = {
                model: this.embeddingModel,
                prompt: text.trim()
            };

            LoggerUtil.logServiceOperation('OllamaService', 'createEmbedding', {
                model: this.embeddingModel,
                textLength: text.length
            });

            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama embedding API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json() as OllamaEmbedResponse;

            LoggerUtil.logServiceOperation('OllamaService', 'createEmbedding - completed', {
                model: this.embeddingModel,
                vectorDimension: result.embedding.length
            });

            return result.embedding;
        } catch (error) {
            LoggerUtil.logServiceError('OllamaService', 'createEmbedding', error, {
                model: this.embeddingModel,
                textLength: text.length
            });
            throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embeddings for multiple texts in batch
     */
    async createEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        
        // Process in smaller batches to avoid overwhelming local service
        const batchSize = 3;
        
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            
            const batchPromises = batch.map(text => this.createEmbedding(text));
            const batchResults = await Promise.all(batchPromises);
            
            embeddings.push(...batchResults);
            
            // Small delay between batches for local processing
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        return embeddings;
    }

    /**
     * List available models
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const result = await response.json() as { models?: Array<{ name: string }> };
            return result.models?.map(model => model.name) || [];
        } catch (error) {
            LoggerUtil.logServiceError('OllamaService', 'listModels', error);
            throw error;
        }
    }

    /**
     * Get model information
     */
    getModelInfo() {
        return {
            generationModel: this.generationModel,
            embeddingModel: this.embeddingModel,
            baseUrl: this.baseUrl
        };
    }
}