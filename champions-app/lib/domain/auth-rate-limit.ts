export type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitStore = Map<string, RateLimitBucket>;

export function consumeRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): boolean {
  if (limit <= 0 || windowMs <= 0) {
    return true;
  }

  let bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
