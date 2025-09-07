export enum Category {
    Health = 0,
    Financial = 1,
    Education = 2,
    Technology = 3,
    Other = 4
}

export interface ModelCampaignRequest {
    name: string;
    description: string;
    owner: string; // wallet address
    category: Category;
    in_token_price: string; // wei string
    out_token_price: string; // wei string
    file: Express.Multer.File;
}

export interface ModelCampaignResponse {
    success: boolean;
    message: string;
    data: {
        campaignId: number;
        vectorStoreId: string; // UUID
        vectorDbCid: string; // IPFS hash or UUID
        transactionHash: string;
        initialDataTokens: number;
        processingInfo: {
            totalChunks: number;
            totalEmbeddings: number;
            vectorDimension: number;
        };
        ipfsEnabled: boolean;
    };
}

export interface CreateCampaignContractArgs {
    name: string;
    description: string;
    vector_db_cid: string; // IPFS hash or UUID
    owner: string; // address
    category: Category;
    in_token_price: bigint;
    out_token_price: bigint;
    initial_data_token: bigint;
}