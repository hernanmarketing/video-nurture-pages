const fs = require('fs');
const path = require('path');

const DATA_DIR = '/tmp/vnp';
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON(filepath) {
  ensureDir();
  try {
    if (!fs.existsSync(filepath)) return [];
    const raw = fs.readFileSync(filepath, 'utf-8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON(filepath, data) {
  ensureDir();
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

function recordVisit(visit) {
  const visits = readJSON(VISITS_FILE);
  visits.push(visit);
  writeJSON(VISITS_FILE, visits);
}

function recordClick(click) {
  const clicks = readJSON(CLICKS_FILE);
  clicks.push(click);
  writeJSON(CLICKS_FILE, clicks);
}

function updateVisit(visitorId, page, updates) {
  const visits = readJSON(VISITS_FILE);
  const idx = visits.findIndex(v => v.visitorId === visitorId && v.page === page);
  if (idx === -1) return false;
  visits[idx] = { ...visits[idx], ...updates };
  writeJSON(VISITS_FILE, visits);
  return true;
}

function findExistingVisit(visitorId, page) {
  const visits = readJSON(VISITS_FILE);
  return visits.find(v => v.visitorId === visitorId && v.page === page) || null;
}

function getStats(filters = {}) {
  let visits = readJSON(VISITS_FILE);
  const clicks = readJSON(CLICKS_FILE);

  // Apply page filter
  if (filters.page) {
    visits = visits.filter(v => v.page === filters.page);
  }

  // Apply bot filter
  if (filters.filter_bots === '1' || filters.filter_bots === 'true') {
    const botRe = /bot|crawler|spider|headless|python-requests|curl/i;
    visits = visits.filter(v => !botRe.test(v.userAgent || ''));
  }

  // Apply since filter
  if (filters.since) {
    const sinceDate = new Date(filters.since).getTime();
    visits = visits.filter(v => {
      const visitDate = new Date(v.createdAt).getTime();
      return visitDate >= sinceDate;
    });
  }

  // Filter clicks by same criteria as visits
  let filteredClicks = clicks;
  if (filters.page) {
    filteredClicks = filteredClicks.filter(c => c.page === filters.page);
  }
  if (filters.since) {
    const sinceDate = new Date(filters.since).getTime();
    filteredClicks = filteredClicks.filter(c => {
      const clickDate = new Date(c.createdAt).getTime();
      return clickDate >= sinceDate;
    });
  }

  const totalViews = visits.length;
  const uniqueVisitorIds = new Set(visits.map(v => v.visitorId));
  const uniqueVisitors = uniqueVisitorIds.size;
  const totalClicks = filteredClicks.length;

  // Views per page
  const pageCounts = {};
  visits.forEach(v => {
    pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
  });
  const viewsPerPage = Object.entries(pageCounts)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views);

  // Apply limit/offset to viewsPerPage
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  const paginatedViewsPerPage = viewsPerPage.slice(offset, offset + limit);

  // Top referrers
  const referrerCounts = {};
  visits.forEach(v => {
    const ref = v.referrer || '(direct)';
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Average time on page
  const visitsWithTime = visits.filter(v => typeof v.timeOnPageSeconds === 'number' && v.timeOnPageSeconds > 0);
  const avgTime = visitsWithTime.length > 0
    ? visitsWithTime.reduce((sum, v) => sum + v.timeOnPageSeconds, 0) / visitsWithTime.length
    : 0;

  return {
    totalViews,
    uniqueVisitors,
    totalClicks,
    avgTime,
    viewsPerPage: paginatedViewsPerPage,
    topReferrers,
  };
}

function getRecentVisits(pageFilter, limit, offset, filters = {}) {
  let visits = readJSON(VISITS_FILE);

  if (pageFilter) {
    visits = visits.filter(v => v.page === pageFilter);
  }
  if (filters.since) {
    const sinceDate = new Date(filters.since).getTime();
    visits = visits.filter(v => {
      const visitDate = new Date(v.createdAt).getTime();
      return visitDate >= sinceDate;
    });
  }
  if (filters.filter_bots === '1' || filters.filter_bots === 'true') {
    const botRe = /bot|crawler|spider|headless|python-requests|curl/i;
    visits = visits.filter(v => !botRe.test(v.userAgent || ''));
  }

  // Sort by createdAt descending
  visits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paginated = visits.slice(offset, offset + limit);

  return paginated.map(v => ({
    id: v.id,
    page: v.page,
    visitorId: v.visitorId,
    referrer: v.referrer,
    userAgent: v.userAgent,
    country: v.country,
    screenWidth: v.screenWidth,
    screenHeight: v.screenHeight,
    timeOnPageSeconds: v.timeOnPageSeconds,
    clicked: v.clicked,
    createdAt: v.createdAt,
  }));
}

function getHealth() {
  const visits = readJSON(VISITS_FILE);
  const clicks = readJSON(CLICKS_FILE);
  return {
    ok: true,
    visits: visits.length,
    clicks: clicks.length,
  };
}

module.exports = {
  readJSON,
  writeJSON,
  recordVisit,
  recordClick,
  updateVisit,
  findExistingVisit,
  getStats,
  getRecentVisits,
  getHealth,
};
