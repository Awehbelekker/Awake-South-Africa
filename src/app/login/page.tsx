'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const { login: localLogin } = useAuthStore()
  const router = useRouter()

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setVerifyMsg('')
    setIsLoading(true)

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (authErr) throw authErr

        const user = data.user
        localLogin({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split('@')[0],
          phone: user.user_metadata?.phone,
        })
        router.push('/account')
      } else {
        const nameParts = formData.name.trim().split(' ')
        const { data, error: authErr } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              first_name: nameParts[0],
              last_name: nameParts.slice(1).join(' ') || '',
            },
          },
        })
        if (authErr) throw authErr

        if (data.user && !data.session) {
          // Email verification required
          setVerifyMsg('Check your email to confirm your account, then sign in.')
          setIsLogin(true)
        } else if (data.user) {
          localLogin({
            id: data.user.id,
            email: data.user.email!,
            name: formData.name || data.user.email!.split('@')[0],
          })
          router.push('/account')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to track your orders' : 'Join the Awake Boards SA community'}
          </p>
        </div>

        <div className="bg-awake-gray p-8 rounded-xl">
          {/* Toggle */}
          <div className="flex mb-6 bg-awake-black rounded-lg p-1">
            {[{ label: 'Sign In', val: true }, { label: 'Sign Up', val: false }].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => { setIsLogin(val); setError(''); setVerifyMsg('') }}
                className={`flex-1 py-2 rounded-md transition-colors ${isLogin === val ? 'bg-accent-primary text-awake-black font-semibold' : 'text-gray-400'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {verifyMsg && (
            <div className="mb-4 p-3 bg-blue-900/40 border border-blue-500/40 rounded-lg text-sm text-blue-300">
              {verifyMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text" required value={formData.name}
                  onChange={e => update('name', e.target.value)}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email" required value={formData.email}
                onChange={e => update('email', e.target.value)}
                className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password" required value={formData.password}
                onChange={e => update('password', e.target.value)}
                className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password" required value={formData.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
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
              <Link href="/privacy" className="text-accent-primary hover:underline">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/terms" className="text-accent-primary hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
