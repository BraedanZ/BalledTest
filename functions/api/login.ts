import { verifyPassword, generateToken } from '../../lib/auth';

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

  // 2. Fetch user
  const user = await context.env.DB.prepare(
    'SELECT id, password_hash FROM players WHERE username = ?'
  ).bind(username).first();
  
  if (!user) return new Response('Invalid credentials', { status: 401 });
  
  // 3. Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return new Response('Invalid credentials', { status: 401 });

  // 4. Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await context.env.DB.prepare(
    'INSERT INTO sessions (token, player_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, user.id, expiresAt).run();

  // 5. Set httpOnly cookie
  return Response.json({ ok: true }, {
    headers: {
      'Set-Cookie': `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    },
  });
};
