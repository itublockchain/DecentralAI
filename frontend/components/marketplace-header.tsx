"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { CreateCampaignModal } from "@/components/create-campaign-modal"

export function MarketplaceHeader() {
  const [activeFilter, setActiveFilter] = useState("All")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filters = ["All", "Active Models", "Funding Campaigns", "Medical", "Legal", "Financial", "Research", "General"]
  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "most-used", label: "Most Used" },
    { value: "best-performance", label: "Best Performance" },
    { value: "newest", label: "Newest" },
    { value: "funding-progress", label: "Funding Progress" },
  ]

  return (
    <>
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Create Campaign Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Model Marketplace</h1>
              <p className="text-muted-foreground">Discover, fund, and earn from decentralized AI models</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Model Campaign
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search models by name, domain, or use case..."
              className="pl-12 pr-4 py-6 text-lg bg-muted/50 border-border focus:bg-background transition-colors"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter}
                  variant={activeFilter === filter ? "default" : "secondary"}
                  className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select defaultValue="trending">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <CreateCampaignModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  )
}
