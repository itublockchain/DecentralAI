"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GitCompare, Check } from "lucide-react"

const mockModels = [
  {
    id: "1",
    name: "MedicalGPT Pro",
    domain: "Medical",
    accuracy: 94,
    price: 0.02,
    responseTime: "245ms",
    features: ["Medical diagnosis", "Treatment recommendations", "Drug interactions", "Research analysis"],
  },
  {
    id: "2",
    name: "BioMed Specialist",
    domain: "Medical",
    accuracy: 92,
    price: 0.025,
    responseTime: "180ms",
    features: ["Biomedical research", "Drug discovery", "Molecular analysis", "Clinical trials"],
  },
  {
    id: "3",
    name: "LegalMind AI",
    domain: "Legal",
    accuracy: 91,
    price: 0.035,
    responseTime: "320ms",
    features: ["Contract analysis", "Case law research", "Legal writing", "Compliance checking"],
  },
]

export function ModelComparison() {
  const [selectedModels, setSelectedModels] = useState<string[]>(["1", "2"])

  const handleModelSelect = (modelId: string, index: number) => {
    const newSelection = [...selectedModels]
    newSelection[index] = modelId
    setSelectedModels(newSelection)
  }

  const comparedModels = selectedModels.map((id) => mockModels.find((m) => m.id === id)).filter(Boolean)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Model Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium text-foreground">Model {index + 1}</label>
              <Select value={selectedModels[index] || ""} onValueChange={(value) => handleModelSelect(value, index)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {mockModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {comparedModels.length === 2 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Feature</th>
                  {comparedModels.map((model) => (
                    <th key={model!.id} className="text-center p-3">
                      <div className="font-semibold text-foreground">{model!.name}</div>
                      <Badge className="mt-1">{model!.domain}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 text-sm text-muted-foreground">Accuracy</td>
                  {comparedModels.map((model) => (
                    <td key={model!.id} className="text-center p-3 font-medium text-foreground">
                      {model!.accuracy}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 text-sm text-muted-foreground">Price per request</td>
                  {comparedModels.map((model) => (
                    <td key={model!.id} className="text-center p-3 font-medium text-foreground">
                      ${model!.price.toFixed(3)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 text-sm text-muted-foreground">Response time</td>
                  {comparedModels.map((model) => (
                    <td key={model!.id} className="text-center p-3 font-medium text-foreground">
                      {model!.responseTime}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 text-sm text-muted-foreground">Features</td>
                  {comparedModels.map((model) => (
                    <td key={model!.id} className="p-3">
                      <ul className="space-y-1">
                        {model!.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1 text-xs">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
