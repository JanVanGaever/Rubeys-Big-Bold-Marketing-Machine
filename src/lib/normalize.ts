export function normalizeLinkedInUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '');
}
