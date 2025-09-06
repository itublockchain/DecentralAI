"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

export function SettingsContent() {
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({})

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your API keys and account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Create New API Key */}
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>Generate a new API key to access AI models programmatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input id="keyName" placeholder="e.g., Production App" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyLimit">Usage Limit (tokens/month)</Label>
                <Input id="keyLimit" placeholder="e.g., 1000000" type="number" />
              </div>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </CardContent>
        </Card>

        {/* Existing API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage your existing API keys and monitor their usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Production App</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {showApiKey["prod"] ? "sk-1234567890abcdef..." : "sk-••••••••••••••••..."}
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => toggleApiKeyVisibility("prod")}>
                        {showApiKey["prod"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard("sk-1234567890abcdef...")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>456K / 1M tokens</div>
                      <div className="text-muted-foreground">45.6% used</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Development</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {showApiKey["dev"] ? "sk-abcdef1234567890..." : "sk-••••••••••••••••..."}
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => toggleApiKeyVisibility("dev")}>
                        {showApiKey["dev"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard("sk-abcdef1234567890...")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>23K / 100K tokens</div>
                      <div className="text-muted-foreground">23% used</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
