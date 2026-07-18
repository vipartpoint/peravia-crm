export function formatRelativeTime(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const rtf = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto', style: 'long' });

  const diffInMs = date.getTime() - now.getTime();
  const diffInSeconds = Math.round(diffInMs / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');
  if (Math.abs(diffInDays) < 30) return rtf.format(diffInDays, 'day');
  
  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) return rtf.format(diffInMonths, 'month');

  return rtf.format(Math.round(diffInDays / 365), 'year');
}

export function formatAbsoluteDate(dateInput: string | Date | number): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateInput));
}
