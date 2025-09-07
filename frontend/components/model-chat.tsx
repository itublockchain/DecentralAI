"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Loader2, User, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  sources?: any[]
  metadata?: any
}

interface ModelChatProps {
  campaignId: string
  modelName: string
}

export function ModelChat({ campaignId, modelName }: ModelChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const rawToken = localStorage.getItem('dynamic_authentication_token')
      
      if (!rawToken) {
        toast({
          title: "Authentication Required",
          description: "Please log in to chat with the model",
          variant: "destructive"
        })
        return
      }

      // Remove quotes from token if they exist
      const token = rawToken.replace(/^"(.*)"$/, '$1')

      const response = await fetch(`http://localhost:4000/api/campaigns/${campaignId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: input.trim(),
          topK: 5,
          minSimilarity: 0.1,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.data.answer,
          isUser: false,
          timestamp: new Date(),
          sources: data.data.sources,
          metadata: data.data.metadata,
        }

        setMessages((prev) => [...prev, botMessage])
      } else {
        throw new Error(data.message || "Failed to get response")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="border-border bg-card h-[600px] flex flex-col">
      <CardHeader className="pb-4 px-6 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {modelName}
        </CardTitle>
      </CardHeader>
      
      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with the model</p>
                <p className="text-sm mt-2">Ask questions about the available data</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    {message.metadata && (
                      <div className="mt-3 pt-3 border-t border-border/20">
                        <div className="text-xs opacity-75 space-y-1">
                          <div>Sources: {message.metadata.totalSourcesFound}</div>
                          <div>Processing: {message.metadata.processingTimeMs}ms</div>
                          <div>Model: {message.metadata.modelUsed}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted text-foreground rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input - Sticky at Bottom */}
      <div className="flex-shrink-0 p-6 pt-4 border-t border-border/50">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the model data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}