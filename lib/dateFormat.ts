/**
 * Format date and time in USA format (MM/DD/YYYY, HH:MM AM/PM) in America/New_York timezone
 */
export function formatUSDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  
  // Convert to America/New_York timezone
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date only in USA format (MM/DD/YYYY) in America/New_York timezone
 */
export function formatUSDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  
  // Convert to America/New_York timezone
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time only in USA format (HH:MM AM/PM) in America/New_York timezone
 */
export function formatUSTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  
  // Convert to America/New_York timezone
  return d.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

