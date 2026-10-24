/** The same Canadian/US identity is used by enquiries and studio clients. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s()+.\-]/g, '');
  return /^(?:1)?[2-9]\d{9}$/.test(digits) ? '+1' + digits.slice(-10) : null;
}
// Handles legacy display formatting without changing stored enquiries.
export const recentPhoneSql = `SELECT id FROM booking_requests WHERE created_at > ? AND substr(replace(replace(replace(replace(replace(replace(phone,' ',''),'+',''),'(',''),')',''),'-',''),'.',''),-10)=? LIMIT 1`;
