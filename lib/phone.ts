export function normalizeUsPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';

  // Strip leading country code 1 if present
  const trimmed = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (trimmed.length !== 10) return trimmed; // return best-effort for validation upstream
  return trimmed;
}

export function formatUsPhone(raw: string): string {
  const normalized = normalizeUsPhone(raw);
  if (normalized.length !== 10) return raw;
  const area = normalized.slice(0, 3);
  const prefix = normalized.slice(3, 6);
  const line = normalized.slice(6);
  return `(${area}) ${prefix}-${line}`;
}

export function isValidUsPhone(raw: string): boolean {
  return normalizeUsPhone(raw).length === 10;
}

