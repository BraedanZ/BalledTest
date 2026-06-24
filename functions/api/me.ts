import { getSessionToken } from '../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = getSessionToken(context.request);
  if (!token) return new Response('Unauthorized', { status: 401 });
  
  const session = await context.env.DB.prepare(
    `SELECT s.player_id, p.username 
     FROM sessions s 
     JOIN players p ON s.player_id = p.id 
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).first<{ player_id: number; username: string }>();
  
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  return Response.json({ id: session.player_id, username: session.username });
};
