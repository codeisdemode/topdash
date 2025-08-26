"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Clock,
  Shield
} from "lucide-react"
import { toast } from "sonner"

interface ApiKey {
  id: string
  name: string
  created_at: string
  expires_at: string | null
  last_used: string | null
  revoked: boolean
  user_email: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)

  useEffect(() => {
    loadApiKeys()
  }, [])

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
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-white tracking-wider">API KEYS</h1>
          <p className="text-sm text-neutral-400">Manage programmatic access to your dashboard</p>
        </div>
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
    </div>
  )
}