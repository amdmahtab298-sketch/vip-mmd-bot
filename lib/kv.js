// MMD Bot ka APNA online storage (alag Supabase project — sirf is bot ke liye).
// Kaam: WhatsApp session (login) aur sticker blocklist ko Render ke server ke
// bahar save karna, taaki har deploy ke baad bot ko dobara pair na karna pade.
// SUPABASE_URL / SUPABASE_KEY sirf Render ke env vars me hain — code/GitHub me NAHI.
// Env na mile to kv = null aur bot purane file-session par chalta rahega.
const store = require('./store');

const TABLE = 'mmd_kv';

function createKv() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_KEY || '';
  if (!url || !key) return null;
  const base = `${url}/rest/v1/${TABLE}`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  async function get(id) {
    const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}&select=data`, { headers });
    if (!res.ok) throw new Error('kv get ' + res.status);
    const rows = await res.json();
    return rows && rows.length ? rows[0].data : null;
  }
  async function set(id, data) {
    const res = await fetch(base, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id, data }),
    });
    if (!res.ok) throw new Error('kv set ' + res.status);
  }
  async function del(id) {
    const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('kv del ' + res.status);
  }
  async function delPrefix(prefix) {
    const res = await fetch(`${base}?id=like.${encodeURIComponent(prefix + '*')}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('kv delPrefix ' + res.status);
  }
  async function listPrefix(prefix) {
    const res = await fetch(`${base}?id=like.${encodeURIComponent(prefix + '*')}&select=id,data`, { headers });
    if (!res.ok) throw new Error('kv list ' + res.status);
    return res.json();
  }
  return { get, set, del, delPrefix, listPrefix };
}

const kv = createKv();

// ---- sticker blocklist persistence (id: 'stickerblock:<chatId>' -> [hash, ...]) ----
async function persistStickerBlock(chatId) {
  if (!kv) return;
  try {
    const arr = [...(store.blockedStickers.get(chatId) || [])];
    if (arr.length) await kv.set('stickerblock:' + chatId, arr);
    else await kv.del('stickerblock:' + chatId);
  } catch (e) {
    console.log('sticker block save fail:', e.message);
  }
}

async function loadStickerBlocks() {
  if (!kv) return 0;
  const rows = await kv.listPrefix('stickerblock:');
  for (const r of rows || []) {
    const chatId = String(r.id).slice('stickerblock:'.length);
    store.blockedStickers.set(chatId, new Set(Array.isArray(r.data) ? r.data : []));
  }
  return (rows || []).length;
}

module.exports = { kv, persistStickerBlock, loadStickerBlocks };
