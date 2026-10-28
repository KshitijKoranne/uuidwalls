import Hero from '@/components/studio/Hero'
import TopBar from '@/components/studio/TopBar'
import StudioProvider from '@/components/studio/StudioProvider'
import Cta from '@/components/sections/Cta'
import Explore from '@/components/sections/Explore'
import Faq from '@/components/sections/Faq'
import Footer from '@/components/sections/Footer'
import Gallery from '@/components/sections/Gallery'
import HowItWorks from '@/components/sections/HowItWorks'
import Pricing from '@/components/sections/Pricing'
import Showcase from '@/components/sections/Showcase'
import { faqPageLd, jsonLd, webApplicationLd } from '@/lib/seo'
import { siteUrl } from '@/lib/site'

/** The whole page. `initialToken` opens a shared wall (/w/<token>) instead of the default one. */
export default function HomeContent({ initialToken }: { initialToken?: string }) {
  return (
    <StudioProvider initialToken={initialToken}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webApplicationLd(siteUrl())) }} />
      {!initialToken && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd()) }} />}
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <main id="main" tabIndex={-1}>
      <Hero />
      <HowItWorks />
      <Showcase />
      <Gallery />
      <Explore />
      <Pricing />
      <Faq />
      <Cta />
      </main>
      <Footer />
    </StudioProvider>
  )
}
