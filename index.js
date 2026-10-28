// VIP MMD Bot — main entry point (Baileys v6, CommonJS)
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode'); // QR string -> PNG data URL (web UI QR tab ke liye)
const express = require('express');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const store = require('./lib/store');
const H = require('./lib/helpers');
const { toStickerBuffer } = require('./lib/sticker');

const log = pino({ level: 'silent' });

// Process ko chhoti-moti galtiyon par marne mat do — log karo aur zinda raho.
// (Render "Application exited early" bhejta hai jab process exit hota hai.)
process.on('unhandledRejection', (e) => console.log('⚠️ unhandledRejection:', e?.message || e));
process.on('uncaughtException', (e) => console.log('⚠️ uncaughtException:', e?.message || e));

// ---------------- web UI state ----------------
let isConnected = false;   // WhatsApp socket connected?
let currentSock = null;    // live Baileys socket (pairing API isi ko use karega)
let latestQR = null;       // Baileys se aaya latest QR string (web UI QR tab ke liye)
let latestQRAt = 0;        // QR kab aaya (ms timestamp)
let welcomed = false;      // 'open' par owner ko welcome msg sirf ek baar
let reconnectDelay = 3000; // reconnect backoff (har fail par double, max 60s)
const seenMsgIds = new Set(); // loop/duplicate protection (har message ID ek baar)
const bootTime = Date.now();

const maskNum = (n = '') => {
  const d = String(n).replace(/\D/g, '');
  if (d.length < 7) return '****';
  return d.slice(0, 3) + 'X'.repeat(d.length - 6) + d.slice(-3);
};
const fmtUptime = () => {
  const s = Math.floor((Date.now() - bootTime) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};

// ---------------- command registry ----------------
const registry = new Map(); // lowercased name-or-alias -> command object
const allCommands = [];
(function loadCommands() {
  const dir = path.join(__dirname, 'commands');
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    let arr;
    try {
      arr = require(path.join(dir, f));
    } catch (e) {
      console.log(`❌ ${f} load nahi hua: ${e.message}`);
      continue;
    }
    for (const c of arr) {
      if (!c || !c.name || typeof c.run !== 'function') continue;
      const key = String(c.name).toLowerCase();
      if (registry.has(key)) {
        console.log(`⚠️ Duplicate command name skipped: ${c.name} (${f})`);
        continue;
      }
      registry.set(key, c);
      for (const a of c.aliases || []) {
        const ak = String(a).toLowerCase();
        if (!registry.has(ak)) registry.set(ak, c);
      }
      allCommands.push(c);
    }
  }
  console.log(`✅ ${allCommands.length} commands loaded (${registry.size} names+aliases)`);
})();

// ---------------- message text ----------------
function getText(msg) {
  const m = msg.message;
  if (!m) return '';
  const inner =
    m.ephemeralMessage?.message || m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m;
  return (
    inner.conversation ||
    inner.extendedTextMessage?.text ||
    inner.imageMessage?.caption ||
    inner.videoMessage?.caption ||
    ''
  );
}

function isViewOnce(msg) {
  const m = msg.message;
  if (!m) return false;
  return !!(m.viewOnceMessage || m.viewOnceMessageV2);
}

