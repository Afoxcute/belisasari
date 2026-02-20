/**
 * Normalize Tapestry/network errors into a user-friendly message.
 * EAI_AGAIN and similar DNS/network errors are transient; we don't expose raw errors to the UI.
 */
export function getTapestryErrorMessage(
  error: unknown,
  fallback = 'Tapestry is temporarily unavailable. Please try again.'
): string {
  const err = error instanceof Error ? error : null;
  const cause = err?.cause instanceof Error ? err.cause : null;
  const code = (err as { code?: string })?.code ?? (cause as { code?: string })?.code;
  const msg = err?.message ?? '';

  // DNS / network transient errors (including when wrapped by Axios)
  if (
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    msg.includes('getaddrinfo') ||
    msg.includes('EAI_AGAIN') ||
    (cause && (cause.message?.includes('getaddrinfo') || (cause as { code?: string }).code === 'EAI_AGAIN'))
  ) {
    return 'Unable to reach Tapestry. Check your internet connection and try again.';
  }

  if (err && msg.length < 200 && !msg.includes('socket') && !msg.includes('connect')) {
    return msg;
  }
  return fallback;
}
