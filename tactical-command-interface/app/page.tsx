"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Monitor, Settings, Shield, Target, Users, Bell, RefreshCw, LogOut, Cog, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs"
import CommandCenterPage from "./command-center/page"
import AgentNetworkPage from "./agent-network/page"
import OperationsPage from "./operations/page"
import IntelligencePage from "./intelligence/page"
import SystemsPage from "./systems/page"
import AlertsPage from "./alerts/page"
import AdminDashboard from "./admin/page"
import SettingsPage from "./settings/page"
import LandingPage from "@/components/LandingPage"

export default function TacticalDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent hydration errors by only rendering auth components after mount
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-orange-500 text-2xl font-bold mb-4">TOPDASH</h1>
          <p className="text-neutral-400">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"} text-center w-full`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">TOPDASH</h1>
              <p className="text-neutral-500 text-xs">v2.1.7 MONITORING</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: Monitor, label: "COMMAND CENTER" },
              { id: "agents", icon: Users, label: "AGENT NETWORK" },
              { id: "operations", icon: Target, label: "OPERATIONS" },
              { id: "intelligence", icon: Shield, label: "INTELLIGENCE" },
              { id: "systems", icon: Settings, label: "SYSTEMS" },
              { id: "alerts", icon: Bell, label: "ALERTS" },
              ...(user?.primaryEmailAddress?.emailAddress === "synthetixofficial@gmail.com" ? 
                [{ id: "admin", icon: UserCheck, label: "ADMIN" }] : []
              ),
              { id: "settings", icon: Cog, label: "SETTINGS" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>UPTIME: --:--:--</div>
                <div>AGENTS: -- ACTIVE</div>
                <div>MISSIONS: -- ONGOING</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              TOPDASH MONITORING / <span className="text-orange-500">OVERVIEW</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: --/--/---- --:-- UTC</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <UserButton 
              appearance={{
                elements: {
                  rootBox: "ml-2",
                  userButtonAvatarBox: "w-8 h-8",
                  userButtonTrigger: "text-neutral-400 hover:text-orange-500"
                }
              }}
            />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "overview" && <CommandCenterPage />}
          {activeSection === "agents" && <AgentNetworkPage />}
          {activeSection === "operations" && <OperationsPage />}
          {activeSection === "intelligence" && <IntelligencePage />}
          {activeSection === "systems" && <SystemsPage />}
          {activeSection === "alerts" && <AlertsPage />}
          {activeSection === "admin" && <AdminDashboard />}
          {activeSection === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
      </SignedIn>
    </>
  )
}
