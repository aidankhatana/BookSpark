'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Bookmark {
  id: string
  content: string
  summary: string
  author_name: string
  author_username: string
  author_profile_image?: string
  author_verified?: boolean
  topics: string[]
  suggested_actions: string[]
  content_type: string
  status: string
  priority?: number
  url?: string
  expanded_urls?: Array<{
    expanded_url: string
    display_url: string
    title?: string
    description?: string
  }>
  media_attachments?: Array<{
    type: 'photo' | 'video' | 'animated_gif'
    url?: string
    preview_image_url?: string
    width?: number
    height?: number
    alt_text?: string
  }>
  tweet_metrics?: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
  sentiment?: string
  reading_time_minutes?: number
  view_count?: number
  created_at: string
  bookmark_created_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [syncing, setSyncing] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedBookmark, setSelectedBookmark] = useState<string | null>(null)

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

  async function createAction(bookmarkId: string, actionType: string) {
    try {
      // For now, just update status - later we'll implement full action creation
      let newStatus = 'pending'
      
      switch (actionType) {
        case 'task':
          newStatus = 'pending'
          break
        case 'done':
          newStatus = 'done'
          break
        case 'snooze':
          newStatus = 'snoozed'
          break
        case 'archive':
          newStatus = 'archived'
          break
      }
      
      await updateBookmarkStatus(bookmarkId, newStatus)
      
      // TODO: Implement actual action creation with external integrations
      if (actionType === 'task') {
        alert('📝 Task created! (Integration with Notion/Todoist coming soon)')
      } else if (actionType === 'routine') {
        alert('🔁 Routine created! (Reminder system coming soon)')
      } else if (actionType === 'idea') {
        alert('💡 Saved to Idea Vault! (Inspiration library coming soon)')
      }
    } catch (error) {
      console.error('Failed to create action:', error)
      alert('Failed to create action')
    }
  }

  // Sort and filter bookmarks
  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark => {
      if (filter === 'all') return true
      return bookmark.status === filter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.bookmark_created_at).getTime() - new Date(a.bookmark_created_at).getTime()
        case 'oldest':
          return new Date(a.bookmark_created_at).getTime() - new Date(b.bookmark_created_at).getTime()
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'engagement':
          const aEngagement = (a.tweet_metrics?.like_count || 0) + (a.tweet_metrics?.retweet_count || 0)
          const bEngagement = (b.tweet_metrics?.like_count || 0) + (b.tweet_metrics?.retweet_count || 0)
          return bEngagement - aEngagement
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'done': return 'bg-green-50 text-green-700 border-green-200'
      case 'snoozed': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'archived': return 'bg-slate-50 text-slate-700 border-slate-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return '✨'
      case 'pending': return '⏳'
      case 'done': return '✅'
      case 'snoozed': return '😴'
      case 'archived': return '📁'
      default: return '❓'
    }
  }

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 3: return 'bg-red-100 text-red-800'
      case 2: return 'bg-orange-100 text-orange-800'
      case 1: return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority?: number) => {
    switch (priority) {
      case 3: return 'Urgent'
      case 2: return 'High'
      case 1: return 'Low'
      default: return 'Normal'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'image': return '🖼️'
      case 'link': return '🔗'
      case 'thread': return '🧵'
      default: return '💬'
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
      <nav className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BookSpark
                </h1>
                <p className="text-sm text-gray-500">AI-powered bookmark assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-sm">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-blue-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="font-medium text-gray-700">{session?.user?.name}</span>
              </div>
              
              <Link 
                href="/settings" 
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center space-x-1"
              >
                <span>⚙️</span>
                <span>Settings</span>
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
        {/* Dashboard Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back! 👋
              </h2>
              <p className="text-xl text-gray-600">
                You have {bookmarks.filter(b => b.status === 'new').length} new bookmarks ready for action
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={syncBookmarks}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Sync Bookmarks</span>
                  </>
                )}
              </button>

              <button
                onClick={sendTestDigest}
                disabled={sendingDigest}
                className="bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sendingDigest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    <span>Test Digest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{bookmarks.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Act</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {bookmarks.filter(b => b.status === 'new').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {bookmarks.filter(b => b.status === 'done').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reading Time</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {bookmarks.reduce((acc, b) => acc + (b.reading_time_minutes || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">minutes saved</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Filter & Sort</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: bookmarks.length },
                  { key: 'new', label: 'New', count: bookmarks.filter(b => b.status === 'new').length },
                  { key: 'pending', label: 'Pending', count: bookmarks.filter(b => b.status === 'pending').length },
                  { key: 'done', label: 'Done', count: bookmarks.filter(b => b.status === 'done').length },
                  { key: 'snoozed', label: 'Snoozed', count: bookmarks.filter(b => b.status === 'snoozed').length },
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      filter === filterOption.key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{getStatusIcon(filterOption.key === 'all' ? 'new' : filterOption.key)}</span>
                    <span>{filterOption.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filter === filterOption.key ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {filterOption.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">Priority</option>
                <option value="engagement">Most engaging</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookmarks Grid */}
        {filteredAndSortedBookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {filter === 'all' ? 'No bookmarks yet' : `No ${filter} bookmarks`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Start by syncing your Twitter bookmarks to transform them into actionable outcomes.'
                : `No bookmarks with ${filter} status found. Try a different filter or sync new content.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={syncBookmarks}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Sync Your First Bookmarks</span>
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onStatusUpdate={updateBookmarkStatus}
                onCreateAction={createAction}
                isSelected={selectedBookmark === bookmark.id}
                onSelect={() => setSelectedBookmark(selectedBookmark === bookmark.id ? null : bookmark.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for bookmark cards to keep code organized
function BookmarkCard({
  bookmark,
  onStatusUpdate,
  onCreateAction,
  isSelected,
  onSelect
}: {
  bookmark: Bookmark
  onStatusUpdate: (id: string, status: string) => void
  onCreateAction: (id: string, action: string) => void
  isSelected: boolean
  onSelect: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'done': return 'bg-green-50 text-green-700 border-green-200'
      case 'snoozed': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'archived': return 'bg-slate-50 text-slate-700 border-slate-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return '✨'
      case 'pending': return '⏳'
      case 'done': return '✅'
      case 'snoozed': return '😴'
      case 'archived': return '📁'
      default: return '❓'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'image': return '🖼️'
      case 'link': return '🔗'
      case 'thread': return '🧵'
      default: return '💬'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden ${
      isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
    }`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {bookmark.author_profile_image ? (
              <Image
                src={bookmark.author_profile_image}
                alt={bookmark.author_name || 'Author'}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {bookmark.author_name?.charAt(0)?.toUpperCase() || 'T'}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-gray-900">
                  {bookmark.author_name || 'Unknown Author'}
                </p>
                {bookmark.author_verified && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                @{bookmark.author_username || 'unknown'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bookmark.status)}`}>
              <span className="mr-1">{getStatusIcon(bookmark.status)}</span>
              {bookmark.status.charAt(0).toUpperCase() + bookmark.status.slice(1)}
            </span>
            <span className="text-xs text-gray-400 flex items-center space-x-1">
              <span>{getContentTypeIcon(bookmark.content_type)}</span>
              <span>{bookmark.content_type}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
            {bookmark.summary || 'AI Summary not available'}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {bookmark.content}
          </p>
        </div>

        {/* Media Attachments */}
        {bookmark.media_attachments && bookmark.media_attachments.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {bookmark.media_attachments.slice(0, 4).map((media, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                  {media.type === 'photo' && media.url && (
                    <Image
                      src={media.url}
                      alt={media.alt_text || 'Attached image'}
                      width={media.width || 400}
                      height={media.height || 300}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  {media.type === 'video' && (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl">🎥</span>
                        <p className="text-xs text-gray-600 mt-1">Video</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URLs */}
        {bookmark.expanded_urls && bookmark.expanded_urls.length > 0 && (
          <div className="mb-4">
            {bookmark.expanded_urls.slice(0, 2).map((url, index) => (
              <a
                key={index}
                href={url.expanded_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">🔗</span>
                  <div className="flex-1 min-w-0">
                    {url.title && (
                      <p className="font-medium text-gray-900 truncate">{url.title}</p>
                    )}
                    <p className="text-sm text-gray-600 truncate">{url.display_url}</p>
                    {url.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{url.description}</p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Topics */}
        {bookmark.topics && bookmark.topics.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {bookmark.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {bookmark.tweet_metrics && (
          <div className="mb-4 flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <span>❤️</span>
              <span>{formatNumber(bookmark.tweet_metrics.like_count)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🔄</span>
              <span>{formatNumber(bookmark.tweet_metrics.retweet_count)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>💬</span>
              <span>{formatNumber(bookmark.tweet_metrics.reply_count)}</span>
            </span>
            {bookmark.reading_time_minutes && (
              <span className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{bookmark.reading_time_minutes}min read</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {bookmark.status !== 'done' && (
              <button
                onClick={() => onCreateAction(bookmark.id, 'done')}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <span className="mr-1">✅</span>
                Mark Done
              </button>
            )}
            
            <button
              onClick={() => onCreateAction(bookmark.id, 'task')}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <span className="mr-1">📝</span>
              Add to Task
            </button>
            
            <button
              onClick={() => onCreateAction(bookmark.id, 'idea')}
              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <span className="mr-1">💡</span>
              Save Idea
            </button>
            
            {bookmark.status !== 'snoozed' && (
              <button
                onClick={() => onCreateAction(bookmark.id, 'snooze')}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">⏰</span>
                Snooze
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="text-xs text-gray-500">
              {new Date(bookmark.bookmark_created_at).toLocaleDateString()} • {bookmark.view_count || 0} views
            </div>
            <button
              onClick={onSelect}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            >
              {isSelected ? '▼' : '▶'}
            </button>
          </div>
        </div>
        
        {/* Expanded Actions */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onCreateAction(bookmark.id, 'routine')}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg mb-1">🔁</div>
                <div className="text-sm font-medium">Create Routine</div>
                <div className="text-xs text-gray-500">Set up recurring reminder</div>
              </button>
              
              <button
                onClick={() => alert('Generate content coming soon!')}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg mb-1">✨</div>
                <div className="text-sm font-medium">Generate</div>
                <div className="text-xs text-gray-500">Create new content</div>
              </button>
              
              <button
                onClick={() => alert('Summarize & stash coming soon!')}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg mb-1">📄</div>
                <div className="text-sm font-medium">Summarize</div>
                <div className="text-xs text-gray-500">Save key points</div>
              </button>
              
              <button
                onClick={() => onCreateAction(bookmark.id, 'archive')}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg mb-1">📁</div>
                <div className="text-sm font-medium">Archive</div>
                <div className="text-xs text-gray-500">Move to archive</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 