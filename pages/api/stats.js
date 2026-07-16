const { getStats } = require('./lib/db');

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
    const stats = getStats({ page, filter_bots, since, limit, offset });

    const totalViews = stats.totalViews;
    const uniqueVisitors = stats.uniqueVisitors;
    const totalClicks = stats.totalClicks;
    const avgTime = stats.avgTime;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    return res.status(200).json({
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      total_clicks: totalClicks,
      click_through_rate: ctr,
      avg_time_on_page_seconds: Math.round(avgTime),
      views_per_page: stats.viewsPerPage,
      top_referrers: stats.topReferrers,
    });
  } catch (e) {
    console.error('Stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}
