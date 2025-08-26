"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Server, 
  Database, 
  AlertTriangle, 
  Eye, 
  UserX, 
  Shield,
  Activity,
  Clock,
  Mail,
  Settings,
  Trash2
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { clientAPI } from "@/lib/api"

const ADMIN_EMAIL = "synthetixofficial@gmail.com"

interface Tenant {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
  server_count: number
  last_activity: string
}

export default function AdminDashboard() {
  const { user } = useUser()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [servers, setServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Check if current user is admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const loadAdminData = async () => {
    try {
      // Load all servers to get tenant information
      const serversData = await clientAPI.servers.getAll()
      setServers(serversData)
      
      // Mock tenant data based on servers (in a real app, this would come from a dedicated endpoint)
      const mockTenants: Tenant[] = [
        {
          id: "1",
          name: "Main Organization",
          email: user?.primaryEmailAddress?.emailAddress || "",
          plan: "enterprise",
          created_at: new Date().toISOString(),
          server_count: serversData.length,
          last_activity: new Date().toISOString()
        }
      ]
      
      setTenants(mockTenants)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="bg-red-900/20 border-red-500/50 max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-500 mb-2">Access Denied</h3>
              <p className="text-neutral-400">
                This area is restricted to system administrators only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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

  const systemStats = {
    totalTenants: tenants.length,
    totalServers: servers.length,
    activeServers: servers.filter(s => s.last_metrics).length,
    criticalAlerts: 0 // Would come from alerts API
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">ADMIN DASHBOARD</h1>
          <p className="text-sm text-neutral-400">System administration and tenant management</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL TENANTS</p>
                <p className="text-2xl font-bold text-white font-mono">{systemStats.totalTenants}</p>
              </div>
              <Users className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL SERVERS</p>
                <p className="text-2xl font-bold text-white font-mono">{systemStats.totalServers}</p>
              </div>
              <Server className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE SERVERS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{systemStats.activeServers}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ALERTS</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{systemStats.criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Management */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white tracking-wider">TENANT MANAGEMENT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="border border-neutral-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                      <Badge className={
                        tenant.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-500' :
                        tenant.plan === 'pro' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-green-500/20 text-green-500'
                      }>
                        {tenant.plan.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400">Email</p>
                        <p className="text-white">{tenant.email}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Servers</p>
                        <p className="text-white font-mono">{tenant.server_count}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Created</p>
                        <p className="text-white">{new Date(tenant.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTenant(tenant)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Server Overview */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white tracking-wider">
            SERVER OVERVIEW ({servers.length} servers)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">SERVER</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">IP ADDRESS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CPU</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">MEMORY</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server, index) => (
                  <tr
                    key={server.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-white">{server.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">{server.ip}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            server.last_metrics ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-xs text-neutral-300 uppercase tracking-wider">
                          {server.last_metrics ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {server.last_metrics ? `${server.last_metrics.cpu_usage?.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {server.last_metrics ? `${server.last_metrics.memory_usage?.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-300">
                      {server.last_metrics ? 
                        new Date(server.last_metrics.timestamp).toLocaleString() : 
                        'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {selectedTenant.name}
                </CardTitle>
                <p className="text-sm text-neutral-400">{selectedTenant.email}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedTenant(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PLAN</p>
                  <Badge className={
                    selectedTenant.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-500' :
                    selectedTenant.plan === 'pro' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-green-500/20 text-green-500'
                  }>
                    {selectedTenant.plan.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">SERVERS</p>
                  <p className="text-lg font-bold text-white font-mono">{selectedTenant.server_count}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">CREATED</p>
                  <p className="text-sm text-white">{new Date(selectedTenant.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LAST ACTIVITY</p>
                  <p className="text-sm text-white">{new Date(selectedTenant.last_activity).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="text-sm text-neutral-400 p-4 bg-neutral-800 rounded border border-neutral-700">
                <p className="mb-2"><strong>Admin Note:</strong></p>
                <p>This admin dashboard provides read-only access to tenant information for monitoring purposes. 
                   No sensitive data like API keys or passwords are accessible through this interface.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}