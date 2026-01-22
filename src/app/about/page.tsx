'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AWAKE_IMAGES, SA_CONTENT } from '@/lib/constants'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white">
      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-awake-black/50 to-awake-black z-10" />
        <div className="absolute inset-0">
          <Image
            src={AWAKE_IMAGES.lifestyle.action1}
            alt="Awake Boards"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">About Awake Boards SA</h1>
          <p className="text-xl text-gray-300">South Africa's Official Awake Boards Distributor</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-6">
              Awake Boards SA is the official South African distributor for Awake Boards, 
              the Swedish pioneers of electric water sports. We bring the thrill of eFoiling 
              and electric jetboards to the shores of South Africa.
            </p>
            <p className="text-lg text-gray-300 mb-6">
              Founded with a passion for innovation and water sports, we're committed to 
              delivering premium electric watercraft experiences to enthusiasts across 
              Southern Africa. From Cape Town to Durban, we're making waves.
            </p>
            <p className="text-lg text-gray-300">
              Our mission is simple: to provide world-class electric water sports equipment 
              backed by exceptional service, expert training, and a community of riders 
              who share our love for the water.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-awake-gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Official Distributor',
                description: 'Authorized Awake Boards partner with full warranty support and genuine parts.',
                icon: '✓'
              },
              {
                title: 'Expert Training',
                description: 'Professional lessons at demo locations across South Africa.',
                icon: '🏄'
              },
              {
                title: 'Local Support',
                description: 'Dedicated SA-based customer service and technical support team.',
                icon: '🇿🇦'
              }
            ].map((value, index) => (
              <div key={index} className="bg-awake-black p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Locations */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Demo Locations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SA_CONTENT.demoLocations.map((location, index) => (
              <div key={index} className="bg-awake-gray p-6 rounded-lg text-center">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="text-lg font-semibold">{location}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Ride?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Book a demo session and experience the future of water sports.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-accent-primary text-awake-black px-8 py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Book Your Demo
          </Link>
        </div>
      </section>
    </main>
  )
}
