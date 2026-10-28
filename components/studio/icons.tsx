// Inline icons (no icon font, no network): 24px grid, 1.75 stroke, inherits colour.
const I = ({ children, ...p }: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>{children}</svg>
export const IconDownload = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="M12 4v11m-5-5 5 5 5-5M5 20h14" /></I>
export const IconShare = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="M12 15V4m-4 4 4-4 4 4M5 13v6h14v-6" /></I>
export const IconHeart = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></I>
export const IconDice = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></I>
export const IconCopy = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></I>
export const IconLock = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>
export const IconChevron = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="m6 9 6 6 6-6" /></I>
export const IconCheck = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="m5 12 5 5 9-10" /></I>
export const IconAlert = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></I>
export const IconMenu = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>
export const IconSearch = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></I>
export const IconMore = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></I>
export const IconArrowLeft = (p: React.SVGProps<SVGSVGElement>) => <I {...p}><path d="M19 12H5m6-6-6 6 6 6" /></I>
