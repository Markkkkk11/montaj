export function appendQueryParam(url: string, key: string, value: string): string {
  const [base, hash] = url.split('#', 2);
  const separator = base.includes('?') ? '&' : '?';

  return `${base}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}${hash ? `#${hash}` : ''}`;
}
