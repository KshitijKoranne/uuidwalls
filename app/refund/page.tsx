export const metadata = {
  title: 'Refund Policy — UUIDWalls',
  description: 'Refund Policy for UUIDWalls by KJR Labs.',
}

export default function RefundPage() {
  return (
    <main style={{ background: 'var(--ink)', minHeight: '100vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <a href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em', display: 'inline-block', marginBottom: '3rem' }}>
          &larr; uuidwalls.vercel.app
        </a>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Refund Policy
        </h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', letterSpacing: '0.06em', marginBottom: '3rem' }}>
          Last updated: April 2026
        </p>

        <div style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--p55)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>1. No Refund Policy</h2>
            <p>All purchases made on UUIDWalls are final and non-refundable. By completing a purchase, you acknowledge and agree that you are not entitled to a refund, exchange, or credit under any circumstances.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>2. Why We Have This Policy</h2>
            <p>UUIDWalls offers a one-time digital unlock for 2K (2560&times;1440) and 4K (3840&times;2160) resolution wallpaper downloads, priced at ₹99 (Indian Rupees). This is a digital product that is delivered instantly and irrevocably to your account upon payment confirmation. Because the product is intangible, cannot be returned, and is accessible immediately, we are unable to offer refunds.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>3. Payment Processing</h2>
            <p>Payments are processed by Razorpay, a third-party payment gateway. KJR Labs does not store your card, UPI, or banking details. Any disputes regarding the payment transaction itself (such as a charge occurring without a corresponding unlock) should be directed to us at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a> and we will investigate promptly.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>4. Technical Issues</h2>
            <p>If you paid successfully but your account was not unlocked due to a technical error on our end, please contact us immediately at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a> with your registered email and Razorpay payment reference. We will resolve the issue and ensure your unlock is applied. This is not a refund situation — it is a fulfilment correction.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>5. Chargebacks</h2>
            <p>Initiating a chargeback or payment dispute for a successfully delivered digital product may result in permanent suspension of your account. We encourage you to contact us first at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a> — we are a small indie product and will always try to resolve issues in good faith.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.75rem' }}>6. Contact</h2>
            <p>For any payment or fulfilment concerns, write to us at <a href="mailto:kjrlabs9@gmail.com" style={{ color: 'var(--p85)', textDecoration: 'none' }}>kjrlabs9@gmail.com</a>. We typically respond within 2 business days.</p>
          </section>

        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--p08)', flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Terms of Service</a>
          <a href="/" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Home</a>
        </div>

      </div>
    </main>
  )
}
