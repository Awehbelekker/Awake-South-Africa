'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useBookingsStore, DemoBooking, BookingStatus } from '@/store/bookings'
import { Check, X, Calendar, Clock, MapPin, Phone, Mail } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminBookingsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const { bookings, confirmBooking, rejectBooking } = useBookingsStore()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.push('/admin')
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const sortedBookings = [...filteredBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConfirm = (id: string) => { confirmBooking(id); toast.success('Booking confirmed!') }
  const handleReject = (id: string) => { if (confirm('Reject this booking?')) { rejectBooking(id); toast.success('Booking rejected') } }

  const stats = { pending: bookings.filter(b => b.status === 'pending').length, confirmed: bookings.filter(b => b.status === 'confirmed').length, total: bookings.length }

  return (
    <AdminLayout title="Demo Bookings">
      <Toaster position="top-right" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Confirmed</p><p className="text-2xl font-bold text-green-600">{stats.confirmed}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
        </div>

        <div className="mb-6 flex gap-2">
          {(['all', 'pending', 'confirmed', 'rejected', 'cancelled'] as const).map((status) => (
            <button key={status} onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {sortedBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center"><p className="text-gray-500">No bookings found</p></div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-sm text-gray-500 font-mono">{booking.id}</p><h3 className="text-lg font-bold">{booking.customerName}</h3></div>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(booking.status)}`}>{booking.status}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{booking.locationName}</p>
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(booking.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{booking.timeSlot}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{booking.customerEmail}</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{booking.customerPhone}</p>
                    <p className="font-bold text-blue-600">R{booking.price.toLocaleString()}</p>
                  </div>
                </div>
                {booking.message && <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">"{booking.message}"</p>}
                {booking.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleConfirm(booking.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check className="w-4 h-4" /> Confirm</button>
                    <button onClick={() => handleReject(booking.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><X className="w-4 h-4" /> Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  )
}

