/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    CHAT_RATE_SALT?: string;
  }
}

interface Window {
  plausible?: ((eventName: string) => void) & { q?: unknown[] };
}
