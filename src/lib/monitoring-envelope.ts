/**
 * Partie PURE de la remontee d erreurs (lib/monitoring.ts) : lecture du DSN
 * et construction de l enveloppe Sentry. Testee par monitoring-envelope.test.ts.
 */
export type ErrorContext = { url?: string; method?: string; route?: string; source?: string };

export function parseDsn(dsn: string): { endpoint: string; key: string } | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    if (!u.username || !projectId) return null;
    return { endpoint: `${u.protocol}//${u.host}/api/${projectId}/envelope/`, key: u.username };
  } catch {
    return null;
  }
}

export function frames(stack: string | undefined) {
  if (!stack) return undefined;
  const parsed = stack
    .split("\n")
    .slice(1)
    .map((line) => line.match(/at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ function: m[1] ?? "?", filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) }))
    .reverse();
  return parsed.length ? { frames: parsed } : undefined;
}

export function buildEnvelope(
  error: unknown,
  context: ErrorContext,
  meta: { eventId: string; timestamp: string; environment: string; release?: string },
): string {
  const err = error instanceof Error ? error : new Error(String(error));
  const event = {
    event_id: meta.eventId,
    timestamp: meta.timestamp,
    platform: "node",
    level: "error",
    environment: meta.environment,
    release: meta.release,
    tags: { route: context.route ?? "", source: context.source ?? "server" },
    request: context.url ? { url: context.url, method: context.method } : undefined,
    exception: { values: [{ type: err.name, value: err.message.slice(0, 2000), stacktrace: frames(err.stack) }] },
  };
  return [JSON.stringify({ event_id: meta.eventId, sent_at: meta.timestamp }), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
}
