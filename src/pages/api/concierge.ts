import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ensureDatabase, getD1 } from '../../lib/db';

const MAX_MESSAGES_PER_HOUR = 12;

export const POST: APIRoute = async ({ request }) => {
  if (!env.OPENAI_API_KEY || !env.CHAT_RATE_SALT) {
    return json({ ok: false, message: 'The concierge is temporarily unavailable.' }, 503);
  }

  let message = '';
  try {
    const body = await request.json() as { message?: unknown };
    message = String(body.message ?? '').trim().slice(0, 500);
  } catch {
    return json({ ok: false, message: 'Please enter a question.' }, 400);
  }

  if (message.length < 2) return json({ ok: false, message: 'Please enter a question.' }, 400);

  try {
    await enforceRateLimit(request);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-5.6-luna',
        store: false,
        max_output_tokens: 220,
        reasoning: { effort: 'none' },
        instructions: `You are the concise website concierge for La La Land Nail Hub.
Use only these approved facts: the business specializes in European manicures; Bianca Ashley is the owner and gel manicurist; appointments are by request; requests are not confirmed until La La Land follows up.
Never invent price, duration, location, hours, availability, credentials, policies, health benefits, technique details, or results. Never provide medical advice. If asked about nail or skin symptoms, recommend contacting a qualified healthcare professional. If information is unavailable, say so plainly and invite the visitor to submit an appointment request. Keep answers under 90 words.`,
        input: message,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI response ${response.status}`);
    const data = await response.json() as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const answer = data.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === 'output_text')?.text?.trim();

    if (!answer) throw new Error('OpenAI response missing output text');
    return json({ ok: true, answer }, 200);
  } catch (error) {
    if (error instanceof RateLimitError) return json({ ok: false, message: error.message }, 429);
    console.error('concierge_request_failed', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, message: 'The concierge could not answer right now. Please try again shortly.' }, 502);
  }
};

async function enforceRateLimit(request: Request): Promise<void> {
  await ensureDatabase();
  const now = Date.now();
  const windowStart = Math.floor(now / 3_600_000) * 3_600_000;
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'anonymous';
  const key = await sha256(`${env.CHAT_RATE_SALT}:${ip}:${windowStart}`);
  const d1 = getD1();

  await d1.batch([
    d1.prepare('DELETE FROM chat_rate_limits WHERE expires_at < ?').bind(now),
    d1.prepare(`INSERT INTO chat_rate_limits (key, count, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET count = count + 1`).bind(key, windowStart + 3_600_000),
  ]);

  const row = await d1.prepare('SELECT count FROM chat_rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
  if ((row?.count ?? 0) > MAX_MESSAGES_PER_HOUR) {
    throw new RateLimitError('You have reached the hourly concierge limit. Please try again later.');
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

class RateLimitError extends Error {}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
