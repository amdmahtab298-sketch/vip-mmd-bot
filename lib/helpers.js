// Baileys helper functions — media send/download, admin checks, mentions.
const { downloadMediaMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const pino = require('pino');

const log = pino({ level: 'silent' });
const norm = (jid = '') => {
  try { return jidNormalizedUser(jid); } catch { return String(jid); }
};
const num = (jid = '') => norm(jid).split('@')[0].replace(/\D/g, '');

const MB60 = 60 * 1024 * 1024;

// ---------- sending ----------
async function sendText(sock, chatId, text, msg) {
  return sock.sendMessage(chatId, { text: String(text).slice(0, 60000) }, msg ? { quoted: msg } : {});
}

// >60MB -> document, else video message
async function sendVideo(sock, chatId, buffer, caption = '', msg, filename = 'video.mp4') {
  const opts = msg ? { quoted: msg } : {};
  if (buffer.length > MB60) {
    return sock.sendMessage(chatId, { document: buffer, fileName: filename, mimetype: 'video/mp4', caption }, opts);
  }
  return sock.sendMessage(chatId, { video: buffer, caption, fileName }, opts);
}
async function sendImage(sock, chatId, buffer, caption = '', msg) {
  return sock.sendMessage(chatId, { image: buffer, caption }, msg ? { quoted: msg } : {});
}
async function sendAudio(sock, chatId, buffer, msg, ptt = false) {
  return sock.sendMessage(chatId, { audio: buffer, mimetype: 'audio/mpeg', ptt }, msg ? { quoted: msg } : {});
}
async function sendPtt(sock, chatId, buffer, msg) {
  return sendAudio(sock, chatId, buffer, msg, true);
}
async function sendDoc(sock, chatId, buffer, filename, mimetype = 'application/octet-stream', msg, caption = '') {
  return sock.sendMessage(chatId, { document: buffer, fileName: filename, mimetype, caption }, msg ? { quoted: msg } : {});
}
async function sendSticker(sock, chatId, buffer, msg) {
  return sock.sendMessage(chatId, { sticker: buffer }, msg ? { quoted: msg } : {});
}
async function react(sock, chatId, msg, emoji) {
  try { await sock.sendMessage(chatId, { react: { text: emoji, key: msg.key } }); } catch { /* ignore */ }
}

// ---------- message inspection ----------
function unwrap(msg) {
  const m = msg.message;
  if (!m) return null;
  return m.ephemeralMessage?.message || m;
}

function mediaType(m) {
  if (!m) return null;
  if (m.imageMessage) return 'image';
  if (m.videoMessage) return 'video';
  if (m.stickerMessage) return 'sticker';
  if (m.audioMessage) return 'audio';
  if (m.documentMessage) return 'document';
  return null;
}

function getQuotedMessage(msg) {
  const inner = unwrap(msg);
  if (!inner) return null;
  const ctx = inner.extendedTextMessage?.contextInfo || inner.imageMessage?.contextInfo || inner.videoMessage?.contextInfo;
  const q = ctx?.quotedMessage;
  if (!q) return null;
  return q.ephemeralMessage?.message || q.viewOnceMessage?.message || q.viewOnceMessageV2?.message || q;
}

function getQuotedSender(msg) {
  const inner = unwrap(msg);
  const ctx = inner?.extendedTextMessage?.contextInfo || inner?.imageMessage?.contextInfo || inner?.videoMessage?.contextInfo;
  return ctx?.participant || null;
}

function getMentioned(msg) {
  const inner = unwrap(msg);
  const ctx = inner?.extendedTextMessage?.contextInfo || inner?.imageMessage?.contextInfo || inner?.videoMessage?.contextInfo;
  return ctx?.mentionedJid || [];
}

async function downloadRaw(sock, msgLike) {
  try {
    return await downloadMediaMessage(msgLike, 'buffer', {}, { logger: log, reuploadRequest: sock.updateMediaMessage });
  } catch {
    return null;
  }
}

// Quoted message ka media download karo
async function getQuotedBuffer(sock, msg) {
  try {
    const qm = getQuotedMessage(msg);
    if (!qm) return null;
    const mtype = mediaType(qm);
    if (!mtype) return null;
    const buffer = await downloadRaw(sock, { key: msg.key, message: qm });
    return buffer ? { buffer, mtype } : null;
  } catch {
    return null;
  }
}

// Message ke apne media (image/video with caption) ko download karo
async function getMediaBuffer(sock, msg) {
  try {
    const inner = unwrap(msg);
    const mtype = mediaType(inner);
    if (!mtype) return null;
    const buffer = await downloadRaw(sock, msg);
    return buffer ? { buffer, mtype } : null;
  } catch {
    return null;
  }
}

// Quoted message delete karo (bot admin hona chahiye)
async function deleteQuoted(sock, msg) {
  try {
    const inner = unwrap(msg);
    const ctx = inner?.extendedTextMessage?.contextInfo || inner?.imageMessage?.contextInfo || inner?.videoMessage?.contextInfo;
    const stanzaId = ctx?.stanzaId;
    const participant = ctx?.participant;
    if (!stanzaId) return false;
    await sock.sendMessage(msg.key.remoteJid, {
      delete: { remoteJid: msg.key.remoteJid, fromMe: false, id: stanzaId, participant },
    });
    return true;
  } catch {
    return false;
  }
}

// ---------- group helpers ----------
async function groupMeta(sock, chatId) {
  try { return await sock.groupMetadata(chatId); } catch { return null; }
}

async function isGroupAdmin(sock, chatId, jid) {
  const md = await groupMeta(sock, chatId);
  if (!md) return false;
  const p = md.participants.find((x) => norm(x.id) === norm(jid));
  return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'));
}

async function isBotAdmin(sock, chatId) {
  try { return await isGroupAdmin(sock, chatId, sock.user.id); } catch { return false; }
}

async function getGroupMembers(sock, chatId) {
  const md = await groupMeta(sock, chatId);
  return md ? md.participants.map((p) => p.id) : [];
}

async function groupInviteCode(sock, chatId) {
  try { return await sock.groupInviteCode(chatId); } catch { return null; }
}

module.exports = {
  norm, num,
  sendText, sendVideo, sendImage, sendAudio, sendPtt, sendDoc, sendSticker, react,
  unwrap, mediaType, getQuotedMessage, getQuotedSender, getMentioned,
  downloadRaw, getQuotedBuffer, getMediaBuffer, deleteQuoted,
  groupMeta, isGroupAdmin, isBotAdmin, getGroupMembers, groupInviteCode,
};
