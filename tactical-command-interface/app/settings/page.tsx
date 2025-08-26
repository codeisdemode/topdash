"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings,
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  Save, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Globe,
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Shield,
  Bell,
  Server,
  Edit,
  Target
} from "lucide-react"
import { toast } from "sonner"

interface SystemSettings {
  email_notifications: boolean
  email_address: string
  telegram_notifications: boolean
  telegram_bot_token: string
  telegram_chat_id: string
  alert_thresholds: {
    cpu: number
    memory: number
    disk: number
    site_status: number
  }
}

interface ApiKey {
  id: string
  name: string
  created_at: string
  expires_at: string | null
  last_used: string | null
  revoked: boolean
  user_email: string
}

interface Server {
  id: number
  name: string
  ip: string
  last_metrics?: any
}

interface AlertRule {
  id: string
  server_id: number | null // null means applies to all servers
  server_name?: string
  name: string
  type: 'threshold' | 'anomaly' | 'service' | 'custom'
  condition: string
  threshold_value?: number
  threshold_metric?: 'cpu' | 'memory' | 'disk' | 'network'
  enabled: boolean
  email_enabled: boolean
  telegram_enabled: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    email_notifications: false,
    email_address: '',
    telegram_notifications: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    alert_thresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      site_status: 400
    }
  })
  const [systemLoading, setSystemLoading] = useState(true)
  const [systemSaving, setSystemSaving] = useState(false)

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)

  // Alert Management State
  const [servers, setServers] = useState<Server[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [showNewAlertForm, setShowNewAlertForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null)

  // Active tab state
  const [activeTab, setActiveTab] = useState("system")

  useEffect(() => {
    loadSystemSettings()
    loadApiKeys()
    loadServers()
    loadAlertRules()
  }, [])

  // System Settings Functions
  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/v1/settings')
      
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data)
      }
    } catch (error) {
      console.error('Settings load error:', error)
      toast.error('Failed to load system settings')
    } finally {
      setSystemLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    setSystemSaving(true)
    
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemSettings)
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Settings save error:', error)
      toast.error('Failed to save settings')
    } finally {
      setSystemSaving(false)
    }
  }

  const updateThreshold = (key: keyof SystemSettings['alert_thresholds'], value: string) => {
    setSystemSettings(prev => ({
      ...prev,
      alert_thresholds: {
        ...prev.alert_thresholds,
        [key]: parseInt(value)
      }
    }))
  }

  // API Keys Functions
  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/v1/api-keys')
      
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error('API keys load error:', error)
      toast.error('Failed to load API keys')
    } finally {
      setApiKeysLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setCreatingKey(true)
    
    try {
      const response = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName })
      })

      if (response.ok) {
        const data = await response.json()
        setNewKey(data.api_key)
        setNewKeyName('')
        setShowNewKeyForm(false)
        toast.success('API key created successfully')
        loadApiKeys()
      } else {
        throw new Error('Failed to create API key')
      }
    } catch (error) {
      console.error('API key creation error:', error)
      toast.error('Failed to create API key')
    } finally {
      setCreatingKey(false)
    }
  }

  const revokeApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('API key revoked successfully')
        loadApiKeys()
      } else {
        throw new Error('Failed to revoke API key')
      }
    } catch (error) {
      console.error('API key revocation error:', error)
      toast.error('Failed to revoke API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (revoked: boolean) => {
    return revoked
      ? 'bg-red-500/20 text-red-500'
      : 'bg-white/20 text-white'
  }

  const getStatusText = (revoked: boolean) => {
    return revoked ? 'REVOKED' : 'ACTIVE'
  }

  // Alert Management Functions
  const loadServers = async () => {
    try {
      const response = await fetch('/api/v1/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error('Failed to load servers:', error)
    } finally {
      setAlertsLoading(false)
    }
  }

  const loadAlertRules = async () => {
    try {
      // For now, we'll use mock data since we don't have alert rules API yet
      const mockRules: AlertRule[] = [
        {
          id: '1',
          server_id: null,
          name: 'Global High CPU Alert',
          type: 'threshold',
          condition: 'CPU usage > 90%',
          threshold_value: 90,
          threshold_metric: 'cpu',
          enabled: true,
          email_enabled: true,
          telegram_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          server_id: 1,
          server_name: 'Production Server',
          name: 'Memory Warning',
          type: 'threshold',
          condition: 'Memory usage > 85%',
          threshold_value: 85,
          threshold_metric: 'memory',
          enabled: true,
          email_enabled: true,
          telegram_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setAlertRules(mockRules)
    } catch (error) {
      console.error('Failed to load alert rules:', error)
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'threshold':
        return 'bg-orange-500/20 text-orange-500'
      case 'anomaly':
        return 'bg-red-500/20 text-red-500'
      case 'service':
        return 'bg-blue-500/20 text-blue-500'
      case 'custom':
        return 'bg-purple-500/20 text-purple-500'
      default:
        return 'bg-neutral-500/20 text-neutral-300'
    }
  }

  const getMetricIcon = (metric?: string) => {
    switch (metric) {
      case 'cpu':
        return <Cpu className="w-4 h-4" />
      case 'memory':
        return <MemoryStick className="w-4 h-4" />
      case 'disk':
        return <HardDrive className="w-4 h-4" />
      case 'network':
        return <Globe className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  if (systemLoading || apiKeysLoading || alertsLoading) {
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
          <h1 className="text-2xl font-bold text-white tracking-wider">SETTINGS</h1>
          <p className="text-sm text-neutral-400">Configure system settings, notifications, and API keys</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-neutral-900 border border-neutral-700">
          <TabsTrigger value="system" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Alert Management
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button 
              onClick={saveSystemSettings}
              disabled={systemSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {systemSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">EMAIL NOTIFICATIONS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="text-neutral-300">
                    Enable Email Alerts
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={systemSettings.email_notifications}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, email_notifications: checked })}
                  />
                </div>

                {systemSettings.email_notifications && (
                  <div className="space-y-2">
                    <Label htmlFor="email-address" className="text-neutral-300">
                      Email Address
                    </Label>
                    <Input
                      id="email-address"
                      type="email"
                      value={systemSettings.email_address}
                      onChange={(e) => setSystemSettings({ ...systemSettings, email_address: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Telegram Notifications */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">TELEGRAM NOTIFICATIONS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="telegram-notifications" className="text-neutral-300">
                    Enable Telegram Alerts
                  </Label>
                  <Switch
                    id="telegram-notifications"
                    checked={systemSettings.telegram_notifications}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, telegram_notifications: checked })}
                  />
                </div>

                {systemSettings.telegram_notifications && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-bot-token" className="text-neutral-300">
                        Bot Token
                      </Label>
                      <Input
                        id="telegram-bot-token"
                        type="password"
                        value={systemSettings.telegram_bot_token}
                        onChange={(e) => setSystemSettings({ ...systemSettings, telegram_bot_token: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white"
                        placeholder="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegram-chat-id" className="text-neutral-300">
                        Chat ID
                      </Label>
                      <Input
                        id="telegram-chat-id"
                        type="text"
                        value={systemSettings.telegram_chat_id}
                        onChange={(e) => setSystemSettings({ ...systemSettings, telegram_chat_id: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white"
                        placeholder="-123456789"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card className="bg-neutral-900 border-neutral-700 lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">ALERT THRESHOLDS</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cpu-threshold" className="text-neutral-300 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      CPU (%)
                    </Label>
                    <Input
                      id="cpu-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={systemSettings.alert_thresholds.cpu}
                      onChange={(e) => updateThreshold('cpu', e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memory-threshold" className="text-neutral-300 flex items-center gap-2">
                      <MemoryStick className="w-4 h-4" />
                      Memory (%)
                    </Label>
                    <Input
                      id="memory-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={systemSettings.alert_thresholds.memory}
                      onChange={(e) => updateThreshold('memory', e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disk-threshold" className="text-neutral-300 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Disk (%)
                    </Label>
                    <Input
                      id="disk-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={systemSettings.alert_thresholds.disk}
                      onChange={(e) => updateThreshold('disk', e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site-status-threshold" className="text-neutral-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      HTTP Status
                    </Label>
                    <Input
                      id="site-status-threshold"
                      type="number"
                      min="100"
                      max="599"
                      value={systemSettings.alert_thresholds.site_status}
                      onChange={(e) => updateThreshold('site_status', e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alert Management Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Alert Management</h3>
              <p className="text-sm text-neutral-400">Configure per-server alerts and notification rules</p>
            </div>
            <Button 
              onClick={() => setShowNewAlertForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Alert Rule
            </Button>
          </div>

          {/* Server-based Alert Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Alert Rules */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">GLOBAL RULES</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {alertRules.filter(rule => rule.server_id === null).map((rule) => (
                  <div key={rule.id} className="border border-neutral-700 rounded p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getMetricIcon(rule.threshold_metric)}
                          <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                          <Switch 
                            checked={rule.enabled}
                            onCheckedChange={() => {/* TODO: Toggle rule */}}
                          />
                        </div>
                        <p className="text-xs text-neutral-400 mb-2">{rule.condition}</p>
                        <div className="flex gap-2">
                          <Badge className={getAlertTypeColor(rule.type)}>{rule.type.toUpperCase()}</Badge>
                          {rule.email_enabled && <Badge className="bg-blue-500/20 text-blue-500">EMAIL</Badge>}
                          {rule.telegram_enabled && <Badge className="bg-green-500/20 text-green-500">TELEGRAM</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingAlert(rule)}
                          className="text-neutral-400 hover:text-white h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-neutral-400 hover:text-red-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alertRules.filter(rule => rule.server_id === null).length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <Globe className="w-12 h-12 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm">No global alert rules configured</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Server-specific Alert Rules */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">SERVER RULES</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {alertRules.filter(rule => rule.server_id !== null).map((rule) => (
                  <div key={rule.id} className="border border-neutral-700 rounded p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getMetricIcon(rule.threshold_metric)}
                          <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                          <Switch 
                            checked={rule.enabled}
                            onCheckedChange={() => {/* TODO: Toggle rule */}}
                          />
                        </div>
                        <p className="text-xs text-neutral-400 mb-1">Server: {rule.server_name}</p>
                        <p className="text-xs text-neutral-400 mb-2">{rule.condition}</p>
                        <div className="flex gap-2">
                          <Badge className={getAlertTypeColor(rule.type)}>{rule.type.toUpperCase()}</Badge>
                          {rule.email_enabled && <Badge className="bg-blue-500/20 text-blue-500">EMAIL</Badge>}
                          {rule.telegram_enabled && <Badge className="bg-green-500/20 text-green-500">TELEGRAM</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingAlert(rule)}
                          className="text-neutral-400 hover:text-white h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-neutral-400 hover:text-red-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alertRules.filter(rule => rule.server_id !== null).length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <Server className="w-12 h-12 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm">No server-specific alert rules configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Alert Templates */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">QUICK ALERT TEMPLATES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'High CPU Alert', metric: 'cpu', threshold: 90, icon: <Cpu className="w-5 h-5" /> },
                  { name: 'Memory Warning', metric: 'memory', threshold: 85, icon: <MemoryStick className="w-5 h-5" /> },
                  { name: 'Low Disk Space', metric: 'disk', threshold: 90, icon: <HardDrive className="w-5 h-5" /> },
                  { name: 'Anomaly Detection', metric: 'anomaly', threshold: null, icon: <Target className="w-5 h-5" /> }
                ].map((template, index) => (
                  <div 
                    key={index}
                    className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => {/* TODO: Apply template */}}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-orange-500">{template.icon}</div>
                      <h4 className="text-sm font-bold text-white">{template.name}</h4>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {template.threshold ? `Threshold: ${template.threshold}%` : 'AI-powered detection'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowNewKeyForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {/* New Key Display */}
          {newKey && (
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-500" />
                  <CardTitle className="text-lg font-bold text-green-500 tracking-wider">NEW API KEY CREATED</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-neutral-800 rounded border border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className={`text-sm ${showNewKey ? 'text-white' : 'text-transparent'} font-mono bg-neutral-700 px-2 py-1 rounded`}>
                        {showNewKey ? newKey : '•'.repeat(32)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNewKey(!showNewKey)}
                        className="text-neutral-400 hover:text-white"
                      >
                        {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(newKey)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-green-400">
                  <p>⚠️ This is the only time you'll see this key. Store it securely!</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewKey(null)}
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          {/* New Key Form */}
          {showNewKeyForm && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-orange-500" />
                  <CardTitle className="text-lg font-bold text-white tracking-wider">CREATE NEW API KEY</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name" className="text-neutral-300">
                    Key Name
                  </Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="e.g., Production Dashboard, Mobile App, etc."
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={createApiKey}
                    disabled={creatingKey}
                    className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    {creatingKey ? 'Creating...' : 'Create Key'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewKeyForm(false)
                      setNewKeyName('')
                    }}
                    className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys List */}
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <Card className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-8 text-center">
                  <Key className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No API Keys</h3>
                  <p className="text-neutral-400 mb-4">
                    Create your first API key to start accessing the dashboard programmatically
                  </p>
                  <Button 
                    onClick={() => setShowNewKeyForm(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create API Key
                  </Button>
                </CardContent>
              </Card>
            ) : (
              apiKeys.map((key) => (
                <Card key={key.id} className="bg-neutral-900 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Key className="w-5 h-5 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-white">{key.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Created {formatDate(key.created_at)}
                            </span>
                            {key.last_used && (
                              <span>Last used {formatDate(key.last_used)}</span>
                            )}
                            {key.expires_at && (
                              <span>Expires {formatDate(key.expires_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(key.revoked)}>
                          {getStatusText(key.revoked)}
                        </Badge>
                        {!key.revoked && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revokeApiKey(key.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Usage Information */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white tracking-wider">USAGE INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-neutral-300">
                <h4 className="font-semibold mb-2">Using your API key:</h4>
                <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                  <code className="text-green-400 text-xs">
                    curl -H "Authorization: Bearer YOUR_API_KEY" https://topdash.live/api/v1/servers
                  </code>
                </div>
              </div>
              <div className="text-sm text-neutral-400">
                <p>• API keys provide full access to your dashboard data and settings</p>
                <p>• Store your keys securely and never share them publicly</p>
                <p>• You can revoke keys at any time if they are compromised</p>
                <p>• All API requests must include the key in the Authorization header</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Advanced Settings</h3>
              <p className="text-neutral-400">
                Advanced configuration options coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}