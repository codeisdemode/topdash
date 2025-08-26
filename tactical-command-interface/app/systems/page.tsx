"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Server,
  Database,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  MemoryStick,
  Globe,
} from "lucide-react"

export default function SystemsPage() {
  const [systemHealth, setSystemHealth] = useState({
    backend: 'online',
    database: 'online', 
    api: 'online',
    uptime: '99.9%',
    responseTime: '42ms',
    activeConnections: 12,
    memoryUsage: 65,
    cpuUsage: 23,
    diskUsage: 45
  })
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState([])

  useEffect(() => {
    // Simulate loading system health data
    const loadSystemHealth = async () => {
      try {
        // In a real implementation, this would fetch from /api/v1/system-health
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setSystemHealth({
          backend: 'online',
          database: 'online',
          api: 'online', 
          uptime: '99.9%',
          responseTime: '42ms',
          activeConnections: 12,
          memoryUsage: 65,
          cpuUsage: 23,
          diskUsage: 45
        })
        
        setMetrics([
          { time: '10:00', responseTime: 38, errors: 0 },
          { time: '10:05', responseTime: 42, errors: 2 },
          { time: '10:10', responseTime: 35, errors: 0 },
          { time: '10:15', responseTime: 48, errors: 1 },
          { time: '10:20', responseTime: 41, errors: 0 }
        ])
      } catch (error) {
        console.error('Failed to load system health:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSystemHealth()
    
    // Set up polling for real-time updates
    const interval = setInterval(loadSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-white/20 text-white"
      case "warning":
        return "bg-orange-500/20 text-orange-500"
      case "maintenance":
        return "bg-neutral-500/20 text-neutral-300"
      case "offline":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "maintenance":
        return <Settings className="w-4 h-4" />
      case "offline":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getSystemIcon = (type) => {
    switch (type) {
      case "Primary Server":
        return <Server className="w-6 h-6" />
      case "Database":
        return <Database className="w-6 h-6" />
      case "Firewall":
        return <Shield className="w-6 h-6" />
      case "Network":
        return <Wifi className="w-6 h-6" />
      case "Storage":
        return <HardDrive className="w-6 h-6" />
      case "Processing":
        return <Cpu className="w-6 h-6" />
      default:
        return <Server className="w-6 h-6" />
    }
  }

  const getHealthColor = (health) => {
    if (health >= 95) return "text-white"
    if (health >= 85) return "text-white"
    if (health >= 70) return "text-orange-500"
    return "text-red-500"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">INFRASTRUCTURE HEALTH</h1>
          <p className="text-sm text-neutral-400">Monitor your TopDash monitoring system performance</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Refresh</Button>
          <Button className="bg-neutral-700 hover:bg-neutral-600 text-white">View Logs</Button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SYSTEM UPTIME</p>
                <p className="text-2xl font-bold text-white font-mono">{systemHealth.uptime}</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RESPONSE TIME</p>
                <p className="text-2xl font-bold text-white font-mono">{systemHealth.responseTime}</p>
              </div>
              <Server className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE CONNECTIONS</p>
                <p className="text-2xl font-bold text-white font-mono">{systemHealth.activeConnections}</p>
              </div>
              <Wifi className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">MEMORY USAGE</p>
                <p className="text-2xl font-bold text-white font-mono">{systemHealth.memoryUsage}%</p>
              </div>
              <MemoryStick className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend Service */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-sm font-bold text-white tracking-wider">BACKEND API</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.backend === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Badge className={systemHealth.backend === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                  {systemHealth.backend.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Port:</span>
              <span className="text-white font-mono">3001</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Environment:</span>
              <span className="text-white">production</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Version:</span>
              <span className="text-white">2.1.7</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Service */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-sm font-bold text-white tracking-wider">DATABASE</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.database === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Badge className={systemHealth.database === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                  {systemHealth.database.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Type:</span>
              <span className="text-white">SQLite</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Size:</span>
              <span className="text-white font-mono">2.4MB</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Tables:</span>
              <span className="text-white font-mono">8</span>
            </div>
          </CardContent>
        </Card>

        {/* API Gateway */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-sm font-bold text-white tracking-wider">API GATEWAY</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.api === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Badge className={systemHealth.api === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                  {systemHealth.api.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Requests:</span>
              <span className="text-white font-mono">1.2K/min</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Success Rate:</span>
              <span className="text-white font-mono">99.8%</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Avg Latency:</span>
              <span className="text-white font-mono">58ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white tracking-wider">CPU USAGE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white font-mono mb-2">{systemHealth.cpuUsage}%</div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    systemHealth.cpuUsage > 80 ? 'bg-red-500' : 
                    systemHealth.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.cpuUsage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white tracking-wider">MEMORY USAGE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white font-mono mb-2">{systemHealth.memoryUsage}%</div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    systemHealth.memoryUsage > 85 ? 'bg-red-500' : 
                    systemHealth.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white tracking-wider">DISK USAGE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white font-mono mb-2">{systemHealth.diskUsage}%</div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    systemHealth.diskUsage > 90 ? 'bg-red-500' : 
                    systemHealth.diskUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Metrics */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white tracking-wider">PERFORMANCE METRICS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left text-neutral-400 pb-2">Time</th>
                  <th className="text-right text-neutral-400 pb-2">Response Time</th>
                  <th className="text-right text-neutral-400 pb-2">Errors</th>
                  <th className="text-right text-neutral-400 pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index} className="border-b border-neutral-800 last:border-b-0">
                    <td className="py-2 text-neutral-300">{metric.time}</td>
                    <td className="py-2 text-right font-mono text-white">{metric.responseTime}ms</td>
                    <td className="py-2 text-right font-mono">
                      <span className={metric.errors > 0 ? 'text-red-400' : 'text-green-400'}>
                        {metric.errors}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Badge className={metric.errors > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}>
                        {metric.errors > 0 ? 'WARNING' : 'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
