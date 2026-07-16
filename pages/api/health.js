const { getHealth } = require('./lib/db');

export default async function handler(req, res) {
  const { ok, visits, clicks } = getHealth();
  res.status(200).json({ status: "ok", visits, clicks });
}
