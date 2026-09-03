import { headers } from "next/headers";

import {
  consumeRateLimit,
  type RateLimitStore,
} from "@/lib/domain/auth-rate-limit";

export type AuthRateLimitKind = "login" | "register" | "password-reset";

const globalStore: RateLimitStore = new Map();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parsePositiveIntMs(value: string | undefined, fallback: number): number {
  return parsePositiveInt(value, fallback);
}

const AUTH_RATE_LIMITS: Record<
  AuthRateLimitKind,
  { max: number; windowMs: number }
> = {
  login: {
    max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_LOGIN_MAX, 10),
    windowMs: parsePositiveIntMs(
      process.env.AUTH_RATE_LIMIT_LOGIN_WINDOW_MS,
      900_000
    ),
  },
  register: {
    max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_REGISTER_MAX, 5),
    windowMs: parsePositiveIntMs(
      process.env.AUTH_RATE_LIMIT_REGISTER_WINDOW_MS,
      900_000
    ),
  },
  "password-reset": {
    max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_PASSWORD_RESET_MAX, 3),
    windowMs: parsePositiveIntMs(
      process.env.AUTH_RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
      900_000
    ),
  },
};

export async function isAuthRateLimitAllowed(
  kind: AuthRateLimitKind,
  store: RateLimitStore = globalStore
): Promise<boolean> {
  const clientKey = await getClientRateLimitKey();
  const { max, windowMs } = AUTH_RATE_LIMITS[kind];

  return consumeRateLimit(store, `${kind}:${clientKey}`, max, windowMs);
}

async function getClientRateLimitKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");

  if (forwarded) {
    const firstHop = forwarded.split(",")[0]?.trim();
    if (firstHop) {
      return firstHop;
    }
  }

  return headerList.get("x-real-ip")?.trim() || "unknown";
}
