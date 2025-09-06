"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiPlaygroundProps {
  modelName: string
}

export function ApiPlayground({ modelName }: ApiPlaygroundProps) {
  const [prompt, setPrompt] = useState(
    "Patient presents with chest pain, shortness of breath, and elevated troponin levels.",
  )
  const [maxTokens, setMaxTokens] = useState("500")
  const [temperature, setTemperature] = useState("0.7")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setResponse(`Based on the symptoms and elevated troponin levels, this presentation is highly suggestive of acute myocardial infarction (heart attack). 

Immediate recommendations:
1. Obtain 12-lead ECG immediately
2. Administer aspirin 325mg if no contraindications
3. Prepare for urgent cardiac catheterization
4. Monitor vital signs continuously
5. Consider antiplatelet therapy (clopidogrel)

The elevated troponin confirms myocardial injury, and the combination with chest pain and dyspnea requires immediate intervention to restore coronary blood flow and minimize myocardial damage.`)
      setIsLoading(false)
    }, 2000)
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
    toast({
      title: "Response Copied",
      description: "The API response has been copied to your clipboard.",
    })
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          API Playground
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input id="maxTokens" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} placeholder="500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="0.7"
            />
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={4}
          />
        </div>

        {/* Test Button */}
        <Button onClick={handleTest} disabled={isLoading || !prompt.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Response...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Test API
            </>
          )}
        </Button>

        {/* Response */}
        {response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Response</Label>
              <Button variant="outline" size="sm" onClick={copyResponse}>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">{response}</div>
            <div className="flex gap-2">
              <Badge variant="secondary">Tokens: 156</Badge>
              <Badge variant="secondary">Time: 1.2s</Badge>
              <Badge variant="secondary">Cost: $0.003</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
