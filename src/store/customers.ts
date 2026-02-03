import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  }
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface CustomersState {
  customers: Customer[]
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  getCustomerById: (id: string) => Customer | undefined
  getCustomerByEmail: (email: string) => Customer | undefined
  incrementOrderStats: (email: string, orderTotal: number) => void
  getOrCreateCustomer: (name: string, email: string, phone?: string) => Customer
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: [],

      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, customer]
      })),

      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map((c) => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      })),

      getCustomerById: (id) => get().customers.find((c) => c.id === id),

      getCustomerByEmail: (email) => get().customers.find((c) => c.email.toLowerCase() === email.toLowerCase()),

      incrementOrderStats: (email, orderTotal) => set((state) => ({
        customers: state.customers.map((c) => 
          c.email.toLowerCase() === email.toLowerCase() 
            ? { 
                ...c, 
                totalOrders: c.totalOrders + 1, 
                totalSpent: c.totalSpent + orderTotal,
                lastOrderDate: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
              } 
            : c
        )
      })),

      getOrCreateCustomer: (name, email, phone) => {
        const existing = get().getCustomerByEmail(email)
        if (existing) {
          return existing
        }
        
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name,
          email,
          phone,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({ customers: [...state.customers, newCustomer] }))
        return newCustomer
      },
    }),
    { name: 'awake-customers-store' }
  )
)

