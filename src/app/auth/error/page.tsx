'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'You denied access to the application. Please try again and grant permission to continue.'
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.'
      case 'Verification':
        return 'The verification token has expired or is invalid.'
      default:
        return 'An unknown error occurred during authentication.'
    }
  }

  const getErrorTitle = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access Denied'
      case 'Configuration':
        return 'Configuration Error'
      case 'Verification':
        return 'Verification Failed'
      default:
        return 'Authentication Error'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📚</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BookSpark
            </span>
          </Link>
          
          <Link 
            href="/" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Error Content */}
      <div className="flex items-center justify-center px-6 py-12 lg:py-24">
        <div className="w-full max-w-md text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>

          {/* Error Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {getErrorTitle(error)}
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {getErrorMessage(error)}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-block"
              >
                Try Again
              </Link>
              
              <Link
                href="/"
                className="w-full bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 inline-block"
              >
                Go Home
              </Link>
            </div>

            {/* Error Details */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-mono">
                  Error code: {error}
                </p>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              Still having trouble?{' '}
              <a href="mailto:support@bookspark.app" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-red-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-red-600/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
} 