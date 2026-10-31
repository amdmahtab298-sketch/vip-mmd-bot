// Baileys auth state — file ki jagah online KV (lib/kv.js) par.
// Isse Render ka deploy session nahi udata: naye container me bot purani
// login (creds + signal keys) DB se utha kar khud connect ho jata hai.
const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

const enc = (v) => JSON.parse(JSON.stringify(v, BufferJSON.replacer));
const dec = (v) => (v == null ? v : JSON.parse(JSON.stringify(v), BufferJSON.reviver));

async function useSupabaseAuthState(kv) {
  const cache = new Map(); // 'key:<type>:<id>' -> decoded value (har message par DB hit na ho)
  let creds = dec(await kv.get('creds'));
  if (!creds) creds = initAuthCreds();

  const keys = {
    get: async (type, ids) => {
      const out = {};
      await Promise.all((ids || []).map(async (id) => {
        const rowId = `key:${type}:${id}`;
        let value = cache.get(rowId);
        if (value === undefined) {
          value = dec(await kv.get(rowId).catch(() => null));
          if (value != null) cache.set(rowId, value);
        }
        if (value != null) {
          if (type === 'app-state-sync-key') {
            try { value = proto.Message.AppStateSyncKeyData.fromObject(value); } catch { /* as-is rakho */ }
          }
          out[id] = value;
        }
      }));
      return out;
    },
    set: async (data) => {
      const tasks = [];
      for (const type of Object.keys(data || {})) {
        for (const id of Object.keys(data[type] || {})) {
          const rowId = `key:${type}:${id}`;
          const value = data[type][id];
          if (value) {
            cache.set(rowId, value);
            tasks.push(kv.set(rowId, enc(value)).catch((e) => console.log('kv key save fail:', e.message)));
          } else {
            cache.delete(rowId);
            tasks.push(kv.del(rowId).catch(() => {}));
          }
        }
      }
      await Promise.all(tasks);
    },
  };

  return {
    state: { creds, keys },
    saveCreds: async () => { await kv.set('creds', enc(creds)); },
    // Logout par DB se bhi session saaf — warna bot mrit session utha kar loop karega.
    clearAll: async () => {
      cache.clear();
      await kv.del('creds').catch(() => {});
      await kv.delPrefix('key:').catch(() => {});
    },
  };
}

module.exports = { useSupabaseAuthState };
