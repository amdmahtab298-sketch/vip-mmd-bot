'use strict';

// AI & Media — 28 commands. Pure-JS/HTTP only; no ffmpeg on the free server.
// All network results are null-checked + try/catch; failures reply in Hinglish.

const { apiGet, apiGetBuffer } = require('../lib/api');
const { cobaltDownload } = require('../lib/cobalt');
const { watermarkImage } = require('../lib/sticker');
const H = require('../lib/helpers');

const aiPrompt = async (ctx, text) => {
  try {
    const r = await apiGet('https://text.pollinations.ai/' + encodeURIComponent(text), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      transformResponse: x => x,
      responseType: 'text',
    });
    if (!r) return ctx.reply('🤖 AI abhi jawab nahi de paya. Thodi der me try karo.');
    ctx.reply('🤖 ' + String(r).slice(0, 1500));
  } catch (e) {
    ctx.reply('🤖 AI abhi jawab nahi de paya. Thodi der me try karo.');
  }
};

const imaginePrompt = async (ctx, prompt) => {
  try {
    const buf = await apiGetBuffer(
      'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=768&height=768&nologo=true'
    );
    if (!buf) return ctx.reply('🎨 Image ban nahi payi. Dobara try karo.');
    await H.sendImage(ctx.sock, ctx.chatId, buf, '🎨 ' + prompt.slice(0, 100), ctx.msg);
  } catch (e) {
    ctx.reply('🎨 Image ban nahi payi. Dobara try karo.');
  }
};

const toAudio = async (ctx) => {
  try {
    const first = ctx.args[0] || '';
    if (/^https?:\/\//i.test(first)) {
      const r = await cobaltDownload(first, { audio: true });
      if (!r || !r.url) return ctx.reply('🎵 Link se audio nahi mil paya. Dobara try karo.');
      const buf = await apiGetBuffer(r.url);
      if (!buf) return ctx.reply('🎵 Audio download nahi ho paya. Dobara try karo.');
      return H.sendAudio(ctx.sock, ctx.chatId, buf, ctx.msg);
    }
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg);
    if (qm && qm.mtype === 'video') {
      return ctx.reply('🎵 Bina ffmpeg ke video→audio convert nahi ho sakta (server limitation). Link do to Cobalt se audio nikaal dunga.');
    }
    if (qm && qm.mtype === 'audio') {
      return H.sendAudio(ctx.sock, ctx.chatId, qm.buffer, ctx.msg);
    }
    ctx.reply('🎵 Usage: .tomp3 <video-link> | audio message pe reply karo. Quoted video convert nahi ho sakta (no ffmpeg).');
  } catch (e) {
    ctx.reply('🎵 Audio nikalne me dikkat aayi. Dobara try karo.');
  }
};

const toVideo = async (ctx) => {
  try {
    const first = ctx.args[0] || '';
    if (/^https?:\/\//i.test(first)) {
      const r = await cobaltDownload(first, {});
      if (!r || !r.url) return ctx.reply('🎬 Link se video nahi mil paya. Dobara try karo.');
      const buf = await apiGetBuffer(r.url);
      if (!buf) return ctx.reply('🎬 Video download nahi ho paya. Dobara try karo.');
      return H.sendVideo(ctx.sock, ctx.chatId, buf, '', ctx.msg);
    }
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg);
    if (qm && qm.mtype === 'video') {
      return H.sendVideo(ctx.sock, ctx.chatId, qm.buffer, '', ctx.msg);
    }
    ctx.reply('🎬 Usage: .tomp4 <video-link> | video pe reply karo.');
  } catch (e) {
    ctx.reply('🎬 Video lane me dikkat aayi. Dobara try karo.');
  }
};

const ttsSpeak = async (ctx) => {
  try {
    let tl = 'hi';
    let q = (ctx.text || '').trim();
    const m = q.match(/^([a-z]{2})\|(.*)$/s);
    if (m) { tl = m[1]; q = m[2].trim(); }
    if (!q) return ctx.reply('🔊 Usage: .tts hello world (default Hindi) | .tts en|hello world');
    q = q.slice(0, 180);
    const buf = await apiGetBuffer(
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + tl + '&q=' + encodeURIComponent(q),
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!buf) return ctx.reply('🔊 Voice ban nahi payi. Dobara try karo.');
    await H.sendPtt(ctx.sock, ctx.chatId, buf, ctx.msg);
  } catch (e) {
    ctx.reply('🔊 Voice ban nahi payi. Dobara try karo.');
  }
};

const wallpaper = async (ctx) => {
  try {
    const seed = (ctx.args[0] || 'nature').slice(0, 40);
    const buf = await apiGetBuffer('https://picsum.photos/seed/' + encodeURIComponent(seed) + '/768/1280');
    if (!buf) return ctx.reply('🖼️ Wallpaper nahi mil paya. Dobara try karo.');
    await H.sendImage(ctx.sock, ctx.chatId, buf, '🖼️ Wallpaper: ' + seed, ctx.msg);
  } catch (e) {
    ctx.reply('🖼️ Wallpaper nahi mil paya. Dobara try karo.');
  }
};

