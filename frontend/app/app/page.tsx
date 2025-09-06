import { Navigation } from "@/components/navigation"
import { MarketplaceHeader } from "@/components/marketplace-header"
import { ModelGrid } from "@/components/model-grid"

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <MarketplaceHeader />
        <ModelGrid />
      </main>
    </div>
  )
}
