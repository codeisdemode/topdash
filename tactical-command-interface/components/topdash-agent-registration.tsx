'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clientAPI } from '@/lib/api'

export default function TopDashAgentRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    site: "",
    ubuntu_version: ""
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [isCopied, setIsCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const response = await clientAPI.servers.register({
        name: formData.name,
        ip: formData.ip,
        site: formData.site || undefined,
        ubuntu_version: formData.ubuntu_version || undefined
      })
      
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register server")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const installationCommand = result 
    ? `SERVER_ID=${result.server?.id} API_TOKEN=${result.server?.agent_token} API_URL=http://localhost:3001 ./agent`
    : `curl -sSL https://topdash.live/agent-registration | bash -s -- --api-key=YOUR_API_KEY`

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
          SERVER REGISTRATION
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Registration Form */}
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-neutral-300 text-xs">Server Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-neutral-800 border-neutral-700 text-white h-8 text-xs"
                  placeholder="e.g., Production Server"
                />
              </div>
              
              <div>
                <Label htmlFor="ip" className="text-neutral-300 text-xs">IP Address</Label>
                <Input
                  id="ip"
                  name="ip"
                  value={formData.ip}
                  onChange={handleInputChange}
                  required
                  className="bg-neutral-800 border-neutral-700 text-white h-8 text-xs"
                  placeholder="e.g., 192.168.1.100"
                />
              </div>
              
              <div>
                <Label htmlFor="site" className="text-neutral-300 text-xs">Site URL (Optional)</Label>
                <Input
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleInputChange}
                  className="bg-neutral-800 border-neutral-700 text-white h-8 text-xs"
                  placeholder="e.g., https://yoursite.com"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
              >
                {loading ? "Registering..." : "Register Server"}
              </Button>
              
              {error && (
                <div className="text-red-400 text-xs">{error}</div>
              )}
            </form>
          ) : (
            <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
              <h3 className="text-green-400 font-mono text-xs mb-2">Server Registered!</h3>
              <div className="space-y-1 text-xs text-neutral-300 font-mono">
                <div><span className="text-neutral-500">ID:</span> {result.server?.id}</div>
                <div><span className="text-neutral-500">Name:</span> {result.server?.name}</div>
                <div><span className="text-neutral-500">IP:</span> {result.server?.ip}</div>
              </div>
            </div>
          )}

          {/* Installation Command */}
          <div className="pt-3 border-t border-neutral-700">
            <div className="text-xs text-neutral-400 mb-2">
              Agent Installation Command:
            </div>
            
            <div className="bg-neutral-800 rounded p-2 relative">
              <code className="text-xs text-green-400 font-mono break-all">
                {installationCommand}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 text-xs text-neutral-400 hover:text-white h-6"
                onClick={() => copyToClipboard(installationCommand)}
              >
                {isCopied ? '✓' : 'Copy'}
              </Button>
            </div>
            
            <div className="text-xs text-neutral-500 space-y-1 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Automatic alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Performance metrics</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}