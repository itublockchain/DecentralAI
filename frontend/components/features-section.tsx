import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, Brain } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Complete Privacy",
      description:
        "Your data is encrypted with TEE technology, ensuring complete privacy and security throughout the process.",
    },
    {
      icon: TrendingUp,
      title: "Dual Earning",
      description:
        "Earn revenue both ways - rent AI models via API or contribute your data to improve existing models.",
    },
    {
      icon: Brain,
      title: "Domain Expertise",
      description:
        "Access specialized AI models trained for specific domains like medical, legal, financial, and research.",
    },
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose DecentralAI?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of AI with complete privacy, dual earning opportunities, and specialized models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-6">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
