import { 
    createWalletClient, 
    http, 
    createPublicClient,
    parseEther,
    formatEther,
    getContract 
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { LoggerUtil } from './logger.util';
import { CreateCampaignContractArgs } from '../types/campaign.types';

// Full Contract ABI
const CONTRACT_ABI = [
    {
        inputs: [
            {
                internalType: "address",
                name: "rofl",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address"
            }
        ],
        name: "SafeERC20FailedOperation",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "in_token",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "out_token",
                type: "uint256"
            },
            {
                internalType: "address",
                name: "user",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "campaignId",
                type: "uint256"
            }
        ],
        name: "chat",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "campaignId",
                type: "uint256"
            },
            {
                internalType: "address",
                name: "contributer",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "data_token_amount",
                type: "uint256"
            }
        ],
        name: "contribute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "name",
                type: "string"
            },
            {
                internalType: "string",
                name: "description",
                type: "string"
            },
            {
                internalType: "string",
                name: "vector_db_cid",
                type: "string"
            },
            {
                internalType: "address",
                name: "owner",
                type: "address"
            },
            {
                internalType: "enum main.Category",
                name: "category",
                type: "uint8"
            },
            {
                internalType: "uint256",
                name: "in_token_price",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "out_token_price",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "initial_data_token",
                type: "uint256"
            }
        ],
        name: "createCampaign",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "campaignId",
                type: "uint256"
            }
        ],
        name: "getCampaign",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string"
            },
            {
                internalType: "string",
                name: "",
                type: "string"
            },
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "enum main.Category",
                name: "",
                type: "uint8"
            },
            {
                internalType: "string",
                name: "",
                type: "string"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "user",
                type: "address"
            }
        ],
        name: "getUser",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "uint256[]",
                name: "",
                type: "uint256[]"
            },
            {
                internalType: "uint256[]",
                name: "",
                type: "uint256[]"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "get_campaigns_length",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "stake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "usdc",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "campaignId",
                type: "uint256"
            },
            {
                internalType: "string",
                name: "cid",
                type: "string"
            }
        ],
        name: "vector_db_update",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;

export class BlockchainUtil {
    private static readonly CONTRACT_ADDRESS = '0xA170FC226053a347106a017Eba688A6193137cc3' as const;
    private static walletClient: any;
    private static publicClient: any;

    /**
     * Initialize blockchain clients
     */
    static initialize() {
        try {
            if (!process.env.PRIVATE_KEY) {
                throw new Error('PRIVATE_KEY environment variable is required');
            }

            if (!process.env.ALCHEMY_API_KEY) {
                throw new Error('ALCHEMY_API_KEY environment variable is required');
            }

            // Create account from private key
            const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY.replace('0x', '')}`);

            // Create wallet client for transactions
            this.walletClient = createWalletClient({
                account,
                chain: sepolia,
                transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
            });

            // Create public client for reading
            this.publicClient = createPublicClient({
                chain: sepolia,
                transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
            });

            LoggerUtil.logServiceOperation('BlockchainUtil', 'initialize', {
                account: account.address,
                chainId: sepolia.id,
                contractAddress: this.CONTRACT_ADDRESS
            });

        } catch (error) {
            LoggerUtil.logServiceError('BlockchainUtil', 'initialize', error);
            throw new Error(`Failed to initialize blockchain clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create a new campaign on the blockchain
     */
    static async createCampaign(args: CreateCampaignContractArgs): Promise<string> {
        try {
            if (!this.walletClient || !this.publicClient) {
                this.initialize();
            }

            LoggerUtil.logServiceOperation('BlockchainUtil', 'createCampaign - start', {
                name: args.name,
                owner: args.owner,
                category: args.category,
                vectorDbCid: args.vector_db_cid,
                inTokenPrice: args.in_token_price.toString(),
                outTokenPrice: args.out_token_price.toString(),
                initialDataToken: args.initial_data_token.toString()
            });

            // Get contract instance
            const contract = getContract({
                address: this.CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                client: { public: this.publicClient, wallet: this.walletClient }
            });

            // Execute transaction
            const txHash = await contract.write.createCampaign([
                args.name,
                args.description,
                args.vector_db_cid,
                args.owner,
                args.category,
                args.in_token_price,
                args.out_token_price,
                args.initial_data_token
            ]);

            LoggerUtil.logServiceOperation('BlockchainUtil', 'createCampaign - transaction sent', {
                transactionHash: txHash,
                contractAddress: this.CONTRACT_ADDRESS
            });

            // Wait for transaction confirmation
            const receipt = await this.publicClient.waitForTransactionReceipt({
                hash: txHash,
                timeout: 60_000 // 60 seconds
            });

            LoggerUtil.logServiceOperation('BlockchainUtil', 'createCampaign - confirmed', {
                transactionHash: txHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed,
                status: receipt.status
            });

            if (receipt.status === 'reverted') {
                throw new Error('Transaction was reverted');
            }

            return txHash;

        } catch (error) {
            LoggerUtil.logServiceError('BlockchainUtil', 'createCampaign', error, {
                contractAddress: this.CONTRACT_ADDRESS,
                owner: args.owner,
                campaignName: args.name
            });

            throw new Error(`Failed to create campaign on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get the current number of campaigns
     */
    static async getCampaignsLength(): Promise<number> {
        try {
            if (!this.publicClient) {
                this.initialize();
            }

            const contract = getContract({
                address: this.CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                client: this.publicClient
            });

            const length = await contract.read.get_campaigns_length();
            
            LoggerUtil.logServiceOperation('BlockchainUtil', 'getCampaignsLength', {
                campaignsLength: Number(length)
            });

            return Number(length);

        } catch (error) {
            LoggerUtil.logServiceError('BlockchainUtil', 'getCampaignsLength', error);
            throw new Error(`Failed to get campaigns length: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get campaign details by ID
     */
    static async getCampaign(campaignId: number) {
        try {
            if (!this.publicClient) {
                this.initialize();
            }

            const contract = getContract({
                address: this.CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                client: this.publicClient
            });

            const campaign = await contract.read.getCampaign([BigInt(campaignId)]);
            
            LoggerUtil.logServiceOperation('BlockchainUtil', 'getCampaign', {
                campaignId,
                name: campaign[0],
                owner: campaign[2]
            });

            return {
                name: campaign[0],
                description: campaign[1],
                owner: campaign[2],
                category: Number(campaign[3]),
                vectorDbCid: campaign[4],
                inTokenPrice: campaign[5],
                outTokenPrice: campaign[6],
                totalDataToken: campaign[7],
                totalRevenue: campaign[8]
            };

        } catch (error) {
            LoggerUtil.logServiceError('BlockchainUtil', 'getCampaign', error, { campaignId });
            throw new Error(`Failed to get campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Convert string to wei (bigint)
     */
    static parseWei(value: string): bigint {
        try {
            return parseEther(value);
        } catch (error) {
            throw new Error(`Invalid wei value: ${value}`);
        }
    }

    /**
     * Convert wei to string
     */
    static formatWei(value: bigint): string {
        try {
            return formatEther(value);
        } catch (error) {
            throw new Error(`Invalid bigint value: ${value}`);
        }
    }
}