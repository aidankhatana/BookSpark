'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bookmark {
  id: string
  content: string
  summary: string
  author_name: string
  author_username: string
  topics: string[]
  suggested_actions: string[]
  content_type: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [syncing, setSyncing] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchBookmarks()
    }
  }, [status, router])

  async function fetchBookmarks() {
    try {
      const response = await fetch('/api/bookmarks')
      const data = await response.json()
      
      if (data.success) {
        setBookmarks(data.bookmarks)
      } else {
        console.error('Failed to fetch bookmarks:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncBookmarks() {
    setSyncing(true)
    try {
      const response = await fetch('/api/bookmarks/sync', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchBookmarks()
        alert(`✅ Sync complete!\n\nProcessed: ${data.processed}\nNew: ${data.new}\nUpdated: ${data.updated}`)
      } else {
        alert(`❌ Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('❌ Sync failed: Network error')
    } finally {
      setSyncing(false)
    }
  }

  async function sendTestDigest() {
    setSendingDigest(true)
    try {
      const response = await fetch('/api/digest/test')
      const data = await response.json()
      
      if (data.success) {
        alert(`📧 ${data.message}\n\nCheck your email (including spam folder)!`)
      } else {
        alert(`❌ Test failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Test digest failed:', error)
      alert('❌ Test failed: Network error')
    } finally {
      setSendingDigest(false)
    }
  }

  async function updateBookmarkStatus(bookmarkId: string, status: string) {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookmarkId,
          status,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchBookmarks()
      } else {
        alert(`Failed to update: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to update bookmark:', error)
      alert('Failed to update bookmark')
    }
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (filter === 'all') return true
    return bookmark.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'done': return 'bg-green-100 text-green-700 border-green-200'
      case 'snoozed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'archived': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return '🆕'
      case 'pending': return '⏳'
      case 'done': return '✅'
      case 'snoozed': return '😴'
      case 'archived': return '📁'
      default: return '❓'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your workspace...</p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📚</span>
              </div>
              <h1 className="text-xl font-bold gradient-text">BookSpark</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="font-medium">{session?.user?.name}</span>
              </div>
              
              <Link 
                href="/settings" 
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Settings
              </Link>
              
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Your Bookmark Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            Transform your saved content into actionable outcomes with AI-powered insights.
          </p>
        </div>

        {/* Stats & Actions */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          {/* Stats */}
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{bookmarks.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ready to Act</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {bookmarks.filter(b => b.status === 'new').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {bookmarks.filter(b => b.status === 'done').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={syncBookmarks}
                disabled={syncing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {syncing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Syncing...</span>
                  </div>
                ) : (
                  '🔄 Sync Bookmarks'
                )}
              </button>

              <button
                onClick={sendTestDigest}
                disabled={sendingDigest}
                className="w-full bg-white text-gray-700 border-2 border-gray-200 px-4 py-3 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingDigest ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  '📧 Test Digest'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filter Bookmarks</h3>
            <div className="text-sm text-gray-600">
              Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: bookmarks.length },
              { key: 'new', label: 'New', count: bookmarks.filter(b => b.status === 'new').length },
              { key: 'pending', label: 'Pending', count: bookmarks.filter(b => b.status === 'pending').length },
              { key: 'done', label: 'Done', count: bookmarks.filter(b => b.status === 'done').length },
              { key: 'snoozed', label: 'Snoozed', count: bookmarks.filter(b => b.status === 'snoozed').length },
              { key: 'archived', label: 'Archived', count: bookmarks.filter(b => b.status === 'archived').length },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === filterOption.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookmarks yet' : `No ${filter} bookmarks`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start by syncing your Twitter bookmarks to see them here.'
                : `No bookmarks with ${filter} status found.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={syncBookmarks}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                🔄 Sync Your First Bookmarks
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 fade-in"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {bookmark.author_name?.charAt(0)?.toUpperCase() || 'T'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {bookmark.author_name || 'Unknown Author'}
                      </p>
                      <p className="text-sm text-gray-600">
                        @{bookmark.author_username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bookmark.status)}`}>
                    <span className="mr-1">{getStatusIcon(bookmark.status)}</span>
                    {bookmark.status.charAt(0).toUpperCase() + bookmark.status.slice(1)}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                    {bookmark.summary || 'AI Summary not available'}
                  </h3>
                  <p className="text-gray-600 line-clamp-3 leading-relaxed">
                    {bookmark.content}
                  </p>
                </div>

                {/* Topics */}
                {bookmark.topics && bookmark.topics.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {bookmark.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateBookmarkStatus(bookmark.id, 'done')}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      disabled={bookmark.status === 'done'}
                    >
                      ✅ Mark Done
                    </button>
                    
                    <button
                      onClick={() => updateBookmarkStatus(bookmark.id, 'snoozed')}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                      disabled={bookmark.status === 'snoozed'}
                    >
                      ⏰ Snooze
                    </button>
                    
                    <button
                      onClick={() => updateBookmarkStatus(bookmark.id, 'archived')}
                      className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                      disabled={bookmark.status === 'archived'}
                    >
                      📁 Archive
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 