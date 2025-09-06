"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, DollarSign, Key, BookOpen } from "lucide-react"
import { ContributeDataModal } from "@/components/contribute-data-modal"

interface ModelActionsProps {
  model: {
    name: string
    domain: string
    price: number
    status: "funding" | "active"
    inputTokenPrice: number
    outputTokenPrice: number
  }
}

export function ModelActions({ model }: ModelActionsProps) {
  const [isRentModalOpen, setIsRentModalOpen] = useState(false)
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)

  if (model.status === "funding") {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contribute Data Card - Emphasized for funding models */}
            <Card className="border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Upload className="h-6 w-6" />
                  Help Complete This Campaign
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Earnings Estimate */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">Potential Monthly Earnings</span>
                  </div>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200">$150-500</div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Based on data quality and model usage after launch
                  </div>
                </div>

                {/* Data Requirements */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Data Requirements</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {model.domain} related datasets
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      High-quality, structured data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Properly formatted and labeled
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Anonymized and privacy-compliant
                    </li>
                  </ul>
                </div>

                <Button className="w-full" size="lg" onClick={() => setIsContributeModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Contribute Data & Earn NFTs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <ContributeDataModal
          isOpen={isContributeModalOpen}
          onClose={() => setIsContributeModalOpen(false)}
          model={model}
        />
      </>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Access Card - Emphasized for active models */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="h-6 w-6" />
                Start Using This Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Pricing */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-4">Token Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded border">
                    <span className="text-muted-foreground">Input Tokens:</span>
                    <span className="font-medium">${model.inputTokenPrice.toFixed(4)}/1M tokens</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border">
                    <span className="text-muted-foreground">Output Tokens:</span>
                    <span className="font-medium">${model.outputTokenPrice.toFixed(4)}/1M tokens</span>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">How to Use</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Generate an API key from your settings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Add funds to your wallet balance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Make API calls and pay per token usage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Monitor usage and costs in your profile
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="w-full" size="lg" asChild>
                  <a href="/settings">
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </a>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="lg">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
