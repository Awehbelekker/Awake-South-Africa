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
  phone: '+27 XXX XXX XXXX',
  whatsapp: '+27 XXX XXX XXXX',
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
        if (password === 'awake2026admin') {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'admin-storage',
    }
  )
)
