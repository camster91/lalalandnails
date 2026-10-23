import { and, count, desc, eq, isNotNull, isNull, lte, notInArray, or, sql } from 'drizzle-orm';
import { bookingRequests } from '../../db/schema.ts';
import type { getDb } from './db';
import { PAGE_SIZE, torontoDate, type parseLeadFilters, type parseLeadUpdate } from './crm.ts';

export async function listLeads(filters: NonNullable<ReturnType<typeof parseLeadFilters>>, db: ReturnType<typeof getDb>) {
  const conditions = [filters.view === 'archived' ? isNotNull(bookingRequests.archivedAt) : isNull(bookingRequests.archivedAt)];
  if (filters.status) conditions.push(eq(bookingRequests.status, filters.status));
  if (filters.view === 'due') conditions.push(and(lte(bookingRequests.followUpDate, torontoDate()), notInArray(bookingRequests.status, ['completed', 'declined']))!);
  if (filters.q) conditions.push(or(
    sql`instr(lower(${bookingRequests.name}), lower(${filters.q})) > 0`,
    sql`instr(${bookingRequests.phone}, ${filters.q}) > 0`,
    sql`instr(lower(${bookingRequests.email}), lower(${filters.q})) > 0`,
  )!);
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(bookingRequests).where(where);
  const records = await db.select().from(bookingRequests).where(where).orderBy(desc(bookingRequests.createdAt), desc(bookingRequests.id)).limit(PAGE_SIZE).offset((filters.page - 1) * PAGE_SIZE);
  return { records, total, page: filters.page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function updateLead(id: string, input: NonNullable<ReturnType<typeof parseLeadUpdate>>, db: ReturnType<typeof getDb>) {
  const updatedAt = Math.max(Date.now(), input.updatedAt + 1);
  const values = input.action === 'update'
    ? { status: input.status, adminNote: input.adminNote, followUpDate: input.followUpDate, updatedAt }
    : { archivedAt: input.action === 'archive' ? updatedAt : null, updatedAt };
  const changed = await db.update(bookingRequests).set(values)
    .where(and(eq(bookingRequests.id, id), eq(bookingRequests.updatedAt, input.updatedAt)))
    .returning({ id: bookingRequests.id, updatedAt: bookingRequests.updatedAt });
  return changed[0] ?? null;
}
