'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'

interface Bookmark {
  id: string
  content: string
  summary: string
  author_name: string
  author_username: string
  topics: string[]
  suggested_actions: string[]
  status: string
  content_type: string
  created_at: string
  processed_at: string | null
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)


  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookmarks()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  async function fetchBookmarks() {
    try {
      setLoading(true)
      const response = await fetch('/api/bookmarks?status=all')
      const data = await response.json()
      
      if (data.success) {
        setBookmarks(data.bookmarks || [])
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
        alert(`✅ ${data.message}`)
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to BookSpark
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Turn your Twitter bookmarks into actionable outcomes
            </p>
          </div>
          <div>
            <button
              onClick={() => signIn('twitter')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Twitter
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BookSpark Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={syncBookmarks}
                disabled={syncing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync Bookmarks'}
              </button>
              <button
                onClick={sendTestDigest}
                disabled={sendingDigest}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingDigest ? 'Sending...' : '📧 Test Digest'}
              </button>
              <button
                onClick={() => signOut()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Bookmarks ({bookmarks.length})
            </h2>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No bookmarks found.</p>
            <p className="text-gray-400 mt-2">Sync your Twitter bookmarks to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-500">
                        @{bookmark.author_username || bookmark.author_name}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {bookmark.summary ? (
                      <h3 className="font-semibold text-gray-900 mb-2">{bookmark.summary}</h3>
                    ) : (
                      <div className="text-yellow-600 text-sm mb-2">Processing...</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      bookmark.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      bookmark.status === 'done' ? 'bg-green-100 text-green-800' :
                      bookmark.status === 'snoozed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bookmark.status}
                    </span>
                    {bookmark.content_type && (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                        {bookmark.content_type}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-3">{bookmark.content}</p>
                
                {bookmark.topics && bookmark.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bookmark.topics.map((topic, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
                
                {bookmark.suggested_actions && bookmark.suggested_actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bookmark.suggested_actions.map((action, index) => (
                      <button
                        key={index}
                        className="bg-green-50 text-green-700 px-3 py-1 text-sm rounded border border-green-200 hover:bg-green-100"
                        onClick={() => alert(`Action: ${action}\n\nThis will be implemented in the next phase!`)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                ) : bookmark.processed_at ? (
                  <div className="text-gray-400 text-sm mb-4">No actions suggested</div>
                ) : null}

                <div className="flex space-x-2">
                  <button
                    onClick={() => updateBookmarkStatus(bookmark.id, 'done')}
                    className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                  >
                    Mark Done
                  </button>
                  <button
                    onClick={() => updateBookmarkStatus(bookmark.id, 'snoozed')}
                    className="bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={() => updateBookmarkStatus(bookmark.id, 'archived')}
                    className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 