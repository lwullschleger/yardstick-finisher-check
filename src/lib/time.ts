export interface FormatOptions {
  showHours?: boolean;
}

export function formatDuration(ms: number, opts?: FormatOptions): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const sign = ms < 0 ? '-' : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  if (opts?.showHours || h > 0) {
    return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${sign}${pad(m)}:${pad(s)}`;
}
