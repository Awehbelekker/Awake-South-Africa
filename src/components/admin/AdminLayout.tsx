'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminStore } from '@/store/admin'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MapPin,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Image,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
  Layers,
  Bot,
  Tag,
  Star,
  BookOpen,
  MessageSquare,
  Award,
  Truck,
  ClipboardList
} from 'lucide-react'

const bottomNav = [
  { name: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Discounts', href: '/admin/discounts', icon: Tag },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Blog', href: '/admin/blog', icon: BookOpen },
  { name: 'WhatsApp', href: '/admin/whatsapp', icon: MessageSquare },
  { name: 'Quotes', href: '/admin/quotes', icon: ClipboardList },
  { name: 'Stoke Points', href: '/admin/stoke', icon: Award },
  { name: 'Pages', href: '/admin/pages', icon: Layers },
  { name: 'Demo Locations', href: '/admin/locations', icon: MapPin },
  { name: 'Demo Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Invoices', href: '/admin/invoices', icon: FileText },
  { name: 'Media Library', href: '/admin/media', icon: Image },
  { name: 'AI Assistant', href: '/admin/ai', icon: Bot },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout, setMedusaAuth } = useAdminStore()
  const [mounted, setMounted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Wait for zustand to hydrate from localStorage before making auth decisions
  useEffect(() => {
    setMounted(true)
    // zustand persist hydrates synchronously after first render
    setHydrated(true)
  }, [])

  // Verify session with server cookie (source of truth)
  useEffect(() => {
    if (!mounted || !hydrated) return

    // If zustand says not authenticated, verify via server cookie
    // This prevents loops caused by hydration timing
    fetch('/api/admin/auth', { method: 'GET', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user?.email) {
          // Server session valid — sync zustand
          if (!isAuthenticated) setMedusaAuth(data.user.email)
        } else {
          // No valid server session — redirect to login
          logout()
          router.push('/admin')
        }
      })
      .catch(() => {
        // Network error — don't kick user out, rely on zustand
        if (!isAuthenticated) router.push('/admin')
      })
  }, [mounted, hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !hydrated || !isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    // Clear server session cookie first
    try {
      await fetch('/api/admin/auth', { method: 'DELETE', credentials: 'include' })
    } catch { /* ignore */ }
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Store className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">Awake Admin</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white text-sm"
            >
              <Store className="h-5 w-5" />
              View Store
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 text-sm w-full"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Menu className="h-5 w-5" />
              </button>
              {title && <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>}
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 lg:hidden"
            >
              <Store className="h-4 w-4" />
              Store
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

