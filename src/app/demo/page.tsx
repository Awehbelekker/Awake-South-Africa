'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AWAKE_IMAGES, SA_CONTENT } from '@/lib/constants'

export default function DemoPage() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit to an API
    console.log('Demo booking:', formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Booking Received!</h1>
          <p className="text-gray-400 mb-8">
            Thanks for your interest! We'll contact you within 24 hours to confirm your demo session.
          </p>
          <a
            href="/"
            className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold"
          >
            Back to Home
          </a>
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
                <h3 className="font-bold mb-3">Demo Locations</h3>
                <ul className="space-y-2 text-gray-400">
                  {SA_CONTENT.demoLocations.map((location, i) => (
                    <li key={i}>📍 {location}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 p-6 bg-awake-gray rounded-lg">
                <h3 className="font-bold mb-3">Pricing</h3>
                <p className="text-2xl font-bold text-accent-primary">R1,500</p>
                <p className="text-sm text-gray-400 mt-1">
                  Fully redeemable against purchase
                </p>
              </div>
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
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Location *</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">Select location...</option>
                    {SA_CONTENT.demoLocations.map((location, i) => (
                      <option key={i} value={location}>{location}</option>
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
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Water Sports Experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">Select...</option>
                    <option value="none">No experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
                >
                  Request Booking
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
