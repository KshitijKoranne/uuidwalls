// The FAQ, as data. The page renders it and the FAQPage JSON-LD is built from it, so search results
// and the visible text can never disagree. Edit the wording here only.
export interface FaqItem { q: string; a: string }

export const FAQ: FaqItem[] = [
  { q: 'Does this send my UUID anywhere?', a: 'No. Everything runs in your browser. Your UUID is never transmitted. There is no backend, no analytics on your input.' },
  { q: 'What resolution will my wallpaper be?', a: 'You choose. Screen res matches your display. 2K exports at 2560×1440. 4K at 3840×2160. Mobile at 1290×2796.' },
  { q: 'Can two machines get the same wall?', a: 'Only if they share a UUID — cryptographically impossible by design. Your wall is provably yours.' },
  { q: 'Will my wall look the same next year?', a: 'Yes. The algorithm is deterministic and versioned. Same UUID, same result, always.' },
  { q: 'What does the ₹99 unlock?', a: '2K and 4K resolution downloads, permanently, for your account. Screen and mobile downloads remain free forever.' },
  { q: 'Is a native app coming?', a: 'Yes. Native apps will read your UUID automatically and set the wallpaper with one tap. Web first, apps soon.' },
]
