import Hero from '@/components/studio/Hero'
import Nav from '@/components/studio/Nav'
import StudioProvider from '@/components/studio/StudioProvider'
import Cta from '@/components/sections/Cta'
import Explore from '@/components/sections/Explore'
import Faq from '@/components/sections/Faq'
import Footer from '@/components/sections/Footer'
import Gallery from '@/components/sections/Gallery'
import HowItWorks from '@/components/sections/HowItWorks'
import Pricing from '@/components/sections/Pricing'
import Showcase from '@/components/sections/Showcase'

export default function Home() {
  return (
    <StudioProvider>
      <Nav />
      <Hero />
      <HowItWorks />
      <Showcase />
      <Gallery />
      <Explore />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </StudioProvider>
  )
}
