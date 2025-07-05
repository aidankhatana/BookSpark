'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UserSettings {
  digest_enabled: boolean
  digest_time: string
  timezone: string
  email?: string
}

export default function Settings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailEditing, setEmailEditing] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    digest_enabled: true,
    digest_time: '08:00:00',
    timezone: 'UTC',
    email: ''
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
        setSettings({
          ...data.settings,
          email: data.settings.email || session?.user?.email || ''
        })
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
        setEmailEditing(false)
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

  const hasEmail = Boolean(settings.email && settings.email.trim())
  const isTwitterEmail = Boolean(session?.user?.email)

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
                  {emailEditing ? (
                    <div className="space-y-2">
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={saveSettings}
                          disabled={saving}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Email'}
                        </button>
                        <button
                          onClick={() => {
                            setEmailEditing(false)
                            setSettings(prev => ({ ...prev, email: session?.user?.email || '' }))
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="email"
                          value={settings.email || 'No email set'}
                          disabled
                          className={`w-full px-4 py-3 border border-gray-200 rounded-lg ${
                            hasEmail ? 'bg-gray-50 text-gray-700' : 'bg-red-50 text-red-600'
                          }`}
                        />
                        <button
                          onClick={() => setEmailEditing(true)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {hasEmail ? 'Edit' : 'Add Email'}
                        </button>
                      </div>
                      {isTwitterEmail ? (
                        <p className="text-xs text-green-600 flex items-center">
                          <span className="mr-1">✓</span>
                          Synced from Twitter account
                        </p>
                      ) : hasEmail ? (
                        <p className="text-xs text-blue-600 flex items-center">
                          <span className="mr-1">✏️</span>
                          Manually added email
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="mr-1">⚠️</span>
                            No email available from Twitter
                          </p>
                          <p className="text-xs text-gray-500">
                            Please add your email to receive digest notifications
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Required Warning */}
            {!hasEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 text-xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-amber-800">Email Required for Digests</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      You need to add an email address to receive daily digest notifications. 
                      Click "Add Email" above to set up your email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Digest Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Digest Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Enable Daily Digest</h4>
                    <p className="text-sm text-gray-600">Receive a curated email with your bookmarks ready for action</p>
                    {!hasEmail && (
                      <p className="text-xs text-red-600 mt-1">Requires email address</p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.digest_enabled && hasEmail}
                      onChange={(e) => setSettings({ ...settings, digest_enabled: e.target.checked })}
                      disabled={!hasEmail}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                      !hasEmail ? 'opacity-50 cursor-not-allowed' : ''
                    }`}></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Digest Time</label>
                  <p className="text-xs text-gray-500 mt-1">Choose when you&apos;d like to receive your daily digest</p>
                  <select
                    value={settings.digest_time}
                    onChange={(e) => setSettings({ ...settings, digest_time: e.target.value })}
                    disabled={!hasEmail}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !hasEmail ? 'bg-gray-50 text-gray-400' : ''
                    }`}
                  >
                    <option value="06:00:00">6:00 AM</option>
                    <option value="07:00:00">7:00 AM</option>
                    <option value="08:00:00">8:00 AM</option>
                    <option value="09:00:00">9:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:00:00">11:00 AM</option>
                    <option value="12:00:00">12:00 PM</option>
                    <option value="13:00:00">1:00 PM</option>
                    <option value="14:00:00">2:00 PM</option>
                    <option value="15:00:00">3:00 PM</option>
                    <option value="16:00:00">4:00 PM</option>
                    <option value="17:00:00">5:00 PM</option>
                    <option value="18:00:00">6:00 PM</option>
                    <option value="19:00:00">7:00 PM</option>
                    <option value="20:00:00">8:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (EST/EDT)</option>
                    <option value="America/Chicago">Central Time (CST/CDT)</option>
                    <option value="America/Denver">Mountain Time (MST/MDT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {!emailEditing && (
              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">
            {/* Email Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Status</h3>
              
              <div className="space-y-3">
                {hasEmail ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-medium">Email configured</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <span className="text-lg">❌</span>
                    <span className="text-sm font-medium">No email set</span>
                  </div>
                )}
                
                {settings.digest_enabled && hasEmail ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <span className="text-lg">📧</span>
                    <span className="text-sm font-medium">Digests enabled</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-lg">📪</span>
                    <span className="text-sm font-medium">Digests disabled</span>
                  </div>
                )}
              </div>
            </div>

            {/* About Digests */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">About Daily Digests</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Get a curated email with your latest bookmarks</p>
                <p>• AI-powered summaries and action suggestions</p>
                <p>• One-click actions to manage your saved content</p>
                <p>• Customizable timing based on your schedule</p>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy & Data</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>• Your email is used only for digest notifications</p>
                <p>• We never share your data with third parties</p>
                <p>• You can disable digests anytime</p>
                <p>• All data is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 