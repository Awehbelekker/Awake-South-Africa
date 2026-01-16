import Link from 'next/link'

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Shipping & Delivery</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Fast, secure delivery across South Africa
        </p>

        {/* Shipping Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-awake-gray p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">📦</div>
              <div>
                <h3 className="font-bold text-lg">Standard Delivery</h3>
                <p className="text-accent-primary font-semibold">FREE</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• 5-7 business days</li>
              <li>• Insured shipment</li>
              <li>• Signature required</li>
              <li>• Tracking included</li>
            </ul>
          </div>
          <div className="bg-awake-gray p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🚀</div>
              <div>
                <h3 className="font-bold text-lg">Express Delivery</h3>
                <p className="text-accent-primary font-semibold">R1,500</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• 2-3 business days</li>
              <li>• Priority handling</li>
              <li>• Insured shipment</li>
              <li>• Real-time tracking</li>
            </ul>
          </div>
        </div>

        {/* Delivery Areas */}
        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Delivery Areas</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-accent-primary">Major Cities (Metro Areas)</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Cape Town</li>
                <li>• Johannesburg</li>
                <li>• Durban</li>
                <li>• Pretoria</li>
                <li>• Port Elizabeth</li>
                <li>• Bloemfontein</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-accent-primary">Regional Delivery</h3>
              <p className="text-gray-400 text-sm">
                We deliver to all areas within South Africa. Remote areas may require additional 
                delivery time (up to 10 business days). Contact us for specific delivery estimates.
              </p>
            </div>
          </div>
        </div>

        {/* International */}
        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">International Shipping</h2>
          <p className="text-gray-300 mb-4">
            We ship to neighboring countries including Namibia, Botswana, Zimbabwe, Mozambique, 
            and Mauritius. International shipping rates vary based on destination.
          </p>
          <p className="text-gray-400 text-sm">
            Please <Link href="/contact" className="text-accent-primary hover:underline">contact us</Link> for 
            international shipping quotes and customs information.
          </p>
        </div>

        {/* Important Info */}
        <div className="bg-awake-gray rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Important Information</h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="text-accent-primary">📋</span>
              <span><strong>Signature Required:</strong> All deliveries require a signature upon receipt.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">📍</span>
              <span><strong>Delivery Address:</strong> Ensure your address is correct and includes any gate codes or special instructions.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">🔔</span>
              <span><strong>Notifications:</strong> You'll receive SMS and email updates at each stage of delivery.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary">📦</span>
              <span><strong>Packaging:</strong> Boards are shipped in custom protective cases with full insurance coverage.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            Have questions about your delivery?
          </p>
          <Link
            href="/contact"
            className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  )
}
