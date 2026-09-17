/**
 * §12 - Limitation de debit sur authentification et API.
 *
 * Deux pilotes derriere une seule fonction :
 *  - `upstash` : des que UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN sont
 *    definis. Le compteur est partage entre toutes les instances - condition
 *    indispensable sur Vercel, ou chaque requete peut tomber sur une instance
 *    differente et ou un compteur en memoire ne limite donc presque rien.
 *  - `memory` : repli local. Suffisant en developpement et en mono-instance.
 *
 * Appel REST direct plutot qu un SDK : deux commandes Redis ne justifient pas
 * une dependance de plus.
 *
 * Si Upstash ne repond pas, on retombe sur la memoire au lieu de refuser : une
 * panne du limiteur ne doit pas empecher un invite de repondre a son RSVP.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

function toResult(count: number, limit: number, resetAt: number): RateLimitResult {
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export function rateLimitDriver(): "upstash" | "memory" {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? "upstash"
    : "memory";
}

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return toResult(1, limit, fresh.resetAt);
  }

  bucket.count += 1;
  return toResult(bucket.count, limit, bucket.resetAt);
}

/**
 * Fenetre fixe : INCR puis PEXPIRE NX. Le NX ne pose l expiration qu a la
 * premiere requete de la fenetre - sans lui, un client insistant repousserait
 * indefiniment sa propre remise a zero.
 */
async function upstashLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(windowMs), "NX"],
      ["PTTL", redisKey],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) throw new Error(`Upstash ${response.status}`);

  const [incr, , pttl] = (await response.json()) as { result?: number; error?: string }[];
  if (typeof incr?.result !== "number") throw new Error(incr?.error ?? "Upstash: reponse invalide");

  const ttl = typeof pttl?.result === "number" && pttl.result > 0 ? pttl.result : windowMs;
  return toResult(incr.result, limit, Date.now() + ttl);
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (rateLimitDriver() === "upstash") {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch (error) {
      console.error("[rate-limit] Upstash indisponible, repli memoire :", error);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
