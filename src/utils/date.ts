// ─────────────────────────────────────────────────────────────
// THE FORGE — Date Utilities (IST)
// ALL date operations go through these functions.
// Never call new Date() directly in product code.
// IST = UTC+5:30 = 330 minutes ahead of UTC.
// ─────────────────────────────────────────────────────────────

const IST_OFFSET_MS = 330 * 60 * 1000; // 5h 30m in milliseconds

/**
 * Returns today's date as a YYYY-MM-DD string in IST.
 * This is the canonical "today" for streak and mission unlock logic.
 */
export function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

/**
 * Returns tomorrow's date as a YYYY-MM-DD string in IST.
 */
export function tomorrowIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS + 86_400_000);
  return ist.toISOString().slice(0, 10);
}

/**
 * Parses a YYYY-MM-DD IST string into a Date object.
 * Treats the string as midnight in IST.
 */
export function parseIST(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

/**
 * Returns the absolute number of calendar days between two YYYY-MM-DD strings.
 * Both are treated as IST dates.
 */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  const diff = parseIST(a).getTime() - parseIST(b).getTime();
  return Math.abs(Math.round(diff / msPerDay));
}

/**
 * Returns which day of the programme a user is on (1-indexed).
 * Day 1 = the day they joined.
 *
 * @param joinedDate - YYYY-MM-DD IST when the user created their account
 */
export function daysSinceJoined(joinedDate: string): number {
  return daysBetween(todayIST(), joinedDate);
}

/**
 * Returns the user's current week number (1-indexed).
 * Week 1 = days 0-6 since joining.
 */
export function currentWeekNumber(joinedDate: string): number {
  return Math.floor(daysSinceJoined(joinedDate) / 7) + 1;
}

/**
 * Returns the user's day-of-week within their current week (1-7).
 * 1 = first day of current week.
 */
export function currentDayOfWeek(joinedDate: string): number {
  return (daysSinceJoined(joinedDate) % 7) + 1;
}

/**
 * Formats a YYYY-MM-DD string for display (e.g. "6 Jun 2026").
 */
export function formatDate(dateStr: string): string {
  return parseIST(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Returns a short relative label: "Today", "Yesterday", or a date string.
 */
export function relativeDateLabel(dateStr: string): string {
  const today     = todayIST();
  const yesterday = (() => {
    const d = new Date(parseIST(today).getTime() - 86_400_000);
    return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
  })();

  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return formatDate(dateStr);
}
