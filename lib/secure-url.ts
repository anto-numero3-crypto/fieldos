/**
 * Coerce any URL to HTTPS to prevent mixed-content warnings when assets
 * stored in the database were uploaded with an http:// origin.
 * Returns '' for nullish input so it can be used directly in JSX src=.
 */
export function secureUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url.replace(/^http:\/\//i, 'https://')
}
