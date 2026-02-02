'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AWAKE_IMAGES, SA_CONTENT } from '@/lib/constants'
import { useDemoLocationsStore } from '@/store/demoLocations'
import { useBookingsStore, TimeSlot, DemoBooking } from '@/store/bookings'
import BookingCalendar from '@/components/BookingCalendar'
import { createPayFastPayment } from '@/lib/payfast'

type BookingStep = 'details' | 'calendar' | 'payment' | 'submitted'

export default function DemoPage() {
  const { locations } = useDemoLocationsStore()
  const { addBooking } = useBookingsStore()
  const activeLocations = locations.filter(loc => loc.active)

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<BookingStep>('details')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    locationId: '',
    experience: '',
    message: '',
  })
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string>('')
  const [bookingId, setBookingId] = useState<string>('')

  useEffect(() => { setMounted(true) }, [])

  const selectedLocation = activeLocations.find(loc => loc.id === formData.locationId)
  const locationPrice = selectedLocation?.price || 1500

  const handleSlotSelect = (date: string, timeSlot: TimeSlot) => {
    setSelectedDate(date)
    setSelectedTime(timeSlot.time)
    setSelectedTimeLabel(timeSlot.label)
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.locationId) { alert('Please select a location'); return }
    setStep('calendar')
  }

  const handleCalendarContinue = () => {
    if (!selectedDate || !selectedTime) { alert('Please select a date and time'); return }
    setStep('payment')
  }

  const createBookingRecord = (id: string): DemoBooking => ({
    id,
    locationId: formData.locationId,
    locationName: selectedLocation?.name || '',
    date: selectedDate,
    timeSlot: selectedTime,
    customerName: formData.name,
    customerEmail: formData.email,
    customerPhone: formData.phone,
    experienceLevel: formData.experience,
    message: formData.message,
    price: locationPrice,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
  })

  const handleWhatsAppBooking = () => {
    const newBookingId = `DEMO-${Date.now()}`
    setBookingId(newBookingId)
    addBooking(createBookingRecord(newBookingId))

    const whatsappNumber = SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const message = `🏄 *DEMO BOOKING REQUEST*\n📋 Booking ID: ${newBookingId}\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone}\n\n*Location:* ${selectedLocation?.name}\n*Date:* ${formattedDate}\n*Time:* ${selectedTimeLabel}\n*Price:* R${locationPrice.toLocaleString()}\n\nReply CONFIRM to accept or REJECT to decline.`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
    setStep('submitted')
  }

  const handlePayFastBooking = () => {
    const newBookingId = `DEMO-${Date.now()}`
    setBookingId(newBookingId)
    addBooking(createBookingRecord(newBookingId))

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-ZA')
    const { url, data } = createPayFastPayment(locationPrice, `Demo Booking - ${selectedLocation?.name}`, `Demo ride at ${selectedLocation?.name} on ${formattedDate} at ${selectedTimeLabel}`, newBookingId, formData.email, formData.name)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url
    Object.entries(data).forEach(([key, value]) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = value; form.appendChild(input) })
    document.body.appendChild(form)
    form.submit()
  }

  if (!mounted) return null

  if (step === 'submitted') {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4">Booking Request Sent!</h1>
          <p className="text-gray-400 mb-4">Booking ID: <span className="text-accent-primary font-mono">{bookingId}</span></p>
          <p className="text-gray-400 mb-8">Your booking request has been sent via WhatsApp. We'll confirm your session shortly.</p>
          <div className="flex flex-col gap-3">
            <a href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700">📱 Open WhatsApp</a>
            <a href="/" className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold hover:bg-accent-secondary">Back to Home</a>
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

            {/* Multi-Step Form */}
            <div className="bg-awake-gray p-8 rounded-xl">
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-2 ${step === 'details' ? 'text-accent-primary' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'details' ? 'bg-accent-primary text-awake-black' : 'bg-white/10'}`}>1</span>
                  <span className="hidden sm:inline text-sm">Details</span>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-2" />
                <div className={`flex items-center gap-2 ${step === 'calendar' ? 'text-accent-primary' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'calendar' ? 'bg-accent-primary text-awake-black' : 'bg-white/10'}`}>2</span>
                  <span className="hidden sm:inline text-sm">Date & Time</span>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-2" />
                <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-accent-primary' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-accent-primary text-awake-black' : 'bg-white/10'}`}>3</span>
                  <span className="hidden sm:inline text-sm">Confirm</span>
                </div>
              </div>

              {/* Step 1: Details */}
              {step === 'details' && (
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">Your Details</h2>
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <input type="tel" required value={formData.phone} placeholder="+27..." onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location *</label>
                    <select required value={formData.locationId} onChange={(e) => setFormData({ ...formData, locationId: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white">
                      <option value="">Select location...</option>
                      {activeLocations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} - R{loc.price?.toLocaleString()}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience Level</label>
                    <select value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white">
                      <option value="">Select...</option>
                      <option value="No experience">No experience</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors">Continue to Select Date →</button>
                </form>
              )}

              {/* Step 2: Calendar */}
              {step === 'calendar' && formData.locationId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Select Date & Time</h2>
                    <button onClick={() => setStep('details')} className="text-sm text-accent-primary hover:underline">← Back</button>
                  </div>
                  <BookingCalendar locationId={formData.locationId} onSelectSlot={handleSlotSelect} selectedDate={selectedDate} selectedTime={selectedTime} />
                  {selectedDate && selectedTime && (
                    <div className="mt-4 p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                      <p className="text-sm text-gray-400">Selected:</p>
                      <p className="font-bold text-accent-primary">{new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedTimeLabel}</p>
                    </div>
                  )}
                  <button onClick={handleCalendarContinue} disabled={!selectedDate || !selectedTime} className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Continue to Confirm →</button>
                </div>
              )}

              {/* Step 3: Payment Options */}
              {step === 'payment' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Confirm Booking</h2>
                    <button onClick={() => setStep('calendar')} className="text-sm text-accent-primary hover:underline">← Back</button>
                  </div>
                  <div className="p-4 bg-awake-black rounded-lg space-y-2">
                    <div className="flex justify-between"><span className="text-gray-400">Location:</span><span>{selectedLocation?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Date:</span><span>{new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Time:</span><span>{selectedTimeLabel}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Name:</span><span>{formData.name}</span></div>
                    <div className="border-t border-white/10 my-2" />
                    <div className="flex justify-between text-lg font-bold"><span>Total:</span><span className="text-accent-primary">R{locationPrice.toLocaleString()}</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Notes (optional)</label>
                    <textarea value={formData.message} rows={2} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary text-white" placeholder="Any special requirements..." />
                  </div>
                  <div className="space-y-3">
                    <button onClick={handlePayFastBooking} className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors flex items-center justify-center gap-2">💳 Pay Now with PayFast</button>
                    <button onClick={handleWhatsAppBooking} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">📱 Request via WhatsApp (Pay Later)</button>
                    <p className="text-xs text-gray-400 text-center">Pay now to secure your slot, or request via WhatsApp for manual confirmation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
