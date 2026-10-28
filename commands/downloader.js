'use strict';
/**
 * Downloader category - 40 commands.
 * Video/link downloaders use the Cobalt API wrapper (lib/cobalt).
 * Free no-key APIs only. Every handler null-checks results and never crashes.
 */
const cobalt = require('../lib/cobalt');
const api = require('../lib/api');
const H = require('../lib/helpers');
const config = require('../config');

const FAIL = '❌ Download fail ho gaya. Link sahi hai na? Koi dusra link try karo.';
const HINT = '.dl <video link> bhejo';
const DONE = '✅ Ho gaya! VIP MMD Bot';

function qualityOf(text) {
  return /480/.test(String(text || '')) ? '480' : '720';
}

async function cobaltVideo(ctx, url, audioOnly) {
  const { sock, chatId, msg, reply, text } = ctx;
  if (!url) { await reply('📥 Pehle link to bhejo!\nUsage: ' + HINT); return; }
  try {
    const opts = audioOnly ? { audio: true } : { quality: qualityOf(text) };
    const r = await cobalt.cobaltDownload(url, opts);
    if (!r || !r.buffer) { await reply(FAIL); return; }
    if (audioOnly) await H.sendAudio(sock, chatId, r.buffer, msg);
    else await H.sendVideo(sock, chatId, r.buffer, DONE, msg);
  } catch (e) {
    await reply(FAIL);
  }
}

async function cobaltUrl(ctx, audioOnly) {
  await cobaltVideo(ctx, ctx.args[0], audioOnly);
}

/* per-platform wrappers: every one calls cobalt with the same pattern */
function plat(name, desc) {
  return {
    name,
    aliases: [],
    category: 'Downloader',
    desc,
    usage: HINT,
    async run(ctx) { await cobaltUrl(ctx, false); }
  };
}

async function ytSearch(q) {
  if (!q) return null;
  try {
    const d = await api.apiGet('https://pipedapi.kavin.rocks/search?q=' + encodeURIComponent(q) + '&filter=videos');
    return (d && d.items && d.items[0]) ? d.items[0] : null;
  } catch (e) { return null; }
}
function ytWatchUrl(id) { return 'https://www.youtube.com/watch?v=' + id; }

