import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Password protection
  const { password, page, filter_bots, since, limit: queryLimit, offset: queryOffset } = req.query;
  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const limit = Math.min(parseInt(queryLimit) || 100, 1000);
  const offset = parseInt(queryOffset) || 0;

  try {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (page) {
      conditions.push(`v.page = $${idx++}`);
      values.push(page);
    }
    if (since) {
      conditions.push(`v.created_at >= $${idx++}`);
      values.push(since);
    }
    if (filter_bots === '1' || filter_bots === 'true') {
      conditions.push(`(v.user_agent NOT ILIKE '%bot%' AND v.user_agent NOT ILIKE '%crawler%' AND v.user_agent NOT ILIKE '%spider%' AND v.user_agent NOT ILIKE '%headless%' AND v.user_agent NOT ILIKE '%python-requests%' AND v.user_agent NOT ILIKE '%curl%')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const nextParam = values.length + 1;

    const result = await sql(
      `SELECT v.id, v.page, v.visitor_id, v.referrer, v.user_agent, v.country, v.screen_width, v.screen_height, v.time_on_page_seconds, v.clicked, v.created_at
       FROM visits v ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${nextParam} OFFSET $${nextParam + 1}`,
      ...values,
      limit,
      offset
    );

    return res.status(200).json({
      visits: result.map(r => ({
        id: r.id,
        page: r.page,
        visitorId: r.visitor_id,
        referrer: r.referrer,
        userAgent: r.user_agent,
        country: r.country,
        screenWidth: r.screen_width,
        screenHeight: r.screen_height,
        timeOnPageSeconds: r.time_on_page_seconds,
        clicked: r.clicked,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    console.error('Recent stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}
