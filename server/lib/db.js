const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = 'emkt_data';

function headers(extra) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function getData(key) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0]?.value ?? null;
}

async function saveData(key, value) {
  // The value column is NOT NULL (it's jsonb, not "maybe jsonb"), so an
  // explicit null write means "clear this key" -- delete the row instead
  // of inserting, keeping the same "missing key -> getData returns null"
  // contract from the caller's point of view.
  if (value === null) {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: 'DELETE', headers: headers() });
    return res.ok;
  }

  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
  });
  return res.ok;
}

module.exports = { getData, saveData };