const fileInfo = async (ctx) => {
  try {
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg) || await H.getMediaBuffer(ctx.sock, ctx.msg);
    if (!qm) return ctx.reply('📁 Usage: file pe reply karke .fileinfo likho.');
    ctx.reply('📁 Type: ' + qm.mtype + '\n📦 Size: ' + (qm.buffer.length / 1024).toFixed(1) + ' KB');
  } catch (e) {
    ctx.reply('📁 File info nahi padh paya. Dobara try karo.');
  }
};

const vidInfo = async (ctx) => {
  try {
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg) || await H.getMediaBuffer(ctx.sock, ctx.msg);
    if (!qm || qm.mtype !== 'video') return ctx.reply('🎬 Kisi video pe reply karke .vidinfo likho.');
    ctx.reply('🎬 Type: video\n📦 Size: ' + (qm.buffer.length / 1024).toFixed(1) + ' KB');
  } catch (e) {
    ctx.reply('🎬 Video info nahi padh paya. Dobara try karo.');
  }
};

const audInfo = async (ctx) => {
  try {
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg) || await H.getMediaBuffer(ctx.sock, ctx.msg);
    if (!qm || qm.mtype !== 'audio') return ctx.reply('🎧 Kisi audio pe reply karke .audinfo likho.');
    ctx.reply('🎧 Type: audio\n📦 Size: ' + (qm.buffer.length / 1024).toFixed(1) + ' KB');
  } catch (e) {
    ctx.reply('🎧 Audio info nahi padh paya. Dobara try karo.');
  }
};

const paidKeyMsg = (ctx) => ctx.reply('🔑 Iske liye paid API key chahiye jo abhi configured nahi hai. Key lagegi to ye command live ho jayega.');

const makePdf = async (ctx) => {
  try {
    const content = (ctx.text || '').trim();
    if (!content) return ctx.reply('📄 Usage: .pdf <text> — text se PDF banao.');
    const { PDFDocument, StandardFonts } = require('pdf-lib');
    const doc = await PDFDocument.create();
    const page = doc.addPage([500, 700]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(content.slice(0, 2000), { x: 40, y: 650, size: 12, font, maxWidth: 420 });
    const bytes = await doc.save();
    await H.sendDoc(ctx.sock, ctx.chatId, Buffer.from(bytes), 'document.pdf', 'application/pdf', ctx.msg);
  } catch (e) {
    ctx.reply('📄 PDF ban nahi paya. Dobara try karo.');
  }
};

const qrRead = (ctx) => ctx.reply('👁️ Photo padhna (vision) is bot me available nahi hai.');

const compress = async (ctx) => {
  try {
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg) || await H.getMediaBuffer(ctx.sock, ctx.msg);
    if (!qm || (qm.mtype !== 'image' && qm.mtype !== 'video')) {
      return ctx.reply('📦 Usage: image/video pe reply karke .compress likho.');
    }
    const name = 'media' + (qm.mtype === 'video' ? '.mp4' : '.jpg');
    await H.sendDoc(ctx.sock, ctx.chatId, qm.buffer, name, 'application/octet-stream', ctx.msg, '📦 Document ke roop me bheja (no compression loss). Free server pe real compression (ffmpeg) possible nahi hai.');
  } catch (e) {
    ctx.reply('📦 File bhejne me dikkat aayi. Dobara try karo.');
  }
};

const splitMergeMsg = (ctx) => ctx.reply('✂️ Video split/merge ke liye ffmpeg chahiye jo free server pe nahi hai — ye limitation hai.');

const watermark = async (ctx) => {
  try {
    const qm = await H.getQuotedBuffer(ctx.sock, ctx.msg) || await H.getMediaBuffer(ctx.sock, ctx.msg);
    const t = (ctx.text || '').trim();
    if (!qm || qm.mtype !== 'image' || !t) {
      return ctx.reply('©️ Usage: image pe reply karke .watermark <text> likho.');
    }
    const out = await watermarkImage(qm.buffer, t.slice(0, 60));
    if (!out) return ctx.reply('©️ Watermark lag nahi paya. Dobara try karo.');
    await H.sendImage(ctx.sock, ctx.chatId, out, '©️ Watermark lag gaya!', ctx.msg);
  } catch (e) {
    ctx.reply('©️ Watermark lag nahi paya. Dobara try karo.');
  }
};

