"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clientAPI } from "@/lib/api"

export default function AgentRegistrationPage() {
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    site: "",
    ubuntu_version: ""
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Agent Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-neutral-300">Server Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="e.g., Production Web Server"
              />
            </div>
            
            <div>
              <Label htmlFor="ip" className="text-neutral-300">IP Address</Label>
              <Input
                id="ip"
                name="ip"
                value={formData.ip}
                onChange={handleInputChange}
                required
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="e.g., 192.168.1.100"
              />
            </div>
            
            <div>
              <Label htmlFor="site" className="text-neutral-300">Site URL (Optional)</Label>
              <Input
                id="site"
                name="site"
                value={formData.site}
                onChange={handleInputChange}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="e.g., https://your-site.com"
              />
            </div>
            
            <div>
              <Label htmlFor="ubuntu_version" className="text-neutral-300">Ubuntu Version (Optional)</Label>
              <Input
                id="ubuntu_version"
                name="ubuntu_version"
                value={formData.ubuntu_version}
                onChange={handleInputChange}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="e.g., 22.04"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? "Registering..." : "Register Server"}
            </Button>
            
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
          </form>
          
          {result && (
            <div className="mt-6 p-4 bg-neutral-800 rounded border border-neutral-700">
              <h3 className="text-green-400 font-mono text-sm mb-2">Server Registered Successfully!</h3>
              <div className="space-y-2 text-xs text-neutral-300 font-mono">
                <div><span className="text-neutral-500">Server ID:</span> {result.server?.id}</div>
                <div><span className="text-neutral-500">Name:</span> {result.server?.name}</div>
                <div><span className="text-neutral-500">IP:</span> {result.server?.ip}</div>
                <div><span className="text-neutral-500">Agent Token:</span> 
                  <code className="bg-neutral-900 px-2 py-1 rounded ml-2 text-orange-400">
                    {result.server?.agent_token}
                  </code>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-neutral-900 rounded border border-neutral-700">
                <h4 className="text-orange-400 text-xs font-mono mb-2">Agent Installation Command:</h4>
                <code className="block bg-black p-3 rounded text-xs text-green-400 font-mono overflow-x-auto">
                  SERVER_ID={result.server?.id} API_TOKEN={result.server?.agent_token} API_URL=http://localhost:3001 ./agent
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}