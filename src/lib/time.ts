/**
 * Format a duration in seconds as a compact string, e.g.
 * 5025 -> "1h 23m 45s", 303 -> "5m 3s", 12 -> "12s", 0 -> "0s".
 * Leading zero units are omitted; seconds are always shown when nothing else is.
 */
export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}
