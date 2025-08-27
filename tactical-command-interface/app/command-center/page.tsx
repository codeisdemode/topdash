"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { fetchServers, fetchAlerts, fetchAlertStats, fetchServerMetrics, deleteServer } from "@/lib/api"
import TopDashAgentRegistration from "@/components/topdash-agent-registration"
import { Trash2 } from "lucide-react"

export default function CommandCenterPage() {
  const [servers, setServers] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, critical: 0 })
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [serverMetrics, setServerMetrics] = useState<any[]>([])
  const [refreshInterval, setRefreshInterval] = useState(5000)

  const loadServerMetrics = async (serverId: string) => {
    try {
      // Try to get detailed metrics first
      const metrics = await fetchServerMetrics(serverId, 1); // Last 1 hour
      setServerMetrics(metrics);
    } catch (error) {
      // Fall back to using last_metrics from servers data if detailed metrics fail
      console.log('Using last_metrics data as fallback');
      const server = servers.find(s => s.id.toString() === serverId);
      if (server?.last_metrics) {
        setServerMetrics([{
          ...server.last_metrics,
          network_in: 0,
          network_out: 0,
          site_status: 200
        }]);
      } else {
        // Use empty metrics
        setServerMetrics([{
          time: new Date().toISOString(),
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0,
          network_in: 0,
          network_out: 0,
          site_status: 0
        }]);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serversData, alertsData, statsData] = await Promise.all([
          fetchServers().catch(() => []),
          fetchAlerts({ resolved: false }).catch(() => []),
          fetchAlertStats().catch(() => ({ active: 0, critical: 0 }))
        ])
        setServers(serversData)
        setAlerts(alertsData)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()

    // Set up real-time refresh
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval])

  useEffect(() => {
    if (selectedServer) {
      loadServerMetrics(selectedServer);
      const interval = setInterval(() => loadServerMetrics(selectedServer), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedServer, refreshInterval])

  const activeServers = servers.filter((server: any) => server.last_metrics).length;
  
  const handleDeleteServer = async (serverId: string, serverName: string) => {
    if (confirm(`Are you sure you want to delete server "${serverName}"? This action cannot be undone.`)) {
      try {
        await deleteServer(serverId);
        // Remove the server from the local state
        setServers(servers.filter(server => server.id !== serverId));
        if (selectedServer === serverId) {
          setSelectedServer(null);
        }
      } catch (error) {
        console.error('Failed to delete server:', error);
        alert('Failed to delete server. Please try again.');
      }
    }
  };
  
  const getStatusColor = (metrics: any) => {
    if (!metrics) return 'neutral-500';
    const { cpu_usage, memory_usage, disk_usage } = metrics;
    if (cpu_usage > 80 || memory_usage > 85 || disk_usage > 90) return 'red-500';
    if (cpu_usage > 60 || memory_usage > 70 || disk_usage > 80) return 'yellow-500';
    return 'green-500';
  };

  const getStatusText = (metrics: any) => {
    if (!metrics) return 'OFFLINE';
    const { cpu_usage, memory_usage, disk_usage } = metrics;
    if (cpu_usage > 80 || memory_usage > 85 || disk_usage > 90) return 'CRITICAL';
    if (cpu_usage > 60 || memory_usage > 70 || disk_usage > 80) return 'WARNING';
    return 'ONLINE';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SERVER DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Real-time server monitoring and metrics overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-neutral-400">
            <span className="text-white font-mono">{servers.length}</span> Total Servers • 
            <span className="text-green-500 font-mono ml-1">{activeServers}</span> Active • 
            <span className="text-red-500 font-mono ml-1">{stats.critical || 0}</span> Critical
          </div>
        </div>
      </div>

      {/* Server Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {servers.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-neutral-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-neutral-600 rounded"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Servers Registered</h3>
                <p className="text-neutral-400 mb-4">
                  Add your first server to start monitoring system metrics and performance
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          servers.map((server: any) => {
            const status = server.last_metrics ? 'active' : 'offline';
            const statusColor = status === 'active' ? 
              getStatusColor(server.last_metrics) : 'neutral-500';
            const statusText = getStatusText(server.last_metrics);

            return (
              <Card
                key={server.id}
                className={`bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-all cursor-pointer ${
                  selectedServer === server.id.toString() ? 'border-orange-500 ring-1 ring-orange-500/20' : ''
                }`}
                onClick={() => setSelectedServer(selectedServer === server.id.toString() ? null : server.id.toString())}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                        <div className="w-5 h-5 bg-orange-500 rounded"></div>
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-white tracking-wider">{server.name}</CardTitle>
                        <p className="text-xs text-neutral-400 font-mono">{server.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteServer(server.id, server.name);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <div className={`w-2 h-2 rounded-full bg-${statusColor}`}></div>
                      <span className={`text-xs font-medium ${statusColor === 'green-500' ? 'text-green-500' : statusColor === 'yellow-500' ? 'text-yellow-500' : statusColor === 'red-500' ? 'text-red-500' : 'text-neutral-500'}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {server.last_metrics ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-neutral-400 mb-1">CPU</div>
                          <div className="text-white font-mono font-bold">{server.last_metrics.cpu_usage?.toFixed(0) || '0'}%</div>
                          <div className="w-full bg-neutral-800 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                server.last_metrics.cpu_usage > 80 ? 'bg-red-500' : 
                                server.last_metrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(server.last_metrics.cpu_usage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-neutral-400 mb-1">RAM</div>
                          <div className="text-white font-mono font-bold">{server.last_metrics.memory_usage?.toFixed(0) || '0'}%</div>
                          <div className="w-full bg-neutral-800 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                server.last_metrics.memory_usage > 85 ? 'bg-red-500' : 
                                server.last_metrics.memory_usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(server.last_metrics.memory_usage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-neutral-400 mb-1">DISK</div>
                          <div className="text-white font-mono font-bold">{server.last_metrics.disk_usage?.toFixed(0) || '0'}%</div>
                          <div className="w-full bg-neutral-800 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                server.last_metrics.disk_usage > 90 ? 'bg-red-500' : 
                                server.last_metrics.disk_usage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(server.last_metrics.disk_usage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-neutral-700">
                        <div className="flex justify-between text-xs text-neutral-400">
                          <span>Last Update:</span>
                          <span className="text-white font-mono">
                            {new Date(server.last_metrics.time || server.updated_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-400 mt-1">
                          <span>Uptime:</span>
                          <span className="text-green-500 font-mono">24d 7h 32m</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-neutral-500 text-xs mb-2">No data available</div>
                      <div className="text-neutral-600 text-xs">Server appears offline</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Bottom Section - Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Alert Log */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RECENT ALERTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.slice(0, 5).map((alert: any) => (
                <div
                  key={alert.id}
                  className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="text-neutral-500 font-mono">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                  <div className="text-white">
                    <span className="text-orange-500 font-mono">
                      {alert.server_name || 'System'}
                    </span>{' '}
                    {alert.message}
                  </div>
                  <div className="text-neutral-400 mt-1">
                    Severity: <span className={alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
              
              {alerts.length === 0 && (
                <div className="text-center py-4 text-neutral-500">
                  No active alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TopDash Agent Registration */}
        <TopDashAgentRegistration />

        {/* System Statistics */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SYSTEM STATISTICS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Total Uptime</span>
                <span className="text-white font-mono text-sm">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Avg Response Time</span>
                <span className="text-white font-mono text-sm">0.8ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Data Processed Today</span>
                <span className="text-white font-mono text-sm">2.4GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Last Full Backup</span>
                <span className="text-white font-mono text-sm">2h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics Display for Selected Server */}
      {selectedServer && (
        <Card className="mt-6 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              DETAILED METRICS - {servers.find(s => s.id.toString() === selectedServer)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serverMetrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <div className="text-3xl font-bold text-white font-mono mb-2">
                    {serverMetrics[0]?.cpu_usage?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">CPU Usage</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <div className="text-3xl font-bold text-white font-mono mb-2">
                    {serverMetrics[0]?.memory_usage?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Memory Usage</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <div className="text-3xl font-bold text-white font-mono mb-2">
                    {serverMetrics[0]?.disk_usage?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Disk Usage</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <div className="text-3xl font-bold text-white font-mono mb-2">
                    {serverMetrics[0]?.network_in?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Network In (MB)</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <div className="text-3xl font-bold text-white font-mono mb-2">
                    {serverMetrics[0]?.network_out?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Network Out (MB)</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No detailed metrics data available for this server
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
