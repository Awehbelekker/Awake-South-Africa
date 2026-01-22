import Link from 'next/link'

export default function WarrantyPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Warranty Information</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Your Awake board is protected by our comprehensive warranty
        </p>

        {/* Warranty Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-awake-gray p-6 rounded-xl text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-2xl font-bold text-accent-primary mb-2">2 Years</h3>
            <p className="text-gray-400">Board & Components Warranty</p>
          </div>
          <div className="bg-awake-gray p-6 rounded-xl text-center">
            <div className="text-4xl mb-3">🔋</div>
            <h3 className="text-2xl font-bold text-accent-primary mb-2">1 Year</h3>
            <p className="text-gray-400">Battery Warranty (500 cycles)</p>
          </div>
        </div>

        {/* Warranty Details */}
        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What's Covered</h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="text-accent-primary">✓</span>
              <span>Defects in materials and workmanship</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">✓</span>
              <span>Motor and drivetrain components</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">✓</span>
              <span>Electronic control systems</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">✓</span>
              <span>Battery cells (within specified capacity)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">✓</span>
              <span>Remote control and charging equipment</span>
            </li>
          </ul>
        </div>

        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What's Not Covered</h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="text-red-500">✕</span>
              <span>Damage from misuse, accidents, or neglect</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-500">✕</span>
              <span>Normal wear and tear (footpads, fins, edges)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-500">✕</span>
              <span>Modifications or unauthorized repairs</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-500">✕</span>
              <span>Damage from improper storage or charging</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-500">✕</span>
              <span>Commercial or rental use</span>
            </li>
          </ul>
        </div>

        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How to Make a Claim</h2>
          <ol className="space-y-4 text-gray-300 list-decimal list-inside">
            <li>Contact our support team with your order details</li>
            <li>Describe the issue and provide photos/videos if possible</li>
            <li>Our technical team will assess the claim within 48 hours</li>
            <li>If approved, we'll arrange repair or replacement</li>
            <li>Shipping for warranty claims is covered by Awake Boards SA</li>
          </ol>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            Need to submit a warranty claim or have questions?
          </p>
          <Link
            href="/contact"
            className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  )
}
