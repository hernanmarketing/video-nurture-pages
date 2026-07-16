import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, visitorId, referrer, userAgent, timestamp, screenWidth, screenHeight, heartbeatSeconds } = req.body || {};
  if (!page || !visitorId) {
    return res.status(400).json({ error: 'page and visitorId required' });
  }

  try {
    const country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '';
    const ua = userAgent || req.headers['user-agent'] || '';
    const ref = referrer || req.headers['referer'] || '';

    // Check if this visitor already has a visit for this page
    const existing = await sql`
      SELECT id FROM visits WHERE visitor_id = ${visitorId} AND page = ${page} LIMIT 1
    `;

    if (existing && existing.length > 0) {
      // Update time on page for heartbeat
      if (heartbeatSeconds) {
        await sql`
          UPDATE visits SET time_on_page_seconds = GREATEST(time_on_page_seconds, ${heartbeatSeconds})
          WHERE id = ${existing[0].id}
        `;
      }
      return res.status(200).json({ ok: true, updated: true });
    }

    await sql`
      INSERT INTO visits (page, visitor_id, referrer, user_agent, country, screen_width, screen_height)
      VALUES (${page}, ${visitorId}, ${ref ? ref.substring(0, 500) : ''}, ${ua ? ua.substring(0, 500) : ''}, ${country}, ${screenWidth || 0}, ${screenHeight || 0})
    `;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Track error:', e);
    return res.status(500).json({ error: e.message });
  }
}