// ---------------- anti-abuse filter (gaali-galoj auto-delete) — ADVANCED ----------------
// Teen layer ki trick-proof matching:
//  1) Compact: spaces/symbols hata kar — "g a a l i", "g**li", "gaali!" pakda jayega
//  2) Leet-normalize: m4darchod -> madarchod, chut1ya -> chutiya, @->a, $->s
//  3) Collapse: dohre/lambe akshar sikod kar — madarchoooood -> madarchod
const ABUSE_WORDS = [
  'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bhosdi', 'chutiya', 'chutya', 'chutiye',
  'gaandu', 'gandu', 'harami', 'haramkhor', 'randi', 'lauda', 'laude', 'lund', 'bsdk',
  'motherfucker', 'fucker', 'fucking', 'fuck', 'bitch', 'bastard', 'asshole', 'whore', 'slut', 'dickhead',
  'teri maa ki chut', 'maa ki chut', 'son of a bitch',
  'मादरचोद', 'बहनचोद', 'भोसड़ी', 'चूतिया', 'गांडू', 'रंडी', 'हरामी', 'लौड़ा', 'हरामखोर',
];
const ABUSE_SHORT = ['bc', 'mc']; // chhote abbreviations — sirf whole-word match hoga
function normalizeAbuseText(s) {
  let t = String(s).toLowerCase().replace(/@/g, 'a').replace(/\$/g, 's');
  t = t.replace(/[^\p{L}\p{N}]/gu, '');
  return t.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't');
}
const collapseAbuse = (s) => s.replace(/(.)\1+/g, '$1');
const ABUSE_COMPACT = ABUSE_WORDS.map(normalizeAbuseText).filter((w) => w.length >= 3);
const ABUSE_COLLAPSED = ABUSE_COMPACT.map(collapseAbuse);
function hasAbuse(text) {
  if (!text) return false;
  const n = normalizeAbuseText(text);
  for (const w of ABUSE_COMPACT) if (n.includes(w)) return true;
  const c = collapseAbuse(n);
  for (const w of ABUSE_COLLAPSED) if (c.includes(w)) return true;
  const spaced = ' ' + String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  for (const w of ABUSE_SHORT) if (spaced.includes(' ' + w + ' ')) return true;
  return false;
}

const normJid = (jid = '') => {
  try { return jidNormalizedUser(jid); } catch { return String(jid); }
};
const ownerNum = () => config.ownerNumber.replace(/\D/g, '');
const senderNum = (sender) => normJid(sender).split('@')[0].replace(/\D/g, '');

