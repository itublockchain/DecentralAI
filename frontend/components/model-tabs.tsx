"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ApiPlayground } from "@/components/api-playground"
import { ModelChat } from "@/components/model-chat"

interface ModelTabsProps {
  model: {
    name: string
    description: string
    baseModel: string
    parameters: string
    trainingData: string
    lastUpdated: string
    accuracy: number
    price: number
    id?: string
  }
}

export function ModelTabs({ model }: ModelTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="technical">Technical Specs</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">About This Model</h3>
              <p className="text-muted-foreground mb-6">{model.description}</p>

              <h4 className="font-semibold text-foreground mb-3">Use Cases</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Medical diagnosis assistance</li>
                <li>• Treatment recommendation</li>
                <li>• Drug interaction analysis</li>
                <li>• Medical literature research</li>
              </ul>

              <h4 className="font-semibold text-foreground mb-3 mt-6">Example Outputs</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  <strong>Input:</strong> "Patient presents with chest pain, shortness of breath, and elevated troponin
                  levels."
                </div>
                <div className="text-sm text-foreground mt-2">
                  <strong>Output:</strong> "Based on the symptoms and elevated troponin, this suggests acute myocardial
                  infarction. Recommend immediate ECG, cardiac catheterization, and antiplatelet therapy..."
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <ModelChat campaignId={model.id || "2"} modelName={model.name} />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Model Architecture</h4>
                  <p className="text-muted-foreground">Base Model: {model.baseModel}</p>
                  <p className="text-muted-foreground">Parameters: {model.parameters}</p>
                  <p className="text-muted-foreground">Last Updated: {model.lastUpdated}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Training Data</h4>
                  <p className="text-muted-foreground">{model.trainingData}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-docs" className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">API Documentation</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Endpoint</h4>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    POST https://api.decentralai.com/v1/models/medical-gpt-pro/generate
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Example Request</h4>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    {`{
  "prompt": "Patient presents with...",
  "max_tokens": 500,
  "temperature": 0.7
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ApiPlayground modelName={model.name} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">User Reviews</h3>
              <div className="space-y-4">
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">Dr. Sarah Johnson</span>
                  </div>
                  <p className="text-muted-foreground">
                    "Excellent accuracy for medical diagnoses. Has significantly improved our clinical workflow."
                  </p>
                </div>
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <span className="text-sm text-muted-foreground">Medical Center AI Team</span>
                  </div>
                  <p className="text-muted-foreground">
                    "Good performance overall, though response times could be faster during peak hours."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
