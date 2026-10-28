import Link from 'next/link'

export const metadata = {
  alternates: { canonical: '/refund' },
  title: 'Refund Policy — UUIDWalls',
  description: 'Refund Policy for UUIDWalls by KJR Labs.',
}

export default function RefundPage() {
  return (
    <main id="main" className="legal" tabIndex={-1}>
      <div>

        <Link href="/">
          &larr; uuidwalls.vercel.app
        </Link>

        <h1>
          Refund Policy
        </h1>
        <p>
          Last updated: April 2026
        </p>

        <div>

          <section>
            <h2>1. No Refund Policy</h2>
            <p>All purchases made on UUIDWalls are final and non-refundable. By completing a purchase, you acknowledge and agree that you are not entitled to a refund, exchange, or credit under any circumstances.</p>
          </section>

          <section>
            <h2>2. Why We Have This Policy</h2>
            <p>UUIDWalls offers a one-time digital unlock for 2K (2560&times;1440) and 4K (3840&times;2160) resolution wallpaper downloads, priced at ₹99 (Indian Rupees). This is a digital product that is delivered instantly and irrevocably to your account upon payment confirmation. Because the product is intangible, cannot be returned, and is accessible immediately, we are unable to offer refunds.</p>
          </section>

          <section>
            <h2>3. Payment Processing</h2>
            <p>Payments are processed by Razorpay, a third-party payment gateway. KJR Labs does not store your card, UPI, or banking details. Any disputes regarding the payment transaction itself (such as a charge occurring without a corresponding unlock) should be directed to us at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a> and we will investigate promptly.</p>
          </section>

          <section>
            <h2>4. Technical Issues</h2>
            <p>If you paid successfully but your account was not unlocked due to a technical error on our end, please contact us immediately at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a> with your registered email and Razorpay payment reference. We will resolve the issue and ensure your unlock is applied. This is not a refund situation — it is a fulfilment correction.</p>
          </section>

          <section>
            <h2>5. Chargebacks</h2>
            <p>Initiating a chargeback or payment dispute for a successfully delivered digital product may result in permanent suspension of your account. We encourage you to contact us first at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a> — we are a small indie product and will always try to resolve issues in good faith.</p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>For any payment or fulfilment concerns, write to us at <a href="mailto:kjrlabs9@gmail.com">kjrlabs9@gmail.com</a>. We typically respond within 2 business days.</p>
          </section>

        </div>

        <div>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <Link href="/">Home</Link>
        </div>

      </div>
    </main>
  )
}
