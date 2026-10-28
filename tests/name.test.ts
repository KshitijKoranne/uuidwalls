import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { hueWord, wallName } from '@/lib/wall/name'
import { parseUUID } from '@/lib/wall/params'
import { FAMILIES, PARAM_INPUTS } from './helpers/fixtures'

describe('wall names (SPEC section 13)', () => {
  it('the spec example: hue 210 + wave = Cobalt Tide', () => {
    expect(wallName({ hue: 210, family: 'wave' })).toBe('Cobalt Tide')
  })

  it('all twelve colour words at their centre hue, all six family nouns', () => {
    const words = ['Ember', 'Amber', 'Citrine', 'Lime', 'Moss', 'Jade', 'Lagoon', 'Cobalt', 'Indigo', 'Violet', 'Orchid', 'Rose']
    words.forEach((w, i) => expect(hueWord(i * 30)).toBe(w))
    const nouns = { flowfield: 'Flow', voronoi: 'Mosaic', geometric: 'Facets', ascii: 'Glyphs', mandala: 'Bloom', wave: 'Tide' }
    for (const [fam, noun] of Object.entries(nouns)) expect(wallName({ hue: 0, family: fam })).toBe(`Ember ${noun}`)
  })

  it('every hue 0..359 maps to the nearest 30-degree word, written independently as ranges', () => {
    // bucket i covers [30i-15, 30i+15); Ember also owns 345..359
    const words = ['Ember', 'Amber', 'Citrine', 'Lime', 'Moss', 'Jade', 'Lagoon', 'Cobalt', 'Indigo', 'Violet', 'Orchid', 'Rose']
    for (let h = 0; h < 360; h++) {
      let i = 0
      for (let b = 0; b < 12; b++) { const lo = b * 30 - 15, hi = b * 30 + 15; if ((h >= lo && h < hi) || (h - 360 >= lo && h - 360 < hi)) i = b }
      expect(hueWord(h), `hue ${h}`).toBe(words[i])
    }
  })

  it('boundaries: 14 Ember, 15 Amber, 344 Rose, 345 Ember', () => {
    expect([14, 15, 344, 345].map(hueWord)).toEqual(['Ember', 'Amber', 'Rose', 'Ember'])
  })

  it('never throws on odd input', () => {
    expect(hueWord(Number.NaN)).toBe('Ember')
    expect(hueWord(-30)).toBe('Rose')
    expect(hueWord(725)).toBe('Ember')
    expect(wallName({ hue: 10, family: 'plasma' })).toBe('Ember Wall')
  })

  it('golden: names for 30 inputs x 6 families do not change', () => {
    const golden: Record<string, Record<string, string>> = JSON.parse(readFileSync(new URL('./golden/names.json', import.meta.url), 'utf8'))
    for (const u of PARAM_INPUTS) for (const f of FAMILIES) expect(wallName(parseUUID(u, f)), `${u} ${f}`).toBe(golden[u][f])
  })

  it('the name does not depend on rendering: same UUID, six families = six nouns, one colour word', () => {
    const names = FAMILIES.map(f => wallName(parseUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479', f)))
    expect(new Set(names.map(n => n.split(' ')[0])).size).toBe(1)
    expect(new Set(names.map(n => n.split(' ')[1])).size).toBe(6)
  })
})
