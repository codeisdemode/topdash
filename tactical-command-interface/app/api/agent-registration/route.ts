import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Read the agent registration script
    const scriptPath = join(process.cwd(), '..', '..', 'agent-registration.sh')
    const scriptContent = readFileSync(scriptPath, 'utf-8')
    
    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sh',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
    
  } catch (error) {
    console.error('Error serving agent registration script:', error)
    
    // Fallback: return a simple script that explains how to get API key
    const fallbackScript = `#!/bin/bash

echo "Error: Could not load installation script"
echo "Please visit https://topdash.live/agent-registration to get your API key"
echo "Then run: curl -sSL https://topdash.live/agent-registration | bash -s -- --api-key=YOUR_API_KEY"
`
    
    return new NextResponse(fallbackScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sh',
      },
    })
  }
}