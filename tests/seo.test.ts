import { describe, expect, it } from 'vitest'
import { FAQ } from '@/lib/content/faq'
import { faqPageLd, jsonLd, webApplicationLd } from '@/lib/seo'

describe('structured data', () => {
  it('FAQPage is built from the same data the page renders, question for question', () => {
    const ld = faqPageLd()
    expect(ld.mainEntity).toHaveLength(FAQ.length)
    ld.mainEntity.forEach((e, i) => { expect(e.name).toBe(FAQ[i].q); expect(e.acceptedAnswer.text).toBe(FAQ[i].a) })
  })
  it('WebApplication states the free tier and the one-time unlock honestly', () => {
    const ld = webApplicationLd('https://x.test/')
    expect(ld['@type']).toBe('WebApplication')
    expect(ld.offers.map(o => [o.price, o.priceCurrency])).toEqual([['0', 'INR'], ['99', 'INR']])
  })
  it('jsonLd cannot close the script tag', () => {
    const s = jsonLd({ a: '</script><script>alert(1)</script>' })
    expect(s).not.toContain('</script>')
    expect(JSON.parse(s).a).toBe('</script><script>alert(1)</script>')
  })
})
