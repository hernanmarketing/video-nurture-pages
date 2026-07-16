const { getRecentVisits } = require('../lib/db');

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
    const visits = getRecentVisits(page, limit, offset, { filter_bots, since });

    return res.status(200).json({ visits });
  } catch (e) {
    console.error('Recent stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}