module.exports = [
  { name: 'ai', aliases: [], category: 'AI & Media', desc: 'AI se sawal pucho', usage: '.ai <sawal>', run: async (ctx) => { const t = (ctx.text || '').trim(); if (!t) return ctx.reply('🤖 Usage: .ai <sawal>'); return aiPrompt(ctx, t); } },
  { name: 'gpt', aliases: [], category: 'AI & Media', desc: 'AI se sawal pucho', usage: '.gpt <sawal>', run: async (ctx) => { const t = (ctx.text || '').trim(); if (!t) return ctx.reply('🤖 Usage: .gpt <sawal>'); return aiPrompt(ctx, t); } },
  { name: 'ask', aliases: [], category: 'AI & Media', desc: 'AI se sawal pucho', usage: '.ask <sawal>', run: async (ctx) => { const t = (ctx.text || '').trim(); if (!t) return ctx.reply('🤖 Usage: .ask <sawal>'); return aiPrompt(ctx, t); } },
  { name: 'imagine', aliases: [], category: 'AI & Media', desc: 'Text se AI image banao', usage: '.imagine <prompt>', run: async (ctx) => { const t = (ctx.text || '').trim(); if (!t) return ctx.reply('🎨 Usage: .imagine <prompt>'); return imaginePrompt(ctx, t); } },
  { name: 'imggen', aliases: [], category: 'AI & Media', desc: 'Text se AI image banao', usage: '.imggen <prompt>', run: async (ctx) => { const t = (ctx.text || '').trim(); if (!t) return ctx.reply('🎨 Usage: .imggen <prompt>'); return imaginePrompt(ctx, t); } },
  { name: 'toaudio', aliases: [], category: 'AI & Media', desc: 'Link se audio nikalo / audio resend', usage: '.toaudio <link>', run: toAudio },
  { name: 'tomp3', aliases: [], category: 'AI & Media', desc: 'Link se audio nikalo / audio resend', usage: '.tomp3 <link>', run: toAudio },
  { name: 'tovideo', aliases: [], category: 'AI & Media', desc: 'Link se video download karo', usage: '.tovideo <link>', run: toVideo },
  { name: 'tomp4', aliases: [], category: 'AI & Media', desc: 'Link se video download karo', usage: '.tomp4 <link>', run: toVideo },
  { name: 'tts', aliases: [], category: 'AI & Media', desc: 'Text ko voice me suno', usage: '.tts <text> | .tts en|<text>', run: ttsSpeak },
  { name: 'say', aliases: [], category: 'AI & Media', desc: 'Text ko voice me suno', usage: '.say <text> | .say en|<text>', run: ttsSpeak },
  { name: 'speak', aliases: [], category: 'AI & Media', desc: 'Text ko voice me suno', usage: '.speak <text> | .speak en|<text>', run: ttsSpeak },
  { name: 'wallpaper', aliases: [], category: 'AI & Media', desc: 'Random HD wallpaper', usage: '.wallpaper [seed]', run: wallpaper },
  { name: 'wallpapers', aliases: [], category: 'AI & Media', desc: 'Random HD wallpaper', usage: '.wallpapers [seed]', run: wallpaper },
  { name: 'fileinfo', aliases: [], category: 'AI & Media', desc: 'File ka type aur size dekho', usage: '.fileinfo (file pe reply)', run: fileInfo },
  { name: 'bgremove', aliases: [], category: 'AI & Media', desc: 'Photo ka background hatao', usage: '.bgremove (photo pe reply)', run: async (ctx) => paidKeyMsg(ctx) },
  { name: 'upscale', aliases: [], category: 'AI & Media', desc: 'Photo ki quality badhao', usage: '.upscale (photo pe reply)', run: async (ctx) => paidKeyMsg(ctx) },
  { name: 'colorize', aliases: [], category: 'AI & Media', desc: 'Black-white photo ko rang do', usage: '.colorize (photo pe reply)', run: async (ctx) => paidKeyMsg(ctx) },
  { name: 'enhd', aliases: [], category: 'AI & Media', desc: 'Photo enhance karo', usage: '.enhd (photo pe reply)', run: async (ctx) => paidKeyMsg(ctx) },
  { name: 'pdf', aliases: [], category: 'AI & Media', desc: 'Text se PDF file banao', usage: '.pdf <text>', run: makePdf },
  { name: 'topdf', aliases: [], category: 'AI & Media', desc: 'Text se PDF file banao', usage: '.topdf <text>', run: makePdf },
  { name: 'qrread', aliases: [], category: 'AI & Media', desc: 'Photo ka QR padho', usage: '.qrread (photo pe reply)', run: async (ctx) => qrRead(ctx) },
  { name: 'vidinfo', aliases: [], category: 'AI & Media', desc: 'Video ka size dekho', usage: '.vidinfo (video pe reply)', run: vidInfo },
  { name: 'audinfo', aliases: [], category: 'AI & Media', desc: 'Audio ka size dekho', usage: '.audinfo (audio pe reply)', run: audInfo },
  { name: 'compress', aliases: [], category: 'AI & Media', desc: 'Media ko document ke roop me bhejo', usage: '.compress (media pe reply)', run: compress },
  { name: 'split', aliases: [], category: 'AI & Media', desc: 'Video split karo', usage: '.split', run: async (ctx) => splitMergeMsg(ctx) },
  { name: 'merge', aliases: [], category: 'AI & Media', desc: 'Videos merge karo', usage: '.merge', run: async (ctx) => splitMergeMsg(ctx) },
  { name: 'watermark', aliases: [], category: 'AI & Media', desc: 'Photo pe watermark text lagao', usage: '.watermark <text> (image pe reply)', run: watermark },
];
