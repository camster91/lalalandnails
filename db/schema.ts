import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bookingRequests = sqliteTable('booking_requests', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  contactMethod: text('contact_method'),
  leadSource: text('lead_source'),
  followUpDate: text('follow_up_date'),
  archivedAt: integer('archived_at'),
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  serviceSlug: text('service_slug').notNull().default('european-manicure'),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull().default('pending'),
  adminNote: text('admin_note').notNull().default(''),
  consentAt: integer('consent_at').notNull(),
}, (table) => [
  index('idx_booking_requests_status_created').on(table.status, table.createdAt),
]);

export const chatRateLimits = sqliteTable('chat_rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [
  index('idx_chat_rate_limits_expires').on(table.expiresAt),
]);
