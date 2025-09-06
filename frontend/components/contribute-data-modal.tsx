"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Check,
  Upload,
  Shield,
  Lock,
  FileText,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContributeDataModalProps {
  isOpen: boolean
  onClose: () => void
  model: {
    name: string
    domain: string
  }
}

export function ContributeDataModal({ isOpen, onClose, model }: ContributeDataModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [qualityRating, setQualityRating] = useState(0)
  const [encryptionProgress, setEncryptionProgress] = useState(0)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [contributionId, setContributionId] = useState("")
  const { toast } = useToast()

  const acceptedFormats = [
    { type: "CSV", description: "Structured data tables" },
    { type: "JSON", description: "API responses and structured data" },
    { type: "TXT", description: "Plain text documents" },
    { type: "PDF", description: "Research papers and reports" },
    { type: "DOCX", description: "Word documents" },
  ]

  const categories = [
    "Medical Literature",
    "Clinical Trials",
    "Case Studies",
    "Research Papers",
    "Treatment Outcomes",
    "Diagnostic Data",
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)

      // Start encryption animation on step 3
      if (currentStep === 2) {
        simulateEncryption()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const simulateEncryption = () => {
    setEncryptionProgress(0)
    const interval = setInterval(() => {
      setEncryptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const handleSubmit = () => {
    // Generate contribution ID
    setContributionId("CONTRIB-" + Math.random().toString(36).substring(2, 10).toUpperCase())
    setCurrentStep(5)
  }

  const resetModal = () => {
    setCurrentStep(1)
    setUploadedFiles([])
    setSelectedCategory("")
    setQualityRating(0)
    setEncryptionProgress(0)
    setTermsAccepted(false)
    setContributionId("")
    onClose()
  }

  const estimatedEarnings = uploadedFiles.length * qualityRating * 25 + Math.floor(Math.random() * 100)

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Contribute Data to {model.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 5 && <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Data Overview */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Data Requirements</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Accepted File Formats</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {acceptedFormats.map((format) => (
                    <div key={format.type} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{format.type}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Quality Requirements</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Data must be relevant to {model.domain.toLowerCase()} domain
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Files should be properly formatted and readable
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    No personally identifiable information (PII)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    High-quality, accurate, and up-to-date information
                  </li>
                </ul>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Privacy Guarantee with ROFL</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your data is encrypted using Oasis ROFL (Runtime OFfload) technology before it leaves your
                        device. This ensures complete privacy - no one, including us, can access your raw data.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Lock className="h-3 w-3" />
                        <span>End-to-end encrypted • Zero-knowledge processing</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Upload Data */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Upload Your Data</h3>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-foreground mb-2">Drag & drop files here, or click to browse</div>
              <div className="text-sm text-muted-foreground mb-4">
                Supports CSV, JSON, TXT, PDF, DOCX files up to 100MB each
              </div>
              <Button variant="outline">Choose Files</Button>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Uploaded Files ({uploadedFiles.length})</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-3">
              <Label>Data Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of data you're contributing" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quality Self-Assessment */}
            <div className="space-y-3">
              <Label>Quality Self-Assessment</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setQualityRating(rating)}
                    className={`p-1 rounded ${rating <= qualityRating ? "text-yellow-400" : "text-muted-foreground"}`}
                  >
                    <Star className={`h-6 w-6 ${rating <= qualityRating ? "fill-current" : ""}`} />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {qualityRating === 0 && "Rate your data quality"}
                  {qualityRating === 1 && "Basic quality"}
                  {qualityRating === 2 && "Fair quality"}
                  {qualityRating === 3 && "Good quality"}
                  {qualityRating === 4 && "High quality"}
                  {qualityRating === 5 && "Excellent quality"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Encryption */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-12 w-12 text-primary animate-pulse" />
            </div>

            <h3 className="text-lg font-semibold text-foreground">Encrypting Your Data</h3>
            <p className="text-muted-foreground">
              Your data is being encrypted with ROFL public key for maximum security
            </p>

            <div className="space-y-3">
              <Progress value={encryptionProgress} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {encryptionProgress < 100 ? `Encrypting... ${Math.round(encryptionProgress)}%` : "Encryption Complete!"}
              </div>
            </div>

            {encryptionProgress >= 100 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Data successfully encrypted</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Confirm Contribution</h3>

            {/* Earnings Estimate */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">Estimated Earnings</span>
                </div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">${estimatedEarnings}</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Based on {uploadedFiles.length} files with {qualityRating}-star quality rating
                </div>
              </CardContent>
            </Card>

            {/* Contribution Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Contribution Summary</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files:</span>
                  <span className="text-foreground">{uploadedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="text-foreground">{selectedCategory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quality Rating:</span>
                  <span className="text-foreground">{qualityRating} stars</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="text-foreground">{model.name}</span>
                </div>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the Terms of Service and Privacy Policy. I confirm that this data is mine to contribute and
                does not contain any personally identifiable information or copyrighted material.
              </Label>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Data Contribution Successful!</h3>
              <p className="text-muted-foreground">
                Your data has been securely uploaded and will help improve {model.name}
              </p>
            </div>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contribution ID:</span>
                  <span className="font-mono text-foreground">{contributionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Processing:</span>
                  <span className="text-foreground">2-5 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Earnings:</span>
                  <span className="text-foreground font-semibold">${estimatedEarnings}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>You'll receive earnings once your data is processed and validated</span>
            </div>

            <Button className="w-full" onClick={resetModal}>
              Track Earnings
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              disabled={
                (currentStep === 2 && (uploadedFiles.length === 0 || !selectedCategory || qualityRating === 0)) ||
                (currentStep === 3 && encryptionProgress < 100) ||
                (currentStep === 4 && !termsAccepted)
              }
            >
              {currentStep === 4 ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Contribution
                </>
              ) : currentStep === 3 && encryptionProgress < 100 ? (
                "Encrypting..."
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
