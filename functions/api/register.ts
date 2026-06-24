import { hashPassword } from '../../lib/auth';

interface Env {
  DB: D1Database;
  TURNSTILE_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { username, password, turnstile } = await context.request.json();
  
  // Verify Turnstile
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: context.env.TURNSTILE_SECRET,
      response: turnstile,
      remoteip: context.request.headers.get('CF-Connecting-IP'),
    }),
  });
  const { success } = await verify.json();
  if (!success) return new Response('Bot check failed', { status: 403 });

  // Validate input
  if (!username || typeof username !== 'string' || username.length < 3 || username.length > 32) {
    return new Response('Invalid username', { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return new Response('Password must be at least 8 characters', { status: 400 });
  }

  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Insert player
  try {
    await context.env.DB.prepare(
      'INSERT INTO players (username, password_hash) VALUES (?, ?)'
    ).bind(username, passwordHash).run();
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return new Response('Username taken', { status: 409 });
    }
    throw e;
  }

  return Response.json({ ok: true });
};
