import test from "node:test";
import assert from "node:assert/strict";
import {
  torontoInstant,
  parseStudioCommand,
  phoneKey,
} from "../src/lib/studio-validation.ts";
test("Toronto booking times reject gaps and ambiguous autumn times", () => {
  assert.equal(
    torontoInstant("2026-10-23", "09:00"),
    Date.parse("2026-10-23T13:00:00Z"),
  );
  assert.throws(() => torontoInstant("2026-03-08", "02:30"));
  assert.throws(() => torontoInstant("2026-11-01", "01:30"));
  assert.throws(() => torontoInstant("2026-02-30", "10:00"));
});
test("phone identity matches Canadian variants and rejects malformed input", () => {
  assert.equal(phoneKey("(416) 555-0123"), phoneKey("+1 416 555 0123"));
  assert.throws(() => phoneKey("123"));
});
test("services cannot activate without confirmed prices and durations", () => {
  assert.throws(() =>
    parseStudioCommand({
      action: "service.save",
      name: "Structured gel",
      active: true,
    }),
  );
  const command = parseStudioCommand({
    action: "service.save",
    name: "Structured gel",
    active: true,
    price: "65.50",
    duration: "90",
    buffer: "15",
    category: "Manicure",
  });
  assert.equal(command.priceCents, 6550);
  assert.equal(command.duration, 90);
});
test("consent is explicit, versions required for edits and text bounded", () => {
  assert.throws(() =>
    parseStudioCommand({
      action: "client.save",
      name: "A",
      phone: "4165550123",
      id: "abc",
    }),
  );
  assert.throws(() =>
    parseStudioCommand({
      action: "client.save",
      name: "x".repeat(121),
      phone: "4165550123",
    }),
  );
  const c = parseStudioCommand({
    action: "client.save",
    name: "Test client",
    phone: "4165550123",
    marketingConsent: "false",
  });
  assert.equal(c.marketingConsent, false);
  assert.throws(() =>
    parseStudioCommand({ action: "notification.send", clientId: "abc" }),
  );
});
