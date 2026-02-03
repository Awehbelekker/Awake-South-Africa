import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type InvoiceType = 'order' | 'booking' | 'rental' | 'custom'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  referenceId?: string // Order ID or Booking ID
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: InvoiceStatus
  dueDate: string
  paidDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface InvoicesState {
  invoices: Invoice[]
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void
  markAsPaid: (id: string) => void
  getInvoiceById: (id: string) => Invoice | undefined
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[]
  getInvoicesByCustomer: (email: string) => Invoice[]
  generateInvoiceNumber: () => string
  createInvoiceFromOrder: (order: any) => Invoice
  createInvoiceFromBooking: (booking: any, locationName: string) => Invoice
}

export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      invoices: [],

      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, invoice]
      })),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map((inv) => 
          inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
        )
      })),

      updateInvoiceStatus: (id, status) => set((state) => ({
        invoices: state.invoices.map((inv) => 
          inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv
        )
      })),

      markAsPaid: (id) => set((state) => ({
        invoices: state.invoices.map((inv) => 
          inv.id === id ? { 
            ...inv, 
            status: 'paid' as InvoiceStatus, 
            paidDate: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } : inv
        )
      })),

      getInvoiceById: (id) => get().invoices.find((inv) => inv.id === id),

      getInvoicesByStatus: (status) => get().invoices.filter((inv) => inv.status === status),

      getInvoicesByCustomer: (email) => get().invoices.filter((inv) => inv.customerEmail === email),

      generateInvoiceNumber: () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const count = get().invoices.length + 1
        return `INV-${year}${month}-${count.toString().padStart(4, '0')}`
      },

      createInvoiceFromOrder: (order) => {
        const invoiceNumber = get().generateInvoiceNumber()
        const now = new Date().toISOString()
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        
        const items: InvoiceItem[] = order.items.map((item: any) => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        }))

        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber,
          type: 'order',
          referenceId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          items,
          subtotal: order.subtotal,
          taxRate: 0.15,
          taxAmount: order.tax,
          total: order.total,
          status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
          dueDate,
          paidDate: order.paymentStatus === 'paid' ? now : undefined,
          createdAt: now,
          updatedAt: now,
        }

        return invoice
      },

      createInvoiceFromBooking: (booking, locationName) => {
        const invoiceNumber = get().generateInvoiceNumber()
        const now = new Date().toISOString()
        
        const items: InvoiceItem[] = [{
          description: `Demo Ride at ${locationName} - ${booking.date} ${booking.timeSlot}`,
          quantity: 1,
          unitPrice: booking.price,
          total: booking.price,
        }]

        const subtotal = booking.price / 1.15
        const taxAmount = booking.price - subtotal

        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber,
          type: 'booking',
          referenceId: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          items,
          subtotal,
          taxRate: 0.15,
          taxAmount,
          total: booking.price,
          status: booking.paymentStatus === 'paid' ? 'paid' : 'sent',
          dueDate: booking.date,
          paidDate: booking.paymentStatus === 'paid' ? now : undefined,
          createdAt: now,
          updatedAt: now,
        }

        return invoice
      },
    }),
    { name: 'awake-invoices-store' }
  )
)

