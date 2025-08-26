"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Eye, Download, Filter, Globe, Shield, AlertTriangle, Activity, Bell } from "lucide-react"
import { fetchServers } from "@/lib/api"

export default function IntelligencePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState(null)
  const [servers, setServers] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [securityEvents, setSecurityEvents] = useState([])

  useEffect(() => {
    const loadServers = async () => {
      try {
        const serversData = await fetchServers()
        setServers(serversData)
        detectAnomalies(serversData)
      } catch (error) {
        console.error('Failed to load servers:', error)
      }
    }

    loadServers()
    const interval = setInterval(loadServers, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const detectAnomalies = (serversData) => {
    const detectedAnomalies = []
    const events = []

    serversData.forEach(server => {
      if (server.last_metrics) {
        const { cpu_usage, memory_usage, disk_usage } = server.last_metrics
        const timestamp = new Date().toISOString()

        // CPU Anomaly Detection
        if (cpu_usage > 90) {
          detectedAnomalies.push({
            id: `cpu-${server.id}-${Date.now()}`,
            type: 'CPU_HIGH',
            server_name: server.name,
            server_id: server.id,
            message: `High CPU usage detected: ${cpu_usage.toFixed(1)}%`,
            value: cpu_usage,
            threshold: 90,
            severity: cpu_usage > 95 ? 'critical' : 'warning',
            timestamp
          })
        }

        // Memory Anomaly Detection
        if (memory_usage > 95) {
          detectedAnomalies.push({
            id: `memory-${server.id}-${Date.now()}`,
            type: 'MEMORY_HIGH',
            server_name: server.name,
            server_id: server.id,
            message: `High memory usage detected: ${memory_usage.toFixed(1)}%`,
            value: memory_usage,
            threshold: 95,
            severity: 'critical',
            timestamp
          })
        } else if (memory_usage > 85) {
          detectedAnomalies.push({
            id: `memory-${server.id}-${Date.now()}`,
            type: 'MEMORY_WARNING',
            server_name: server.name,
            server_id: server.id,
            message: `Elevated memory usage: ${memory_usage.toFixed(1)}%`,
            value: memory_usage,
            threshold: 85,
            severity: 'warning',
            timestamp
          })
        }

        // Disk Space Anomaly Detection
        if (disk_usage > 90) {
          detectedAnomalies.push({
            id: `disk-${server.id}-${Date.now()}`,
            type: 'DISK_HIGH',
            server_name: server.name,
            server_id: server.id,
            message: `Low disk space: ${disk_usage.toFixed(1)}% used`,
            value: disk_usage,
            threshold: 90,
            severity: disk_usage > 95 ? 'critical' : 'warning',
            timestamp
          })
        }

        // Pattern Detection - Unusual Resource Combinations
        if (cpu_usage > 80 && memory_usage > 80) {
          events.push({
            id: `pattern-${server.id}-${Date.now()}`,
            type: 'RESOURCE_SPIKE',
            server_name: server.name,
            server_id: server.id,
            message: `Resource spike detected - CPU: ${cpu_usage.toFixed(1)}%, RAM: ${memory_usage.toFixed(1)}%`,
            severity: 'info',
            timestamp
          })
        }
      }
    })

    setAnomalies(detectedAnomalies)
    setSecurityEvents([...events, ...detectedAnomalies])
  }

  const reports = securityEvents

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "warning":
        return "bg-orange-500/20 text-orange-500"
      case "info":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "CPU_HIGH":
        return "bg-red-500/20 text-red-500"
      case "MEMORY_HIGH":
      case "MEMORY_WARNING":
        return "bg-orange-500/20 text-orange-500"
      case "DISK_HIGH":
        return "bg-yellow-500/20 text-yellow-500"
      case "RESOURCE_SPIKE":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "warning":
        return "bg-orange-500/20 text-orange-500"
      case "info":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-green-500/20 text-green-400"
    }
  }

  const filteredReports = reports.filter(
    (report) =>
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.server_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length
  const totalEvents = securityEvents.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SECURITY ANALYTICS</h1>
          <p className="text-sm text-neutral-400">Security events and threat intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">New Analysis</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search security analytics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SECURITY EVENTS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalEvents}</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ALERTS</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{criticalAnomalies}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">MONITORED SERVERS</p>
                <p className="text-2xl font-bold text-white font-mono">{servers.length}</p>
              </div>
              <Globe className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection Results */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ANOMALY DETECTION</CardTitle>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-neutral-400">Real-time monitoring active</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Anomalies Detected</h3>
                <p className="text-neutral-400 mb-4">
                  All monitored servers are operating within normal parameters
                </p>
                <div className="text-xs text-neutral-500">
                  Monitoring: CPU usage &gt; 90%, Memory &gt; 85%, Disk &gt; 90%
                </div>
              </div>
            ) : (
              filteredReports.map((report) => (
              <div
                key={report.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wider">{report.type.replace(/_/g, ' ')}</h3>
                        <p className="text-xs text-neutral-400 font-mono">{report.server_name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-300 ml-8">{report.message}</p>

                    <div className="flex flex-wrap gap-2 ml-8">
                      <Badge className={getTypeColor(report.type)}>{report.type}</Badge>
                      {report.threshold && (
                        <Badge className="bg-neutral-800 text-neutral-300 text-xs">
                          Threshold: {report.threshold}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getSeverityColor(report.severity)}>{report.severity.toUpperCase()}</Badge>
                      <Badge className="bg-orange-500/20 text-orange-500">ACTIVE</Badge>
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        <span>Server {report.server_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        <span>{report.value?.toFixed(1)}%</span>
                      </div>
                      <div className="font-mono">{new Date(report.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {selectedReport.type.replace(/_/g, ' ')}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedReport.server_name}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedReport(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">ANOMALY DETAILS</h3>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(selectedReport.severity)}>
                        {selectedReport.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getTypeColor(selectedReport.type)}>
                        {selectedReport.type}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">SERVER INFORMATION</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Server Name:</span>
                        <span className="text-white font-mono">{selectedReport.server_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Server ID:</span>
                        <span className="text-white">{selectedReport.server_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Detection Time:</span>
                        <span className="text-white font-mono">{new Date(selectedReport.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <Badge className="bg-orange-500/20 text-orange-500">ACTIVE</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">METRICS</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Current Value</span>
                        <span className="text-white font-mono">{selectedReport.value?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Threshold</span>
                        <span className="text-orange-500 font-mono">{selectedReport.threshold}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            selectedReport.severity === "critical" ? "bg-red-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${Math.min(selectedReport.value || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">SEVERITY ASSESSMENT</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Severity Level</span>
                        <Badge className={getSeverityColor(selectedReport.severity)}>
                          {selectedReport.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIPTION</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{selectedReport.message}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Alert
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Server
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
