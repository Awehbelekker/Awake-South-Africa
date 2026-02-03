'use client'

import { useState, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useCustomersStore, Customer } from '@/store/customers'
import { useOrdersStore } from '@/store/orders'
import { useBookingsStore } from '@/store/bookings'
import { 
  Search, Users, Mail, Phone, MapPin, ShoppingBag, 
  Calendar, DollarSign, XCircle, Edit, Trash2, Plus
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminCustomersPage() {
  const { customers, updateCustomer, deleteCustomer, addCustomer } = useCustomersStore()
  const { orders } = useOrdersStore()
  const { bookings } = useBookingsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Customer>>({})

  // Enrich customers with order/booking data
  const enrichedCustomers = useMemo(() => {
    return customers.map(customer => {
      const customerOrders = orders.filter(o => o.customerEmail.toLowerCase() === customer.email.toLowerCase())
      const customerBookings = bookings.filter(b => b.customerEmail.toLowerCase() === customer.email.toLowerCase())
      return {
        ...customer,
        orderCount: customerOrders.length,
        bookingCount: customerBookings.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + o.total, 0) + 
                    customerBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.price, 0),
      }
    })
  }, [customers, orders, bookings])

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers
      .filter(c => {
        const matchesSearch = 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.phone && c.phone.includes(searchQuery))
        return matchesSearch
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }, [enrichedCustomers, searchQuery])

  const stats = useMemo(() => ({
    total: customers.length,
    withOrders: enrichedCustomers.filter(c => c.orderCount > 0).length,
    withBookings: enrichedCustomers.filter(c => c.bookingCount > 0).length,
    totalRevenue: enrichedCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
  }), [customers, enrichedCustomers])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm(customer)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (selectedCustomer && editForm) {
      updateCustomer(selectedCustomer.id, editForm)
      toast.success('Customer updated')
      setIsEditing(false)
      setSelectedCustomer(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id)
      toast.success('Customer deleted')
    }
  }

  return (
    <AdminLayout title="Customers">
      <Toaster position="top-right" />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">With Orders</div>
          <div className="text-2xl font-bold text-blue-600">{stats.withOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">With Bookings</div>
          <div className="text-2xl font-bold text-purple-600">{stats.withBookings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">Since {formatDate(customer.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="h-4 w-4" /> {customer.email}
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="h-4 w-4" /> {customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-semibold text-blue-600">{customer.orderCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-semibold text-purple-600">{customer.bookingCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <Users className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Edit Customer"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">Customers will appear here when they place orders or book demos.</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && !isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="font-medium">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Since</h3>
                  <p className="font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
                  <p className="font-medium text-green-600">{formatCurrency((selectedCustomer as any).totalSpent || 0)}</p>
                </div>
              </div>

              {selectedCustomer.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="text-sm">
                    {selectedCustomer.address.street && <>{selectedCustomer.address.street}<br /></>}
                    {selectedCustomer.address.city}, {selectedCustomer.address.province}<br />
                    {selectedCustomer.address.postalCode}, {selectedCustomer.address.country}
                  </p>
                </div>
              )}

              {selectedCustomer.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                </div>
              )}

              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => handleEdit(selectedCustomer)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Customer
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditing && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
                <button onClick={() => { setIsEditing(false); setSelectedCustomer(null); }} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => { setIsEditing(false); setSelectedCustomer(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