module.exports = [
  plat('dl', 'Kisi bhi supported link se video download karo'),
  plat('tiktok', 'TikTok video download (watermark-free)'),
  plat('tt', 'TikTok video download (short alias)'),
  plat('ig', 'Instagram post/reel download'),
  plat('reel', 'Instagram reel download'),
  plat('igdl', 'Instagram download (alias)'),
  plat('fb', 'Facebook video download'),
  plat('fbdl', 'Facebook video download (alias)'),
  plat('x', 'X (Twitter) video download'),
  plat('twitter', 'Twitter video download'),
  plat('reddit', 'Reddit video download'),
  plat('pinterest', 'Pinterest video download'),
  plat('threads', 'Threads video download'),
  plat('snackvideo', 'SnackVideo download'),
  plat('moj', 'Moj short video download'),
  plat('josh', 'Josh short video download'),
  plat('chingari', 'Chingari short video download'),
  plat('rumble', 'Rumble video download'),
  plat('odysee', 'Odysee video download'),
  plat('streamable', 'Streamable video download'),
  plat('dailymotion', 'Dailymotion video download'),
  plat('dm', 'Dailymotion download (short alias)'),
  plat('vimeo', 'Vimeo video download'),
  plat('soundcloud', 'SoundCloud track download'),
  plat('sc', 'SoundCloud download (short alias)'),
  plat('mp4', 'Link se mp4 video download'),
  plat('yt', 'YouTube video download'),
  plat('ytdl', 'YouTube video download (alias)'),
  plat('ytshorts', 'YouTube Shorts download'),

  /* ---- audio variants ---- */
  {
    name: 'audio',
    aliases: ['mp3'],
    category: 'Downloader',
    desc: 'Link se audio (mp3) nikalo',
    usage: '.audio <video link> bhejo',
    async run(ctx) { await cobaltUrl(ctx, true); }
  },
  {
    name: 'ytmp3',
    aliases: [],
    category: 'Downloader',
    desc: 'YouTube video se mp3 audio nikalo',
    usage: '.ytmp3 <youtube link> bhejo',
    async run(ctx) { await cobaltUrl(ctx, true); }
  },

  /* ---- kwai: cobalt first, direct fallback ---- */
  {
    name: 'kwai',
    aliases: [],
    category: 'Downloader',
    desc: 'Kwai/Kuaishou video download',
    usage: '.kwai <kwai link> bhejo',
    async run(ctx) {
      const { sock, chatId, msg, reply, args, text } = ctx;
      const url = args[0];
      if (!url) { await reply('📥 Pehle link to bhejo!\nUsage: .kwai <kwai link>'); return; }
      try {
        let r = await cobalt.cobaltDownload(url, { quality: qualityOf(text) });
        if (!r || !r.buffer) r = await cobalt.kwaiDirect(url);
        if (!r || !r.buffer) { await reply(FAIL); return; }
        await H.sendVideo(sock, chatId, r.buffer, DONE, msg);
      } catch (e) {
        await reply(FAIL);
      }
    }
  },

  /* ---- igstory: honest limitation ---- */
  {
    name: 'igstory',
    aliases: [],
    category: 'Downloader',
    desc: 'Instagram story download (limitations)',
    usage: '.igstory <story link>',
    async run(ctx) {
      await ctx.reply('📸 Insta story download ke liye login chahiye hota hai — bot me possible nahi. Post/reel ka link bhejo.');
    }
  },

  /* ---- terabox: unsupported ---- */
  {
    name: 'terabox',
    aliases: [],
    category: 'Downloader',
    desc: 'Terabox download (unsupported)',
    usage: '.terabox <link>',
    async run(ctx) {
      await ctx.reply('📦 Terabox ka direct download supported nahi hai, bhai.');
    }
  },

  /* ---- spotify: oembed info only, honest note ---- */
  {
    name: 'spotify',
    aliases: [],
    category: 'Downloader',
    desc: 'Spotify track ki info + thumbnail',
    usage: '.spotify <spotify track link> bhejo',
    async run(ctx) {
      const { sock, chatId, msg, reply, args } = ctx;
      const url = args[0];
      if (!url) { await reply('📥 Pehle Spotify link to bhejo!\nUsage: .spotify <link>'); return; }
      try {
        const info = await api.apiGet('https://open.spotify.com/oembed?url=' + encodeURIComponent(url));
        if (!info || !info.title) { await reply(FAIL); return; }
        let out = '🎵 ' + (info.title || 'Track') + '\n👤 ' + (info.author_name || 'Unknown artist') + '\n🔗 ' + url + '\n\n⚠️ Spotify se direct mp3 download allowed nahi hai.';
        await reply(out);
        if (info.thumbnail_url) {
          const thumb = await api.apiGetBuffer(info.thumbnail_url);
          if (thumb) await H.sendImage(sock, chatId, thumb, '🎵 ' + info.title, msg);
        }
      } catch (e) {
        await reply(FAIL);
      }
    }
  },

  /* ---- mediafire: scrape direct download link ---- */
  {
    name: 'mediafire',
    aliases: [],
    category: 'Downloader',
    desc: 'MediaFire file download',
    usage: '.mediafire <mediafire link> bhejo',
    async run(ctx) {
      const { sock, chatId, msg, reply, args } = ctx;
      const url = args[0];
      if (!url) { await reply('📥 Pehle MediaFire link to bhejo!\nUsage: .mediafire <link>'); return; }
      try {
        const page = await api.apiGetBuffer(url);
        if (!page) { await reply(FAIL); return; }
        const html = page.toString('utf8');
        const m = html.match(/https?:\/\/download\d*\.mediafire\.com\/[^\s"'<>]+/);
        if (!m) { await reply(FAIL); return; }
        const buf = await api.apiGetBuffer(m[0]);
        if (!buf) { await reply(FAIL); return; }
        const name = decodeURIComponent(m[0].split('/').pop().split('?')[0] || 'mediafire-file');
        await H.sendDoc(sock, chatId, buf, name, 'application/octet-stream', msg);
      } catch (e) {
        await reply(FAIL);
      }
    }
  },

  /* ---- gdrive: id extraction + direct dl ---- */
  {
    name: 'gdrive',
    aliases: [],
    category: 'Downloader',
    desc: 'Google Drive file download',
    usage: '.gdrive <drive share link> bhejo',
    async run(ctx) {
      const { sock, chatId, msg, reply, args } = ctx;
      const url = args[0];
      if (!url) { await reply('📥 Pehle Google Drive link to bhejo!\nUsage: .gdrive <link>'); return; }
      try {
        let id = null;
        const m1 = String(url).match(/\/d\/([^\/]+)/);
        const m2 = String(url).match(/[?&]id=([^&]+)/);
        if (m1) id = m1[1];
        else if (m2) id = m2[1];
        if (!id) { await reply(FAIL); return; }
        const buf = await api.apiGetBuffer('https://drive.google.com/uc?export=download&id=' + id);
        if (!buf) { await reply(FAIL); return; }
        await H.sendDoc(sock, chatId, buf, 'gdrive-file', 'application/octet-stream', msg);
      } catch (e) {
        await reply(FAIL);
      }
    }
  },

  /* ---- yts: youtube search ---- */
  {
    name: 'yts',
    aliases: [],
    category: 'Downloader',
    desc: 'YouTube search karo',
    usage: '.yts <search text>',
    async run(ctx) {
      const { reply, text } = ctx;
      const q = String(text || '').trim();
      if (!q) { await reply('🔎 Pehle search text to bhejo!\nUsage: .yts <song/video name>'); return; }
      try {
        const item = await ytSearch(q);
        if (item && item.url) {
          const id = String(item.url).split('v=')[1] || String(item.url).split('/').pop();
          await reply('🎬 ' + item.title + '\n' + ytWatchUrl(id) + '\n\nDownload: .dl <link>');
        } else {
          await reply('🔎 https://www.youtube.com/results?search_query=' + encodeURIComponent(q));
        }
      } catch (e) {
        await reply('❌ Search me dikkat aayi, phir try karo.');
      }
    }
  },

  /* ---- play / song: search + audio download ---- */
  {
    name: 'play',
    aliases: [],
    category: 'Downloader',
    desc: 'Song search karke audio bhejo',
    usage: '.play <song name>',
    async run(ctx) {
      const { sock, chatId, msg, reply, text } = ctx;
      const q = String(text || '').trim();
      if (!q) { await reply('🎵 Pehle song ka naam to bhejo!\nUsage: .play <song name>'); return; }
      try {
        const item = await ytSearch(q);
        if (!item || !item.url) { await reply('❌ Gaana nahi mila. Spelling check karke phir try karo.'); return; }
        const id = String(item.url).split('v=')[1] || String(item.url).split('/').pop();
        await reply('⏳ Download ho raha hai: ' + item.title);
        const r = await cobalt.cobaltDownload(ytWatchUrl(id), { audio: true });
        if (!r || !r.buffer) { await reply(FAIL); return; }
        await H.sendAudio(sock, chatId, r.buffer, msg);
      } catch (e) {
        await reply(FAIL);
      }
    }
  },
  {
    name: 'song',
    aliases: [],
    category: 'Downloader',
    desc: 'Song search karke audio bhejo (alias)',
    usage: '.song <song name>',
    async run(ctx) {
      const { sock, chatId, msg, reply, text } = ctx;
      const q = String(text || '').trim();
      if (!q) { await reply('🎵 Pehle song ka naam to bhejo!\nUsage: .song <song name>'); return; }
      try {
        const item = await ytSearch(q);
        if (!item || !item.url) { await reply('❌ Gaana nahi mila. Spelling check karke phir try karo.'); return; }
        const id = String(item.url).split('v=')[1] || String(item.url).split('/').pop();
        await reply('⏳ Download ho raha hai: ' + item.title);
        const r = await cobalt.cobaltDownload(ytWatchUrl(id), { audio: true });
        if (!r || !r.buffer) { await reply(FAIL); return; }
        await H.sendAudio(sock, chatId, r.buffer, msg);
      } catch (e) {
        await reply(FAIL);
      }
    }
  }
];
