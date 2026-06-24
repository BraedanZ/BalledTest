export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return new Response('Unauthorized', { status: 401 });
  
  const token = match[1];
  
  const session = await context.env.DB.prepare(
    `SELECT s.player_id, p.username 
     FROM sessions s 
     JOIN players p ON s.player_id = p.id 
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).first();
  
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  return Response.json({ id: session.player_id, username: session.username });
};
