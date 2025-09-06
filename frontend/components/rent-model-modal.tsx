"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Check, Copy, CreditCard, Key, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RentModelModalProps {
  isOpen: boolean
  onClose: () => void
  model: {
    name: string
    price: number
  }
}

export function RentModelModal({ isOpen, onClose, model }: RentModelModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState("pro")
  const [apiKeyName, setApiKeyName] = useState("")
  const [usageLimit, setUsageLimit] = useState("10000")
  const [allowedDomains, setAllowedDomains] = useState("")
  const [generatedApiKey, setGeneratedApiKey] = useState("")
  const { toast } = useToast()

  const pricingTiers = [
    {
      id: "basic",
      name: "Basic",
      price: model.price,
      requests: "1,000",
      features: ["Standard API access", "Email support"],
      monthlyCost: 20,
    },
    {
      id: "pro",
      name: "Pro",
      price: model.price * 0.8,
      requests: "10,000",
      features: ["Priority API access", "Chat support", "Usage analytics"],
      monthlyCost: 160,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: model.price * 0.6,
      requests: "Unlimited",
      features: ["Dedicated infrastructure", "24/7 support", "Custom integrations"],
      monthlyCost: 500,
    },
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmPayment = () => {
    // Simulate API key generation
    setGeneratedApiKey("sk-decentralai-" + Math.random().toString(36).substring(2, 15))
    setCurrentStep(4)
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(generatedApiKey)
    toast({
      title: "API Key Copied",
      description: "The API key has been copied to your clipboard.",
    })
  }

  const resetModal = () => {
    setCurrentStep(1)
    setSelectedPlan("pro")
    setApiKeyName("")
    setUsageLimit("10000")
    setAllowedDomains("")
    setGeneratedApiKey("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Rent {model.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && <div className={`w-12 h-0.5 mx-2 ${step < currentStep ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Plan */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Choose Your Plan</h3>
            <div className="space-y-3">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === tier.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedPlan(tier.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan === tier.id ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{tier.name}</span>
                            {tier.popular && <Badge variant="secondary">Popular</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{tier.requests} requests/month</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">${tier.price.toFixed(3)}</div>
                        <div className="text-xs text-muted-foreground">per request</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure API Key */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Configure API Key</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API Key"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Monthly Usage Limit</Label>
                <Input
                  id="usageLimit"
                  placeholder="10000"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="domains">Allowed Domains (CORS)</Label>
                <Input
                  id="domains"
                  placeholder="https://myapp.com, https://staging.myapp.com"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                />
                <div className="text-xs text-muted-foreground mt-1">Leave empty to allow all domains</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Payment Summary</h3>
            <Card className="border-border bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="text-foreground font-medium">
                    {pricingTiers.find((t) => t.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly requests</span>
                  <span className="text-foreground">{pricingTiers.find((t) => t.id === selectedPlan)?.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per request</span>
                  <span className="text-foreground">
                    ${pricingTiers.find((t) => t.id === selectedPlan)?.price.toFixed(3)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">Estimated monthly cost</span>
                  <span className="text-foreground">
                    ${pricingTiers.find((t) => t.id === selectedPlan)?.monthlyCost}
                  </span>
                </div>
              </CardContent>
            </Card>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment will be deducted from your wallet balance: $1,234.56
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">API Key Generated Successfully!</h3>
              <p className="text-muted-foreground">Your API key is ready to use</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Your API Key</Label>
                <div className="flex items-center gap-2">
                  <Input value={generatedApiKey} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Quick Start</h4>
                <div className="text-sm font-mono bg-background rounded p-3 text-foreground">
                  {`curl -X POST https://api.decentralai.com/v1/models/${model.name.toLowerCase().replace(/\s+/g, "-")}/generate \\
  -H "Authorization: Bearer ${generatedApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your prompt here", "max_tokens": 100}'`}
                </div>
              </div>

              <Button className="w-full" onClick={resetModal}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={currentStep === 3 ? handleConfirmPayment : handleNext}
              disabled={currentStep === 2 && !apiKeyName.trim()}
            >
              {currentStep === 3 ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
