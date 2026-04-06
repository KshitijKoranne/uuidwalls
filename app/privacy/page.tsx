export const metadata = {
  title: 'Privacy Policy — UUIDWalls',
  description: 'Privacy Policy for UUIDWalls by KJR Labs.',
}

export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--ink)', minHeight: '100vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Back */}
        <a href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em', display: 'inline-block', marginBottom: '3rem' }}>
          &larr; uuidwalls.vercel.app
        </a>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', letterSpacing: '0.06em', marginBottom: '3rem' }}>
          Last updated: April 2026
        </p>

        <div style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--p55)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>1. Who We Are</h2>
            <p>UUIDWalls is operated by KJR Labs (Kshitij Koranne), an independent software builder based in India. References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo; in this policy refer to KJR Labs. You can reach us at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a>.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>2. What We Collect</h2>
            <p style={{ marginBottom: '0.75rem' }}>We collect the minimum data necessary to operate the service:</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong style={{ color: 'var(--p85)' }}>Account data</strong> — your email address and a unique user ID, obtained when you sign in via Google OAuth or magic link through Supabase Auth.</li>
              <li><strong style={{ color: 'var(--p85)' }}>Payment record</strong> — upon a successful purchase, we store your user ID, email, and Razorpay payment reference IDs. We never see or store your card number, UPI ID, bank account, or any other payment instrument details. All payment processing is handled entirely by Razorpay.</li>
              <li><strong style={{ color: 'var(--p85)' }}>UUID input</strong> — the UUID you enter to generate a wallpaper is processed entirely in your browser. It is never transmitted to or stored on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>3. What We Do Not Collect</h2>
            <p>We do not use analytics tools, advertising pixels, or tracking cookies. We do not sell, rent, or share your personal data with any third party for marketing purposes. We do not collect device identifiers, IP addresses, or browsing behaviour beyond what Supabase and Vercel log as standard infrastructure operation.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>4. How We Use Your Data</h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>To authenticate you and maintain your session.</li>
              <li>To verify your payment status and unlock 2K/4K downloads.</li>
              <li>To respond to support queries if you contact us.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>5. Third-Party Services</h2>
            <p style={{ marginBottom: '0.75rem' }}>We use the following third-party services, each governed by their own privacy policies:</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong style={{ color: 'var(--p85)' }}>Supabase</strong> — authentication and database (supabase.com/privacy)</li>
              <li><strong style={{ color: 'var(--p85)' }}>Razorpay</strong> — payment processing (razorpay.com/privacy)</li>
              <li><strong style={{ color: 'var(--p85)' }}>Google</strong> — OAuth sign-in (policies.google.com/privacy)</li>
              <li><strong style={{ color: 'var(--p85)' }}>Vercel</strong> — hosting and infrastructure (vercel.com/legal/privacy-policy)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>6. Data Retention</h2>
            <p>Your account and payment records are retained as long as your account exists or as required for legal and financial record-keeping. You may request deletion of your account and associated data at any time by emailing us.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>7. Your Rights</h2>
            <p>You have the right to access, correct, or request deletion of your personal data. To exercise any of these rights, contact us at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a>. We will respond within a reasonable timeframe.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>8. Security</h2>
            <p>We implement industry-standard security practices including row-level security on our database and HTTPS-only communication. However, no system is entirely infallible, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>10. Contact</h2>
            <p>For any privacy-related questions, write to us at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a>.</p>
          </section>

        </div>

        {/* Footer nav */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--p08)', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Terms of Service</a>
          <a href="/refund" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Refund Policy</a>
          <a href="/" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Home</a>
        </div>

      </div>
    </main>
  )
}
