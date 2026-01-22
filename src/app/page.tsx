'use client'

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Zap, Shield, Waves, Battery, Phone, MapPin } from "lucide-react";
import { AWAKE_IMAGES, PRODUCTS, SA_CONTENT } from "@/lib/constants";
import { useDemoLocationsStore } from "@/store/demoLocations";

export default function HomePage() {
  const { locations } = useDemoLocationsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use active locations from store if mounted, otherwise use default
  const displayLocations = mounted ? locations.filter(loc => loc.active) : SA_CONTENT.demo.locations

  return (
    <main className="min-h-screen bg-awake-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src={AWAKE_IMAGES.hero.main} alt="Awake Electric Surfboard" fill className="object-cover opacity-60" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-awake-black/60 via-awake-black/30 to-awake-black/80" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Official Awake Distributor for South Africa</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
            THE FUTURE OF
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-cyan-400">WATERSPORTS</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the thrill of electric surfboarding with premium RÄVIK Jetboards and VINGA eFoils. Now available in South Africa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/products" className="group px-8 py-4 bg-accent-primary text-awake-black font-semibold rounded-lg hover:bg-accent-primary/90 transition-all flex items-center gap-2">
              Explore Boards <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/demo" className="px-8 py-4 bg-white/5 text-white font-semibold rounded-lg border border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all">
              Book a Demo Ride
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-16 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-accent-primary" /><span>2 Year Warranty</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-accent-primary" /><span>SA Support & Service</span></div>
            <div className="flex items-center gap-2"><Phone className="w-5 h-5 text-accent-primary" /><span>WhatsApp Support</span></div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-24 px-4 bg-awake-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Ride</h2>
            <p className="text-xl text-gray-400">Two distinct electric watersports experiences</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/products?category=jetboards" className="group relative overflow-hidden rounded-2xl bg-awake-charcoal border border-white/5 hover:border-accent-primary/50 transition-all">
              <div className="aspect-[4/3] relative">
                <Image src={AWAKE_IMAGES.categories.jetboards} alt="RÄVIK Jetboards" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-awake-black via-awake-black/50 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">RÄVIK Jetboards</h3>
                <p className="text-gray-300 mb-4">High-speed rides on the water&apos;s surface</p>
                <span className="inline-flex items-center text-accent-primary font-semibold gap-2">View Collection <ArrowRight className="w-5 h-5" /></span>
              </div>
            </Link>

            <Link href="/products?category=efoils" className="group relative overflow-hidden rounded-2xl bg-awake-charcoal border border-white/5 hover:border-accent-primary/50 transition-all">
              <div className="aspect-[4/3] relative">
                <Image src={AWAKE_IMAGES.categories.efoils} alt="VINGA eFoils" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-awake-black via-awake-black/50 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">VINGA eFoils</h3>
                <p className="text-gray-300 mb-4">Lift above the water for a &quot;flying&quot; sensation</p>
                <span className="inline-flex items-center text-accent-primary font-semibold gap-2">View Collection <ArrowRight className="w-5 h-5" /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-awake-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Pioneering Innovation</h2>
            <p className="text-xl text-gray-400">From day one, innovation has driven everything Awake does</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: "Click-to-Ride", desc: "Instant power with intuitive controls" },
              { icon: Battery, title: "Awake Flex 4", desc: "Modular battery with SmartPair tech" },
              { icon: Shield, title: "2 Year Warranty", desc: "Complete peace of mind with local support" },
              { icon: Waves, title: "Scandinavian Design", desc: "Clean lines and functional elegance" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-8 rounded-2xl bg-awake-charcoal border border-white/5 hover:border-accent-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-6 group-hover:bg-accent-primary/20">
                  <Icon className="w-7 h-7 text-accent-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-24 px-4 bg-awake-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Experience It Yourself</h2>
            <p className="text-xl text-gray-300 mb-8">Book a demo ride at one of our South African locations</p>
          </div>
          
          {/* Location Cards with Images */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {displayLocations.map((loc) => (
              <div key={loc.name} className="group relative overflow-hidden rounded-xl aspect-[4/3] border border-white/10 hover:border-accent-primary/50 transition-all">
                <Image
                  src={loc.image}
                  alt={loc.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-awake-black via-awake-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{loc.name}</h3>
                  <p className="text-gray-300 text-sm">{loc.area}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-accent-primary text-awake-black font-semibold rounded-lg hover:bg-accent-primary/90">
              Book Your Demo Ride <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-4 bg-awake-black border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join the Awake SA Community</h2>
          <p className="text-gray-400 mb-8">Stay connected with the latest news and exclusive offers</p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input type="email" placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-awake-charcoal border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary" />
            <button type="submit" className="px-8 py-4 bg-accent-primary text-awake-black font-semibold rounded-lg hover:bg-accent-primary/90">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
