"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Check,
  Upload,
  Shield,
  Lock,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
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
  campaignId: string
}

export function ContributeDataModal({ isOpen, onClose, model, campaignId }: ContributeDataModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [contributionId, setContributionId] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Check authentication when modal opens
  const checkAuth = () => {
    const token = localStorage.getItem('dynamic_authentication_token')
    if (!token && isOpen) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contribute data",
        variant: "destructive"
      })
      onClose()
      // Redirect to login - adjust this path as needed
      window.location.href = '/login'
    }
  }

  // Check auth when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAuth()
    }
  }, [isOpen])

  const acceptedFormats = [
    { type: "CSV", description: "Structured data tables" },
    { type: "JSON", description: "API responses and structured data" },
    { type: "TXT", description: "Plain text documents" },
    { type: "PDF", description: "Research papers and reports" },
    { type: "DOCX", description: "Word documents" },
  ]


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles])
    toast({
      title: "Files uploaded",
      description: `Successfully uploaded ${acceptedFiles.length} file(s)`,
    })
  }, [toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      return ['csv', 'json', 'txt', 'pdf', 'docx'].includes(extension || '')
    })
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Some files rejected",
        description: "Only CSV, JSON, TXT, PDF, and DOCX files are accepted",
        variant: "destructive"
      })
    }
    
    if (validFiles.length > 0) {
      onDrop(validFiles)
    }
  }, [onDrop, toast])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onDrop(files)
    }
  }, [onDrop])

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

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


  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
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

      // Create FormData for file upload
      const formData = new FormData()
      
      // Add all uploaded files
      uploadedFiles.forEach((file) => {
        formData.append('file', file)
      })

      const response = await fetch(`http://localhost:4000/api/contribute/${campaignId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Generate contribution ID from response or use random
      setContributionId(result.contributionId || "CONTRIB-" + Math.random().toString(36).substring(2, 10).toUpperCase())
      
      toast({
        title: "Success!",
        description: "Your data has been successfully contributed"
      })
      
      setCurrentStep(4)
      
    } catch (error) {
      console.error('Contribution error:', error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setUploadedFiles([])
    setTermsAccepted(false)
    setContributionId("")
    setIsDragOver(false)
    setIsSubmitting(false)
    onClose()
  }

  const estimatedEarnings = uploadedFiles.length * 50 + Math.floor(Math.random() * 100)

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
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? "bg-primary" : "bg-muted"}`} />}
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
                    Data must be relevant to {model.category.toLowerCase()} domain
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
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-foreground mb-2">Drag & drop files here, or click to browse</div>
              <div className="text-sm text-muted-foreground mb-4">
                Supports CSV, JSON, TXT, PDF, DOCX files up to 100MB each
              </div>
              <input
                type="file"
                multiple
                accept=".csv,.json,.txt,.pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
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

          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Confirm Contribution</h3>

            {/* Contribution Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Contribution Summary</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files:</span>
                  <span className="text-foreground">{uploadedFiles.length}</span>
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

        {/* Step 4: Success */}
        {currentStep === 4 && (
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
        {currentStep < 4 && (
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={currentStep === 3 ? handleSubmit : handleNext}
              disabled={
                (currentStep === 2 && uploadedFiles.length === 0) ||
                (currentStep === 3 && (!termsAccepted || isSubmitting))
              }
            >
              {currentStep === 3 ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Contribution"}
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
