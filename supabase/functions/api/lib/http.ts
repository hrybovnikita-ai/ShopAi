/** JSON responses and the API's single error type. */
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = "request_failed", details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJson<T>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON", "invalid_json");
  }
}

/** Never echo a token/password back in an error payload. */
export function publicError(error: unknown) {
  if (error instanceof HttpError) {
    return { status: error.status, body: { error: error.message, code: error.code, details: error.details ?? null } };
  }
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return { status: 500, body: { error: message, code: "internal_error", details: null } };
}
