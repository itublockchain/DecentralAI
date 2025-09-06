"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute inset-0 grain-texture opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-foreground/5 to-transparent rounded-full blur-3xl mesh-gradient"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-foreground/5 to-transparent rounded-full blur-3xl mesh-gradient"
          style={{ animationDelay: "-10s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
          Decentralized AI Models
          <span className="block text-muted-foreground">Marketplace</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Rent Private AI Models or Contribute Data Securely with Oasis ROFL
        </p>

        <Link href="/app">
          <Button size="lg" className="text-lg px-8 py-6 group">
            Explore Marketplace
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Stats Counter */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">247</div>
            <div className="text-sm text-muted-foreground">Active Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">1,429</div>
            <div className="text-sm text-muted-foreground">Data Contributors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">2.4M</div>
            <div className="text-sm text-muted-foreground">API Calls Today</div>
          </div>
        </div>
      </div>
    </section>
  )
}
