const { recordClick, updateVisit } = require('./lib/db');
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, visitorId } = req.body || {};
  if (!page || !visitorId) {
    return res.status(400).json({ error: 'page and visitorId required' });
  }

  try {
    const click = {
      id: crypto.randomUUID(),
      page,
      visitorId,
      createdAt: new Date().toISOString(),
    };

    recordClick(click);
    updateVisit(visitorId, page, { clicked: true });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Click error:', e);
    return res.status(500).json({ error: e.message });
  }
}