// ---------------- per-message handler ----------------
async function handleOne(sock, msg) {
  try {
    if (!msg.message) return;
    // NOTE: fromMe messages BHI process hote hain — bot owner ke APNE number par chalta hai
    // (self-bot mode), to owner apne phone se hi commands bhejta hai. Loop se bachne ke liye:
    // (a) sirf prefix "." wale messages dispatch hote hain, (b) har message ID ek baar (seenMsgIds).
    const mid = msg.key.id;
    if (mid) {
      if (seenMsgIds.has(mid)) return;
      seenMsgIds.add(mid);
      if (seenMsgIds.size > 300) seenMsgIds.delete(seenMsgIds.values().next().value);
    }
    const chatId = msg.key.remoteJid;
    if (!chatId || chatId === 'status@broadcast') return;
    // DEBUG: har message ka fromMe/chat/text log karo
    try { console.log(`📩 msg fromMe=${!!msg.key.fromMe} chat=${chatId} text=${JSON.stringify(getText(msg)).slice(0, 80)}`); } catch {}

    const sender = msg.key.participant ? normJid(msg.key.participant) : normJid(chatId);
    const isGroup = chatId.endsWith('@g.us');

    store.seenUsers.add(sender);
    store.seenChats.add(chatId);
    store.msgCount++;

    if (store.banned.has(sender)) return;

    const text = getText(msg).trim();

    // ---- hook: view-once saver (DM me bot ko bheja gaya view-once wapas bhejo) ----
    if (isViewOnce(msg) && !isGroup && !text.startsWith(config.prefix)) {
      try {
        const buf = await H.downloadRaw(sock, msg);
        if (buf) {
          const inner = msg.message.viewOnceMessage?.message || msg.message.viewOnceMessageV2?.message || {};
          if (inner.imageMessage) await H.sendImage(sock, chatId, buf, '👁️ View-once save ho gaya!', msg);
          else if (inner.videoMessage) await H.sendVideo(sock, chatId, buf, '👁️ View-once save ho gaya!', msg);
        }
      } catch { /* ignore */ }
      return;
    }

    // ---- hook: autosticker (chat me har image -> sticker) ----
    if (store.autostickerChats.has(chatId)) {
      const inner = H.unwrap(msg);
      if (inner?.imageMessage && !text.startsWith(config.prefix)) {
        try {
          const buf = await H.downloadRaw(sock, msg);
          if (buf) await H.sendSticker(sock, chatId, await toStickerBuffer(buf), msg);
        } catch { /* ignore */ }
      }
    }

    // ---- hook: antilink ----
    if (isGroup && store.antilinkChats.has(chatId) && /https?:\/\/|www\.|chat\.whatsapp\.com/i.test(text)) {
      const admin = await H.isGroupAdmin(sock, chatId, sender);
      if (!admin) {
        try {
          await sock.sendMessage(chatId, { delete: msg.key });
          await H.sendText(sock, chatId, `🔗 @${senderNum(sender)} link allowed nahi hai!`, null).catch(() => {});
        } catch { /* ignore */ }
        return;
      }
    }

    // ---- hook: anti-abuse ADVANCED (gaali -> delete + 3-strike system) ----
    // Default ON hai har group me (.antiabuse off se band hota hai).
    // Strike 1-2: delete + warning | Strike 3: delete + group se REMOVE (24h me strikes reset).
    // Admins aur owner exempt hain. Delete tabhi hoga jab bot group admin ho (WhatsApp rule).
    if (isGroup && !store.antiabuseOff.has(chatId) && !text.startsWith(config.prefix) && hasAbuse(text)) {
      const admin = await H.isGroupAdmin(sock, chatId, sender);
      if (!admin && senderNum(sender) !== ownerNum()) {
        let deleted = false;
        try {
          await sock.sendMessage(chatId, { delete: msg.key });
          deleted = true;
        } catch { /* bot admin nahi hai — delete fail, chup raho */ }
        if (deleted) {
          const key = chatId + ':' + sender;
          const now = Date.now();
          let rec = store.abuseWarns.get(key);
          if (!rec || now - rec.firstAt > 24 * 60 * 60 * 1000) rec = { count: 0, firstAt: now };
          rec.count++;
          store.abuseWarns.set(key, rec);
          console.log(`🚫 abuse deleted: ${senderNum(sender)} in group (strike ${rec.count}/3)`);
          if (rec.count >= 3) {
            let kicked = false;
            try {
              await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
              kicked = true;
            } catch { /* remove fail — warning par ruk jao */ }
            if (kicked) {
              store.abuseWarns.delete(key);
              await sock.sendMessage(chatId, {
                text: `⛔ @${senderNum(sender)} ko gaali-galoj ki 3 warnings ke baad group se REMOVE kar diya gaya.`,
                mentions: [sender],
              }).catch(() => {});
            } else {
              await sock.sendMessage(chatId, {
                text: `🚫 @${senderNum(sender)} Warning ${rec.count}/3 — message delete kar diya gaya. (Remove nahi ho paya — bot admin hai na?)`,
                mentions: [sender],
              }).catch(() => {});
            }
          } else {
            await sock.sendMessage(chatId, {
              text: `🚫 @${senderNum(sender)} gaali-galoj allowed nahi hai! Message delete kar diya gaya. (Warning ${rec.count}/3 — 3 warnings par REMOVE ho jaoge)`,
              mentions: [sender],
            }).catch(() => {});
          }
        }
        return;
      }
    }

    // ---- command dispatch ----
    if (!text.startsWith(config.prefix)) return;
    const parts = text.slice(config.prefix.length).trim().split(/\s+/);
    const cmdName = (parts[0] || '').toLowerCase();
    const cmd = registry.get(cmdName);
    if (!cmd) return;

    const args = parts.slice(1);
    const cmdText = text.slice(config.prefix.length + parts[0].length).trim();

    // gates
    if (cmd.ownerOnly && senderNum(sender) !== ownerNum()) {
      await H.sendText(sock, chatId, '⛔ Ye command sirf bot owner ke liye hai.', msg);
      return;
    }
    if (cmd.groupOnly && !isGroup) {
      await H.sendText(sock, chatId, '👥 Ye command sirf group me chalegi.', msg);
      return;
    }
    if (cmd.adminOnly && !(await H.isGroupAdmin(sock, chatId, sender))) {
      await H.sendText(sock, chatId, '👮 Ye command sirf group admin chala sakte hain.', msg);
      return;
    }

    // cooldown (per user per command)
    const cd = cmd.cooldownMs || config.cooldownMs;
    const cdKey = `${sender}:${cmd.name}`;
    const last = store.cooldowns.get(cdKey) || 0;
    const wait = cd - (Date.now() - last);
    if (wait > 0) {
      await H.sendText(sock, chatId, `⏳ Thoda slow! ${Math.ceil(wait / 1000)}s ruk ke dobara try karo.`, msg);
      return;
    }
    store.cooldowns.set(cdKey, Date.now());

    // auto-react on commands
    if (store.autoreactChats.has(chatId)) await H.react(sock, chatId, msg, '⚡');

    const ctx = {
      sock, msg, args, text: cmdText, sender, chatId, isGroup,
      command: cmd.name, registry: allCommands, store,
      reply: (t) => H.sendText(sock, chatId, t, msg),
    };
    try {
      await cmd.run(ctx);
    } catch (e) {
      console.log(`cmd err [${cmd.name}]:`, e.message);
      await H.sendText(sock, chatId, '⚠️ Kuch gadbad ho gayi, dobara try karo.', msg).catch(() => {});
    }
  } catch (e) {
    console.log('handle err:', e.message);
  }
}

