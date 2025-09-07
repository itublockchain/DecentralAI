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
import { Rocket, Database, DollarSign, Info, Loader2, Upload, X } from "lucide-react"
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
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.002,
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const categories = ["Medical", "Legal", "Financial", "Research", "General"]

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1 requirements
      if (!formData.name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter a campaign name.",
          variant: "destructive",
        })
        return
      }
      if (!formData.category) {
        toast({
          title: "Category Required",
          description: "Please select a category.",
          variant: "destructive",
        })
        return
      }
      if (!selectedFile) {
        toast({
          title: "File Required",
          description: "Please upload an initial data file.",
          variant: "destructive",
        })
        return
      }
      if (!formData.description.trim()) {
        toast({
          title: "Description Required",
          description: "Please enter a description.",
          variant: "destructive",
        })
        return
      }
    }
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

    if (!selectedFile) {
      toast({
        title: "File Required",
        description: "Please upload an initial data file for cold start prevention.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const account = primaryWallet.address

      // Get category enum value
      const categoryId = categories.indexOf(formData.category)
      if (categoryId === -1) {
        throw new Error("Invalid category selected")
      }

      // Create FormData for API request
      const apiFormData = new FormData()
      apiFormData.append('name', formData.name)
      apiFormData.append('description', formData.description)
      apiFormData.append('owner', account as string)
      apiFormData.append('category', categoryId.toString())
      apiFormData.append('in_token_price', formData.inputTokenPrice.toString())
      apiFormData.append('out_token_price', formData.outputTokenPrice.toString())
      apiFormData.append('file', selectedFile)

      // Get the JWT token
      const rawToken = localStorage.getItem('dynamic_authentication_token')

      if (!rawToken) {
        toast({
          title: "Authentication Error",
          description: "Please log in to contribute data",
          variant: "destructive"
        })
        return
      }

      // Remove quotes from token if they exist
      const token = rawToken.replace(/^"(.*)"$/, '$1')

      // Make API request
      const response = await fetch('http://localhost:4000/api/model-campaign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: apiFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to create campaign')
      }

      const result = await response.json()

      toast({
        title: "Campaign Created!",
        description: "Your model campaign has been successfully created with initial data.",
      })

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        category: "",
        inputTokenPrice: 0.001,
        outputTokenPrice: 0.002,
      })
      setSelectedFile(null)
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

  const estimatedMonthlyRevenue = 1000 * formData.outputTokenPrice // Rough estimate based on typical initial allocation

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
                  <Label htmlFor="initialData">Initial Data File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    {selectedFile ? (
                      <div className="flex items-center justify-between bg-muted/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm font-medium mb-1">Upload Initial Data</div>
                        <div className="text-xs text-muted-foreground mb-3">
                          PDF, CSV, TXT, or other data files (Max 10MB)
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.csv,.txt,.json,.xlsx,.xls,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast({
                                  title: "File too large",
                                  description: "Please select a file smaller than 10MB",
                                  variant: "destructive",
                                })
                                return
                              }
                              setSelectedFile(file)
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required: Upload initial data to prevent cold start issues and provide training data
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
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Token Economics</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Initial data tokens will be calculated automatically by the backend based on your uploaded file.
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
                    <div className="text-sm text-muted-foreground">Initial Data File</div>
                    <div className="font-medium text-xs">{selectedFile?.name || "None"}</div>
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
                        This will create a new campaign via API call with the parameters above.
                        Your wallet address will be used as the owner and the uploaded file will provide initial training data to prevent cold start issues.
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
