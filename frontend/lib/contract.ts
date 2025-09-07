import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

// Create public client for Sepolia
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
})

// Contract configuration
export const CONTRACT_ADDRESS = '0x90Cb261abe850f4b0413B8143b66aeC1D97593d8'
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "rofl",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "in_token",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "out_token",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      }
    ],
    "name": "chat",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "contributer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "data_token_amount",
        "type": "uint256"
      }
    ],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "vector_db_cid",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "enum main.Category",
        "name": "category",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "in_token_price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "out_token_price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "initial_data_token",
        "type": "uint256"
      }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      }
    ],
    "name": "getCampaign",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "enum main.Category",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUser",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "get_campaigns_length",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "vector_db_update",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Category enum mapping
export enum Category {
  Medical = 0,
  Legal = 1,
  Financial = 2,
  Research = 3,
  General = 4,
}

export const getCategoryName = (categoryId: number): string => {
  const categories = ['Medical', 'Legal', 'Financial', 'Research', 'General']
  return categories[categoryId] || 'General'
}

// Campaign interface based on contract structure
export interface Campaign {
  id: string
  name: string
  description: string
  owner: string
  category: string
  vectorDbCid: string
  inputTokenPrice: number
  outputTokenPrice: number
  totalDataToken: number
  totalRevenue: number
  status: 'active' | 'funding' | 'inactive'
  avatar: string
}