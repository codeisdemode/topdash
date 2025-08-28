"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Shield, Monitor, Lock, Globe, Server, Activity, Database, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignInButton } from "@clerk/nextjs"

export default function LandingPage() {
  const [currentTime, setCurrentTime] = useState("")
  const [activeStats, setActiveStats] = useState(0)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toISOString().slice(0, 19).replace("T", " ") + " UTC")
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStats((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { label: "SERVERS ONLINE", value: "2,847", icon: Server },
    { label: "UPTIME HOURS", value: "99.97%", icon: Activity },
    { label: "DATABASES MONITORED", value: "1,341", icon: Database },
    { label: "ALERTS RESOLVED", value: "8,692", icon: Shield },
  ]

  const features = [
    {
      icon: Server,
      title: "SERVER MONITORING",
      description: "Real-time monitoring of server health, performance metrics, and resource utilization",
    },
    {
      icon: Activity,
      title: "PERFORMANCE ANALYTICS",
      description: "Advanced analytics and alerting for system performance and bottleneck detection",
    },
    {
      icon: Database,
      title: "DATABASE OVERSIGHT",
      description: "Comprehensive database monitoring with query optimization and health tracking",
    },
    {
      icon: Monitor,
      title: "INFRASTRUCTURE CONTROL",
      description: "Centralized dashboard for managing and monitoring entire infrastructure stack",
    },
    {
      icon: Cpu,
      title: "RESOURCE TRACKING",
      description: "CPU, memory, disk, and network monitoring with predictive scaling insights",
    },
    {
      icon: Globe,
      title: "GLOBAL DEPLOYMENT",
      description: "Multi-region server monitoring with distributed system health visibility",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <Server className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-orange-500 font-bold text-xl tracking-wider">TOPDASH</h1>
                <p className="text-neutral-500 text-xs">SERVER MONITORING v2.1.7</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-500">{currentTime}</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-500">SYSTEM ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-orange-500 mb-8">
              <Lock className="w-4 h-4" />
              ADMIN ACCESS REQUIRED
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            TOPDASH
            <span className="block text-orange-500">SERVER</span>
            MONITORING
          </h1>

          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto text-balance">
            Advanced infrastructure monitoring platform for real-time server health, performance analytics, and
            comprehensive system oversight across your entire technology stack.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <SignInButton mode="modal">
              <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-8 py-3 text-lg">
                REQUEST ACCESS
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </SignInButton>
            <Button
              variant="outline"
              className="border-neutral-700 text-white hover:bg-neutral-800 px-8 py-3 text-lg bg-transparent"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              LEARN MORE
            </Button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`p-6 bg-neutral-900 border rounded-lg transition-all duration-500 ${
                  activeStats === index ? "border-orange-500 bg-neutral-800" : "border-neutral-700"
                }`}
              >
                <stat.icon
                  className={`w-8 h-8 mb-3 mx-auto ${activeStats === index ? "text-orange-500" : "text-neutral-400"}`}
                />
                <div className={`text-2xl font-bold mb-1 ${activeStats === index ? "text-orange-500" : "text-white"}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              MONITORING <span className="text-orange-500">CAPABILITIES</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Comprehensive suite of monitoring tools and analytics designed for maximum infrastructure visibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-orange-500 transition-all duration-300 group"
              >
                <feature.icon className="w-12 h-12 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-neutral-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            READY FOR <span className="text-orange-500">MONITORING</span>
          </h2>
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto">
            Join the advanced server monitoring platform. Access requires administrator privileges.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-8 py-4 text-lg">
                REQUEST DEMO ACCESS
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </SignInButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-700 bg-neutral-900 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <Server className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="text-orange-500 font-bold tracking-wider">TOPDASH</div>
                <div className="text-xs text-neutral-500">SERVER MONITORING</div>
              </div>
            </div>
            <div className="text-xs text-neutral-500 text-center md:text-right">
              <div>© 2025 TOPDASH SERVER MONITORING</div>
              <div>UNAUTHORIZED ACCESS PROHIBITED</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}