'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UserSettings {
  digest_enabled: boolean
  digest_time: string
  timezone: string
}

export default function Settings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    digest_enabled: true,
    digest_time: '08:00:00',
    timezone: 'UTC'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, router])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/user/settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Settings saved successfully!')
      } else {
        alert(`❌ Failed to save settings: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('❌ Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📚</span>
                </div>
                <h1 className="text-xl font-bold gradient-text">BookSpark</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← Back to Dashboard
              </Link>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="font-medium">{session?.user?.name}</span>
              </div>
              
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Settings Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Account Settings
          </h2>
          <p className="text-xl text-gray-600">
            Customize your BookSpark experience and notification preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={session?.user?.name || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name is synced from your Twitter account</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email is synced from your Twitter account</p>
                </div>
              </div>
            </div>

            {/* Digest Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Digest Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Enable Daily Digest</h4>
                    <p className="text-sm text-gray-600">Receive a curated email with your bookmarks ready for action</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.digest_enabled}
                      onChange={(e) => setSettings({ ...settings, digest_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Digest Time</label>
                  <select
                    value={settings.digest_time}
                    onChange={(e) => setSettings({ ...settings, digest_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="06:00:00">6:00 AM</option>
                    <option value="07:00:00">7:00 AM</option>
                    <option value="08:00:00">8:00 AM</option>
                    <option value="09:00:00">9:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="18:00:00">6:00 PM</option>
                    <option value="19:00:00">7:00 PM</option>
                    <option value="20:00:00">8:00 PM</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose when you'd like to receive your daily digest</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data & Privacy</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Data Usage</h4>
                  <p className="text-sm text-blue-800">
                    BookSpark only accesses your Twitter bookmarks and basic profile information. 
                    We use AI to analyze bookmark content for summaries and suggestions.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Privacy Protection</h4>
                  <p className="text-sm text-green-800">
                    Your data is encrypted and stored securely. We never share your bookmarks 
                    or personal information with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Your Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last sync</span>
                  <span className="text-sm font-medium text-gray-900">Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Digest status</span>
                  <span className={`text-sm font-medium ${settings.digest_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {settings.digest_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                <a 
                  href="mailto:support@bookspark.app" 
                  className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  📧 Contact Support
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  📚 Documentation
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  💡 Feature Requests
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 