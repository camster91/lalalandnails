import { googleCalendarLink } from '../lib/studio-calendar';
import { pages, esc, icon, initials, money, dateLabel, time, localTime, button, badge, field, area, check, select, hidden, form, empty, head, sectionHead, type Row, type Snapshot } from './studio-ui';
import { torontoDate } from "../lib/crm";
export async function startStudio() {
  const root = document.querySelector<HTMLElement>("#studio-app");
  if (!root || root.dataset.started) return;
  root.dataset.started = "true";
  const main = root.querySelector<HTMLElement>("main")!,
    dialog = root.querySelector<HTMLDialogElement>("dialog")!,
    body = root.querySelector<HTMLElement>("#dialog-body")!,
    title = root.querySelector<HTMLElement>("#dialog-title")!;
  const demo = import.meta.env.DEV && root.dataset.demo === "true";
  let fixture: Snapshot | null = null,
    leads: Row[] = [],
    leadTotal = 0,
    leadPage = 1,
    clientPage = 1,
    clientQuery = "",
    leadQuery = "",
    leadView = "active",
    leadStatus = "",
    date = demo ? "2026-10-23" : torontoDate(),
    state: Snapshot,
    loading = 0;
  let page = pages.some((x) => x[0] === location.hash.slice(1))
      ? location.hash.slice(1)
      : "today",
    toastTimer: number | undefined,
    convertLead: Row | undefined;
  if (demo) {
    const d = await import("./studio-demo");
    fixture = d.demoSnapshot() as Snapshot;
    leads = d.demoLeads as unknown as Row[];
    leadTotal = leads.length;
  }
  const toast = (text: string) => {
    const el = root.querySelector<HTMLElement>("#studio-message")!;
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (el.textContent = ""), 7000);
  };
  async function api(url: string, raw?: Record<string, unknown>) {
    const r = await fetch(
      url,
      raw
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(raw),
          }
        : { headers: { Accept: "application/json" } },
    );
    if (
      r.redirected ||
      !r.headers.get("content-type")?.includes("application/json")
    )
      throw Error(
        "Your staff session may have expired. Reload and sign in again.",
      );
    const data = (await r.json()) as Record<string, any>;
    if (!r.ok) throw Error(data.error || "The request could not be completed.");
    return data;
  }
  function navigate(next: string) {
    page = next;
    location.hash = next;
    render();
    main.focus();
  }
  async function load() {
    const token = ++loading;
    try {
      const data = (
        demo
          ? fixture!
          : await api(
              `/api/admin/studio?date=${date}&q=${encodeURIComponent(clientQuery)}&page=${clientPage}`,
            )
      ) as Snapshot;
      let records = leads,
        total = leadTotal;
      if (!demo) {
        const result = await api(
          `/api/admin/bookings?view=${leadView}&q=${encodeURIComponent(leadQuery)}&status=${leadStatus}&page=${leadPage}`,
        );
        records = result.records;
        total = result.total;
      }
      if (token !== loading) return;
      state = { ...data, date };
      leads = records;
      leadTotal = total;
      render();
    } catch (e) {
      main.innerHTML = empty(
        "Unable to load your workspace",
        esc((e as Error).message),
        '<button class="studio-button" data-retry>Try again</button>',
      );
    }
  }
  function nav() {
    const link = (key: string, label: string, i: string) =>
      `<a href="#${key}" data-page="${key}" class="studio-nav-item" ${page === key ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span></a>`;
    root!.querySelector(".studio-sidebar")!.innerHTML = pages
      .map(([key, label, i]) => link(key, label, i))
      .join("");
    root!.querySelector(".studio-bottom")!.innerHTML =
      pages
        .filter((p) => ["today", "calendar", "clients"].includes(p[0]))
        .map(([key, label, i]) => link(key, label, i))
        .join("") +
      `<button class="studio-nav-item studio-icon-button" style="width:auto" data-open="more" ${!["today", "calendar", "clients"].includes(page) ? 'aria-current="page"' : ""}>${icon("dots-three")}<span>More</span></button>`;
  }
  function appointmentRow(a: Row) {
    const t = time(a.start_at),
      parts = t.split(/\s/);
    return `<div class="studio-row"><div class="studio-time">${esc(parts[0])}<small>${esc(parts.slice(1).join(" "))}</small></div><span class="studio-initials">${initials(a.client_name)}</span><div class="studio-row-main"><strong>${esc(a.client_name)}</strong><p>${esc(a.service_name)}</p></div>${badge(a.status)}<button class="studio-icon-button" data-open="appointment-detail" data-id="${esc(a.id)}" aria-label="Open appointment for ${esc(a.client_name)}">${icon("caret-right")}</button></div>`;
  }
  function leadRow(l: Row) {
    return `<div class="studio-row"><span class="studio-initials">${icon(l.status === "pending" ? "chat-circle" : "clock")}</span><div class="studio-row-main"><span class="studio-eyebrow">${l.status === "pending" ? "New enquiry" : "Follow-up"}</span><br/><strong>${esc(l.name)}</strong><p>${esc(l.notes || l.adminNote || "Appointment enquiry")}</p></div><button class="studio-icon-button" data-open="lead" data-id="${esc(l.id)}" aria-label="Open enquiry from ${esc(l.name)}">${icon("caret-right")}</button></div>`;
  }
  function render() {
    if (!state) return;
    nav();
    const todays = state.appointments.filter(
      (a) =>
        torontoDate(new Date(a.start_at)) === date && a.status !== "cancelled",
    );
    if (page === "today") {
      const hours = demo
        ? 9
        : Number(
            new Intl.DateTimeFormat("en-CA", {
              hour: "numeric",
              hourCycle: "h23",
              timeZone: "America/Toronto",
            }).format(new Date()),
          );
      const greeting =
        hours < 12
          ? "Good morning"
          : hours < 17
            ? "Good afternoon"
            : "Good evening";
      main.innerHTML =
        head(`${greeting}, Bianca`, dateLabel(date)) +
        `<div class="studio-stats"><div class="studio-stat"><strong>${todays.length}</strong><span>appointments</span></div><div class="studio-stat"><strong>${state.counts.new_enquiries || 0}</strong><span>new enquiries</span></div><div class="studio-stat"><strong>${state.counts.follow_ups || 0}</strong><span>follow-ups</span></div></div><div class="studio-two-col"><section class="studio-section">${sectionHead("Today’s appointments", button("Add booking", "appointment"))}<div class="studio-date-strip"><span>${icon("calendar-blank")} ${dateLabel(date)}</span><span>${todays.length} booked</span></div>${todays.length ? todays.map(appointmentRow).join("") : empty("A little room in your day", "Add a booking or block time to organise your schedule.", button("Open calendar", "calendar-link", "", true))}</section><section class="studio-section studio-attention">${sectionHead("Needs your attention", '<a class="studio-link" data-page="enquiries" href="#enquiries">View all</a>')}${
          (state.attention || leads)
            .filter(
              (l) => !["completed", "declined", "confirmed"].includes(l.status),
            )
            .slice(0, 2)
            .map(leadRow)
            .join("") ||
          empty(
            "You’re all caught up",
            "New appointment enquiries and follow-ups will appear here.",
          )
        }</section></div>`;
    } else if (page === "calendar") {
      const base = new Date(date + "T12:00Z"),
        monday = new Date(base);
      monday.setUTCDate(base.getUTCDate() - ((base.getUTCDay() + 6) % 7));
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(d.getUTCDate() + i);
        return d;
      });
      main.innerHTML =
        head(
          "Your schedule",
          "Toronto time · appointment buffers are protected",
          button("Add booking", "appointment"),
        ) +
        `<div class="studio-week-controls"><button class="studio-icon-button" data-shift="-7" aria-label="Previous week">${icon("caret-left")}</button><label>Calendar date<input type="date" id="calendar-date" value="${date}" min="2000-01-01" max="2099-12-31"/></label><button class="studio-icon-button" data-shift="7" aria-label="Next week">${icon("caret-right")}</button></div><div class="studio-calendar-days">${days.map((d) => `<button class="studio-day" data-date="${d.toISOString().slice(0, 10)}" aria-pressed="${d.toISOString().slice(0, 10) === date}">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]}<strong>${d.getUTCDate()}</strong></button>`).join("")}</div>${sectionHead(dateLabel(date), button("Block time", "block", "", true))}${(state.requestedBlocks||[]).filter(r=>r.preferredDate===date).map(r=>`<div class="studio-notice"><strong>Requested ${esc(r.preferredTime)} · 2 hours</strong>${leadRow(r)}</div>`).join("")}${todays.length ? todays.map(appointmentRow).join("") : empty("No appointments for this day", "Add a manual booking when the client and service are ready.")}${state.blocks
          .filter((b) => torontoDate(new Date(b.start_at)) === date)
          .map(
            (b) =>
              `<div class="studio-block"><strong>${esc(time(b.start_at))}–${esc(time(b.end_at))}</strong> · ${esc(b.label)}<div>${button("Remove block", "archive-block", b.id, true)}</div></div>`,
          )
          .join("")}`;
    } else if (page === "enquiries") {
      const visible = demo
        ? leads.filter(
            (l) =>
              (!leadQuery ||
                l.name.toLowerCase().includes(leadQuery.toLowerCase())) &&
              (!leadStatus || l.status === leadStatus) &&
              (leadView !== "due" ||
                (l.followUpDate && l.followUpDate <= date)),
          )
        : leads;
      main.innerHTML =
        head(
          "Enquiries",
          `${leadTotal} matching enquiries · Page ${leadPage}`,
          button("Add enquiry", "manual-lead"),
        ) +
        `<form class="studio-toolbar" id="lead-filter"><label>Find an enquiry<input name="q" type="search" value="${esc(leadQuery)}" placeholder="Name, phone or email" maxlength="80"/></label><label>Status<select name="status"><option value="">All statuses</option>${["pending", "contacted", "confirmed", "declined", "completed"].map((s) => `<option ${leadStatus === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><label>Inbox<select name="view">${[
          ["active", "Active enquiries"],
          ["due", "Follow-up due"],
          ["archived", "Archived"],
        ]
          .map(
            ([v, l]) =>
              `<option value="${v}" ${v === leadView ? "selected" : ""}>${l}</option>`,
          )
          .join(
            "",
          )}</select></label><button class="studio-button">Apply filters</button></form>${visible.map(leadRow).join("") || empty("No enquiries here", "Try another filter, or add an enquiry received by phone or Instagram.")}<div class="studio-actions">${leadPage > 1 ? '<button class="studio-button studio-button--light" data-lead-page="-1">Previous</button>' : ""}${leadPage * 25 < leadTotal ? '<button class="studio-button studio-button--light" data-lead-page="1">Next</button>' : ""}</div>`;
    } else if (page === "clients")
      main.innerHTML =
        head(
          "Your clients",
          `${state.clientCount.total} clients · preferences, consultations and history`,
          button("Add client", "client"),
        ) +
        `<form id="client-filter" class="studio-toolbar"><label>Find a client<input name="q" type="search" value="${esc(clientQuery)}" placeholder="Name, phone or email" maxlength="80"/></label><button class="studio-button">Search</button></form>${state.clients.map((c) => `<div class="studio-row"><span class="studio-initials">${initials(c.name)}</span><div class="studio-row-main"><strong>${esc(c.name)}</strong><p>${esc(c.phone || c.email)}</p></div><button class="studio-icon-button" data-open="client" data-id="${esc(c.id)}" aria-label="Edit client ${esc(c.name)}">${icon("caret-right")}</button></div>`).join("") || empty("Your client book starts here", "Add a client, then record their service preferences and bookings.")}<div class="studio-actions">${clientPage > 1 ? '<button class="studio-button studio-button--light" data-client-page="-1">Previous</button>' : ""}${clientPage * 50 < state.clientCount.total ? '<button class="studio-button studio-button--light" data-client-page="1">Next</button>' : ""}</div>`;
    else if (page === "services")
      main.innerHTML =
        head(
          "Services & pricing",
          "CAD · configure prices and durations before booking",
          button("Add service", "service"),
        ) +
        `${state.services.map((s) => `<div class="studio-row"><span class="studio-initials">${icon("sparkle")}</span><div class="studio-row-main"><strong>${esc(s.name)}</strong><p>${esc(s.category)} · ${s.duration ? `${s.duration} min` : "Duration not set"} · ${s.buffer} min buffer</p><p>${money(s.price_cents)} · ${s.active ? "Available for booking" : "Inactive"}</p></div><button class="studio-icon-button" data-open="service" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">${icon("pencil-simple")}</button></div>`).join("") || empty("Set up your service menu", "Add manicures, maintenance, removal, repairs, and length or nail-art packages. Prices are yours to confirm.")}<p class="studio-muted">Use separate service variants for combinations that need a different price or duration, such as a long set with detailed nail art.</p>`;
    else if (page === "waitlist")
      main.innerHTML =
        head(
          "Waitlist",
          "Clients who have asked to hear about an opening",
          button("Add to waitlist", "waitlist"),
        ) +
        state.waitlist
          .map(
            (w) =>
              `<div class="studio-row"><span class="studio-initials">${initials(w.client_name)}</span><div class="studio-row-main"><strong>${esc(w.client_name)}</strong><p>${esc(w.notes || "Flexible availability")}</p><p>Opted in ${dateLabel(torontoDate(new Date(w.consent_at)))}</p></div>${button("Remove", "archive-waitlist", w.id, true)}</div>`,
          )
          .join("") +
        (state.waitlist.length
          ? ""
          : empty(
              "No one is waiting yet",
              "Add clients only after they have asked to join. Adding someone does not send a message.",
            ));
    else if (page === "reports") {
      const completed = state.appointments.filter(
          (a) => a.status === "completed",
        ),
        booked =
          state.report?.booking_value ??
          completed.reduce((n, a) => n + a.price_cents, 0),
        paid =
          state.paid?.total ??
          state.payments.reduce((n, p) => n + p.amount_cents, 0);
      main.innerHTML =
        head(
          "Studio reports",
          `${date.slice(0, 7)} · CAD · based on saved records`,
        ) +
        `<div class="studio-stats"><div class="studio-stat"><strong>${state.report?.completed ?? completed.length}</strong><span>completed appointments</span></div><div class="studio-stat"><strong>${money(booked)}</strong><span>completed booking value</span></div><div class="studio-stat"><strong>${money(paid)}</strong><span>recorded payments</span></div></div><p class="studio-notice">Booking value is the saved service price. It is not collected revenue. Payments reflect staff-entered records, not verified Stripe transactions.</p>${sectionHead("Services this month")}<table class="studio-table"><thead><tr><th>Service</th><th>Completed</th><th>Booking value</th></tr></thead><tbody>${
          (
            state.serviceReport ||
            [...new Set(completed.map((a) => a.service_name))].map((name) => {
              const rows = completed.filter((a) => a.service_name === name);
              return {
                service_name: name,
                completed: rows.length,
                booking_value: rows.reduce((n, a) => n + a.price_cents, 0),
              };
            })
          )
            .map(
              (r) =>
                `<tr><td>${esc(r.service_name)}</td><td>${r.completed}</td><td>${money(r.booking_value)}</td></tr>`,
            )
            .join("") ||
          '<tr><td colspan="3">Complete an appointment to start your report.</td></tr>'
        }</tbody></table><div class="studio-setting"><h3>Enquiries by source · All time</h3><p>Channel labels come from known referral sites or utm_source links, or staff entry. They are hints, not verified attribution. Existing records without a source stay unknown.</p><table class="studio-table"><thead><tr><th>Source</th><th>Enquiries</th><th>Linked bookings</th></tr></thead><tbody>${(state.sources || []).map(s => `<tr><td>${esc(s.source)}</td><td>${s.total}</td><td>${s.converted}</td></tr>`).join("") || '<tr><td colspan="3">No source data yet.</td></tr>'}</tbody></table></div>`;
    } else main.innerHTML = settings();
  }
  function settings() {
    return (
      head("Studio settings", "Secure workspace · America/Toronto · CAD") +
      `<div class="studio-setting"><h3>Staff access</h3><p>Signed in as ${esc(state.staff)}. Staff access is controlled by Cloudflare Access.</p><div class="studio-actions"><a class="studio-link" href="/" target="_blank" rel="noopener">View website</a><a class="studio-link" href="/cdn-cgi/access/logout">Sign out</a></div></div><div class="studio-setting"><h3>Calendar subscription</h3><p>Subscribe to your private hosted calendar in Google Calendar, Apple Calendar or Outlook. Appointments, reschedules, cancellations and blocked time update when your calendar app refreshes. Client names, contact details and private notes are excluded.</p>${button("Manage calendar feed", "calendar-feed", "", true)}</div><div class="studio-setting"><h3>Online booking & availability</h3><p>Clients can request two-hour blocks Monday–Friday, 10 a.m.–3 p.m. Toronto time. One appointment or held request per day. Decline a request to release its day; archiving does not cancel it. Bianca confirms the service, price and visit details.</p></div><div class="studio-setting"><h3>Payments & deposits · Not connected</h3><p>Record payments already received on an appointment. Stripe checkout, deposits and refunds require the salon’s Stripe account, credentials, deposit rules and a verified webhook. No charge is made here.</p></div><div class="studio-setting"><h3>Reminders & review requests · Not active</h3><p>Appointment reminders, delivery tracking and review requests require a verified sender and approved templates. SMS also needs a provider and client consent. Follow-up dates create staff tasks only.</p></div><div class="studio-setting"><h3>Private client photos · Storage needed</h3><p>Photo consent is recorded in client profiles. Image uploads require a private storage binding and retention settings; no client photos are placed in the public site.</p></div><div class="studio-setting"><h3>Export & recovery</h3><p>Download a private JSON export of the studio tables. Keep it secure; it may contain client information. Export does not change records.</p>${button("Export studio records", "export", "", true)} ${button("Archived records", "archived-records", "", true)}<p class="studio-muted">An export is not a tested database restore. Cloudflare D1 recovery and a restore rehearsal remain part of launch verification.</p></div><div class="studio-setting"><h3>Recent activity</h3>${
        state.activity
          .slice(0, 12)
          .map(
            (a) =>
              `<p>${esc(new Date(a.created_at).toLocaleString("en-CA", { timeZone: "America/Toronto" }))} · ${esc(a.action)} · ${esc(a.actor)}</p>`,
          )
          .join("") || "<p>No staff changes recorded yet.</p>"
      }</div>`
    );
  }
  function show(name: string, html: string) {
    title.textContent = name;
    body.innerHTML = html;
    if (!dialog.open) dialog.showModal();
  }
  async function open(kind: string, id = "") {
    const client = state.clients.find((c) => c.id === id),
      service = state.services.find((s) => s.id === id),
      appointment = state.appointments.find((a) => a.id === id),
      lead = [...leads, ...(state.attention || []), ...(state.requestedBlocks || [])].find((l) => l.id === id);
    if (kind.startsWith("feed-") || kind === "calendar-feed") {
      if (demo) {
        show("Calendar subscription", "<p>Private subscription links are available in the signed-in live workspace. Demo data is never published to a feed.</p>");
        return;
      }
      if (kind === "feed-copy") {
        const input = body.querySelector<HTMLInputElement>("#feed-url");
        if (input) {
          try { await navigator.clipboard.writeText(input.value); toast("Private calendar link copied."); }
          catch { input.focus(); input.select(); toast("Select and copy the private link."); }
        }
        return;
      }
      const action = kind === "feed-rotate" ? "rotate" : kind === "feed-disable" ? "disable" : null;
      const data = await api(`/api/admin/calendar-feed${action ? `?action=${action}` : ""}`, action ? {} : undefined);
      show("Calendar subscription", `<p>${data.enabled ? "Your private feed is enabled." : "Your calendar feed is disabled."} This is a read-only subscription. Changes appear after your calendar provider refreshes; updates may take several hours.</p>${data.url ? `<label class="studio-form">Private subscription URL<input id="feed-url" type="url" readonly value="${esc(data.url)}" /></label><div class="studio-actions">${button("Copy private link", "feed-copy", "", true)}<a class="studio-button studio-button--light" href="${esc(data.url.replace(/^https?:/, "webcal:"))}">Open in calendar app</a></div><p>In Google Calendar on desktop: Other calendars → + → From URL → paste this link → Add calendar. Save this link now; it is only shown when created.</p>` : ""}<p>Anyone with the link can read your schedule. Keep it private. Creating a new link immediately revokes the old one; existing subscribers must add the new URL. Disabling stops future refreshes but cannot erase copies already saved in another app.</p><div class="studio-actions">${button(data.enabled ? "Create replacement link" : "Create private link", "feed-rotate", "", true)}${data.enabled ? button("Disable feed", "feed-disable", "", true) : ""}</div>`);
      return;
    }
    if (kind === "more") {
      show(
        "Your workspace",
        `<nav class="studio-menu" aria-label="More sections">${pages.map(([key, name, i]) => `<a class="studio-nav-item" data-page="${key}" href="#${key}">${icon(i)}${name}</a>`).join("")}</nav>`,
      );
      return;
    }
    if (kind === "account") {
      show(
        "Staff account",
        `<p>${esc(state.staff)}</p><div class="studio-actions"><a class="studio-link" href="/">View website</a><a class="studio-link" href="/cdn-cgi/access/logout">Sign out</a></div>`,
      );
      return;
    }
    if (kind === "calendar-link") {
      navigate("calendar");
      return;
    }
    if (kind === "client") {
      const c = client || convertLead;
      show(
        client ? "Client profile" : "Add client",
        form(
          "client.save",
          field(
            "Full name",
            "name",
            c?.name || "",
            "text",
            'required maxlength="120"',
          ) +
            field("Phone", "phone", c?.phone || "", "tel", 'maxlength="40"') +
            field(
              "Email",
              "email",
              c?.email || "",
              "email",
              'maxlength="200"',
            ) +
            area(
              "Preferences · shape, length, shades, products",
              "preferences",
              client?.preferences || "",
            ) +
            area(
              "Product sensitivities · client-provided information",
              "sensitivities",
              client?.sensitivities || "",
            ) +
            area(
              "Private consultation and service notes",
              "notes",
              client?.notes || "",
              2000,
            ) +
            check(
              "Client explicitly opted in to marketing. Appointment enquiries alone do not count.",
              "marketingConsent",
              !!client?.marketing_consent_at,
            ) +
            check(
              "Client granted permission to take and store nail photos.",
              "photoConsent",
              !!client?.photo_consent_at,
            ),
          client,
        ) +
          (client
            ? `<div class="studio-client-history"><h3>Appointment history</h3><div id="client-history">Loading history…</div></div><div class="studio-actions">${button("Book again", "client-book", client.id)}${button("Archive client", "archive-client", client.id, true)}</div>`
            : ""),
      );
      if (client) {
        const history = demo
          ? state.appointments.filter((a) => a.client_id === client.id)
          : (
              await api(
                `/api/admin/client-history?id=${encodeURIComponent(client.id)}`,
              )
            ).appointments;
        const target = body.querySelector("#client-history");
        if (target)
          target.innerHTML =
            history
              .map(
                (a: Row) =>
                  `<p>${dateLabel(torontoDate(new Date(a.start_at)))} · ${esc(a.service_name)} · ${esc(a.status)}</p>`,
              )
              .join("") ||
            '<p class="studio-muted">No appointments saved yet.</p>';
      }
      return;
    }
    if (kind === "service") {
      show(
        service ? "Edit service" : "Add service",
        form(
          "service.save",
          field(
            "Service name",
            "name",
            service?.name || "",
            "text",
            'required maxlength="120"',
          ) +
            field(
              "Category or design/length tier",
              "category",
              service?.category || "Manicure",
              "text",
              'maxlength="60"',
            ) +
            area("Description", "description", service?.description || "") +
            `<div class="studio-form-grid">${field("Price (CAD)", "price", service?.price_cents != null ? (service.price_cents / 100).toFixed(2) : "", "number", 'min="0" max="9999.99" step="0.01"')}${field("Duration (minutes)", "duration", service?.duration || "", "number", 'min="5" max="480" step="1"')}${field("Buffer after service", "buffer", service?.buffer || 0, "number", 'min="0" max="120" step="1"')}</div>` +
            check(
              "Available for bookings · requires price and duration",
              "active",
              !!service?.active,
            ),
          service,
        ) +
          (service
            ? `<div class="studio-actions">${button("Archive service", "archive-service", service.id, true)}</div>`
            : ""),
      );
      return;
    }
    if (kind === "client-book") {
      await open("appointment");
      const el = body.querySelector(
        "[name=clientId]",
      ) as HTMLSelectElement | null;
      if (el) el.value = id;
      return;
    }
    if (kind === "appointment" || kind === "convert") {
      if (kind === "appointment" && !id) convertLead = undefined;
      if (kind === "convert") convertLead = lead;
      if (!state.clients.length || !state.services.some((s) => s.active)) {
        show(
          "Set up your first booking",
          empty(
            "A client and service are needed",
            "Add a client and configure at least one active service with a price and duration.",
            button("Add client", "client") +
              button("Set up services", "services-link", "", true),
          ),
        );
        return;
      }
      const booking = appointment;
      const choices = [...state.clients];
      if (booking && !choices.some((c) => c.id === booking.client_id))
        choices.push({
          id: booking.client_id,
          version: 0,
          name: booking.client_name,
        });
      show(
        booking
          ? "Reschedule appointment"
          : convertLead
            ? "Book from enquiry"
            : "Add booking",
        form(
          "appointment.save",
          (convertLead
            ? `<p class="studio-notice">Booking enquiry from ${esc(convertLead.name)}. Select their existing client record, or add them first.</p><input type="hidden" name="leadId" value="${esc(convertLead.id)}"/>`
            : "") +
            select("Client", "clientId", choices, booking?.client_id || "") +
            select(
              "Service",
              "serviceId",
              state.services.filter((s) => s.active),
              booking?.service_id || "",
            ) +
            `<div class="studio-form-grid">${field("Date · Toronto", "date", booking ? torontoDate(new Date(booking.start_at)) : convertLead?.preferredDate || date, "date", 'required min="2000-01-01" max="2099-12-31"')}${field("Start time · Toronto", "time", booking ? localTime(booking.start_at) : convertLead?.preferredTime || "10:00", "time", "required")}</div>` +
            area(
              "Appointment notes · products, shades and design",
              "notes",
              booking?.notes || "",
            ),
          booking,
        ),
      );
      return;
    }
    if (kind === "services-link") {
      dialog.close();
      navigate("services");
      return;
    }
    if (kind === "appointment-detail" && appointment) {
      const a = appointment;
      const calendarLink=googleCalendarLink({start_at:a.start_at,end_at:a.end_at,status:a.status});
      show(
        "Appointment",
        `<h3>${esc(a.client_name)}</h3><dl class="studio-details"><div><dt>Service</dt><dd>${esc(a.service_name)}</dd></div><div><dt>When · Toronto</dt><dd>${dateLabel(torontoDate(new Date(a.start_at)))} · ${esc(time(a.start_at))}–${esc(time(a.end_at))}</dd></div><div><dt>Saved service price</dt><dd>${money(a.price_cents)}</dd></div><div><dt>Notes</dt><dd>${esc(a.notes || "No notes yet.")}</dd></div></dl>${badge(a.status)}<div class="studio-actions">${a.phone ? `<a class="studio-button studio-button--light" href="tel:${esc(a.phone)}">Call client</a><a class="studio-button studio-button--light" href="sms:${esc(a.phone)}">Text client</a>` : ""}${calendarLink?`<a class="studio-button studio-button--light" href="${esc(calendarLink)}" target="_blank" rel="noopener noreferrer">${icon("calendar-plus")} Add to Google Calendar</a>`:''}${button("Reschedule", "appointment", id, true)}${button("Record payment", "payment", id, true)}</div><form class="studio-form" data-command="appointment.status" style="margin-top:20px">${hidden(a)}<label>Status<select name="status">${["confirmed", "completed", "cancelled", "no-show"].map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select></label><p class="studio-form-error" role="alert"></p><button class="studio-button">Save status</button></form><p class="studio-muted" style="margin-top:16px">These changes do not send a message or issue a refund. Google Calendar opens a separate event draft; review and save it there. Rescheduling or cancelling here does not update that calendar copy.</p>`,
      );
      return;
    }
    if (kind === "block") {
      show(
        "Block time",
        form(
          "block.save",
          `<div class="studio-form-grid">${field("Date · Toronto", "date", date, "date", "required")}${field("Start · Toronto", "time", "09:00", "time", "required")}</div>` +
            field(
              "Length (minutes)",
              "duration",
              60,
              "number",
              'required min="5" max="1440"',
            ) +
            field("Label", "label", "", "text", 'maxlength="120"'),
        ),
      );
      return;
    }
    if (kind === "waitlist") {
      show(
        "Add to waitlist",
        form(
          "waitlist.save",
          select("Client", "clientId", state.clients) +
            area("Availability and service preferences", "notes") +
            check("Client explicitly asked to join the waitlist.", "consent"),
        ),
      );
      return;
    }
    if (kind === "payment" && appointment) {
      show(
        "Record a payment received",
        form(
          "payment.record",
          `<p class="studio-notice">Record a payment you already received. This does not charge a card.</p><input type="hidden" name="appointmentId" value="${esc(id)}"/>` +
            field(
              "Amount received (CAD)",
              "amount",
              ((appointment.price_cents || 0) / 100).toFixed(2),
              "number",
              'required min="0.01" max="10000" step="0.01"',
            ) +
            `<label>Method<select name="method"><option value="cash">Cash</option><option value="card">Card paid elsewhere</option><option value="etransfer">E-transfer</option></select></label>` +
            field(
              "Reference (no card or account numbers)",
              "reference",
              "",
              "text",
              'maxlength="120"',
            ),
        ),
      );
      return;
    }
    if (kind === "lead" && lead) {
      const l = lead;
      show(
        "Appointment enquiry",
        `<h3>${esc(l.name)}</h3>${badge(l.status)}${l.preferredDate ? `<p class="studio-notice">Requested: ${dateLabel(l.preferredDate)} · ${esc(l.preferredTime)} Toronto · two-hour block. Confirm details with the client. Decline the request to reopen the day; archiving does not cancel it.</p>` : ""}<p style="margin-top:12px">${esc(l.notes || "No client note.")}</p><p class="studio-muted">Source: ${esc(l.leadSource || "unknown")} · Prefers a ${l.contactMethod === "call" ? "call" : "text"} back</p><div class="studio-actions">${l.phone ? `<a class="studio-button studio-button--light" href="tel:${esc(l.phone)}">Call</a><a class="studio-button studio-button--light" href="sms:${esc(l.phone)}">Text client</a>` : ""}${button("Create booking", "convert", id)}${button("Add as client", "lead-client", id, true)}</div><form class="studio-form" data-lead="${esc(id)}" style="margin-top:24px"><input type="hidden" name="updatedAt" value="${l.updatedAt}"/><label>Status<select name="status">${["pending", "contacted", "confirmed", "declined", "completed"].map((s) => `<option ${s === l.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>${field("Follow-up date", "followUpDate", l.followUpDate || "", "date", 'min="2000-01-01" max="2099-12-31"')}${area("Private staff note", "adminNote", l.adminNote || "", 500)}<p class="studio-form-error" role="alert"></p><div class="studio-actions"><button class="studio-button" name="action" value="update">Save enquiry</button><button class="studio-button studio-button--light" name="action" value="${l.archivedAt ? "restore" : "archive"}">${l.archivedAt ? "Restore" : "Archive"}</button></div></form>`,
      );
      return;
    }
    if (kind === "lead-client") {
      convertLead = lead;
      await open("client");
      return;
    }
    if (kind === "manual-lead") {
      show(
        "Add an enquiry",
        form(
          "lead.create",
          field("Name", "name", "", "text", 'required maxlength="120"') +
            field("Phone", "phone", "", "tel", 'required maxlength="40"') +
            `<label>Respond by<select name="contactMethod"><option value="text">Text</option><option value="call">Call</option></select></label><label>Source<select name="source"><option>Phone</option><option>Instagram</option><option>Referral</option><option>Other</option></select></label>` +
            area("Enquiry note", "notes") +
            check("Client asked the studio to respond.", "consent"),
        ),
      );
      return;
    }
    if (kind.startsWith("archive-")) {
      const entity = kind.slice(8),
        table =
          entity === "client"
            ? state.clients
            : entity === "service"
              ? state.services
              : entity === "block"
                ? state.blocks
                : state.waitlist;
      const row = table.find((r) => r.id === id);
      if (row)
        show(
          "Archive record",
          form(
            "record.archive",
            `<input type="hidden" name="entity" value="${entity}"/><p>Archive this ${entity}? Existing history is kept. This does not contact the client.</p>`,
            row,
          ),
        );
      return;
    }
    if (kind === "archived-records") {
      if (demo) {
        show(
          "Archived records",
          "<p>Archived production records will appear here, with restore controls.</p>",
        );
        return;
      }
      const archived = await api("/api/admin/studio-archive");
      show(
        "Archived records",
        Object.entries(archived)
          .map(
            ([entity, rows]) =>
              `<h3>${esc(entity)}</h3>${(rows as Row[]).map((r) => form("record.restore", `<input type="hidden" name="entity" value="${esc(entity)}"/><p>${esc(r.name || r.label || r.id)}</p>`, r)).join("") || '<p class="studio-muted">No archived records.</p>'}`,
          )
          .join(""),
      );
      return;
    }
    if (kind === "export") {
      show(
        "Export private studio data",
        `<p>This download contains client information. Store it securely and do not share it publicly.</p><div class="studio-actions"><button class="studio-button" data-download>Download JSON export</button><button class="studio-link" data-close>Cancel</button></div>`,
      );
      return;
    }
  }
  async function demoSave(raw: Record<string, any>) {
    const id =
        raw.id ||
        "demo-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      version = Date.now();
    let collection: Row[] | undefined, row: Row;
    const a = raw.action;
    if (a === "client.save") {
      collection = fixture!.clients;
      row = {
        ...raw,
        id,
        version,
        marketing_consent_at: raw.marketingConsent ? version : null,
        photo_consent_at: raw.photoConsent ? version : null,
      };
    } else if (a === "service.save") {
      collection = fixture!.services;
      row = {
        ...raw,
        id,
        version,
        price_cents: Math.round(Number(raw.price) * 100),
        duration: Number(raw.duration),
        buffer: Number(raw.buffer),
        active: raw.active ? 1 : 0,
      };
    } else if (a === "appointment.save") {
      collection = fixture!.appointments;
      const service = fixture!.services.find((s) => s.id === raw.serviceId)!,
        client = fixture!.clients.find((c) => c.id === raw.clientId)!;
      const { torontoInstant } = await import("../lib/studio-validation");
      const start = torontoInstant(raw.date, raw.time);
      if (
        collection.some(
          (a) =>
            a.id !== id &&
            a.status !== "cancelled" &&
            a.start_at < start + (service.duration + service.buffer) * 60000 &&
            a.end_at + 15 * 60000 > start,
        ) ||
        fixture!.blocks.some(
          (b) =>
            b.start_at < start + (service.duration + service.buffer) * 60000 &&
            b.end_at > start,
        )
      )
        throw Error(
          "This time overlaps an appointment, buffer or blocked time.",
        );
      row = {
        id,
        version,
        client_id: client.id,
        client_name: client.name,
        phone: client.phone,
        service_id: service.id,
        service_name: service.name,
        price_cents: service.price_cents,
        start_at: start,
        end_at: start + service.duration * 60000,
        status: "confirmed",
        notes: raw.notes,
      };
    } else if (a === "appointment.status") {
      row = fixture!.appointments.find((a) => a.id === id)!;
      Object.assign(row, { status: raw.status, version });
      return;
    } else if (a === "block.save") {
      const { torontoInstant } = await import("../lib/studio-validation");
      const start = torontoInstant(raw.date, raw.time);
      collection = fixture!.blocks;
      row = {
        id,
        version,
        start_at: start,
        end_at: start + Number(raw.duration) * 60000,
        label: raw.label,
      };
    } else if (a === "waitlist.save") {
      if (!raw.consent) throw Error("Confirm the client opted in.");
      collection = fixture!.waitlist;
      row = {
        ...raw,
        id,
        version,
        client_id: raw.clientId,
        client_name: fixture!.clients.find((c) => c.id === raw.clientId)?.name,
        consent_at: version,
      };
    } else if (a === "record.archive") {
      const key = (
        {
          client: "clients",
          service: "services",
          block: "blocks",
          waitlist: "waitlist",
        } as const
      )[raw.entity as "client"];
      const arr = fixture![key];
      arr.splice(
        arr.findIndex((r) => r.id === id),
        1,
      );
      return;
    } else if (a === "payment.record") {
      collection = fixture!.payments;
      row = {
        ...raw,
        id,
        version,
        amount_cents: Number(raw.amountCents),
        appointment_id: raw.appointmentId,
      };
    } else if (a === "lead.create") {
      if (!raw.consent) throw Error("Confirm the client asked for a response.");
      leads.unshift({
        ...raw,
        id,
        version,
        updatedAt: version,
        status: "pending",
        createdAt: version,
      });
      leadTotal = leads.length;
      return;
    } else return;
    const index = collection!.findIndex((r) => r.id === id);
    if (index < 0) collection!.push(row!);
    else collection![index] = row!;
    fixture!.clientCount.total = fixture!.clients.length;
  }
  root.addEventListener("click", async (event) => {
    const el = (event.target as Element).closest<HTMLElement>("button,a");
    if (!el) return;
    try {
      if (el.hasAttribute("data-close")) {
        dialog.close();
        return;
      }
      if (el.dataset.page) {
        event.preventDefault();
        dialog.close();
        convertLead = undefined;
        navigate(el.dataset.page);
        return;
      }
      if (el.hasAttribute("data-retry")) {
        await load();
        return;
      }
      if (el.dataset.open) {
        await open(el.dataset.open, el.dataset.id);
        return;
      }
      if (el.dataset.date) {
        date = el.dataset.date;
        await load();
        return;
      }
      if (el.dataset.shift) {
        const d = new Date(date + "T12:00Z");
        d.setUTCDate(d.getUTCDate() + Number(el.dataset.shift));
        date = d.toISOString().slice(0, 10);
        await load();
        return;
      }
      if (el.dataset.leadPage) {
        leadPage += Number(el.dataset.leadPage);
        await load();
        return;
      }
      if (el.dataset.clientPage) {
        clientPage += Number(el.dataset.clientPage);
        await load();
        return;
      }
      if (el.hasAttribute("data-download")) {
        if (demo) {
          toast("Demo preview: production exports require staff sign-in.");
          return;
        }
        const r = await fetch("/api/admin/studio-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!r.ok || r.redirected)
          throw Error("Export could not be created. Sign in again if needed.");
        const blob = await r.blob(),
          url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = `lalaland-studio-${torontoDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        dialog.close();
        toast("Private export downloaded.");
      }
    } catch (e) {
      toast((e as Error).message);
    }
  });
  root.addEventListener("change", async (event) => {
    const el = event.target as HTMLInputElement;
    if (el.id === "calendar-date" && el.value) {
      date = el.value;
      await load();
    }
  });
  root.addEventListener("submit", async (event) => {
    const f = event.target as HTMLFormElement;
    if (!f.matches("form")) return;
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(f)) as Record<string, any>;
    if (f.id === "client-filter") {
      clientQuery = String(raw.q);
      clientPage = 1;
      await load();
      return;
    }
    if (f.id === "lead-filter") {
      leadQuery = String(raw.q);
      leadStatus = String(raw.status);
      leadView = String(raw.view);
      leadPage = 1;
      await load();
      return;
    }
    const err = f.querySelector<HTMLElement>(".studio-form-error")!,
      submit = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const controls = f.querySelectorAll<HTMLButtonElement>(
      "button[type=submit],button:not([type])",
    );
    controls.forEach((b) => (b.disabled = true));
    err.textContent = "";
    try {
      if (f.dataset.lead) {
        raw.action = submit?.value || "update";
        if (demo) {
          const l = leads.find((l) => l.id === f.dataset.lead)!;
          Object.assign(l, raw);
          if (raw.action === "archive") leads = leads.filter((x) => x !== l);
        } else await api(`/api/admin/bookings/${f.dataset.lead}`, raw);
      } else {
        raw.action = f.dataset.command;
        for (const name of [
          "marketingConsent",
          "photoConsent",
          "active",
          "consent",
        ])
          raw[name] = !!f.querySelector<HTMLInputElement>(
            `[name=${name}]:checked`,
          );
        if (raw.action === "payment.record") {
          raw.amountCents = Math.round(Number(raw.amount) * 100);
          delete raw.amount;
        }
        if (demo) await demoSave(raw);
        else await api("/api/admin/studio", raw);
      }
      dialog.close();
      toast(demo ? "Saved in this demo only." : "Saved.");
      await load();
    } catch (e) {
      err.textContent = (e as Error).message;
      err.tabIndex = -1;
      err.focus();
    } finally {
      controls.forEach((b) => (b.disabled = false));
    }
  });
  window.addEventListener("hashchange", () => {
    const next = location.hash.slice(1);
    if (pages.some((p) => p[0] === next)) {
      page = next;
      render();
    }
  });
  await load();
}
