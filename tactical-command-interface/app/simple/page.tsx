"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Monitor, Settings, Shield, Target, Users, Bell, RefreshCw, Cog } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SimpleDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300`}
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
                className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
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
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              TOPDASH MONITORING / <span className="text-orange-500">OVERVIEW</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">SIMPLE MODE</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Simple Dashboard Working!</h1>
            <p className="text-neutral-400 mb-8">This version bypasses Clerk authentication</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded p-4">
                <h3 className="text-orange-500 font-bold">Backend Status</h3>
                <p className="text-neutral-300">Connected</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded p-4">
                <h3 className="text-orange-500 font-bold">Active Servers</h3>
                <p className="text-neutral-300">1 Agent Online</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded p-4">
                <h3 className="text-orange-500 font-bold">Current Section</h3>
                <p className="text-neutral-300">{activeSection.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}