export default function HowItWorks() {
  return (
    <section className="s alt" aria-labelledby="how-h">
      <div className="wrap">
        <h2 className="h2" id="how-h">How it works</h2>
        <p className="lead">Three steps. Nothing to install.</p>
        <div className="how">
          <article><span className="label">Step 1</span><h3>Find your UUID</h3><p>Every device has one. Tap <b>Find my UUID</b> above for the command on Mac, Windows or Linux, or where to look on a phone.</p></article>
          <article><span className="label">Step 2</span><h3>Pick a pattern</h3><p>Six patterns, each drawn from the same seed. The picker shows all six, so you can compare.</p></article>
          <article><span className="label">Step 3</span><h3>Download, save or share</h3><p>Save it to your device, keep it in My walls, or send a link that doesn’t include your UUID.</p></article>
        </div>
      </div>
    </section>
  )
}
