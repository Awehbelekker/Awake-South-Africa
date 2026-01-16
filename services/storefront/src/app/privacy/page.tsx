export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Privacy Policy</h1>
        <p className="text-gray-400 text-center mb-12">Last updated: January 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-300">
              Awake Boards SA ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you visit our website or make a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <p className="text-gray-300 mb-4">We may collect the following types of information:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, shipping address, billing address</li>
              <li><strong>Payment Information:</strong> Credit card details (processed securely via PayFast)</li>
              <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent on pages</li>
              <li><strong>Communications:</strong> Emails, chat messages, and customer service interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
            <p className="text-gray-300 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><strong>Service Providers:</strong> Payment processors (PayFast), shipping companies, email services</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-gray-300">
              We implement appropriate security measures to protect your personal information. 
              All payment transactions are encrypted using SSL technology. However, no method 
              of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Rights (POPIA)</h2>
            <p className="text-gray-300 mb-4">
              Under the Protection of Personal Information Act (POPIA), you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent for marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Cookies</h2>
            <p className="text-gray-300">
              We use cookies to enhance your browsing experience, analyze site traffic, and 
              personalize content. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
            <p className="text-gray-300">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us at:
            </p>
            <p className="text-gray-300 mt-4">
              <strong>Email:</strong> privacy@awakesa.co.za<br />
              <strong>Address:</strong> Cape Town, South Africa
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
