// Admin store for managing products and store details
// Supports Medusa Admin API auth with localStorage fallback
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoreSettings {
  tenantId?: string
  storeName: string
  email: string
  phone: string
  whatsapp: string
  currency: string
  taxRate: number
  exchangeRate: number
  margin: number
  // Invoice Settings
  invoiceLogo?: string
  invoiceLogoPosition?: 'left' | 'center' | 'right'
  invoiceTheme?: 'professional' | 'modern' | 'minimal' | 'bold'
  invoiceShowVAT?: boolean
  invoiceShowTaxNumber?: boolean
  taxNumber?: string
  invoiceShowBankDetails?: boolean
  bankName?: string
  bankAccountNumber?: string
  bankBranchCode?: string
  invoiceFooterText?: string
  invoiceTerms?: string
  invoiceShowLineNumbers?: boolean
  currencySymbol?: string
  invoiceDateFormat?: string
}

interface AdminStore {
  settings: StoreSettings
  isAuthenticated: boolean
  adminEmail: string | null
  authMode: 'medusa' | 'local' // Track which auth mode was used
  updateSettings: (settings: Partial<StoreSettings>) => void
  login: (password: string) => boolean // Legacy local auth (fallback)
  setMedusaAuth: (email: string) => void // Set auth state after Medusa login
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
      adminEmail: null,
      authMode: 'local',
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      // Medusa auth - called after successful Medusa Admin API login
      setMedusaAuth: (email: string) => {
        set({ isAuthenticated: true, adminEmail: email, authMode: 'medusa' })
      },
      // Legacy local auth - fallback when Medusa is unavailable
      login: (password) => {
        if (password === 'awake2026admin') {
          set({ isAuthenticated: true, adminEmail: null, authMode: 'local' })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false, adminEmail: null, authMode: 'local' }),
    }),
    {
      name: 'admin-storage',
    }
  )
)
