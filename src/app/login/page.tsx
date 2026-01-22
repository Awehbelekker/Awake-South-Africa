'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Mock login - in production this would call an API
    login({
      id: '1',
      email: formData.email,
      name: formData.name || formData.email.split('@')[0],
    })
    
    router.push('/account')
  }

  return (
    <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400">
            {isLogin 
              ? 'Sign in to access your account' 
              : 'Join the Awake Boards SA community'
            }
          </p>
        </div>

        <div className="bg-awake-gray p-8 rounded-xl">
          {/* Toggle */}
          <div className="flex mb-6 bg-awake-black rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                isLogin ? 'bg-accent-primary text-awake-black' : 'text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                !isLogin ? 'bg-accent-primary text-awake-black' : 'text-gray-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-accent-primary">
                Forgot your password?
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-gray-400">
              By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-accent-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-accent-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
