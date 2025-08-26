import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:3001'

export async function POST(request: NextRequest, { params }: Promise<{ params: { path: string[] } }>) {
  try {
    const awaitedParams = await params
    const path = awaitedParams.path.join('/')
    const url = `${BACKEND_URL}/api/v1/${path}`
    
    const body = await request.text()
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('x-forwarded-host')
    headers.delete('x-forwarded-proto')
    headers.delete('connection')
    
    // For development, use dev API key
    if (process.env.NODE_ENV === 'development') {
      headers.set('authorization', 'Bearer dev-api-key-1234567890')
    } else {
      // Get Clerk session token from cookies
      const sessionToken = request.cookies.get('__session')?.value
      
      // If we have a Clerk session token, use it for backend authentication
      if (sessionToken) {
        headers.set('authorization', `Bearer ${sessionToken}`)
      } else {
        // Fallback to existing Authorization header if no Clerk session
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          headers.set('authorization', authHeader)
        }
      }
    }
    
    // Forward the request to the backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const responseData = await response.json()
      
      return NextResponse.json(responseData, {
        status: response.status,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('API proxy POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: Promise<{ params: { path: string[] } }>) {
  try {
    const awaitedParams = await params
    const path = awaitedParams.path.join('/')
    const url = `${BACKEND_URL}/api/v1/${path}`
    
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('x-forwarded-host')
    headers.delete('x-forwarded-proto')
    headers.delete('connection')
    
    // For development, use dev API key
    if (process.env.NODE_ENV === 'development') {
      headers.set('authorization', 'Bearer dev-api-key-1234567890')
    } else {
      // Get Clerk session token from cookies
      const sessionToken = request.cookies.get('__session')?.value
      
      // If we have a Clerk session token, use it for backend authentication
      if (sessionToken) {
        headers.set('authorization', `Bearer ${sessionToken}`)
      } else {
        // Fallback to existing Authorization header if no Clerk session
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          headers.set('authorization', authHeader)
        }
      }
    }
    
    // Forward the request to the backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const responseData = await response.json()
      
      return NextResponse.json(responseData, {
        status: response.status,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('API proxy GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Promise<{ params: { path: string[] } }>) {
  try {
    const awaitedParams = await params
    const path = awaitedParams.path.join('/')
    const url = `${BACKEND_URL}/api/v1/${path}`
    
    const body = await request.text()
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('x-forwarded-host')
    headers.delete('x-forwarded-proto')
    headers.delete('connection')
    
    // For development, use dev API key
    if (process.env.NODE_ENV === 'development') {
      headers.set('authorization', 'Bearer dev-api-key-1234567890')
    } else {
      // Get Clerk session token from cookies
      const sessionToken = request.cookies.get('__session')?.value
      
      // If we have a Clerk session token, use it for backend authentication
      if (sessionToken) {
        headers.set('authorization', `Bearer ${sessionToken}`)
      } else {
        // Fallback to existing Authorization header if no Clerk session
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          headers.set('authorization', authHeader)
        }
      }
    }
    
    // Forward the request to the backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const responseData = await response.json()
      
      return NextResponse.json(responseData, {
        status: response.status,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('API proxy PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}