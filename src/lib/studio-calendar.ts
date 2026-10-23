// A user-driven Google event draft, not an OAuth connection or background sync.
// Deliberately accepts only schedule fields: no client identity, contact information or private notes.
export function googleCalendarLink(appointment: { start_at: number; end_at: number; status: string }): string | null {
  const { start_at: start, end_at: end, status } = appointment;
  if (status === 'cancelled' || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start || start < 946684800000 || end > 4102444800000) return null;
  const stamp = (value: number) => new Date(value).toISOString().replace(/[-:]/g, '').replace('.000', '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: 'La La Land Nail Hub appointment', dates: `${stamp(start)}/${stamp(end)}`, stz: 'America/Toronto', etz: 'America/Toronto', details: 'View appointment and client details in your secure studio workspace: https://lalalandnails.ca/admin#calendar\nThis is a separate calendar copy. Changes and cancellations in the studio are not automatically synced.' });
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}