// ---------------- socket ----------------
async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: log,
    printQRInTerminal: false,
    browser: ['VIP MMD Bot', 'Chrome', '1.0'],
    // History sync BAND — warna connect hote hi saari purani chats sync hoti hain
    // aur free server par socket "503 Stream Errored" se mar jata hai
    // (2026-10-28 ke Render logs me connect ke 1s baad yahi hua tha).
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });
  currentSock = sock; // web UI ke /api/pair ke liye

  // Bot ke khud ke bheje messages ko dobara process mat karo (self-bot loop protection):
  // har outbound message ka ID seenMsgIds me daal do, echo aane par skip ho jayega.
  const _sendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async (...args) => {
    const sent = await _sendMessage(...args);
    try {
      if (sent?.key?.id) {
        seenMsgIds.add(sent.key.id);
        if (seenMsgIds.size > 300) seenMsgIds.delete(seenMsgIds.values().next().value);
      }
    } catch {}
    return sent;
  };

  // Pairing code AUTO-generate BAND (2026-10-28): pehle har fresh start par code
  // manga jata tha, jo expire hokar 401/logout loop banata tha aur WhatsApp ko
  // irritate karta tha. Ab code sirf web UI ke "Pairing Code" tab se on-demand
  // milega (POST /api/pair); warna QR tab se scan karo — QR khud aata rahega.

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    isConnected = connection === 'open';
    if (u.qr) { latestQR = u.qr; latestQRAt = Date.now(); } // web UI QR tab ke liye save
    if (connection === 'open') {
      reconnectDelay = 3000; // safal connect — backoff reset
      console.log(`✅ Bot connected! (${sock.user?.id})`);
      console.log(`📜 ${allCommands.length} commands live — prefix "${config.prefix}"`);
      // Pehli baar connect hone par owner ke number par confirmation bhejo
      if (!welcomed) {
        welcomed = true;
        const oj = ownerNum() + '@s.whatsapp.net';
        const txt =
          `🤖 *VIP MMD Bot live ho gaya!* ✅\n\n` +
          `Tumhara number ab bot se connected hai. Ab tum commands use kar sakte ho:\n\n` +
          `• \`${config.prefix}menu\` — saare ${allCommands.length} commands ki list\n` +
          `• \`${config.prefix}ping\` — bot online check\n` +
          `• \`${config.prefix}dl <link>\` — video download (TikTok / IG / X / FB / YT...)\n` +
          `• \`${config.prefix}mp3 <link>\` — sirf audio\n` +
          `• \`${config.prefix}sticker\` — photo ka sticker\n` +
          `• \`${config.prefix}tagall\` — group me sabko tag\n\n` +
          `Prefix \`${config.prefix}\` mat bhoolna!\nMade for VIP Shorts Creator 🎬`;
        sock.sendMessage(oj, { text: txt }).catch(() => console.log('welcome msg nahi gaya'));
      }
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('🔌 connection close — code:', code, '|', lastDisconnect?.error?.message || 'no-msg');
      if (code === DisconnectReason.loggedOut) {
        // Session khatam — saaf karo aur naye socket se dobara pairing ke liye taiyaar raho.
        // process.exit NAHI karenge (Render "exited early" mail bhejta hai) — pairing page se dobara pair ho jayega.
        console.log('❌ Logged out. Session saaf kar raha hoon — pairing page kholo aur dobara pair karo.');
        try { fs.rmSync(path.join(__dirname, config.sessionDir), { recursive: true, force: true }); } catch {}
        latestQR = null; latestQRAt = 0;
        reconnectDelay = 5000;
        setTimeout(() => startSock().catch((e) => console.log('re-pair start fail:', e.message)), reconnectDelay);
        return;
      }
      // Backoff: har fail par wait double (3s → 6s → 12s ... max 60s), taaki
      // WhatsApp par reconnect ka bojh na pade (503 ke baad turant retry ulta padta hai).
      const waitMs = reconnectDelay;
      reconnectDelay = Math.min(reconnectDelay * 2, 60000);
      console.log(`🔄 Connection toot gaya — ${Math.round(waitMs / 1000)}s me reconnect...`);
      setTimeout(() => startSock().catch((e) => console.log('reconnect fail:', e.message)), waitMs);
    }
  });

  sock.ev.on('messages.upsert', async (upsert) => {
    // DEBUG: har upsert log karo — pata chalega message bot tak pahunch raha hai ya nahi
    try {
      const flags = (upsert.messages || []).map((m) => (m.key.fromMe ? 'fromMe' : 'other')).join(',');
      console.log(`📥 upsert type=${upsert.type} count=${upsert.messages?.length || 0} [${flags}]`);
    } catch {}
    if (upsert.type !== 'notify') return;
    for (const msg of upsert.messages) await handleOne(sock, msg);
  });

  // welcome / goodbye
  sock.ev.on('group-participants.update', async (u) => {
    try {
      const { id, participants, action } = u;
      if (action === 'add' && store.welcomeChats.has(id)) {
        const names = participants.map((p) => '@' + p.split('@')[0]).join(' ');
        await sock.sendMessage(id, { text: `👋 Welcome ${names}!\n📌 Rules ke liye .rules likho.`, mentions: participants });
      } else if (action === 'remove' && store.goodbyeChats.has(id)) {
        const names = participants.map((p) => '@' + p.split('@')[0]).join(' ');
        await sock.sendMessage(id, { text: `👋 Alvida ${names}!` });
      }
    } catch { /* ignore */ }
  });

  return sock;
}

