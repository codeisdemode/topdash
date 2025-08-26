import React, { useState, useEffect } from 'react';
import { serversAPI, alertsAPI } from '../utils/api';
import { 
  Server, 
  AlertCircle, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [serversResponse, alertsResponse, statsResponse] = await Promise.all([
        serversAPI.getAll(),
        alertsAPI.getAll({ resolved: false }),
        alertsAPI.getStats()
      ]);

      setServers(serversResponse.data);
      setAlerts(alertsResponse.data.slice(0, 5)); // Show only 5 latest alerts
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (metrics) => {
    if (!metrics) return 'gray';
    
    const { cpu_usage, memory_usage, disk_usage } = metrics;
    
    if (cpu_usage > 80 || memory_usage > 85 || disk_usage > 90) {
      return 'red';
    } else if (cpu_usage > 60 || memory_usage > 70 || disk_usage > 80) {
      return 'yellow';
    }
    return 'green';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Servers</h3>
              <p className="text-2xl font-bold text-gray-900">{servers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Active Servers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {servers.filter(s => s.last_metrics).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Critical Alerts</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.critical || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servers List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Servers</h2>
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 bg-${getStatusColor(server.last_metrics)}-500`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{server.name}</h4>
                    <p className="text-sm text-gray-600">{server.ip}</p>
                  </div>
                </div>
                
                {server.last_metrics && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Cpu className="w-4 h-4 mr-1" />
                      {server.last_metrics.cpu_usage?.toFixed(1)}%
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MemoryStick className="w-4 h-4 mr-1" />
                      {server.last_metrics.memory_usage?.toFixed(1)}%
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HardDrive className="w-4 h-4 mr-1" />
                      {server.last_metrics.disk_usage?.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {servers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No servers registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {alert.server_name || 'System'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;