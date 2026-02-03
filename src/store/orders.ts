import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentId?: string
  paymentMethod?: string
  shippingAddress?: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  invoiceId?: string
}

interface OrdersState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  updatePaymentStatus: (id: string, status: PaymentStatus) => void
  getOrderById: (id: string) => Order | undefined
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByCustomer: (email: string) => Order[]
  generateOrderNumber: () => string
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (order) => set((state) => ({
        orders: [...state.orders, order]
      })),

      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map((o) => 
          o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
        )
      })),

      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map((o) => 
          o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
        )
      })),

      updatePaymentStatus: (id, status) => set((state) => ({
        orders: state.orders.map((o) => 
          o.id === id ? { ...o, paymentStatus: status, updatedAt: new Date().toISOString() } : o
        )
      })),

      getOrderById: (id) => get().orders.find((o) => o.id === id),

      getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),

      getOrdersByCustomer: (email) => get().orders.filter((o) => o.customerEmail === email),

      generateOrderNumber: () => {
        const date = new Date()
        const year = date.getFullYear().toString().slice(-2)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        return `AWK-${year}${month}-${random}`
      },
    }),
    { name: 'awake-orders-store' }
  )
)

