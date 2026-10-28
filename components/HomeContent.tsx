import Explore from '@/components/sections/Explore'
import Faq from '@/components/sections/Faq'
import FourK from '@/components/sections/FourK'
import HowItWorks from '@/components/sections/HowItWorks'
import Stage from '@/components/studio/Stage'
import { faqPageLd, jsonLd, webApplicationLd } from '@/lib/seo'
import { siteUrl } from '@/lib/site'

/** The studio page: stage and panel, then the short story sections. The same page serves /w/<token>. */
export default function HomeContent({ shared }: { shared?: boolean }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webApplicationLd(siteUrl())) }} />
      {!shared && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd()) }} />}
      <main id="main" tabIndex={-1}>
        <Stage />
        <HowItWorks />
        <Explore />
        <FourK />
        <Faq />
      </main>
    </>
  )
}
