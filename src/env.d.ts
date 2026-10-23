/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BOOKING_EMAIL?: SendEmail;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    CHAT_RATE_SALT?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    CRM_ADMIN_EMAILS?: string;
  }
}

interface Window {
  plausible?: ((eventName: string) => void) & { q?: unknown[] };
}
