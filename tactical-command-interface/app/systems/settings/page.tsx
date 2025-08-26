"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  Save, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Globe 
} from "lucide-react"
import { toast } from "sonner"

interface Settings {
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

export default function SystemsSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/v1/settings')
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Settings load error:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
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
      setSaving(false)
    }
  }

  const updateThreshold = (key: keyof Settings['alert_thresholds'], value: string) => {
    setSettings(prev => ({
      ...prev,
      alert_thresholds: {
        ...prev.alert_thresholds,
        [key]: parseInt(value)
      }
    }))
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
          <h1 className="text-2xl font-bold text-white tracking-wider">SYSTEM SETTINGS</h1>
          <p className="text-sm text-neutral-400">Configure notification and alert settings</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
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
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
              />
            </div>

            {settings.email_notifications && (
              <div className="space-y-2">
                <Label htmlFor="email-address" className="text-neutral-300">
                  Email Address
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  value={settings.email_address}
                  onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
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
                checked={settings.telegram_notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, telegram_notifications: checked })}
              />
            </div>

            {settings.telegram_notifications && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telegram-bot-token" className="text-neutral-300">
                    Bot Token
                  </Label>
                  <Input
                    id="telegram-bot-token"
                    type="password"
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
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
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
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
                  value={settings.alert_thresholds.cpu}
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
                  value={settings.alert_thresholds.memory}
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
                  value={settings.alert_thresholds.disk}
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
                  value={settings.alert_thresholds.site_status}
                  onChange={(e) => updateThreshold('site_status', e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}