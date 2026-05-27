import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const TOKEN_COOKIE = "jcb_auth_token";

/** Strip accidental `Bearer ` prefixes if the token was pasted manually. */
export function normalizeBearerToken(raw: string): string {
  let t = raw.trim();
  while (/^bearer\s+/i.test(t)) {
    t = t.replace(/^bearer\s+/i, "").trim();
  }
  return t;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const escaped = TOKEN_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match) return null;
  try {
    return normalizeBearerToken(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const sameSite = "; SameSite=Lax";
  const path = "; Path=/";
  if (token) {
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}${path}${sameSite}${secure}; Max-Age=${60 * 60 * 24 * 7}`;
  } else {
    document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3003";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  config.headers = config.headers ?? {};
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundaries for file uploads
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)["Content-Type"];
  }
  return config;
});

// Backend wraps every response in { success, data, timeStamp }.
// We unwrap to `data` so callers get the payload directly.
api.interceptors.response.use(
  (res: AxiosResponse) => {
    if (
      res.data &&
      typeof res.data === "object" &&
      "data" in res.data &&
      "success" in res.data
    ) {
      res.data = (res.data as { data: unknown }).data;
    }
    return res;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      if (typeof window !== "undefined") {
        const onAuthPage =
          window.location.pathname === "/login" ||
          window.location.pathname === "/register";
        if (!onAuthPage) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export type ApiErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  data?: unknown;
};

export interface OffsetMeta {
  offset: number;
  limit: number;
  total: number;
  totalPages: number;
  page: number;
}

export interface OffsetPaginatedResponse<T> {
  data: T[];
  meta: OffsetMeta;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | (ApiErrorBody & { error?: { message?: string | string[] } })
      | undefined;

    const nestedMessage = body?.error?.message;
    if (nestedMessage) {
      return Array.isArray(nestedMessage)
        ? nestedMessage.join(", ")
        : nestedMessage;
    }

    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(", ") : body.message;
    }

    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
