'use strict';

// Sticker category — 22 commands (public-by-default, no adminOnly/ownerOnly/groupOnly).
// Uses only: ../lib/api (apiGetBuffer), ../lib/sticker, ../lib/helpers (as H), node builtins.

const { apiGetBuffer } = require('../lib/api');
const {
  toStickerBuffer,
  stickerToPng,
  cropSquare,
  textSticker,
  memeSticker,
  imageEffect,
  watermarkImage,
} = require('../lib/sticker');
const H = require('../lib/helpers');

// --- shared helpers ---------------------------------------------------------

async function getAnyImageBuffer(sock, msg) {
  // quoted first, then own message media
  const q = await H.getQuotedBuffer(sock, msg);
  if (q) return q;
  return await H.getMediaBuffer(sock, msg);
}

function errReply(ctx, fallback) {
  return ctx.reply(fallback || '😅 Kuch gadbad ho gayi, thodi der baad try karo.');
}

module.exports = [
  // ---------------------------------------------------------------- sticker
  {
    name: 'sticker',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ko sticker banao',
    usage: '.sticker (photo pe reply ya caption me)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await H.getQuotedBuffer(sock, msg) || await H.getMediaBuffer(sock, msg);
        if (!media) return ctx.reply('🖼️ Kisi photo pe reply karke .sticker likho, ya photo ke caption me .sticker likho.');
        if (media.mtype === 'video') return ctx.reply('🎞️ Video sticker ke liye ffmpeg chahiye jo server pe nahi hai — photo use karo.');
        const st = await toStickerBuffer(media.buffer);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, dusri photo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ---------------------------------------------------------------------- s
  {
    name: 's',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker ka shortcut (same as .sticker)',
    usage: '.s (photo pe reply ya caption me)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await H.getQuotedBuffer(sock, msg) || await H.getMediaBuffer(sock, msg);
        if (!media) return ctx.reply('🖼️ Kisi photo pe reply karke .s likho, ya photo ke caption me .s likho.');
        if (media.mtype === 'video') return ctx.reply('🎞️ Video sticker ke liye ffmpeg chahiye jo server pe nahi hai — photo use karo.');
        const st = await toStickerBuffer(media.buffer);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, dusri photo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------ smeme
  {
    name: 'smeme',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo pe top/bottom meme text lagake sticker banao',
    usage: '.smeme top text | bottom text (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId, text } = ctx;
      try {
        const media = await H.getQuotedBuffer(sock, msg) || await H.getMediaBuffer(sock, msg);
        if (!media || media.mtype === 'video') {
          return ctx.reply('🖼️ Pehle kisi photo pe reply karo, phir .smeme likho.\nUsage: .smeme top text | bottom text');
        }
        const parts = String(text || '').split('|').map(s => s.trim());
        const top = parts[0] || '';
        const bottom = parts[1] || '';
        if (!top && !bottom) return ctx.reply('✍️ Text bhi likho!\nUsage: .smeme top text | bottom text');
        const st = await memeSticker(media.buffer, top, bottom);
        if (!st) return ctx.reply('😅 Meme sticker nahi ban paya, dusri photo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------ memesticker
  {
    name: 'memesticker',
    aliases: [],
    category: 'Sticker',
    desc: 'Meme text wala sticker (same as .smeme)',
    usage: '.memesticker top text | bottom text (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId, text } = ctx;
      try {
        const media = await H.getQuotedBuffer(sock, msg) || await H.getMediaBuffer(sock, msg);
        if (!media || media.mtype === 'video') {
          return ctx.reply('🖼️ Pehle kisi photo pe reply karo, phir .memesticker likho.\nUsage: .memesticker top text | bottom text');
        }
        const parts = String(text || '').split('|').map(s => s.trim());
        const top = parts[0] || '';
        const bottom = parts[1] || '';
        if (!top && !bottom) return ctx.reply('✍️ Text bhi likho!\nUsage: .memesticker top text | bottom text');
        const st = await memeSticker(media.buffer, top, bottom);
        if (!st) return ctx.reply('😅 Meme sticker nahi ban paya, dusri photo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // --------------------------------------------------------------------- ttp
  {
    name: 'ttp',
    aliases: [],
    category: 'Sticker',
    desc: 'Text se sticker banao',
    usage: '.ttp hello dosto',
    run: async (ctx) => {
      const { sock, chatId, msg, text } = ctx;
      try {
        const t = String(text || '').trim().slice(0, 40);
        if (!t) return ctx.reply('✍️ Kuch text to likho!\nUsage: .ttp hello dosto');
        const st = await textSticker(t);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, phir try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // -------------------------------------------------------------------- attp
  {
    name: 'attp',
    aliases: [],
    category: 'Sticker',
    desc: 'Text sticker (static style — animated ke liye ffmpeg chahiye jo server pe nahi hai)',
    usage: '.attp hello dosto',
    run: async (ctx) => {
      const { sock, chatId, msg, text } = ctx;
      try {
        const t = String(text || '').trim().slice(0, 40);
        if (!t) return ctx.reply('✍️ Kuch text to likho!\nUsage: .attp hello dosto');
        const st = await textSticker(t);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, phir try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ---------------------------------------------------------------- emojimix
  {
    name: 'emojimix',
    aliases: [],
    category: 'Sticker',
    desc: 'Do emoji ko mix karke sticker banao',
    usage: '.emojimix 😀 😎',
    run: async (ctx) => {
      const { sock, chatId, msg, args } = ctx;
      try {
        const list = (args || []).filter(Boolean);
        if (list.length < 2) return ctx.reply('😀 Do emoji likho!\nUsage: .mix 😀 😎');
        const url = 'https://emojik.vercel.app/s/' + encodeURIComponent(list[0]) + '_' + encodeURIComponent(list[1]);
        const buf = await apiGetBuffer(url);
        if (!buf) return ctx.reply('😅 Ye combo nahi mila, kuch aur try karo.');
        const st = await toStickerBuffer(buf);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, dusra combo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // --------------------------------------------------------------------- mix
  {
    name: 'mix',
    aliases: [],
    category: 'Sticker',
    desc: 'Emoji mix ka shortcut (same as .emojimix)',
    usage: '.mix 😀 😎',
    run: async (ctx) => {
      const { sock, chatId, msg, args } = ctx;
      try {
        const list = (args || []).filter(Boolean);
        if (list.length < 2) return ctx.reply('😀 Do emoji likho!\nUsage: .mix 😀 😎');
        const url = 'https://emojik.vercel.app/s/' + encodeURIComponent(list[0]) + '_' + encodeURIComponent(list[1]);
        const buf = await apiGetBuffer(url);
        if (!buf) return ctx.reply('😅 Ye combo nahi mila, kuch aur try karo.');
        const st = await toStickerBuffer(buf);
        if (!st) return ctx.reply('😅 Sticker nahi ban paya, dusra combo try karo.');
        await H.sendSticker(sock, chatId, st, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // --------------------------------------------------------------- stickerwm
  {
    name: 'stickerwm',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker watermark (pack name | author) save karo',
    usage: '.stickerwm My Pack | Your Name',
    run: async (ctx) => {
      try {
        const parts = String(ctx.text || '').split('|').map(s => s.trim());
        const pack = parts[0] || '';
        const author = parts[1] || '';
        if (!pack && !author) return ctx.reply('✍️ Pack name aur author likho!\nUsage: .stickerwm My Pack | Your Name');
        if (ctx.store && ctx.store.stickerWm && typeof ctx.store.stickerWm.set === 'function') {
          ctx.store.stickerWm.set(ctx.sender, { pack, author });
        }
        return ctx.reply('✅ Watermark save ho gaya! (Note: webp metadata editor ke bina pack name sticker pe show nahi hoga)');
      } catch (e) { return errReply(ctx); }
    },
  },
  // --------------------------------------------------------------------- swm
  {
    name: 'swm',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker watermark shortcut (same as .stickerwm)',
    usage: '.swm My Pack | Your Name',
    run: async (ctx) => {
      try {
        const parts = String(ctx.text || '').split('|').map(s => s.trim());
        const pack = parts[0] || '';
        const author = parts[1] || '';
        if (!pack && !author) return ctx.reply('✍️ Pack name aur author likho!\nUsage: .swm My Pack | Your Name');
        if (ctx.store && ctx.store.stickerWm && typeof ctx.store.stickerWm.set === 'function') {
          ctx.store.stickerWm.set(ctx.sender, { pack, author });
        }
        return ctx.reply('✅ Watermark save ho gaya! (Note: webp metadata editor ke bina pack name sticker pe show nahi hoga)');
      } catch (e) { return errReply(ctx); }
    },
  },
  // -------------------------------------------------------------------- take
  {
    name: 'take',
    aliases: [],
    category: 'Sticker',
    desc: 'Dusre ka sticker chura lo',
    usage: '.take (sticker pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const q = await H.getQuotedBuffer(sock, msg);
        if (!q || q.mtype !== 'sticker') return ctx.reply('👆 Kisi sticker pe reply karke .take likho.');
        await H.sendSticker(sock, chatId, q.buffer, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------- steal
  {
    name: 'steal',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker chori ka shortcut (same as .take)',
    usage: '.steal (sticker pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const q = await H.getQuotedBuffer(sock, msg);
        if (!q || q.mtype !== 'sticker') return ctx.reply('👆 Kisi sticker pe reply karke .steal likho.');
        await H.sendSticker(sock, chatId, q.buffer, msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------- toimg
  {
    name: 'toimg',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker ko wapas photo (PNG) me badlo',
    usage: '.toimg (sticker pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const q = await H.getQuotedBuffer(sock, msg);
        if (!q || q.mtype !== 'sticker') return ctx.reply('👆 Kisi sticker pe reply karke .toimg likho.');
        const png = await stickerToPng(q.buffer);
        if (!png) return ctx.reply('😅 Photo nahi ban payi, phir try karo.');
        await H.sendImage(sock, chatId, png, '🖼️ Ye raha photo!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------- photo
  {
    name: 'photo',
    aliases: [],
    category: 'Sticker',
    desc: 'Sticker ko photo me badlo (same as .toimg)',
    usage: '.photo (sticker pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const q = await H.getQuotedBuffer(sock, msg);
        if (!q || q.mtype !== 'sticker') return ctx.reply('👆 Kisi sticker pe reply karke .photo likho.');
        const png = await stickerToPng(q.buffer);
        if (!png) return ctx.reply('😅 Photo nahi ban payi, phir try karo.');
        await H.sendImage(sock, chatId, png, '🖼️ Ye raha photo!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // -------------------------------------------------------------------- crop
  {
    name: 'crop',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ko square me crop karo',
    usage: '.crop (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await cropSquare(media.buffer);
        if (!out) return ctx.reply('😅 Crop nahi ho paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '✂️ Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------ circle
  {
    name: 'circle',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ko gol (circle) shape me karo',
    usage: '.circle (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'circle');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '⭕ Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ----------------------------------------------------------------- trigger
  {
    name: 'trigger',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo pe trigger meme effect lagao',
    usage: '.trigger (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'trigger');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '😡 TRIGGERED!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------ wasted
  {
    name: 'wasted',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo pe GTA wasted effect lagao',
    usage: '.wasted (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'wasted');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '💀 WASTED!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // -------------------------------------------------------------------- jail
  {
    name: 'jail',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo pe jail bars effect lagao',
    usage: '.jail (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'jail');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '🚔 Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // -------------------------------------------------------------------- blur
  {
    name: 'blur',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ko blur karo',
    usage: '.blur (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'blur');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '🌫️ Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // ------------------------------------------------------------------ invert
  {
    name: 'invert',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ke colors ulta (invert) karo',
    usage: '.invert (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'invert');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '🔄 Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
  // --------------------------------------------------------------- grayscale
  {
    name: 'grayscale',
    aliases: [],
    category: 'Sticker',
    desc: 'Photo ko black & white karo',
    usage: '.grayscale (photo pe reply karke)',
    run: async (ctx) => {
      const { sock, msg, chatId } = ctx;
      try {
        const media = await getAnyImageBuffer(sock, msg);
        if (!media || media.mtype === 'video' || media.mtype === 'audio') {
          return ctx.reply('🖼️ Photo pe reply karke command likho.');
        }
        const out = await imageEffect(media.buffer, 'grayscale');
        if (!out) return ctx.reply('😅 Effect nahi lag paya, dusri photo try karo.');
        await H.sendImage(sock, chatId, out, '⬛ Ho gaya!', msg);
      } catch (e) { return errReply(ctx); }
    },
  },
];
