// Extras — crowd-pleaser features: autosticker, view-once saver, auto-react, status saver.
const { apiGetBuffer } = require('../lib/api');
const H = require('../lib/helpers');

const onOff = (set, chatId, arg) => {
  if (arg === 'on') { set.add(chatId); return 'ON'; }
  if (arg === 'off') { set.delete(chatId); return 'OFF'; }
  return null;
};

module.exports = [
  {
    name: 'autosticker', aliases: [], category: 'Extras',
    desc: 'Is chat me har photo auto-sticker ban jayegi (on/off)',
    usage: '.autosticker on',
    run: async (ctx) => {
      const r = onOff(ctx.store.autostickerChats, ctx.chatId, (ctx.args[0] || '').toLowerCase());
      if (!r) return ctx.reply('💡 Usage: .autosticker on / off');
      ctx.reply(r === 'ON' ? '✨ Auto-sticker ON! Ab har photo sticker ban jayegi.' : '✨ Auto-sticker OFF.');
    },
  },
  {
    name: 'ason', aliases: [], category: 'Extras',
    desc: 'Auto-sticker ON (shortcut)', usage: '.ason',
    run: async (ctx) => { ctx.store.autostickerChats.add(ctx.chatId); ctx.reply('✨ Auto-sticker ON!'); },
  },
  {
    name: 'asoff', aliases: [], category: 'Extras',
    desc: 'Auto-sticker OFF (shortcut)', usage: '.asoff',
    run: async (ctx) => { ctx.store.autostickerChats.delete(ctx.chatId); ctx.reply('✨ Auto-sticker OFF.'); },
  },
  {
    name: 'vv', aliases: [], category: 'Extras',
    desc: 'View-once photo/video ko normal bana ke wapas bhejo',
    usage: '.vv (view-once pe reply karke)',
    run: async (ctx) => {
      try {
        const qm = H.getQuotedMessage(ctx.msg);
        if (!qm) return ctx.reply('👁️ Kisi view-once photo/video pe reply karke .vv likho.');
        const mtype = H.mediaType(qm);
        if (mtype !== 'image' && mtype !== 'video') return ctx.reply('👁️ Ye view-once photo/video nahi lagta.');
        const buf = await H.downloadRaw(ctx.sock, { key: ctx.msg.key, message: qm });
        if (!buf) return ctx.reply('❌ Download fail ho gaya. Dobara try karo.');
        if (mtype === 'image') await H.sendImage(ctx.sock, ctx.chatId, buf, '👁️ View-once revealed!', ctx.msg);
        else await H.sendVideo(ctx.sock, ctx.chatId, buf, '👁️ View-once revealed!', ctx.msg);
      } catch { ctx.reply('❌ Kuch gadbad ho gayi.'); }
    },
  },
  {
    name: 'viewonce', aliases: [], category: 'Extras',
    desc: 'View-once reveal (vv jaisa)', usage: '.viewonce (view-once pe reply karke)',
    run: async (ctx) => {
      try {
        const qm = H.getQuotedMessage(ctx.msg);
        if (!qm) return ctx.reply('👁️ Kisi view-once photo/video pe reply karke .viewonce likho.');
        const mtype = H.mediaType(qm);
        if (mtype !== 'image' && mtype !== 'video') return ctx.reply('👁️ Ye view-once photo/video nahi lagta.');
        const buf = await H.downloadRaw(ctx.sock, { key: ctx.msg.key, message: qm });
        if (!buf) return ctx.reply('❌ Download fail ho gaya. Dobara try karo.');
        if (mtype === 'image') await H.sendImage(ctx.sock, ctx.chatId, buf, '👁️ View-once revealed!', ctx.msg);
        else await H.sendVideo(ctx.sock, ctx.chatId, buf, '👁️ View-once revealed!', ctx.msg);
      } catch { ctx.reply('❌ Kuch gadbad ho gayi.'); }
    },
  },
  {
    name: 'save', aliases: [], category: 'Extras',
    desc: 'Quoted photo/video ko document (file) bana ke save karo — status saver jaisa',
    usage: '.save (photo/video pe reply karke)',
    run: async (ctx) => {
      try {
        const qm = (await H.getQuotedBuffer(ctx.sock, ctx.msg)) || (await H.getMediaBuffer(ctx.sock, ctx.msg));
        if (!qm || (qm.mtype !== 'image' && qm.mtype !== 'video'))
          return ctx.reply('💾 Kisi photo/video pe reply karke .save likho.');
        const ext = qm.mtype === 'video' ? 'mp4' : 'jpg';
        await H.sendDoc(ctx.sock, ctx.chatId, qm.buffer, `saved-media.${ext}`, qm.mtype === 'video' ? 'video/mp4' : 'image/jpeg', ctx.msg, '💾 Save ho gaya!');
      } catch { ctx.reply('❌ Save nahi ho paya.'); }
    },
  },
  {
    name: 'savestatus', aliases: [], category: 'Extras',
    desc: 'Status saver — quoted media file bana ke bhejo', usage: '.savestatus (media pe reply karke)',
    run: async (ctx) => {
      try {
        const qm = (await H.getQuotedBuffer(ctx.sock, ctx.msg)) || (await H.getMediaBuffer(ctx.sock, ctx.msg));
        if (!qm || (qm.mtype !== 'image' && qm.mtype !== 'video'))
          return ctx.reply('💾 Kisi photo/video pe reply karke .savestatus likho.');
        const ext = qm.mtype === 'video' ? 'mp4' : 'jpg';
        await H.sendDoc(ctx.sock, ctx.chatId, qm.buffer, `status.${ext}`, qm.mtype === 'video' ? 'video/mp4' : 'image/jpeg', ctx.msg, '💾 Status save ho gaya!');
      } catch { ctx.reply('❌ Save nahi ho paya.'); }
    },
  },
  {
    name: 'autoreact', aliases: [], category: 'Extras',
    desc: 'Har command par auto emoji react (on/off)', usage: '.autoreact on',
    run: async (ctx) => {
      const r = onOff(ctx.store.autoreactChats, ctx.chatId, (ctx.args[0] || '').toLowerCase());
      if (!r) return ctx.reply('💡 Usage: .autoreact on / off');
      ctx.reply(r === 'ON' ? '⚡ Auto-react ON! Ab har command par react aayega.' : '⚡ Auto-react OFF.');
    },
  },
  {
    name: 'aron', aliases: [], category: 'Extras',
    desc: 'Auto-react ON (shortcut)', usage: '.aron',
    run: async (ctx) => { ctx.store.autoreactChats.add(ctx.chatId); ctx.reply('⚡ Auto-react ON!'); },
  },
  {
    name: 'aroff', aliases: [], category: 'Extras',
    desc: 'Auto-react OFF (shortcut)', usage: '.aroff',
    run: async (ctx) => { ctx.store.autoreactChats.delete(ctx.chatId); ctx.reply('⚡ Auto-react OFF.'); },
  },
  {
    name: 'react', aliases: [], category: 'Extras',
    desc: 'Kisi message pe emoji react karo', usage: '.react ❤️ (message pe reply karke)',
    run: async (ctx) => {
      try {
        const emoji = ctx.args[0] || '❤️';
        const inner = H.unwrap(ctx.msg);
        const c = inner?.extendedTextMessage?.contextInfo || inner?.imageMessage?.contextInfo || inner?.videoMessage?.contextInfo;
        let key = ctx.msg.key;
        if (c?.stanzaId) {
          key = { remoteJid: ctx.chatId, id: c.stanzaId, participant: c.participant, fromMe: false };
        }
        await ctx.sock.sendMessage(ctx.chatId, { react: { text: emoji, key } });
      } catch { ctx.reply('❌ React nahi ho paya.'); }
    },
  },
  {
    name: 'getpp', aliases: [], category: 'Extras',
    desc: 'Kisi ki profile photo nikalo', usage: '.getpp (reply/tag ya khud)',
    run: async (ctx) => {
      try {
        const target = H.getMentioned(ctx.msg)[0] || H.getQuotedSender(ctx.msg) || ctx.sender;
        const url = await ctx.sock.profilePictureUrl(target, 'image').catch(() => null);
        if (!url) return ctx.reply('🖼️ DP nahi mili (private hai ya set nahi hai).');
        const buf = await apiGetBuffer(url);
        if (!buf) return ctx.reply('🖼️ DP download nahi ho payi.');
        await H.sendImage(ctx.sock, ctx.chatId, buf, '🖼️ Profile photo', ctx.msg);
      } catch { ctx.reply('❌ Kuch gadbad ho gayi.'); }
    },
  },
];
