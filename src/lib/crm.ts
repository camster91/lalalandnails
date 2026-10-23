export const leadStatuses = ['pending', 'contacted', 'confirmed', 'declined', 'completed'] as const;
export type LeadStatus = typeof leadStatuses[number];
export const PAGE_SIZE = 25;

export function torontoDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function parseLeadFilters(url: URL) {
  const q = (url.searchParams.get('q') ?? '').trim();
  const status = url.searchParams.get('status') || null;
  const view = url.searchParams.get('view') || 'active';
  const pageText = url.searchParams.get('page') ?? '1';
  if (q.length > 80 || (status && !leadStatuses.includes(status as LeadStatus)) || !['active', 'archived', 'due'].includes(view) || !/^[1-9]\d{0,3}$/.test(pageText)) return null;
  return { q, status: status as LeadStatus | null, view, page: Number(pageText) };
}

type LeadUpdate = { action: 'archive' | 'restore'; updatedAt: number } | { action: 'update'; updatedAt: number; status: LeadStatus; adminNote: string; followUpDate: string | null };

export function parseLeadUpdate(input: Record<string, unknown>): LeadUpdate | null {
  const action = String(input.action ?? 'update');
  const version = String(input.updatedAt ?? '');
  if (!/^\d{1,16}$/.test(version) || !Number.isSafeInteger(Number(version)) || Number(version) < 1) return null;
  const updatedAt = Number(version);
  if (action === 'archive' || action === 'restore') return { action, updatedAt };
  if (action !== 'update' || !leadStatuses.includes(input.status as LeadStatus)) return null;
  const adminNote = String(input.adminNote ?? '').trim();
  const followUpDate = String(input.followUpDate ?? '');
  if (adminNote.length > 500 || (followUpDate && (!/^20\d{2}-\d{2}-\d{2}$/.test(followUpDate) || Number.isNaN(Date.parse(`${followUpDate}T12:00:00Z`)) || new Date(`${followUpDate}T12:00:00Z`).toISOString().slice(0, 10) !== followUpDate))) return null;
  return { action: 'update', updatedAt, status: input.status as LeadStatus, adminNote, followUpDate: followUpDate || null };
}
