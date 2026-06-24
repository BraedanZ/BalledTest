import { getSessionToken, clearSessionCookie } from '../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = getSessionToken(context.request);
  
  if (token) {
    await context.env.DB.prepare(
      'DELETE FROM sessions WHERE token = ?'
    ).bind(token).run();
  }
  
  const response = Response.json({ ok: true });
  return clearSessionCookie(response);
};
