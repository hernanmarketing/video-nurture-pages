const { recordVisit, updateVisit, findExistingVisit } = require('./lib/db');
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, visitorId, referrer, userAgent, screenWidth, screenHeight, heartbeatSeconds } = req.body || {};
  if (!page || !visitorId) {
    return res.status(400).json({ error: 'page and visitorId required' });
  }

  try {
    const country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '';
    const ua = userAgent || req.headers['user-agent'] || '';
    const ref = referrer || req.headers['referer'] || '';

    // Check if this visitor already has a visit for this page
    const existing = findExistingVisit(visitorId, page);

    if (existing) {
      // Update time on page for heartbeat
      if (heartbeatSeconds) {
        const newTime = Math.max(existing.timeOnPageSeconds || 0, heartbeatSeconds);
        updateVisit(visitorId, page, { timeOnPageSeconds: newTime });
      }
      return res.status(200).json({ ok: true, updated: true });
    }

    const visit = {
      id: crypto.randomUUID(),
      page,
      visitorId,
      referrer: ref ? ref.substring(0, 500) : '',
      userAgent: ua ? ua.substring(0, 500) : '',
      country,
      screenWidth: screenWidth || 0,
      screenHeight: screenHeight || 0,
      timeOnPageSeconds: heartbeatSeconds || 0,
      clicked: false,
      createdAt: new Date().toISOString(),
    };

    recordVisit(visit);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Track error:', e);
    return res.status(500).json({ error: e.message });
  }
}
