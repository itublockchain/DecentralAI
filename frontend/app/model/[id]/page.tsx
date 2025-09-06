import { Navigation } from "@/components/navigation"
import { ModelDetailHeader } from "@/components/model-detail-header"
import { ModelMetrics } from "@/components/model-metrics"
import { ModelActions } from "@/components/model-actions"
import { ModelTabs } from "@/components/model-tabs"
import { mockModels } from "@/components/model-grid"
import { notFound } from "next/navigation"

export default function ModelDetailPage({ params }: { params: { id: string } }) {
  const model = mockModels.find((m) => m.id === params.id)

  if (!model) {
    notFound()
  }

  const detailModel = {
    ...model,
    id: params.id,
    creator: "AI Research Labs", // Default creator
    baseModel: "GPT-4 Turbo",
    parameters: "175B",
    trainingData: "Specialized domain literature and datasets",
    lastUpdated: "2024-01-15",
    // Map grid data to detail format
    fundingProgress:
      model.status === "funding"
        ? Math.round(((model.currentDatasets || 0) / (model.requiredDatasets || 1)) * 100)
        : 100,
    totalTokensUsed: model.apiCalls || "0",
    datasetsProvided: model.currentDatasets || (model.status === "active" ? model.requiredDatasets || 200 : 0),
    maxDatasets: model.requiredDatasets || 200,
    monthlyRevenue: model.monthlyRevenue ? `$${model.monthlyRevenue.toLocaleString()}` : "$0",
    inputTokenPrice: model.inputTokenPrice || 0.0015,
    outputTokenPrice: model.outputTokenPrice || 0.003,
    currentPoolAmount: model.status === "active" ? `$${(Math.random() * 50000 + 10000).toFixed(0)}` : undefined,
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <ModelDetailHeader model={detailModel} />
        <ModelMetrics model={detailModel} />
        <ModelActions model={detailModel} campaignId={params.id} />
        <ModelTabs model={detailModel} />
      </main>
    </div>
  )
}
