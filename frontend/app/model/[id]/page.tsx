import { Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { ModelDetailHeader } from "@/components/model-detail-header"
import { ModelMetrics } from "@/components/model-metrics"
import { ModelChat } from "@/components/model-chat"
import { ContractService } from "@/lib/contract-service"
import { notFound } from "next/navigation"

// Loading components
function ModelDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
            {/* Metrics skeleton */}
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-24 bg-muted rounded-lg"></div>
                <div className="h-24 bg-muted rounded-lg"></div>
                <div className="h-24 bg-muted rounded-lg"></div>
              </div>
            </div>
            {/* Chat skeleton */}
            <div className="animate-pulse">
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

async function ModelDetailContent({ campaignId }: { campaignId: string }) {
  try {
    // Fetch campaign data from contract
    const campaign = await ContractService.getCampaign(parseInt(campaignId))

    if (!campaign) {
      notFound()
    }

    // Transform campaign data to detail model format
    const detailModel = {
      ...campaign,
      // Add additional fields needed by existing components
      creator: campaign.owner,
      baseModel: "Blockchain AI Model",
      parameters: "Distributed",
      trainingData: "Decentralized data contributions",
      lastUpdated: new Date().toISOString().split('T')[0],
      fundingProgress: 85, // Could calculate based on contributions
      totalTokensUsed: campaign.totalDataToken.toString(),
      datasetsProvided: Math.floor(campaign.totalDataToken / 100),
      maxDatasets: Math.floor(campaign.totalDataToken / 50),
      monthlyRevenue: `$${campaign.totalRevenue.toLocaleString()}`,
      currentPoolAmount: campaign.status === "active" ? `$${(campaign.totalRevenue * 1.5).toFixed(0)}` : undefined,
      totalDataToken: campaign.totalDataToken,
      totalRevenue: campaign.totalRevenue,
    }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          <ModelDetailHeader model={detailModel} campaignId={campaignId} />
          <ModelMetrics model={detailModel} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ModelChat campaignId={campaignId} modelName={detailModel.name} />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Campaign</h1>
              <p className="text-muted-foreground mb-4">
                Failed to load campaign data from the blockchain.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default function ModelDetailPage({ params }: { params: { id: string } }) {
  const campaignId = params.id

  // Validate campaign ID is a number
  if (isNaN(parseInt(campaignId))) {
    notFound()
  }

  return (
    <Suspense fallback={<ModelDetailSkeleton />}>
      <ModelDetailContent campaignId={campaignId} />
    </Suspense>
  )
}