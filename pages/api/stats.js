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
    // Build WHERE clause dynamically
    const conditions = [];
    const values = [];
    let idx = 1;

    if (page) {
      conditions.push(`page = $${idx++}`);
      values.push(page);
    }
    if (since) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(since);
    }
    if (filter_bots === '1' || filter_bots === 'true') {
      conditions.push(`(user_agent NOT ILIKE '%bot%' AND user_agent NOT ILIKE '%crawler%' AND user_agent NOT ILIKE '%spider%' AND user_agent NOT ILIKE '%headless%' AND user_agent NOT ILIKE '%python-requests%' AND user_agent NOT ILIKE '%curl%')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const nextParam = values.length + 1;

    // Total views
    const totalViewsResult = await sql(
      `SELECT COUNT(*) AS count FROM visits ${whereClause}`,
      ...values
    );

    // Unique visitors
    const uniqueVisitorsResult = await sql(
      `SELECT COUNT(DISTINCT visitor_id) AS count FROM visits ${whereClause}`,
      ...values
    );

    // Total clicks
    const totalClicksResult = await sql(
      `SELECT COUNT(*) AS count FROM clicks ${whereClause.replace(/created_at/g, 'c.created_at')}`,
      ...values
    );

    // Views per page
    const viewsPerPageResult = await sql(
      `SELECT page, COUNT(*) AS views FROM visits ${whereClause} GROUP BY page ORDER BY views DESC LIMIT $${nextParam} OFFSET $${nextParam + 1}`,
      ...values,
      limit,
      offset
    );

    // Top referrers
    const topReferrersResult = await sql(
      `SELECT COALESCE(NULLIF(referrer, ''), '(direct)') AS referrer, COUNT(*) AS count FROM visits ${whereClause} GROUP BY referrer ORDER BY count DESC LIMIT 20`,
      ...values
    );

    // Average time on page
    const avgTimeResult = await sql(
      `SELECT COALESCE(AVG(time_on_page_seconds), 0) AS avg_time FROM visits ${whereClause}`,
      ...values
    );

    const totalViews = parseInt(totalViewsResult[0]?.count || '0');
    const uniqueVisitors = parseInt(uniqueVisitorsResult[0]?.count || '0');
    const totalClicks = parseInt(totalClicksResult[0]?.count || '0');
    const avgTime = parseFloat(avgTimeResult[0]?.avg_time || '0');
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    return res.status(200).json({
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      total_clicks: totalClicks,
      click_through_rate: ctr,
      avg_time_on_page_seconds: Math.round(avgTime),
      views_per_page: viewsPerPageResult.map(r => ({ page: r.page, views: parseInt(r.views) })),
      top_referrers: topReferrersResult.map(r => ({ referrer: r.referrer, count: parseInt(r.count) })),
    });
  } catch (e) {
    console.error('Stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}
