import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, visitorId } = req.body || {};
  if (!page || !visitorId) {
    return res.status(400).json({ error: 'page and visitorId required' });
  }

  try {
    await sql`
      INSERT INTO clicks (page, visitor_id) VALUES (${page}, ${visitorId})
    `;
    await sql`
      UPDATE visits SET clicked = TRUE WHERE visitor_id = ${visitorId} AND page = ${page}
    `;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Click error:', e);
    return res.status(500).json({ error: e.message });
  }
}
