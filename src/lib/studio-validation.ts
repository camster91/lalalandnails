import { normalizePhone } from "./phone.ts";
export class StudioError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
const invalid = (message: string): never => {
  throw new StudioError(message);
};
function text(v: unknown, max: number, required = false): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length > max || (required && !s))
    invalid("Check the required fields and text lengths.");
  return s;
}
const flag = (v: unknown) => v === true || v === "true" || v === "on";
const integer = (v: unknown, min: number, max: number) => {
  if (
    !/^\d+$/.test(String(v)) ||
    !Number.isSafeInteger(Number(v)) ||
    Number(v) < min ||
    Number(v) > max
  )
    invalid("Enter a valid whole number.");
  return Number(v);
};
export const uuid = (v: unknown): string =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    String(v),
  )
    ? String(v)
    : invalid("Invalid record identifier.");
export function phoneKey(value: string): string {
  return normalizePhone(value) ?? invalid("Enter a Canadian or US phone number, including area code.");
}
export function torontoInstant(date: string, time: string): number {
  if (
    !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    invalid("Choose a valid date and time.");
  const base = Date.parse(`${date}T${time}:00Z`);
  if (
    !Number.isFinite(base) ||
    new Date(base).toISOString().slice(0, 10) !== date
  )
    invalid("Choose a valid date.");
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const matches = [4, 5]
    .map((hours) => base + hours * 3600000)
    .filter((ms) => {
      const p = fmt.formatToParts(ms);
      const v = (key: string) => p.find((x) => x.type === key)?.value;
      return (
        `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}` ===
        `${date}T${time}`
      );
    });
  if (matches.length !== 1)
    invalid(
      "This Toronto time is skipped or repeated by daylight saving. Choose another time.",
    );
  return matches[0]!;
}
export function parseStudioCommand(raw: Record<string, unknown>) {
  const action = text(raw.action, 40, true);
  const id = raw.id ? uuid(raw.id) : null;
  const version = id ? integer(raw.version, 1, Number.MAX_SAFE_INTEGER) : null;
  if (action === "lead.create") {
    const phone = phoneKey(text(raw.phone, 40, true));
    if (!flag(raw.consent)) invalid("Confirm the client asked for a response.");
    return {
      action: "lead.create" as const,
      id: null,
      version: null,
      name: text(raw.name, 120, true),
      phone,
      contactMethod: raw.contactMethod === "call" ? "call" : "text",
      source: ["Phone", "Instagram", "Referral", "Other"].includes(
        String(raw.source),
      )
        ? String(raw.source)
        : "Other",
      notes: text(raw.notes, 1000),
    };
  }
  if (action === "client.save") {
    const email = text(raw.email, 200).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      invalid("Enter a valid email.");
    const phone = text(raw.phone, 40);
    if (!phone && !email) invalid("Enter a phone number or email.");
    return {
      action: "client.save" as const,
      id,
      version,
      name: text(raw.name, 120, true),
      phone: phone ? phoneKey(phone) : null,
      email: email || null,
      notes: text(raw.notes, 2000),
      preferences: text(raw.preferences, 1000),
      sensitivities: text(raw.sensitivities, 1000),
      marketingConsent: flag(raw.marketingConsent),
      photoConsent: flag(raw.photoConsent),
    };
  }
  if (action === "service.save") {
    const active = flag(raw.active);
    const priceText = text(raw.price, 12);
    let priceCents: number | null = null;
    if (priceText) {
      if (!/^\d{1,4}(\.\d{1,2})?$/.test(priceText))
        invalid("Enter a CAD price with at most two decimals.");
      priceCents = Math.round(Number(priceText) * 100);
    }
    const duration = raw.duration ? integer(raw.duration, 5, 480) : null;
    const buffer = raw.buffer ? integer(raw.buffer, 0, 120) : 0;
    if (active && (priceCents === null || !duration))
      invalid("Set a price and duration before activating this service.");
    return {
      action: "service.save" as const,
      id,
      version,
      name: text(raw.name, 120, true),
      category: text(raw.category, 60) || "Manicure",
      description: text(raw.description, 1000),
      priceCents,
      duration,
      buffer,
      active,
    };
  }
  if (action === "appointment.save") {
    const start = torontoInstant(
      text(raw.date, 10, true),
      text(raw.time, 5, true),
    );
    return {
      action: "appointment.save" as const,
      id,
      version,
      clientId: uuid(raw.clientId),
      serviceId: uuid(raw.serviceId),
      leadId: raw.leadId ? uuid(raw.leadId) : null,
      start,
      notes: text(raw.notes, 1000),
    };
  }
  if (action === "appointment.status") {
    const status = text(raw.status, 20);
    if (
      !id ||
      !["confirmed", "completed", "cancelled", "no-show"].includes(status)
    )
      invalid("Choose a valid appointment status.");
    return { action: "appointment.status" as const, id, version, status };
  }
  if (action === "block.save") {
    const start = torontoInstant(
      text(raw.date, 10, true),
      text(raw.time, 5, true),
    );
    return {
      action: "block.save" as const,
      id,
      version,
      start,
      end: start + integer(raw.duration, 5, 1440) * 60000,
      label: text(raw.label, 120) || "Unavailable",
    };
  }
  if (action === "waitlist.save")
    return {
      action: "waitlist.save" as const,
      id,
      version,
      clientId: uuid(raw.clientId),
      serviceId: raw.serviceId ? uuid(raw.serviceId) : null,
      notes: text(raw.notes, 1000),
      consent:
        flag(raw.consent) ||
        invalid("Confirm the client opted in to the waitlist."),
    };
  if (action === "record.archive" || action === "record.restore") {
    if (
      !id ||
      !["client", "service", "block", "waitlist"].includes(String(raw.entity))
    )
      invalid("Choose a valid record.");
    return {
      action: action as "record.archive" | "record.restore",
      id,
      version,
      entity: String(raw.entity),
    };
  }
  if (action === "payment.record") {
    return {
      action: "payment.record" as const,
      id,
      version,
      appointmentId: uuid(raw.appointmentId),
      amountCents: integer(raw.amountCents, 1, 1000000),
      method: ["cash", "card", "etransfer"].includes(String(raw.method))
        ? String(raw.method)
        : invalid("Choose the payment method."),
      reference: text(raw.reference, 120),
    };
  }
  return invalid("This action is unavailable.");
}
export type StudioCommand = ReturnType<typeof parseStudioCommand>;