console.log('🤖 VIP MMD Bot start ho raha hai...');
function boot() {
  startSock().catch((e) => {
    // Pehli baar start fail ho to exit mat karo — retry karo (Render mail nahi bhejega)
    console.log('❌ Start fail:', e.message, '— 10s me retry...');
    setTimeout(boot, 10000);
  });
}
boot();

// ---------------- pairing web UI (Express) ----------------
// Bot init ko block nahi karta — saath me chalta hai.
const app = express();
app.use(express.json());

// Rate limit: /api/pair — 1 request per 30 sec per IP
const pairHits = new Map();
function pairRateOk(ip) {
  const last = pairHits.get(ip) || 0;
  const wait = 30000 - (Date.now() - last);
  if (wait > 0) return Math.ceil(wait / 1000);
  pairHits.set(ip, Date.now());
  return 0;
}

const PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d10;color:#f2f2f2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#16161b;border:1px solid #2a2a33;border-radius:18px;padding:28px 24px;max-width:430px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.55)}
.brand{text-align:center;margin-bottom:6px}
.brand h1{font-size:30px;background:linear-gradient(90deg,#ffd54a,#ff8f00);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.5px}
.brand p{color:#9a9aa5;font-size:13px;margin-top:4px}
.status{display:inline-block;margin:14px 0 4px;padding:6px 16px;border-radius:999px;font-size:13px;font-weight:700}
.off{background:rgba(229,57,53,.15);color:#ff6b66;border:1px solid rgba(229,57,53,.4)}
.on{background:rgba(46,204,113,.15);color:#4be08a;border:1px solid rgba(46,204,113,.4)}
label{display:block;color:#b9b9c4;font-size:13px;margin:16px 0 6px}
input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid #33333d;background:#0d0d10;color:#fff;font-size:17px;letter-spacing:1px}
input:focus{outline:none;border-color:#ffd54a}
button{width:100%;margin-top:14px;padding:14px;border:none;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;background:linear-gradient(90deg,#ffd54a,#ff8f00);color:#1a1a1a}
button:disabled{opacity:.45;cursor:wait}
button.ghost{background:#22222a;color:#ffd54a;border:1px solid #3a3a45;margin-top:10px}
.codebox{display:none;text-align:center;margin-top:18px;padding:20px 12px;border:1px dashed #ffd54a;border-radius:14px;background:rgba(255,213,74,.06)}
.codebox .code{font-size:38px;font-weight:900;letter-spacing:6px;color:#ffd54a;font-family:ui-monospace,Menlo,monospace}
.timer{margin-top:10px;height:8px;background:#26262e;border-radius:99px;overflow:hidden}
.timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4be08a,#ffd54a);transition:width 1s linear}
.tleft{color:#9a9aa5;font-size:12px;margin-top:6px}
.steps{margin-top:20px;background:#101014;border-radius:12px;padding:14px 16px;font-size:13.5px;line-height:1.9;color:#c9c9d4}
.steps b{color:#ffd54a}
.err{color:#ff6b66;font-size:13px;margin-top:10px;text-align:center;min-height:18px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.stat{background:#101014;border:1px solid #26262e;border-radius:12px;padding:12px;text-align:center}
.stat .v{font-size:20px;font-weight:800;color:#ffd54a}
.stat .k{font-size:11.5px;color:#9a9aa5;margin-top:3px}
.foot{text-align:center;color:#55555f;font-size:11.5px;margin-top:18px}
.tabs{display:flex;gap:8px;margin:14px 0 4px}
.tab{flex:1;margin-top:0;padding:11px;background:#22222a;color:#b9b9c4;border:1px solid #33333d;font-size:14px;font-weight:700}
.tab.active{background:linear-gradient(90deg,#ffd54a,#ff8f00);color:#1a1a1a;border:none}
.qrbox{text-align:center;margin-top:16px;padding:18px 12px;border:1px dashed #ffd54a;border-radius:14px;background:rgba(255,213,74,.06)}
.qrbox img{width:240px;height:240px;border-radius:10px;background:#fff;padding:8px}
`;

function pairingPage() {
  const num = String(config.pairingNumber || '').replace(/\D/g, '');
  return `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIP MMD Bot — Pairing</title><style>${PAGE_CSS}</style></head><body>
<div class="card">
  <div class="brand"><h1>🤖 VIP MMD Bot</h1><p>WhatsApp se connect karo — 2 minute me live!</p></div>
  <div style="text-align:center"><span class="status off" id="connStatus">● Bot abhi connected nahi hai</span></div>
  <div class="tabs">
    <button class="tab active" id="tab-code" onclick="showTab('code')">🔑 Pairing Code</button>
    <button class="tab" id="tab-qr" onclick="showTab('qr')">📷 QR Code</button>
  </div>
  <div id="pane-code">
  <label>WhatsApp number (country code ke saath, bina +)</label>
  <input id="num" inputmode="numeric" value="${num}" placeholder="9779714313486">
  <button id="go" onclick="getCode()">🔑 Pairing Code Lao</button>
  <div class="err" id="err"></div>
  <div class="codebox" id="codebox">
    <div style="color:#9a9aa5;font-size:13px;margin-bottom:8px">Ye code WhatsApp me daalo:</div>
    <div class="code" id="code">--------</div>
    <div class="timer"><i id="bar"></i></div>
    <div class="tleft"><span id="tleft">60</span> second bache hain</div>
    <button class="ghost" id="retry" onclick="getCode()">🔄 Dobara code mangao</button>
  </div>
  </div>
  <div id="pane-qr" style="display:none">
    <div class="qrbox">
      <img id="qrimg" style="display:none" alt="WhatsApp QR code">
      <div class="tleft" id="qrmsg">QR load ho raha hai...</div>
      <button class="ghost" onclick="loadQR()">🔄 Naya QR lao</button>
    </div>
    <div class="steps" style="margin-top:14px">
      <b>📷 QR se connect karo:</b><br>
      1️⃣ WhatsApp kholo → <b>Linked devices</b><br>
      2️⃣ <b>Link a device</b> → QR scan karo ✅<br>
      <span style="color:#9a9aa5;font-size:12px">QR har ~20 second me badalta hai — jaldi scan karo!</span>
    </div>
  </div>
  <div class="steps">
    <b>📱 Code milne ke baad:</b><br>
    1️⃣ WhatsApp kholo → <b>Linked devices</b><br>
    2️⃣ <b>Link a device</b> → <b>Link with phone number</b><br>
    3️⃣ Upar wala code daalo — ho gaya! ✅
  </div>
  <div class="foot">Made for VIP Shorts Creator 🎬</div>
</div>
<script>
var cdTimer=null;
function getCode(){
  var n=document.getElementById('num').value.replace(/\\D/g,'');
  var err=document.getElementById('err'), go=document.getElementById('go');
  err.textContent='';
  if(n.length<10){ err.textContent='⚠️ Sahi number daalo (country code ke saath)'; return; }
  go.disabled=true; go.textContent='⏳ Code mangaya ja raha hai...';
  fetch('/api/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:n})})
    .then(function(r){ return r.json().then(function(j){ return {s:r.status,j:j}; }); })
    .then(function(r){
      go.disabled=false; go.textContent='🔑 Pairing Code Lao';
      if(r.s!==200){ err.textContent='⚠️ '+(r.j.error||'Kuch gadbad ho gayi'); return; }
      document.getElementById('codebox').style.display='block';
      document.getElementById('code').textContent=r.j.code;
      startCountdown(60);
      document.getElementById('codebox').scrollIntoView({behavior:'smooth',block:'center'});
    })
    .catch(function(){ go.disabled=false; go.textContent='🔑 Pairing Code Lao'; err.textContent='⚠️ Server se baat nahi ho payi'; });
}
function startCountdown(sec){
  var bar=document.getElementById('bar'), tl=document.getElementById('tleft');
  if(cdTimer) clearInterval(cdTimer);
  var left=sec;
  bar.style.width='100%'; tl.textContent=left;
  cdTimer=setInterval(function(){
    left--;
    if(left<=0){ clearInterval(cdTimer); tl.textContent='0 — code expire! Dobara mangao 👆'; bar.style.width='0%'; return; }
    tl.textContent=left; bar.style.width=(left/sec*100)+'%';
  },1000);
}
function showTab(w){
  var pc=document.getElementById('pane-code'), pq=document.getElementById('pane-qr');
  var tc=document.getElementById('tab-code'), tq=document.getElementById('tab-qr');
  if(w==='qr'){ pc.style.display='none'; pq.style.display='block'; tc.classList.remove('active'); tq.classList.add('active'); loadQR(); startQRPoll(); }
  else { pq.style.display='none'; pc.style.display='block'; tq.classList.remove('active'); tc.classList.add('active'); stopQRPoll(); }
}
var qrPoll=null;
function startQRPoll(){ stopQRPoll(); qrPoll=setInterval(function(){ var pq=document.getElementById('pane-qr'); if(pq && pq.style.display!=='none') loadQR(true); },5000); }
function stopQRPoll(){ if(qrPoll){ clearInterval(qrPoll); qrPoll=null; } }
function loadQR(silent){
  var img=document.getElementById('qrimg'), msg=document.getElementById('qrmsg');
  fetch('/api/qr').then(function(r){ return r.json().then(function(j){ return {s:r.status,j:j}; }); })
  .then(function(r){
    if(r.s===200 && r.j.qr){ img.src=r.j.qr; img.style.display='inline-block'; msg.textContent='Scan karo — QR har ~20s me refresh hota hai'; }
    else if(!silent){ msg.textContent='⚠️ '+(r.j.error||'QR nahi mila'); }
  }).catch(function(){ if(!silent) msg.textContent='⚠️ Server se baat nahi ho payi'; });
}
// Connection status auto-refresh (har 8s): connect hote hi page khud dashboard me badal jayega,
// taaki "connected nahi hai" wala text stale na rahe.
setInterval(function(){
  fetch('/api/status').then(function(r){ return r.json(); })
  .then(function(j){
    if(j && j.connected){ location.reload(); }
    else { var s=document.getElementById('connStatus'); if(s){ s.className='status off'; s.textContent='● Bot abhi connected nahi hai'; } }
  }).catch(function(){});
},8000);
</script></body></html>`;
}

function dashboardPage() {
  return `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIP MMD Bot — Online</title><style>${PAGE_CSS}</style></head><body>
<div class="card">
  <div class="brand"><h1>🤖 VIP MMD Bot</h1><p>WhatsApp media downloader + 300+ commands</p></div>
  <div style="text-align:center"><span class="status on">● Bot Online ✓</span></div>
  <div class="stats">
    <div class="stat"><div class="v">${allCommands.length}</div><div class="k">Total Commands</div></div>
    <div class="stat"><div class="v">${fmtUptime()}</div><div class="k">Uptime</div></div>
    <div class="stat"><div class="v">${config.prefix}</div><div class="k">Prefix</div></div>
    <div class="stat"><div class="v" style="font-size:15px">${maskNum(config.ownerNumber)}</div><div class="k">Owner</div></div>
  </div>
  <div class="steps">💡 Kisi bhi chat me <b>${config.prefix}menu</b> likho — saare commands ki list aa jayegi.<br>📥 Media download: <b>${config.prefix}dl &lt;link&gt;</b></div>
  <div class="foot">Made for VIP Shorts Creator 🎬</div>
</div></body></html>`;
}

app.get('/', (req, res) => {
  res.send(isConnected ? dashboardPage() : pairingPage());
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// Connection status (pairing page auto-refresh ke liye)
app.get('/api/status', (req, res) => res.json({ connected: isConnected }));

// QR code as PNG data URL (pairing page ka QR tab) — har ~20s me naya QR aata hai
app.get('/api/qr', async (req, res) => {
  try {
    if (isConnected) return res.status(409).json({ error: 'Bot pehle se connected hai! 🎉' });
    if (!latestQR || Date.now() - latestQRAt > 90000)
      return res.status(404).json({ error: 'QR abhi taiyaar nahi — 5 second ruk ke retry karo.' });
    const dataUrl = await QRCode.toDataURL(latestQR, { width: 280, margin: 1 });
    return res.json({ qr: dataUrl });
  } catch (e) {
    return res.status(500).json({ error: 'QR ban nahi paya.' });
  }
});

app.post('/api/pair', async (req, res) => {
  try {
    const wait = pairRateOk(req.ip);
    if (wait > 0) return res.status(429).json({ error: `${wait}s ruk ke dobara try karo.` });
    if (isConnected) return res.status(409).json({ error: 'Bot pehle se connected hai! 🎉' });
    if (!currentSock) return res.status(503).json({ error: 'Bot abhi start ho raha hai, 10 second ruk ke retry karo.' });
    const number = String(req.body?.number || '').replace(/\D/g, '');
    if (number.length < 10) return res.status(400).json({ error: 'Sahi number daalo (country code ke saath).' });
    const code = await currentSock.requestPairingCode(number);
    console.log(`🔑 Pairing code web UI se manga gaya (${maskNum(number)}): ${code}`);
    return res.json({ code });
  } catch (e) {
    console.log('pair api err:', e.message);
    return res.status(500).json({ error: 'Pairing code nahi mil paya — 1 minute ruk ke dobara try karo.' });
  }
});

const WEB_PORT = process.env.PORT || 3000;
app.listen(WEB_PORT, () => console.log(`🌐 Pairing UI live: http://localhost:${WEB_PORT}`));
