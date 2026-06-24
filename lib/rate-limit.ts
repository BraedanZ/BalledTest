interface Env {
  RATE_LIMIT: KVNamespace; // Optional - add KV binding if you want rate limiting
}

export async function checkRateLimit(
  env: { RATE_LIMIT?: KVNamespace },
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number }> {
  if (!env.RATE_LIMIT) return { allowed: true, remaining: maxAttempts };
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  // Get existing attempts
  const data = await env.RATE_LIMIT.get(`ratelimit:${key}`);
  let attempts: number[] = data ? JSON.parse(data) : [];
  
  // Filter to current window
  attempts = attempts.filter(t => t > windowStart);
  
  if (attempts.length >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  // Record attempt
  attempts.push(now);
  await env.RATE_LIMIT.put(`ratelimit:${key}`, JSON.stringify(attempts), {
    expirationTtl: windowSeconds,
  });
  
  return { allowed: true, remaining: maxAttempts - attempts.length };
}
interface Env {
  RATE_LIMIT: KVNamespace; // Optional - add KV binding if you want rate limiting
}

export async function checkRateLimit(
  env: { RATE_LIMIT?: KVNamespace },
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number }> {
  if (!env.RATE_LIMIT) return { allowed: true, remaining: maxAttempts };
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  // Get existing attempts
  const data = await env.RATE_LIMIT.get(`ratelimit:${key}`);
  let attempts: number[] = data ? JSON.parse(data) : [];
  
  // Filter to current window
  attempts = attempts.filter(t => t > windowStart);
  
  if (attempts.length >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  // Record attempt
  attempts.push(now);
  await env.RATE_LIMIT.put(`ratelimit:${key}`, JSON.stringify(attempts), {
    expirationTtl: windowSeconds,
  });
  
  return { allowed: true, remaining: maxAttempts - attempts.length };
}
