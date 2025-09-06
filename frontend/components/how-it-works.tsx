import { Card, CardContent } from "@/components/ui/card"
import { Search, Key, Play, Upload, Lock, DollarSign } from "lucide-react"

export function HowItWorks() {
  const rentFlow = [
    { icon: Search, title: "Browse Models", description: "Explore our marketplace of specialized AI models" },
    { icon: Key, title: "Rent Model", description: "Choose your pricing plan and get instant access" },
    { icon: Key, title: "Get API Key", description: "Receive your secure API key for integration" },
    { icon: Play, title: "Start Using", description: "Begin making API calls to your rented model" },
  ]

  const contributeFlow = [
    { icon: Search, title: "Browse Models", description: "Find models that need your type of data" },
    { icon: Upload, title: "Contribute Data", description: "Upload your high-quality datasets" },
    { icon: Lock, title: "Encrypt & Upload", description: "Data is encrypted with ROFL for privacy" },
    { icon: DollarSign, title: "Earn Revenue", description: "Get paid as your data improves models" },
  ]

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            Two simple ways to participate in the decentralized AI economy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Rent Models Flow */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">Rent AI Models</h3>
            <div className="space-y-6">
              {rentFlow.map((step, index) => (
                <Card key={index} className="border-border bg-card hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0">
                      <step.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contribute Data Flow */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">Contribute Data</h3>
            <div className="space-y-6">
              {contributeFlow.map((step, index) => (
                <Card key={index} className="border-border bg-card hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0">
                      <step.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
