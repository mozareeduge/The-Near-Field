// Sliding-window rate limiting, backed by a Durable Object so the limit is
// real across a Worker's stateless, per-request invocations (an
// in-process counter would reset on every cold start and provide no real
// protection -- see KNOWN_LIMITS.md before this file existed).
//
// The window-eviction math is a pure function so it can be unit tested
// directly (tests/rate-limit.test.mjs) without a live Durable Objects
// runtime. The Durable Object class itself is a thin wrapper: load the
// stored timestamp list, run the pure check, persist the result.

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  timestamps: number[];
}

// Drops timestamps outside the window, decides whether one more request
// fits, and returns the timestamp list callers should persist. Kept free
// of any Durable Object / Workers runtime API so it is trivially testable.
export function evaluateRateLimit(
  timestamps: number[],
  now: number,
  windowMs: number,
  max: number
): RateLimitDecision {
  const windowStart = now - windowMs;
  const withinWindow = timestamps.filter(t => t > windowStart);
  if (withinWindow.length >= max) {
    const oldest = withinWindow[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds, timestamps: withinWindow };
  }
  withinWindow.push(now);
  return { allowed: true, remaining: max - withinWindow.length, retryAfterSeconds: 0, timestamps: withinWindow };
}

export const DEFAULT_RATE_LIMIT_MAX = 60;
export const DEFAULT_RATE_LIMIT_WINDOW_S = 300;

interface DurableObjectStateLike {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
  };
}

// One Durable Object instance per rate-limit key (see keyFor() in
// index.ts) -- Cloudflare routes every request for the same key to the
// same instance, which is what makes the count real instead of
// per-isolate-and-therefore-meaningless.
export class RateLimiter {
  private readonly state: DurableObjectStateLike;

  constructor(state: DurableObjectStateLike) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const max = Number(url.searchParams.get('max')) || DEFAULT_RATE_LIMIT_MAX;
    const windowMs = (Number(url.searchParams.get('windowS')) || DEFAULT_RATE_LIMIT_WINDOW_S) * 1000;
    const stored = (await this.state.storage.get<number[]>('timestamps')) || [];
    const decision = evaluateRateLimit(stored, Date.now(), windowMs, max);
    await this.state.storage.put('timestamps', decision.timestamps);
    return new Response(JSON.stringify(decision), { headers: { 'content-type': 'application/json' } });
  }
}
