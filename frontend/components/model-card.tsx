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
    category: string
    avatar: string
    description: string
    status: "active" | "funding" | "inactive"
    inputTokenPrice: number
    outputTokenPrice: number
    totalDataToken: number
    totalRevenue: number
  }
}

export function ModelCard({ model }: ModelCardProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      Medical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Legal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Financial: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Research: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      General: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    }
    return colors[category as keyof typeof colors] || colors.General
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
                <Badge className={`text-xs ${getCategoryColor(model.category)}`}>{model.category} AI</Badge>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{model.description}</p>

        {/* Campaign Metrics - Clean List Layout */}
        <div className="flex-1 space-y-4">
          <div className="space-y-3">
            {/* Token Pricing */}
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Input Token Price</span>
              <span className="text-base font-semibold text-foreground">${model.inputTokenPrice}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Output Token Price</span>
              <span className="text-base font-semibold text-foreground">${model.outputTokenPrice}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Total Data Tokens</span>
              <span className="text-base font-semibold text-foreground">{model.totalDataToken.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-base font-semibold text-green-600">${model.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <Link href={`/model/${model.id}`}>
          <Button className="w-full" variant="outline">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
