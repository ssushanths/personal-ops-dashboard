export function toISO(date) {
  return date.toISOString().split('T')[0];
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameMonth(dateStr) {
  return Boolean(dateStr && dateStr.startsWith(currentMonthKey()));
}

export function addMonthsKeepingDay(dateStr, desiredDay) {
  const d = new Date(`${dateStr}T00:00:00`);
  const target = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(desiredDay || d.getDate(), lastDay));
  return toISO(target);
}
