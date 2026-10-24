// Display transport only; every mutation is independently validated on the server.
export type Row = { id: string; version: number; [field: string]: any };
export type Snapshot = {
  date: string;
  clients: Row[];
  clientCount: { total: number };
  clientPage: number;
  services: Row[];
  appointments: Row[];
  blocks: Row[];
  waitlist: Row[];
  payments: Row[];
  activity: Row[];
  attention?: Row[];
  report?: { completed: number; booking_value: number };
  serviceReport?: Row[];
  sources?: {source: string; total: number; converted: number}[];
  paid?: { total: number };
  counts: { new_enquiries: number; follow_ups: number };
  staff: string;
  integrations: Record<string, boolean>;
};
export const pages = [
  ["today", "Today", "house"],
  ["calendar", "Calendar", "calendar-blank"],
  ["enquiries", "Enquiries", "chats-circle"],
  ["clients", "Clients", "users"],
  ["services", "Services", "sparkle"],
  ["waitlist", "Waitlist", "clock"],
  ["reports", "Reports", "chart-bar"],
  ["settings", "Settings", "gear-six"],
];
export const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const icon = (name: string) =>
  `<i class="ph ph-${name}" aria-hidden="true"></i>`;
export const initials = (name: string) =>
  esc(
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join(""),
  );
export const money = (n: number | null) =>
  n === null
    ? "Price not set"
    : new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(n / 100);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00Z"));
export const time = (n: number) =>
  new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  }).format(n);
export const localTime = (n: number) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Toronto",
  }).format(n);
export const button = (label: string, open: string, id = "", light = false) =>
  `<button class="studio-button${light ? " studio-button--light" : ""}" data-open="${esc(open)}" data-id="${esc(id)}">${esc(label)}</button>`;
export const badge = (s: string) =>
  `<span class="studio-badge studio-badge--${esc(s)}">${esc(s.charAt(0).toUpperCase() + s.slice(1))}</span>`;
export const field = (
  label: string,
  name: string,
  value: unknown = "",
  type = "text",
  extra = "",
) =>
  `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}/></label>`;
export const area = (label: string, name: string, value: unknown = "", max = 1000) =>
  `<label>${esc(label)}<textarea name="${name}" rows="3" maxlength="${max}">${esc(value)}</textarea></label>`;
export const check = (label: string, name: string, checked = false) =>
  `<label class="studio-check"><input type="checkbox" name="${name}" ${checked ? "checked" : ""}/><span>${esc(label)}</span></label>`;

export const select = (
    label: string,
    name: string,
    items: Row[],
    value = "",
    nameKey = "name",
  ) =>
    `<label>${label}<select name="${name}" required><option value="">Select…</option>${items.map((r) => `<option value="${esc(r.id)}" ${value === r.id ? "selected" : ""}>${esc(r[nameKey])}</option>`).join("")}</select></label>`;
export const hidden = (c?: Row) =>
    c
      ? `<input type="hidden" name="id" value="${esc(c.id)}"/><input type="hidden" name="version" value="${c.version}"/>`
      : "";
export const form = (action: string, html: string, c?: Row) =>
    `<form class="studio-form" data-command="${action}">${hidden(c)}${html}<p class="studio-form-error" role="alert"></p><div class="studio-actions"><button class="studio-button" type="submit">${action === "record.restore" ? "Restore record" : action === "record.archive" ? "Archive record" : "Save " + (action.split(".")[0] === "block" ? "blocked time" : action.split(".")[0])}</button><button class="studio-link" type="button" data-close>Cancel</button></div></form>`;
export const empty = (heading: string, copy: string, action = "") =>
    `<div class="studio-empty"><h3>${heading}</h3><p>${copy}</p>${action}</div>`;
export const head = (name: string, sub: string, action = "") =>
    `<div class="studio-page-head"><div><h1>${name}</h1><p class="studio-muted">${sub}</p></div>${action}</div>`;
export const sectionHead = (name: string, action = "") =>
    `<div class="studio-section-head"><h2>${name}</h2>${action}</div>`;
