'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Address {
  id: string
  name: string
  street: string
  city: string
  province: string
  postalCode: string
  isDefault: boolean
}

export default function AddressesPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Placeholder addresses - in production, store in user profile or Medusa
  const [addresses, setAddresses] = useState<Address[]>([])

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const handleAddAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newAddress: Address = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      street: formData.get('street') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
      isDefault: addresses.length === 0,
    }
    setAddresses([...addresses, newAddress])
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id))
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-accent-primary hover:text-accent-secondary">
            ← Back to Account
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Shipping Addresses</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-accent-primary text-awake-black px-4 py-2 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            + Add Address
          </button>
        </div>

        {showAddForm && (
          <div className="bg-awake-gray rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Add New Address</h2>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <input name="name" placeholder="Address Label (e.g., Home, Work)" required
                className="w-full bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white" />
              <input name="street" placeholder="Street Address" required
                className="w-full bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input name="city" placeholder="City" required
                  className="bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white" />
                <input name="province" placeholder="Province" required
                  className="bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white" />
              </div>
              <input name="postalCode" placeholder="Postal Code" required
                className="w-full bg-awake-dark border border-gray-700 rounded-lg px-4 py-3 text-white" />
              <div className="flex gap-4">
                <button type="submit" className="bg-accent-primary text-awake-black px-6 py-2 rounded-lg font-bold">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <div className="bg-awake-gray rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-xl font-bold mb-2">No Addresses Saved</h2>
            <p className="text-gray-400 mb-6">
              Add a shipping address to make checkout faster.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-awake-gray rounded-xl p-6 relative">
                {address.isDefault && (
                  <span className="absolute top-4 right-4 text-xs bg-accent-primary/20 text-accent-primary px-2 py-1 rounded">
                    Default
                  </span>
                )}
                <h3 className="font-bold mb-2">{address.name}</h3>
                <p className="text-gray-400 text-sm">
                  {address.street}<br />
                  {address.city}, {address.province}<br />
                  {address.postalCode}
                </p>
                <div className="mt-4 flex gap-4">
                  <button className="text-accent-primary text-sm hover:underline">Edit</button>
                  <button onClick={() => handleDelete(address.id)} className="text-red-400 text-sm hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

