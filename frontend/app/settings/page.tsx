import { Navigation } from "@/components/navigation"
import { SettingsContent } from "@/components/settings-content"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SettingsContent />
      </div>
    </div>
  )
}
