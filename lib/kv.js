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

// ---- welcome OFF list persistence (id: 'settings:welcomeOff' -> [chatId, ...]) ----
// Welcome har group me default ON hai; sirf jin groups me admin ne band kiya,
// wahi yaad rakhne hain taaki deploy/restart par setting na bhoole.
async function persistWelcomeOff() {
  if (!kv) return;
  try {
    const arr = [...store.welcomeOffChats];
    if (arr.length) await kv.set('settings:welcomeOff', arr);
    else await kv.del('settings:welcomeOff');
  } catch (e) {
    console.log('welcome-off save fail:', e.message);
  }
}

async function loadWelcomeOff() {
  if (!kv) return 0;
  const data = await kv.get('settings:welcomeOff');
  const arr = Array.isArray(data) ? data : [];
  store.welcomeOffChats = new Set(arr.map(String));
  return arr.length;
}

// ---- generic Set persistence (guard/engage settings ke liye) ----
async function persistSet(id, set) {
  if (!kv) return;
  try {
    const arr = [...set];
    if (arr.length) await kv.set(id, arr);
    else await kv.del(id);
  } catch (e) {
    console.log('set save fail:', id, e.message);
  }
}

async function loadSet(id) {
  if (!kv) return [];
  try {
    const d = await kv.get(id);
    return Array.isArray(d) ? d.map(String) : [];
  } catch {
    return [];
  }
}

// ---- points persistence (id: 'points:<chatId>' -> { senderKey: {p,name,day,dayP} }) ----
async function persistPoints(chatId) {
  if (!kv) return;
  try {
    const m = store.points.get(chatId);
    if (!m || !m.size) { await kv.del('points:' + chatId); return; }
    const obj = {};
    for (const [k, v] of m) obj[k] = v;
    await kv.set('points:' + chatId, obj);
  } catch (e) {
    console.log('points save fail:', e.message);
  }
}

async function loadPoints(chatId) {
  if (store.points.has(chatId)) return store.points.get(chatId);
  const m = new Map();
  store.points.set(chatId, m);
  if (!kv) return m;
  try {
    const d = await kv.get('points:' + chatId);
    if (d && typeof d === 'object') for (const [k, v] of Object.entries(d)) m.set(k, v);
  } catch { /* ignore */ }
  return m;
}

// ---- LID -> phone mapping persistence (id: 'lidmap' -> { lidDigits: phoneDigits }) ----
async function persistLidMap() {
  if (!kv) return;
  try {
    let entries = [...store.lidToPhone.entries()];
    if (entries.length > 800) entries = entries.slice(entries.length - 800); // aakhri 800 hi rakho
    if (entries.length) await kv.set('lidmap', Object.fromEntries(entries));
    else await kv.del('lidmap');
  } catch (e) {
    console.log('lidmap save fail:', e.message);
  }
}

async function loadLidMap() {
  if (!kv) return 0;
  try {
    const d = await kv.get('lidmap');
    if (d && typeof d === 'object') {
      store.lidToPhone = new Map(Object.entries(d).map(([k, v]) => [String(k), String(v)]));
      return store.lidToPhone.size;
    }
  } catch { /* ignore */ }
  return 0;
}

module.exports = { kv, persistStickerBlock, loadStickerBlocks, persistWelcomeOff, loadWelcomeOff, persistSet, loadSet, persistPoints, loadPoints, persistLidMap, loadLidMap };
