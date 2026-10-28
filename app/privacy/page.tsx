import Link from 'next/link'

export const metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy — UUIDWalls',
  description: 'Privacy Policy for UUIDWalls by KJR Labs.',
}

export default function PrivacyPage() {
  return (
    <main id="main" className="legal" tabIndex={-1}>
      <div>

        {/* Back */}
        <Link href="/">
          &larr; uuidwalls.vercel.app
        </Link>

        {/* Title */}
        <h1>
          Privacy Policy
        </h1>
        <p>
          Last updated: April 2026
        </p>

        <div>

          <section>
            <h2>1. Who We Are</h2>
            <p>UUIDWalls is operated by KJR Labs (Kshitij Koranne), an independent software builder based in India. References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo; in this policy refer to KJR Labs. You can reach us at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a>.</p>
          </section>

          <section>
            <h2>2. What We Collect</h2>
            <p>We collect the minimum data necessary to operate the service:</p>
            <ul>
              <li><strong>Account data</strong> — your email address and a unique user ID, obtained when you sign in via Google OAuth or magic link through Supabase Auth.</li>
              <li><strong>Payment record</strong> — upon a successful purchase, we store your user ID, email, and Razorpay payment reference IDs. We never see or store your card number, UPI ID, bank account, or any other payment instrument details. All payment processing is handled entirely by Razorpay.</li>
              <li><strong>UUID input</strong> — the UUID you enter to generate a wallpaper is processed entirely in your browser. It is never transmitted to or stored on our servers.</li>
            </ul>
          </section>

          <section>
            <h2>3. What We Do Not Collect</h2>
            <p>We do not use analytics tools, advertising pixels, or tracking cookies. We do not sell, rent, or share your personal data with any third party for marketing purposes. We do not collect device identifiers, IP addresses, or browsing behaviour beyond what Supabase and Vercel log as standard infrastructure operation.</p>
          </section>

          <section>
            <h2>4. How We Use Your Data</h2>
            <ul>
              <li>To authenticate you and maintain your session.</li>
              <li>To verify your payment status and unlock 2K/4K downloads.</li>
              <li>To respond to support queries if you contact us.</li>
            </ul>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services, each governed by their own privacy policies:</p>
            <ul>
              <li><strong>Supabase</strong> — authentication and database (supabase.com/privacy)</li>
              <li><strong>Razorpay</strong> — payment processing (razorpay.com/privacy)</li>
              <li><strong>Google</strong> — OAuth sign-in (policies.google.com/privacy)</li>
              <li><strong>Vercel</strong> — hosting and infrastructure (vercel.com/legal/privacy-policy)</li>
            </ul>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>Your account and payment records are retained as long as your account exists or as required for legal and financial record-keeping. You may request deletion of your account and associated data at any time by emailing us.</p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>You have the right to access, correct, or request deletion of your personal data. To exercise any of these rights, contact us at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a>. We will respond within a reasonable timeframe.</p>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>We implement industry-standard security practices including row-level security on our database and HTTPS-only communication. However, no system is entirely infallible, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>For any privacy-related questions, write to us at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a>.</p>
          </section>

        </div>

        {/* Footer nav */}
        <div>
          <a href="/terms">Terms of Service</a>
          <a href="/refund">Refund Policy</a>
          <Link href="/">Home</Link>
        </div>

      </div>
    </main>
  )
}
