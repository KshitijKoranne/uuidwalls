// The FAQ, as data. The page renders it and the FAQPage JSON-LD is built from it, so search results
// and the visible text can never disagree. Wording approved by the owner (SPEC 9.3); edit it here only.
export interface FaqItem { q: string; a: string }

export const FAQ: FaqItem[] = [
  { q: 'Is my UUID sent anywhere?', a: 'No. Walls are drawn in your browser. If you sign in, we store your email and the walls you save (not your UUID). Share links don’t contain your UUID.' },
  { q: 'Will my wall change?', a: 'Same UUID, same pattern, same size gives the same wall. We version the algorithm so future updates add new looks rather than change yours.' },
  { q: 'Can someone else get my wall?', a: 'Anyone who has your exact UUID can make the same wall, so treat it as a fun image, not a secret.' },
  { q: 'What does it cost?', a: 'Screen and Phone downloads are free. 2K and 4K are ₹99, once, for your account.' },
  { q: 'How do I set it as my wallpaper?', a: 'Download it, then pick it in your system’s wallpaper settings.' },
]
