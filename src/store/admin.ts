// Admin store for managing products and store details
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoreSettings {
  storeName: string
  email: string
  phone: string
  whatsapp: string
  currency: string
  taxRate: number
  exchangeRate: number
  margin: number
}

interface AdminStore {
  settings: StoreSettings
  isAuthenticated: boolean
  updateSettings: (settings: Partial<StoreSettings>) => void
  login: (password: string) => boolean
  logout: () => void
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Awake SA',
  email: 'info@awakesa.co.za',
  phone: '+27 64 575 5210',
  whatsapp: '+27 64 575 5210',
  currency: 'ZAR',
  taxRate: 0.15,
  exchangeRate: 19.85,
  margin: 0.35,
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isAuthenticated: false,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      login: (password) => {
        // Simple password check - in production use proper auth
        console.log('Login attempt with password:', password)
        console.log('Expected password:', 'awake2026admin')
        console.log('Match:', password === 'awake2026admin')

        if (password === 'awake2026admin') {
          set({ isAuthenticated: true })
          console.log('Authentication set to true')
          return true
        }
        console.log('Authentication failed')
        return false
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'admin-storage',
    }
  )
)
