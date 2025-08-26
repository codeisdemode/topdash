"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  Archive,
  Settings,
  Clock,
  Server,
  Activity,
  Mail,
  MessageSquare,
  Eye,
  X,
  Target
} from "lucide-react"
import { fetchServers, fetchAlerts } from "@/lib/api"

interface Alert {
  id: string
  type: 'threshold' | 'anomaly' | 'service' | 'custom'
  severity: 'info' | 'warning' | 'critical'
  server_name: string
  server_id: number
  title: string
  message: string
  metric?: string
  value?: number
  threshold?: number
  status: 'active' | 'acknowledged' | 'resolved'
  created_at: string
  acknowledged_at?: string
  resolved_at?: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [servers, setServers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("active")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [serversData, alertsData] = await Promise.all([
        fetchServers().catch(() => []),
        fetchAlerts({ resolved: filterStatus !== 'resolved' }).catch(() => [])
      ])
      
      setServers(serversData)
      
      // Generate some mock alerts based on server data and anomaly detection
      const mockAlerts: Alert[] = []
      
      // Add some sample alerts
      serversData.forEach(server => {
        if (server.last_metrics) {
          const { cpu_usage, memory_usage, disk_usage } = server.last_metrics
          
          // Generate threshold alerts
          if (cpu_usage > 80) {
            mockAlerts.push({
              id: `cpu-${server.id}-${Date.now()}`,
              type: 'threshold',
              severity: cpu_usage > 95 ? 'critical' : cpu_usage > 90 ? 'warning' : 'info',
              server_name: server.name,
              server_id: server.id,
              title: 'High CPU Usage Detected',
              message: `CPU usage is ${cpu_usage.toFixed(1)}% on ${server.name}`,
              metric: 'cpu',
              value: cpu_usage,
              threshold: 80,
              status: 'active',
              created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
            })
          }
          
          if (memory_usage > 85) {
            mockAlerts.push({
              id: `memory-${server.id}-${Date.now()}`,
              type: 'threshold',
              severity: memory_usage > 95 ? 'critical' : 'warning',
              server_name: server.name,
              server_id: server.id,
              title: 'High Memory Usage',
              message: `Memory usage is ${memory_usage.toFixed(1)}% on ${server.name}`,
              metric: 'memory',
              value: memory_usage,
              threshold: 85,
              status: 'active',
              created_at: new Date(Date.now() - Math.random() * 7200000).toISOString()
            })
          }
        }
      })

      // Add some resolved/acknowledged alerts for demo
      mockAlerts.push({
        id: 'resolved-1',
        type: 'service',
        severity: 'warning',
        server_name: 'Web Server',
        server_id: 1,
        title: 'Service Restart Required',
        message: 'Nginx service required restart due to configuration change',
        status: 'resolved',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: new Date(Date.now() - 82800000).toISOString()
      })

      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Failed to load alerts data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-500 border-red-500/20'
      case 'warning':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/20'
      case 'info':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/20'
      default:
        return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500/20 text-red-500'
      case 'acknowledged':
        return 'bg-orange-500/20 text-orange-500'
      case 'resolved':
        return 'bg-green-500/20 text-green-500'
      default:
        return 'bg-neutral-500/20 text-neutral-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold':
        return <Activity className="w-4 h-4" />
      case 'anomaly':
        return <Target className="w-4 h-4" />
      case 'service':
        return <Server className="w-4 h-4" />
      case 'custom':
        return <Settings className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.server_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length
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
          <h1 className="text-2xl font-bold text-white tracking-wider">ALERTS CENTER</h1>
          <p className="text-sm text-neutral-400">Real-time alerts and notification management</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Settings className="w-4 h-4 mr-2" />
            Configure Rules
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL ALERTS</p>
                <p className="text-2xl font-bold text-white font-mono">{alertStats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE ALERTS</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{alertStats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{alertStats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACKNOWLEDGED</p>
                <p className="text-2xl font-bold text-white font-mono">{alertStats.acknowledged}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterSeverity === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('all')}
            className="bg-neutral-800 text-white border-neutral-700"
          >
            All
          </Button>
          <Button
            variant={filterSeverity === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('critical')}
            className="bg-red-500/20 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
          >
            Critical
          </Button>
          <Button
            variant={filterSeverity === 'warning' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('warning')}
            className="bg-orange-500/20 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-white"
          >
            Warning
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className="bg-neutral-800 text-white border-neutral-700"
          >
            {filterStatus === 'active' ? 'Active Only' : 'Show All'}
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            ACTIVE ALERTS ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Alerts Found</h3>
                <p className="text-neutral-400">
                  {searchTerm || filterSeverity !== 'all' 
                    ? 'No alerts match your current filters'
                    : 'All systems are operating normally'
                  }
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 hover:border-orange-500/50 transition-colors cursor-pointer ${getSeverityColor(alert.severity)}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(alert.type)}
                        <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-neutral-300 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          <span>{alert.server_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                        {alert.value && alert.threshold && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{alert.value.toFixed(1)}% (threshold: {alert.threshold}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-white h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-green-500 h-8 w-8"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {selectedAlert.title}
                </CardTitle>
                <p className="text-sm text-neutral-400">{selectedAlert.server_name}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedAlert(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(selectedAlert.status)}>
                  {selectedAlert.status.toUpperCase()}
                </Badge>
                <Badge className="bg-neutral-800 text-neutral-300">
                  {selectedAlert.type.toUpperCase()}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">DESCRIPTION</h4>
                <p className="text-sm text-white">{selectedAlert.message}</p>
              </div>

              {selectedAlert.value && selectedAlert.threshold && (
                <div>
                  <h4 className="text-sm font-medium text-neutral-300 mb-2">METRICS</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Current Value:</span>
                      <span className="text-white font-mono">{selectedAlert.value.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Threshold:</span>
                      <span className="text-orange-500 font-mono">{selectedAlert.threshold}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
                <Button 
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}