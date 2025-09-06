import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Shield, Lock, CheckCircle, Zap, Users, TrendingUp } from "lucide-react"

export function ROFLBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            <Lock className="h-3 w-3 mr-1" />
            ROFL-Protected
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>
            Runtime OFfload (ROFL) technology ensures your data is encrypted end-to-end. No one, including us, can
            access your raw data during processing.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function PrivacyVerifiedBadge() {
  return (
    <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
      <Shield className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium text-green-800 dark:text-green-200">Privacy Verified</span>
      <CheckCircle className="h-3 w-3 text-green-600" />
    </div>
  )
}

export function ModelStatusBadge({ status }: { status: "training" | "ready" | "updating" }) {
  const statusConfig = {
    training: { color: "bg-yellow-100 text-yellow-800", icon: Zap, label: "Training" },
    ready: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Ready" },
    updating: { color: "bg-blue-100 text-blue-800", icon: TrendingUp, label: "Updating" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

export function DataProcessingBadge({ status }: { status: "encrypting" | "processing" | "active" }) {
  const statusConfig = {
    encrypting: { color: "bg-purple-100 text-purple-800", icon: Lock, label: "Encrypting" },
    processing: { color: "bg-blue-100 text-blue-800", icon: Zap, label: "Processing" },
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

export function ApiHealthBadge({ status }: { status: "operational" | "degraded" | "down" }) {
  const statusConfig = {
    operational: { color: "bg-green-100 text-green-800", label: "Operational" },
    degraded: { color: "bg-yellow-100 text-yellow-800", label: "Degraded" },
    down: { color: "bg-red-100 text-red-800", label: "Down" },
  }

  const config = statusConfig[status]

  return <Badge className={config.color}>{config.label}</Badge>
}

export function VerifiedContributorBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            <Users className="h-3 w-3 mr-1" />
            Verified Contributor
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This contributor has been verified and has a history of high-quality data submissions.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
