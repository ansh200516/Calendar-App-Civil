// src/lib/date-utils.ts
// (Keep all your existing functions)

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';

  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${period}`;
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTimeForInput(time: string): string {
  return time;
}

export function getCurrentMonthName(): string {
  const date = new Date();
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function generateCalendarDays(year: number, month: number): Array<{ day: number; currentMonth: boolean }> {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Previous month days to display
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const prevMonthDays = Array.from({ length: firstDay }, (_, i) => ({
    day: daysInPrevMonth - firstDay + i + 1,
    currentMonth: false
  }));

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true
  }));

  // Next month days to display (to fill out the grid)
  const totalDaysToShow = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const nextMonthDays = Array.from({ length: totalDaysToShow - (prevMonthDays.length + currentMonthDays.length) }, (_, i) => ({
    day: i + 1,
    currentMonth: false
  }));

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
}

export function getTimeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return 'Invalid date'; // Handle invalid date strings
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  return diffSeconds < 5 ? 'just now' : `${diffSeconds} seconds ago`;
}

// --- ADDED FUNCTION ---
/**
 * Combines a date string (YYYY-MM-DD) and a time string (HH:MM) into a Date object.
 * Assumes the date and time are in the server's local timezone unless timezone handling is added.
 * @param dateStr - The date string in YYYY-MM-DD format.
 * @param timeStr - The time string in HH:MM format.
 * @returns A Date object representing the combined date and time.
 */
export function combineDateTime(dateStr: string, timeStr: string): Date {
    // Basic implementation assuming local time interpretation of date/time strings
    // Ensure timeStr includes seconds for robustness, default to :00 if not present
    const timeParts = timeStr.split(':');
    const formattedTime = `${timeParts[0]}:${timeParts[1] || '00'}:00`;
    return new Date(`${dateStr}T${formattedTime}`);
}
// --- END ADDED FUNCTION ---