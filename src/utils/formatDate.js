// Formats ISO date (YYYY-MM-DD) into DD-MM-YYYY (British/Irish format)
export function formatDate(dateStr) {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;

  return `${day}-${month}-${year}`;
}