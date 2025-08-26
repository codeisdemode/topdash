import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../utils/api';
import { Bell, Mail, MessageSquare, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Settings load error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateThreshold = (key, value) => {
    setSettings(prev => ({
      ...prev,
      alert_thresholds: {
        ...prev.alert_thresholds,
        [key]: parseInt(value)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Bell className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email_notifications"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="email_notifications" className="ml-2 text-sm font-medium text-gray-700">
                Enable email notifications
              </label>
            </div>

            {settings.email_notifications && (
              <div>
                <label htmlFor="email_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email_address"
                  value={settings.email_address}
                  onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
            )}
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Telegram Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="telegram_notifications"
                checked={settings.telegram_notifications}
                onChange={(e) => setSettings({ ...settings, telegram_notifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="telegram_notifications" className="ml-2 text-sm font-medium text-gray-700">
                Enable Telegram notifications
              </label>
            </div>

            {settings.telegram_notifications && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="telegram_bot_token" className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    id="telegram_bot_token"
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh"
                  />
                </div>

                <div>
                  <label htmlFor="telegram_chat_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    id="telegram_chat_id"
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-123456789"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Thresholds</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cpu_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                CPU Usage Threshold (%)
              </label>
              <input
                type="number"
                id="cpu_threshold"
                min="1"
                max="100"
                value={settings.alert_thresholds.cpu}
                onChange={(e) => updateThreshold('cpu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="memory_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Memory Usage Threshold (%)
              </label>
              <input
                type="number"
                id="memory_threshold"
                min="1"
                max="100"
                value={settings.alert_thresholds.memory}
                onChange={(e) => updateThreshold('memory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="disk_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Disk Usage Threshold (%)
              </label>
              <input
                type="number"
                id="disk_threshold"
                min="1"
                max="100"
                value={settings.alert_thresholds.disk}
                onChange={(e) => updateThreshold('disk', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="site_status_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Site Status Threshold (HTTP Code)
              </label>
              <input
                type="number"
                id="site_status_threshold"
                min="100"
                max="599"
                value={settings.alert_thresholds.site_status}
                onChange={(e) => updateThreshold('site_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;