import { Card, CardContent } from "@/components/ui/card"
import { Database, Coins, DollarSign, TrendingUp } from "lucide-react"

interface ModelMetricsProps {
  model: {
    fundingProgress?: number
    totalTokensUsed: string
    datasetsProvided: number
    maxDatasets: number
    monthlyRevenue: string
    status: "funding" | "active"
    inputTokenPrice: number
    outputTokenPrice: number
    currentPoolAmount?: string
    totalDataToken: number
    totalRevenue: number
  }
}

export function ModelMetrics({ model }: ModelMetricsProps) {
  const metrics = [
    {
      icon: Database,
      label: "Total Data Tokens",
      value: `${model.totalDataToken.toLocaleString()}`,
      description: model.status === "funding" ? "Data tokens collected for training" : "Total data tokens available",
      color: "text-blue-600",
    },
    {
      icon: DollarSign,
      label: "Input Token Price",
      value: `$${model.inputTokenPrice.toFixed(4)}`,
      description: "Per 1M input tokens",
      color: "text-green-600",
    },
    {
      icon: DollarSign,
      label: "Output Token Price",
      value: `$${model.outputTokenPrice.toFixed(4)}`,
      description: "Per 1M output tokens",
      color: "text-purple-600",
    },
    ...(model.status === "active"
      ? [
          {
            icon: Coins,
            label: "Current Pool Amount",
            value: model.currentPoolAmount || "$0",
            description: "Accumulated revenue for this distribution period",
            color: "text-orange-600",
          },
        ]
      : [
          {
            icon: DollarSign,
            label: "Total Revenue",
            value: `$${model.totalRevenue.toLocaleString()}`,
            description: "Total revenue generated from model usage",
            color: "text-orange-600",
          },
        ]),
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-border bg-card hover:bg-muted/30 transition-colors">
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
              <div className="text-sm font-medium text-foreground mb-1">{metric.label}</div>
              <div className="text-xs text-muted-foreground">{metric.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
