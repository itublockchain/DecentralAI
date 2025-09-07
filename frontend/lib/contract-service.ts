import { publicClient, CONTRACT_ADDRESS, CONTRACT_ABI, getCategoryName, type Campaign } from './contract'
import { formatUnits } from 'viem'

// Default avatars for categories
const categoryAvatars: Record<string, string> = {
  Medical: '/medical-ai-robot.jpg',
  Legal: '/legal-ai-scales-justice.jpg',
  Financial: '/financial-ai-chart-graph.jpg',
  Research: '/research-ai-microscope.jpg',
  General: '/general-ai-brain-network.jpg',
}

export class ContractService {
  /**
   * Get total number of campaigns
   */
  static async getCampaignCount(): Promise<number> {
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'get_campaigns_length',
      })
      return Number(result)
    } catch (error) {
      console.error('Error fetching campaign count:', error)
      return 0
    }
  }

  /**
   * Get campaign data by ID
   */
  static async getCampaign(campaignId: number): Promise<Campaign | null> {
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getCampaign',
        args: [BigInt(campaignId)],
      })

      // Contract returns: [name, description, owner, category, vectorDbCid, inTokenPrice, outTokenPrice, totalDataToken, totalRevenue]
      const [
        name,
        description,
        owner,
        categoryId,
        vectorDbCid,
        inTokenPrice,
        outTokenPrice,
        totalDataToken,
        totalRevenue
      ] = result

      console.log('Raw contract data for campaign', campaignId, ':', {
        name,
        description,
        owner,
        categoryId: Number(categoryId),
        vectorDbCid,
        inTokenPrice: inTokenPrice.toString(),
        outTokenPrice: outTokenPrice.toString(),
        totalDataToken: totalDataToken.toString(),
        totalRevenue: totalRevenue.toString()
      })

      const categoryName = getCategoryName(Number(categoryId))

      return {
        id: campaignId.toString(),
        name: name as string,
        description: description as string,
        owner: owner as string,
        category: categoryName,
        vectorDbCid: vectorDbCid as string,
        // Convert from wei to readable format (token prices are in USDC with 6 decimals)
        inputTokenPrice: Number(formatUnits(inTokenPrice as bigint, 6)),
        outputTokenPrice: Number(formatUnits(outTokenPrice as bigint, 6)),
        totalDataToken: Number(totalDataToken as bigint),
        totalRevenue: Number(formatUnits(totalRevenue as bigint, 6)), // Revenue is also in USDC
        status: this.determineStatus(totalDataToken as bigint, totalRevenue as bigint),
        avatar: categoryAvatars[categoryName] || categoryAvatars.General,
      }
    } catch (error) {
      console.error(`Error fetching campaign ${campaignId}:`, error)
      return null
    }
  }

  /**
   * Get all campaigns
   */
  static async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const campaignCount = await this.getCampaignCount()
      const campaigns: Campaign[] = []

      // Fetch all campaigns in parallel
      const campaignPromises = Array.from({ length: campaignCount }, (_, i) =>
        this.getCampaign(i)
      )

      const results = await Promise.allSettled(campaignPromises)
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          campaigns.push(result.value)
        }
      })

      return campaigns
    } catch (error) {
      console.error('Error fetching all campaigns:', error)
      return []
    }
  }

  /**
   * Determine campaign status based on data
   */
  private static determineStatus(totalDataToken: bigint, totalRevenue: bigint): 'active' | 'funding' | 'inactive' {
    // Simple logic - you can adjust based on your business rules
    if (totalRevenue > 0n) {
      return 'active'
    } else if (totalDataToken > 0n) {
      return 'funding'
    } else {
      return 'inactive'
    }
  }
}