import type { ApiResponse } from "@/types/api";

/** Field-level detail attached to a 400 validation error from the backend. */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Thrown for any non-2xx response or network/parse failure. Callers
 * catch this in one place (e.g. the form's submit handler) instead of
 * scattering try/catch per call site.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: ApiFieldError[];

  constructor(status: number, code: string, message: string, fields: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper around the Go/Gin backend's NEO-style envelope
 * (`{ status, data, message }` / `{ status, data: null, message, error_code }`).
 * Every API call in the app should go through this function.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
  }

  let payload: (ApiResponse<T> & { fields?: ApiFieldError[] }) | null = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body; fall through to status-based error below.
  }

  if (!response.ok || !payload || payload.status !== "success") {
    const message = payload?.message ?? `เกิดข้อผิดพลาด (HTTP ${response.status})`;
    const code = payload && "error_code" in payload ? payload.error_code : "UNKNOWN_ERROR";
    const fields = payload?.fields ?? [];
    throw new ApiError(response.status, code, message, fields);
  }

  return payload.data;
}
