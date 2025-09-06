import { ModelCard } from "@/components/model-card"

const mockModels = [
  {
    id: "1",
    name: "MedicalGPT Pro",
    domain: "Medical",
    avatar: "/medical-ai-robot.jpg",
    accuracy: 94,
    apiCalls: "1.2M",
    dataSources: 48,
    price: 0.02,
    description:
      "Advanced medical diagnosis and treatment recommendation AI trained on comprehensive medical literature and case studies.",
    status: "active" as const,
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.002,
    nftHolders: 156,
    monthlyRevenue: 12500,
  },
  {
    id: "2",
    name: "LegalMind AI",
    domain: "Legal",
    avatar: "/legal-ai-scales-justice.jpg",
    accuracy: 91,
    apiCalls: "856K",
    dataSources: 32,
    price: 0.035,
    description: "Specialized legal research and document analysis AI for contract review and case law research.",
    status: "funding" as const,
    requiredDatasets: 200,
    currentDatasets: 145,
    inputTokenPrice: 0.0015,
    outputTokenPrice: 0.003,
  },
  {
    id: "3",
    name: "FinanceBot Elite",
    domain: "Financial",
    avatar: "/financial-ai-chart-graph.jpg",
    accuracy: 96,
    apiCalls: "2.1M",
    dataSources: 67,
    price: 0.05,
    description: "High-performance financial analysis AI for market predictions and risk assessment.",
    status: "active" as const,
    inputTokenPrice: 0.002,
    outputTokenPrice: 0.004,
    nftHolders: 89,
    monthlyRevenue: 8900,
  },
  {
    id: "4",
    name: "ResearchAI Scholar",
    domain: "Research",
    avatar: "/research-ai-microscope.jpg",
    accuracy: 89,
    apiCalls: "445K",
    dataSources: 28,
    price: 0.015,
    description: "Academic research assistant AI specialized in literature review and hypothesis generation.",
    status: "funding" as const,
    requiredDatasets: 150,
    currentDatasets: 67,
    inputTokenPrice: 0.0008,
    outputTokenPrice: 0.0016,
  },
  {
    id: "5",
    name: "GeneralGPT Plus",
    domain: "General",
    avatar: "/general-ai-brain-network.jpg",
    accuracy: 87,
    apiCalls: "3.4M",
    dataSources: 89,
    price: 0.01,
    description: "Versatile general-purpose AI model suitable for a wide range of applications and use cases.",
    status: "active" as const,
    inputTokenPrice: 0.0005,
    outputTokenPrice: 0.001,
    nftHolders: 234,
    monthlyRevenue: 15600,
  },
  {
    id: "6",
    name: "BioMed Specialist",
    domain: "Medical",
    avatar: "/biomedical-ai-dna-helix.jpg",
    accuracy: 92,
    apiCalls: "678K",
    dataSources: 41,
    price: 0.025,
    description: "Biomedical research AI focused on drug discovery and molecular analysis.",
    status: "inactive" as const,
    requiredDatasets: 100,
    currentDatasets: 23,
    inputTokenPrice: 0.0012,
    outputTokenPrice: 0.0024,
  },
]

export { mockModels }

export function ModelGrid() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockModels.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  )
}
