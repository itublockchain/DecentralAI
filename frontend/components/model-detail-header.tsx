"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Lock, Shield, CheckCircle, Upload } from "lucide-react"
import { ContributeDataModal } from "@/components/contribute-data-modal"

interface ModelDetailHeaderProps {
  model: {
    name: string
    category: string
    avatar: string
    creator: string
    description: string
    status: "funding" | "active" | "inactive"
    inputTokenPrice: number
    outputTokenPrice: number
  }
  campaignId?: string
}

export function ModelDetailHeader({ model, campaignId }: ModelDetailHeaderProps) {
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
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

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Model Avatar and Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
              <AvatarFallback className="text-2xl">{model.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{model.name}</h1>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getCategoryColor(model.category)}`}>{model.category} AI</Badge>
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  ROFL-Protected
                </Badge>
              </div>
              <p className="text-muted-foreground">by {model.creator}</p>
            </div>
          </div>

          {/* Privacy Verification and Contribute Button */}
          <div className="lg:ml-auto flex flex-col items-end gap-3">
            <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Privacy Verified</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            {model.status === "funding" && (
              <Button 
                onClick={() => setIsContributeModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Contribute Data
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <p className="text-lg text-muted-foreground max-w-4xl">{model.description}</p>
        </div>
      </div>

      {/* Contribute Data Modal */}
      {campaignId && (
        <ContributeDataModal
          isOpen={isContributeModalOpen}
          onClose={() => setIsContributeModalOpen(false)}
          model={model}
          campaignId={campaignId}
        />
      )}
    </div>
  )
}
