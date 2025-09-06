import { Navigation } from "@/components/navigation"
import { ProfileContent } from "@/components/profile-content"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <ProfileContent />
      </div>
    </div>
  )
}
