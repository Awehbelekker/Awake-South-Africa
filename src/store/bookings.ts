import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

export interface TimeSlot {
  id: string
  time: string
  label: string
}

export interface DemoBooking {
  id: string
  locationId: string
  locationName: string
  date: string
  timeSlot: string
  customerName: string
  customerEmail: string
  customerPhone: string
  experienceLevel: string
  message?: string
  price: number
  status: BookingStatus
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  paymentId?: string
  createdAt: string
  confirmedAt?: string
}

export interface BlockedDate {
  date: string
  locationId: string
  reason?: string
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '09:00', label: '9:00 AM' },
  { id: 'slot-2', time: '11:00', label: '11:00 AM' },
  { id: 'slot-3', time: '14:00', label: '2:00 PM' },
  { id: 'slot-4', time: '16:00', label: '4:00 PM' },
]

interface BookingsState {
  bookings: DemoBooking[]
  blockedDates: BlockedDate[]
  timeSlots: TimeSlot[]
  addBooking: (booking: DemoBooking) => void
  updateBooking: (id: string, updates: Partial<DemoBooking>) => void
  confirmBooking: (id: string) => void
  rejectBooking: (id: string) => void
  cancelBooking: (id: string) => void
  blockDate: (date: string, locationId: string, reason?: string) => void
  unblockDate: (date: string, locationId: string) => void
  getBookingsForDate: (date: string, locationId: string) => DemoBooking[]
  isSlotAvailable: (date: string, locationId: string, timeSlot: string) => boolean
  getAvailableSlots: (date: string, locationId: string) => TimeSlot[]
  isDateBlocked: (date: string, locationId: string) => boolean
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      blockedDates: [],
      timeSlots: DEFAULT_TIME_SLOTS,
      
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      
      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map((b) => b.id === id ? { ...b, ...updates } : b)
      })),
      
      confirmBooking: (id) => set((state) => ({
        bookings: state.bookings.map((b) => 
          b.id === id ? { ...b, status: 'confirmed' as BookingStatus, confirmedAt: new Date().toISOString() } : b
        )
      })),
      
      rejectBooking: (id) => set((state) => ({
        bookings: state.bookings.map((b) => b.id === id ? { ...b, status: 'rejected' as BookingStatus } : b)
      })),
      
      cancelBooking: (id) => set((state) => ({
        bookings: state.bookings.map((b) => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b)
      })),
      
      blockDate: (date, locationId, reason) => set((state) => ({
        blockedDates: [...state.blockedDates, { date, locationId, reason }]
      })),
      
      unblockDate: (date, locationId) => set((state) => ({
        blockedDates: state.blockedDates.filter((d) => !(d.date === date && d.locationId === locationId))
      })),
      
      getBookingsForDate: (date, locationId) => {
        const { bookings } = get()
        return bookings.filter((b) => b.date === date && b.locationId === locationId && 
          (b.status === 'confirmed' || b.status === 'pending'))
      },
      
      isSlotAvailable: (date, locationId, timeSlot) => {
        const { getBookingsForDate, isDateBlocked } = get()
        if (isDateBlocked(date, locationId)) return false
        const bookings = getBookingsForDate(date, locationId)
        return !bookings.some((b) => b.timeSlot === timeSlot)
      },
      
      getAvailableSlots: (date, locationId) => {
        const { timeSlots, isSlotAvailable } = get()
        return timeSlots.filter((slot) => isSlotAvailable(date, locationId, slot.time))
      },
      
      isDateBlocked: (date, locationId) => {
        const { blockedDates } = get()
        return blockedDates.some((d) => d.date === date && d.locationId === locationId)
      },
    }),
    { name: 'awake-bookings-store' }
  )
)

