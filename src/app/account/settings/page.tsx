'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AccountSettingsPage() {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [isAuthenticated, router, user])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser({ name, email })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-accent-primary hover:text-accent-secondary">
            ← Back to Account
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">Account Settings</h1>

        {saved && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-awake-gray rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-awake-gray rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Preferences</h2>
            <p className="text-gray-400">
              Email notification preferences and other settings coming soon.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  )
}

