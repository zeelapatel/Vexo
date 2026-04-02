export const runtime = 'edge';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// Simple in-memory rate limiter — resets on edge cold start (acceptable)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const ALLOWED_ORIGINS = ['https://vexo.dev', 'https://www.vexo.dev', 'http://localhost:3000', 'http://localhost:3001'];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]) as string;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending more messages.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI Interviewer is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { system, messages } = body as { system?: string; messages?: unknown[] };
  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing system or messages.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Forward to Anthropic with streaming
  const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages,
      stream: true,
    }),
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    const status = anthropicResponse.status === 429 ? 429 : 502;
    return new Response(JSON.stringify({ error: 'AI service error.', detail: errText.slice(0, 200) }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Stream the SSE response back to the client
  return new Response(anthropicResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...corsHeaders,
    },
  });
}
