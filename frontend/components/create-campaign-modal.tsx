"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Rocket, Database, DollarSign, Info } from "lucide-react"

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
    requiredDatasets: 100,
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.002,
    campaignDuration: 30,
    baseModel: "",
    expectedAccuracy: 90,
  })

  const domains = ["Medical", "Legal", "Financial", "Research", "General"]
  const baseModels = ["GPT-4 Turbo", "Claude-3 Opus", "Llama-2 70B", "Gemini Pro", "Custom Architecture"]

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    // Handle campaign creation
    console.log("Creating campaign:", formData)
    onClose()
    setStep(1)
  }

  const estimatedMonthlyRevenue = formData.requiredDatasets * 50 // Rough estimate

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Create Model Campaign
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && <div className="w-12 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., MedicalGPT Pro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Select
                    value={formData.domain}
                    onValueChange={(value) => setFormData({ ...formData, domain: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain} AI
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="baseModel">Base Model</Label>
                  <Select
                    value={formData.baseModel}
                    onValueChange={(value) => setFormData({ ...formData, baseModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base model" />
                    </SelectTrigger>
                    <SelectContent>
                      {baseModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your AI model's capabilities and use cases..."
                  className="h-32"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Campaign Parameters */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" />
                    Data Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="requiredDatasets">Required Dataset Count</Label>
                    <Input
                      id="requiredDatasets"
                      type="number"
                      value={formData.requiredDatasets}
                      onChange={(e) => setFormData({ ...formData, requiredDatasets: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of datasets needed to activate the model
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="campaignDuration">Campaign Duration (days)</Label>
                    <Input
                      id="campaignDuration"
                      type="number"
                      value={formData.campaignDuration}
                      onChange={(e) => setFormData({ ...formData, campaignDuration: Number.parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedAccuracy">Expected Accuracy (%)</Label>
                    <Input
                      id="expectedAccuracy"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.expectedAccuracy}
                      onChange={(e) => setFormData({ ...formData, expectedAccuracy: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Token Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="inputTokenPrice">Input Token Price (per 1M tokens)</Label>
                    <Input
                      id="inputTokenPrice"
                      type="number"
                      step="0.001"
                      value={formData.inputTokenPrice}
                      onChange={(e) => setFormData({ ...formData, inputTokenPrice: Number.parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="outputTokenPrice">Output Token Price (per 1M tokens)</Label>
                    <Input
                      id="outputTokenPrice"
                      type="number"
                      step="0.001"
                      value={formData.outputTokenPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, outputTokenPrice: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm font-medium text-foreground">Estimated Monthly Revenue</div>
                    <div className="text-lg font-bold text-primary">${estimatedMonthlyRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Based on average usage patterns</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Review & Launch */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Model Name</div>
                    <div className="font-medium">{formData.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Domain</div>
                    <Badge>{formData.domain} AI</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Required Datasets</div>
                    <div className="font-medium">{formData.requiredDatasets} datasets</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Campaign Duration</div>
                    <div className="font-medium">{formData.campaignDuration} days</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Input Token Price</div>
                    <div className="font-medium">${formData.inputTokenPrice}/1M tokens</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Output Token Price</div>
                    <div className="font-medium">${formData.outputTokenPrice}/1M tokens</div>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">NFT Revenue Model</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Contributors will receive ERC-1155 NFTs based on their data contributions. Monthly revenue will
                        be distributed proportionally to NFT holders based on their token quantities.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button onClick={step === 3 ? handleSubmit : handleNext}>{step === 3 ? "Launch Campaign" : "Next"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
