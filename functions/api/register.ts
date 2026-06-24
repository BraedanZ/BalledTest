import { hashPassword } from '../../lib/auth'; // You'll need a bcrypt wasm implementation

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { username, password, turnstile } = await context.request.json();
  
  // 1. Verify Turnstile
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

  // 2. Hash password (use bcrypt-wasm or similar in Workers)
  const passwordHash = await hashPassword(password);
  
  // 3. Insert player
  try {
    await context.env.DB.prepare(
      'INSERT INTO players (username, password_hash) VALUES (?, ?)'
    ).bind(username, passwordHash).run();
  } catch (e) {
    return new Response('Username taken', { status: 409 });
  }

  return Response.json({ ok: true });
};
