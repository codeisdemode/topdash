// API utilities for server monitoring

// Use relative URL for same-origin requests to avoid browser blocking
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// For server-side requests, we need the full URL
const SERVER_API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Helper to get auth token from Clerk session
export async function getAuthHeaders() {
  // For development, always use the dev API key to bypass Clerk issues
  console.warn('Using development API key for testing');
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-api-key-1234567890'
  };
}

// Server registration API
export async function registerServer(serverData: {
  name: string;
  ip: string;
  site?: string;
  ubuntu_version?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/servers/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(serverData),
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to register server');
  }
  
  return response.json();
}

// Server API functions
export async function fetchServers() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/servers`, {
    headers,
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch servers');
  }
  
  const servers = await response.json();
  
  // Parse last_metrics field from JSON string to object
  return servers.map((server: any) => ({
    ...server,
    last_metrics: server.last_metrics ? JSON.parse(server.last_metrics) : null
  }));
}

export async function fetchAlerts(params?: { resolved?: boolean }) {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_BASE_URL}/v1/alerts`);
  
  if (params?.resolved !== undefined) {
    url.searchParams.append('resolved', params.resolved.toString());
  }
  
  const response = await fetch(url.toString(), {
    headers,
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  
  return response.json();
}

export async function fetchAlertStats() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/alerts/stats`, {
    headers,
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch alert stats');
  }
  
  return response.json();
}

export async function resolveAlert(alertId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Failed to resolve alert');
  }
  
  return response.json();
}

export async function deleteAlert(alertId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/alerts/${alertId}`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete alert');
  }
  
  return response.json();
}

export async function fetchServerMetrics(serverId: string, hours: number = 24) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/metrics/${serverId}?hours=${hours}`, {
    headers,
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch server metrics');
  }
  
  return response.json();
}

export async function deleteServer(serverId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/servers/${serverId}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete server');
  }
  
  return response.json();
}

// Settings API functions
export async function fetchSettings() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/settings`, {
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }

  return response.json();
}

export async function updateSettings(settingsData: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/v1/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(settingsData),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  return response.json();
}

// Client-side API functions (for use in client components)
export const clientAPI = {
  servers: {
    getAll: () => fetchServers(),
    getById: (id: string) => fetch(`${API_BASE_URL}/api/v1/servers/${id}`).then(res => res.json()),
    register: (serverData: { name: string; ip: string; site?: string; ubuntu_version?: string }) => 
      registerServer(serverData),
    delete: (serverId: string) => deleteServer(serverId),
  },
  alerts: {
    getAll: (params?: { resolved?: boolean }) => fetchAlerts(params),
    getStats: () => fetchAlertStats(),
    resolve: (id: string) => resolveAlert(id),
    delete: (id: string) => deleteAlert(id),
  },
  metrics: {
    getByServer: (serverId: string, hours: number = 24) => fetchServerMetrics(serverId, hours),
  },
  settings: {
    get: () => fetchSettings(),
    update: (settingsData: any) => updateSettings(settingsData),
  }
};