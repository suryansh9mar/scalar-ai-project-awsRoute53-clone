import { clearSession, getToken } from "./session";
import type {
  CreateRecordInput,
  CreateZoneInput,
  DnsRecord,
  ListParams,
  LoginResponse,
  Paginated,
  UpdateRecordInput,
  User,
  Zone,
} from "./types";

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
}

function buildQuery(query?: Record<string, string | number | undefined>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the API. Make sure the backend is running on port 8000."
    );
  }

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const detail = obj.detail ?? obj.message;
      if (typeof detail === "string" && detail) {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // FastAPI validation errors come back as a list of {msg, loc}.
        const first = detail[0] as { msg?: string };
        if (first?.msg) message = first.msg;
      }
    }
    throw new ApiError(res.status, message);
  }

  return data as T;
}

// Auth
export function login(email: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export function getMe() {
  return request<User>("/api/auth/me");
}

// Hosted zones
export function listZones(params: ListParams = {}) {
  return request<Paginated<Zone>>("/api/hosted-zones", { query: { ...params } });
}

export function createZone(input: CreateZoneInput) {
  return request<Zone>("/api/hosted-zones", { method: "POST", body: input });
}

export function getZone(id: string) {
  return request<Zone>(`/api/hosted-zones/${id}`);
}

export function updateZone(id: string, comment: string) {
  return request<Zone>(`/api/hosted-zones/${id}`, {
    method: "PATCH",
    body: { comment },
  });
}

export function deleteZone(id: string) {
  return request<void>(`/api/hosted-zones/${id}`, { method: "DELETE" });
}

// Records
export function listRecords(zoneId: string, params: ListParams = {}) {
  return request<Paginated<DnsRecord>>(
    `/api/hosted-zones/${zoneId}/records`,
    { query: { ...params } }
  );
}

export function createRecord(zoneId: string, input: CreateRecordInput) {
  return request<DnsRecord>(`/api/hosted-zones/${zoneId}/records`, {
    method: "POST",
    body: input,
  });
}

export function getRecord(zoneId: string, recordId: string) {
  return request<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`);
}

export function updateRecord(
  zoneId: string,
  recordId: string,
  input: UpdateRecordInput
) {
  return request<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteRecord(zoneId: string, recordId: string) {
  return request<void>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: "DELETE",
  });
}

export async function importZoneFile(zoneId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/hosted-zones/${zoneId}/import`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let msg = "Import failed";
    try {
      const data = await res.json();
      msg = data.detail || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

export async function exportZoneFile(zoneId: string, format: "json" | "bind", zoneName: string) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/hosted-zones/${zoneId}/export?format=${format}`, {
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Export failed");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${zoneName}.${format === "json" ? "json" : "txt"}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

