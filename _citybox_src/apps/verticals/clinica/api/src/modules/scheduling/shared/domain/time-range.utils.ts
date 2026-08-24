export type TimeWindow = {
  startMinutes: number;
  endMinutes: number;
};

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function intersectTimeWindows(
  a: TimeWindow,
  b: TimeWindow,
): TimeWindow | null {
  const startMinutes = Math.max(a.startMinutes, b.startMinutes);
  const endMinutes = Math.min(a.endMinutes, b.endMinutes);
  if (startMinutes >= endMinutes) return null;
  return { startMinutes, endMinutes };
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

export function subtractInterval(
  window: TimeWindow,
  blocked: TimeWindow,
): TimeWindow[] {
  if (blocked.endMinutes <= window.startMinutes) return [window];
  if (blocked.startMinutes >= window.endMinutes) return [window];

  const result: TimeWindow[] = [];
  if (blocked.startMinutes > window.startMinutes) {
    result.push({
      startMinutes: window.startMinutes,
      endMinutes: Math.min(blocked.startMinutes, window.endMinutes),
    });
  }
  if (blocked.endMinutes < window.endMinutes) {
    result.push({
      startMinutes: Math.max(blocked.endMinutes, window.startMinutes),
      endMinutes: window.endMinutes,
    });
  }
  return result.filter((w) => w.startMinutes < w.endMinutes);
}
