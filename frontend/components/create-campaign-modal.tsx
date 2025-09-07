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
import { Rocket, Database, DollarSign, Info, Loader2 } from "lucide-react"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { CONTRACT_ADDRESS, CONTRACT_ABI, Category } from "@/lib/contract"
import { parseUnits } from "viem"
import { useToast } from "@/hooks/use-toast"

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { primaryWallet } = useDynamicContext()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    vectorDbCid: "",
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.002,
    initialDataToken: 1000,
  })

  const categories = ["Medical", "Legal", "Financial", "Research", "General"]

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!primaryWallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a campaign.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const walletClient = await primaryWallet.getWalletClient()
      const account = primaryWallet.address

      // Get category enum value
      const categoryId = categories.indexOf(formData.category)
      if (categoryId === -1) {
        throw new Error("Invalid category selected")
      }

      // Convert prices to wei (18 decimals)
      const inTokenPriceWei = parseUnits(formData.inputTokenPrice.toString(), 18)
      const outTokenPriceWei = parseUnits(formData.outputTokenPrice.toString(), 18)

      // Call contract function
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createCampaign',
        args: [
          formData.name,
          formData.description,
          formData.vectorDbCid || "QmDefaultCID", // Default if empty
          account as `0x${string}`, // owner
          categoryId, // category enum
          inTokenPriceWei, // in_token_price
          outTokenPriceWei, // out_token_price  
          BigInt(formData.initialDataToken), // initial_data_token
        ],
        account: account as `0x${string}`,
      })

      toast({
        title: "Campaign Created!",
        description: `Transaction hash: ${hash}`,
      })

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        category: "",
        vectorDbCid: "",
        inputTokenPrice: 0.001,
        outputTokenPrice: 0.002,
        initialDataToken: 1000,
      })
      setStep(1)
      onClose()

      // Refresh page to show new campaign
      window.location.reload()

    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const estimatedMonthlyRevenue = formData.initialDataToken * formData.outputTokenPrice // Rough estimate

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
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., MedicalGPT Pro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category} AI
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vectorDbCid">Vector DB CID (Optional)</Label>
                  <Input
                    id="vectorDbCid"
                    placeholder="IPFS CID for vector database"
                    value={formData.vectorDbCid}
                    onChange={(e) => setFormData({ ...formData, vectorDbCid: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for default configuration
                  </p>
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
                    Token Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="initialDataToken">Initial Data Tokens</Label>
                    <Input
                      id="initialDataToken"
                      type="number"
                      min="1"
                      value={formData.initialDataToken}
                      onChange={(e) => setFormData({ ...formData, initialDataToken: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Initial token amount for campaign creator
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Token Economics</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      You'll receive {formData.initialDataToken} data tokens as the campaign creator.
                      Contributors can earn more tokens by providing datasets.
                    </div>
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
                    <Label htmlFor="inputTokenPrice">Input Token Price</Label>
                    <Input
                      id="inputTokenPrice"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.inputTokenPrice}
                      onChange={(e) => setFormData({ ...formData, inputTokenPrice: Number.parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Price per input token</p>
                  </div>

                  <div>
                    <Label htmlFor="outputTokenPrice">Output Token Price</Label>
                    <Input
                      id="outputTokenPrice"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.outputTokenPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, outputTokenPrice: Number.parseFloat(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">Price per output token</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm font-medium text-foreground">Estimated Revenue Potential</div>
                    <div className="text-lg font-bold text-primary">${estimatedMonthlyRevenue.toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">Based on initial tokens × output price</div>
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
                    <div className="text-sm text-muted-foreground">Campaign Name</div>
                    <div className="font-medium">{formData.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <Badge>{formData.category} AI</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Initial Data Tokens</div>
                    <div className="font-medium">{formData.initialDataToken.toLocaleString()} tokens</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Vector DB CID</div>
                    <div className="font-medium text-xs">{formData.vectorDbCid || "Default"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Input Token Price</div>
                    <div className="font-medium">${formData.inputTokenPrice}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Output Token Price</div>
                    <div className="font-medium">${formData.outputTokenPrice}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Description</div>
                  <div className="text-sm bg-muted/50 rounded p-2">{formData.description}</div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">Campaign Creation</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        This will create a new campaign on the blockchain with the parameters above.
                        You will receive {formData.initialDataToken} initial data tokens and become the campaign owner.
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
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack} disabled={loading}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button onClick={step === 3 ? handleSubmit : handleNext} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              step === 3 ? "Launch Campaign" : "Next"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
