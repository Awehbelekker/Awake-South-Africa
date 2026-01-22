'use client'

import Link from 'next/link'
import { SA_CONTENT } from '@/lib/constants'

const faqs = [
  {
    question: 'How long does shipping take?',
    answer: 'Standard delivery within South Africa takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee. All boards are shipped fully insured.',
  },
  {
    question: 'Do you offer training?',
    answer: 'Yes! We offer professional training sessions at all our demo locations. Training is included with every board purchase, or can be booked separately.',
  },
  {
    question: 'What warranty do you offer?',
    answer: 'All Awake boards come with a 2-year manufacturer warranty covering defects in materials and workmanship. Batteries are covered for 1 year or 500 charge cycles.',
  },
  {
    question: 'Can I try before I buy?',
    answer: 'Absolutely! We encourage all customers to book a demo session before purchasing. Demo fees are fully redeemable against your purchase.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'We primarily serve South Africa and neighboring countries. Contact us for international shipping quotes and availability.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, EFT, and offer financing through PayFast PayJustNow with 0% interest over 3 payments.',
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Support Center</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          How can we help you today?
        </p>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link
            href="/contact"
            className="bg-awake-gray p-6 rounded-xl text-center hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold mb-2">Contact Us</h3>
            <p className="text-sm text-gray-400">Get in touch with our team</p>
          </Link>
          <Link
            href="/warranty"
            className="bg-awake-gray p-6 rounded-xl text-center hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-bold mb-2">Warranty</h3>
            <p className="text-sm text-gray-400">Warranty information & claims</p>
          </Link>
          <Link
            href="/shipping"
            className="bg-awake-gray p-6 rounded-xl text-center hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold mb-2">Shipping</h3>
            <p className="text-sm text-gray-400">Delivery times & costs</p>
          </Link>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-awake-gray rounded-xl overflow-hidden"
              >
                <summary className="flex justify-between items-center p-6 cursor-pointer font-medium hover:text-accent-primary">
                  {faq.question}
                  <span className="text-accent-primary group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className="bg-awake-gray rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Still Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold mb-1">Email</h3>
              <a href={`mailto:${SA_CONTENT.contact.email}`} className="text-accent-primary text-sm">
                {SA_CONTENT.contact.email}
              </a>
            </div>
            <div>
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href={`tel:${SA_CONTENT.contact.phone}`} className="text-accent-primary text-sm">
                {SA_CONTENT.contact.phone}
              </a>
            </div>
            <div>
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <a
                href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                className="text-accent-primary text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat with us
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
