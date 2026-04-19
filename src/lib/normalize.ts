export function normalizeLinkedInUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '');
}

/**
 * Extract the LinkedIn company slug from any LinkedIn URL.
 * Handles company pages, posts, and activity URLs.
 * Returns null if no company slug can be detected.
 *
 * Examples:
 *   https://www.linkedin.com/company/kmska/posts/?feedView=all -> "kmska"
 *   https://linkedin.com/company/tefaf/ -> "tefaf"
 *   https://www.linkedin.com/posts/kmska_some-post-activity-123 -> "kmska"
 */
export function extractCompanySlug(url: string | null | undefined): string | null {
  if (!url) return null;
  const normalized = normalizeLinkedInUrl(url);

  // Pattern 1: /company/{slug}/...
  const companyMatch = normalized.match(/linkedin\.com\/company\/([^/?#]+)/);
  if (companyMatch) return companyMatch[1].toLowerCase();

  // Pattern 2: /posts/{slug}_... (slug is before the first underscore)
  const postsMatch = normalized.match(/linkedin\.com\/posts\/([^_/?#]+)/);
  if (postsMatch) return postsMatch[1].toLowerCase();

  return null;
}

