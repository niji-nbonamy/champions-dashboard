import { headers } from "next/headers";

import {
  consumeRateLimit,
  type RateLimitStore,
} from "@/lib/domain/auth-rate-limit";

export type AuthRateLimitKind = "login" | "register";

const globalStore: RateLimitStore = new Map();

const AUTH_RATE_LIMITS: Record<
  AuthRateLimitKind,
  { max: number; windowMs: number }
> = {
  login: {
    max: Number(process.env.AUTH_RATE_LIMIT_LOGIN_MAX ?? 10),
    windowMs: Number(process.env.AUTH_RATE_LIMIT_LOGIN_WINDOW_MS ?? 900_000),
  },
  register: {
    max: Number(process.env.AUTH_RATE_LIMIT_REGISTER_MAX ?? 5),
    windowMs: Number(process.env.AUTH_RATE_LIMIT_REGISTER_WINDOW_MS ?? 900_000),
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
