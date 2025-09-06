import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, Users, Coins } from "lucide-react"
import Link from "next/link"

interface ModelCardProps {
  model: {
    id: string
    name: string
    domain: string
    avatar: string
    accuracy: number
    apiCalls: string
    dataSources: number
    price: number
    description: string
    status: "active" | "funding" | "inactive"
    requiredDatasets?: number
    currentDatasets?: number
    inputTokenPrice?: number
    outputTokenPrice?: number
    nftHolders?: number
    monthlyRevenue?: number
  }
}

export function ModelCard({ model }: ModelCardProps) {
  const getDomainColor = (domain: string) => {
    const colors = {
      Medical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Legal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Financial: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Research: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      General: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    }
    return colors[domain as keyof typeof colors] || colors.General
  }

  const getStatusBadge = () => {
    switch (model.status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "funding":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Funding
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
    }
  }

  const fundingProgress = model.requiredDatasets ? ((model.currentDatasets || 0) / model.requiredDatasets) * 100 : 0

  return (
    <Card className="border-border bg-card hover:bg-muted/30 transition-all duration-300 hover:shadow-lg group flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
              <AvatarFallback>{model.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{model.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${getDomainColor(model.domain)}`}>{model.domain} AI</Badge>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{model.description}</p>

        <div className="flex-1">
          {model.status === "funding" && model.requiredDatasets ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-medium">
                  {model.currentDatasets || 0}/{model.requiredDatasets} datasets
                </span>
              </div>
              <Progress value={fundingProgress} className="h-2" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">${model.inputTokenPrice}</div>
                  <div className="text-xs text-muted-foreground">Input/1M tokens</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">${model.outputTokenPrice}</div>
                  <div className="text-xs text-muted-foreground">Output/1M tokens</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {model.status === "active" ? (
                <>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{model.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{model.apiCalls}</div>
                    <div className="text-xs text-muted-foreground">API Calls</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-lg font-semibold text-foreground">{model.nftHolders || 0}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">NFT Holders</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="h-3 w-3" />
                      <span className="text-lg font-semibold text-foreground">${model.monthlyRevenue || 0}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{model.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Expected Accuracy</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">{model.dataSources}</div>
                    <div className="text-xs text-muted-foreground">Data Sources</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">${model.inputTokenPrice}</div>
                    <div className="text-xs text-muted-foreground">Input/1M tokens</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-foreground">${model.outputTokenPrice}</div>
                    <div className="text-xs text-muted-foreground">Output/1M tokens</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <Link href={`/model/${model.id}`}>
          <Button className="w-full bg-transparent" variant="outline">
            {model.status === "funding" ? "View Campaign" : "View Details"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
