'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AWAKE_IMAGES, SA_CONTENT } from '@/lib/constants'
import { useDemoLocationsStore } from '@/store/demoLocations'

export default function DemoPage() {
  const { locations } = useDemoLocationsStore()
  const activeLocations = locations.filter(loc => loc.active)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    date: '',
    experience: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  // Get selected location details
  const selectedLocation = activeLocations.find(loc => loc.name === formData.location)
  const locationPrice = selectedLocation?.price || 1500

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prepare WhatsApp message
    const whatsappNumber = SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '') // Remove non-numeric characters
    const message = `
🏄 *DEMO BOOKING REQUEST*

*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone}

*Location:* ${formData.location}
*Price:* R${locationPrice.toLocaleString()}
*Preferred Date:* ${formData.date}
*Experience Level:* ${formData.experience || 'Not specified'}

${formData.message ? `*Additional Notes:*\n${formData.message}` : ''}

Please confirm availability and pricing.
    `.trim()

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4">WhatsApp Opened!</h1>
          <p className="text-gray-400 mb-8">
            Your booking details have been prepared. Please send the WhatsApp message to confirm your demo session.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700"
            >
              📱 Open WhatsApp Again
            </a>
            <a
              href="/"
              className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold hover:bg-accent-secondary"
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-awake-black text-white">
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-awake-black/50 to-awake-black z-10" />
        <div className="absolute inset-0">
          <Image
            src={AWAKE_IMAGES.lifestyle.action2}
            alt="Demo Session"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book a Demo</h1>
          <p className="text-xl text-gray-300">Experience the thrill before you buy</p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">What to Expect</h2>
              <ul className="space-y-4 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-accent-primary">✓</span>
                  <span>30-minute introduction and safety briefing</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-primary">✓</span>
                  <span>45-minute hands-on riding experience</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-primary">✓</span>
                  <span>Professional instruction from certified trainers</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-primary">✓</span>
                  <span>All safety equipment provided</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-primary">✓</span>
                  <span>Try multiple board models</span>
                </li>
              </ul>

              <div className="mt-8 p-6 bg-awake-gray rounded-lg">
                <h3 className="font-bold mb-3">Available Locations</h3>
                <ul className="space-y-2 text-gray-400">
                  {activeLocations.map((location) => (
                    <li key={location.id} className="flex justify-between">
                      <span>📍 {location.name} ({location.area})</span>
                      <span className="text-accent-primary font-bold">R{location.price?.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  WhatsApp Booking
                </h3>
                <p className="text-sm text-gray-300">
                  After submitting, your booking details will be sent via WhatsApp to our team for instant confirmation.
                </p>
              </div>

              {selectedLocation && (
                <div className="mt-6 p-6 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                  <h3 className="font-bold mb-2">Selected Location</h3>
                  <p className="text-xl font-bold text-accent-primary">
                    {selectedLocation.name}
                  </p>
                  <p className="text-sm text-gray-400">{selectedLocation.area}</p>
                  <p className="text-2xl font-bold text-accent-primary mt-3">
                    R{locationPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Fully redeemable against purchase
                  </p>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-awake-gray p-8 rounded-xl">
              <h2 className="text-2xl font-bold mb-6">Book Your Session</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                    placeholder="+27..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Location *</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                  >
                    <option value="">Select location...</option>
                    {activeLocations.map((location) => (
                      <option key={location.id} value={location.name}>
                        {location.name} - R{location.price?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Water Sports Experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                  >
                    <option value="">Select...</option>
                    <option value="No experience">No experience</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white"
                    placeholder="Any special requirements or questions..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  Book via WhatsApp
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Your details will be sent to our WhatsApp for instant confirmation
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
