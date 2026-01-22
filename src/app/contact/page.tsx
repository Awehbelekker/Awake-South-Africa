'use client'

import { useState } from 'react'
import { SA_CONTENT } from '@/lib/constants'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Contact form:', formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✉️</div>
          <h1 className="text-3xl font-bold mb-4">Message Sent!</h1>
          <p className="text-gray-400 mb-8">
            Thanks for reaching out! We'll get back to you within 24 hours.
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
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Contact Us</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          We're here to help with any questions
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary">
                  📧
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href={`mailto:${SA_CONTENT.contact.email}`} className="text-gray-400 hover:text-accent-primary">
                    {SA_CONTENT.contact.email}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href={`tel:${SA_CONTENT.contact.phone}`} className="text-gray-400 hover:text-accent-primary">
                    {SA_CONTENT.contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary">
                  💬
                </div>
                <div>
                  <h3 className="font-semibold">WhatsApp</h3>
                  <a 
                    href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                    className="text-gray-400 hover:text-accent-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {SA_CONTENT.contact.whatsapp}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-awake-gray rounded-lg">
              <h3 className="font-bold mb-4">Demo Locations</h3>
              <ul className="space-y-2 text-gray-400">
                {SA_CONTENT.demoLocations.map((location, i) => (
                  <li key={i}>📍 {location}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 p-6 bg-awake-gray rounded-lg">
              <h3 className="font-bold mb-4">Business Hours</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 4:00 PM</li>
                <li>Sunday: By appointment only</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-awake-gray p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
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
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Select...</option>
                  <option value="sales">Sales Enquiry</option>
                  <option value="demo">Demo Booking</option>
                  <option value="support">Technical Support</option>
                  <option value="warranty">Warranty</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
