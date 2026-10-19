// commands/search.js — 35 search/reference commands. Free no-key APIs only.
'use strict';
const { apiGet } = require('../lib/api');

const FALLBACK = 'Are yaar, service abhi respond nahi kar rahi. Thodi der me try karo.';
const enc = encodeURIComponent;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = [
  {
    name: 'google', aliases: [], category: 'Search',
    desc: 'Google par search karo', usage: '<query>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .google <query>');
      ctx.reply('🔎 Google search:\nhttps://www.google.com/search?q=' + enc(ctx.text));
    },
  },
  {
    name: 'image', aliases: [], category: 'Search',
    desc: 'Images search karo', usage: '<query>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .image <query>');
      ctx.reply('🖼️ Image search:\nhttps://www.google.com/search?tbm=isch&q=' + enc(ctx.text));
    },
  },
  {
    name: 'wiki', aliases: [], category: 'Search',
    desc: 'Wikipedia summary', usage: '<topic>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .wiki <topic>');
      const d = await apiGet('https://en.wikipedia.org/api/rest_v1/page/summary/' + enc(ctx.text));
      if (!d || !d.title) return ctx.reply(FALLBACK);
      ctx.reply('📚 *' + d.title + '*\n\n' + strip(d.extract).slice(0, 800) + (d.content_urls?.desktop?.page ? '\n\n🔗 ' + d.content_urls.desktop.page : ''));
    },
  },
  {
    name: 'lyrics', aliases: [], category: 'Search',
    desc: 'Gaane ke lyrics', usage: '<artist> | <title>',
    run: async (ctx) => {
      if (!ctx.text || !ctx.text.includes('|')) return ctx.reply('❌ Usage: .lyrics <artist> | <title>\nExample: .lyrics Arijit Singh | Tum Hi Ho');
      const [artist, title] = ctx.text.split('|').map(s => s.trim());
      if (!artist || !title) return ctx.reply('❌ Usage: .lyrics <artist> | <title>');
      const d = await apiGet('https://api.lyrics.ovh/v1/' + enc(artist) + '/' + enc(title));
      if (!d || !d.lyrics) return ctx.reply('❌ Lyrics nahi mile. Artist/title spelling check karo.');
      ctx.reply('🎵 *' + title + '* — ' + artist + '\n\n' + d.lyrics.slice(0, 2000));
    },
  },
  {
    name: 'movie', aliases: [], category: 'Search',
    desc: 'Movie ki info', usage: '<movie name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .movie <movie name>');
      let extra = '';
      const w = await apiGet('https://en.wikipedia.org/api/rest_v1/page/summary/' + enc(ctx.text + ' film'));
      if (w && w.title && !/disambiguation/i.test(w.type || '')) extra = '📖 ' + strip(w.extract).slice(0, 500) + '\n\n';
      ctx.reply(extra + '🎬 *' + ctx.text + '*\nIMDb: https://www.imdb.com/find?q=' + enc(ctx.text) + '\n\n⚠️ Note: bina key ke live movie API nahi hai, isliye full details IMDb link par dekho.');
    },
  },
  {
    name: 'tvshow', aliases: [], category: 'Search',
    desc: 'TV show ki info', usage: '<show name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .tvshow <show name>');
      const d = await apiGet('https://api.tvmaze.com/search/shows?q=' + enc(ctx.text));
      if (!d || !d.length || !d[0].show) return ctx.reply('❌ Show nahi mila.');
      const s = d[0].show;
      ctx.reply('📺 *' + s.name + '*\n⭐ Rating: ' + (s.rating?.average || 'N/A') + '\n📅 Premiered: ' + (s.premiered || 'N/A') + ' | Status: ' + (s.status || 'N/A') + '\n\n' + strip(s.summary).slice(0, 600));
    },
  },
  {
    name: 'anime', aliases: [], category: 'Search',
    desc: 'Anime ki info (MyAnimeList)', usage: '<anime name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .anime <anime name>');
      const d = await apiGet('https://api.jikan.moe/v4/anime?q=' + enc(ctx.text) + '&limit=1');
      if (!d || !d.data || !d.data.length) return ctx.reply('❌ Anime nahi mila.');
      const a = d.data[0];
      ctx.reply('🎌 *' + (a.title_english || a.title) + '*\n⭐ Score: ' + (a.score || 'N/A') + ' | 📺 Episodes: ' + (a.episodes || 'N/A') + ' | Type: ' + (a.type || 'N/A') + '\n\n' + strip(a.synopsis).slice(0, 600));
    },
  },
  {
    name: 'manga', aliases: [], category: 'Search',
    desc: 'Manga ki info (MyAnimeList)', usage: '<manga name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .manga <manga name>');
      const d = await apiGet('https://api.jikan.moe/v4/manga?q=' + enc(ctx.text) + '&limit=1');
      if (!d || !d.data || !d.data.length) return ctx.reply('❌ Manga nahi mila.');
      const a = d.data[0];
      ctx.reply('📖 *' + (a.title_english || a.title) + '*\n⭐ Score: ' + (a.score || 'N/A') + ' | 📚 Chapters: ' + (a.chapters || 'N/A') + '\n\n' + strip(a.synopsis).slice(0, 600));
    },
  },
  {
    name: 'character', aliases: [], category: 'Search',
    desc: 'Anime character ki info', usage: '<character name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .character <name>');
      const d = await apiGet('https://api.jikan.moe/v4/characters?q=' + enc(ctx.text) + '&limit=1');
      if (!d || !d.data || !d.data.length) return ctx.reply('❌ Character nahi mila.');
      const c = d.data[0];
      ctx.reply('👤 *' + c.name + '*\n\n' + strip(c.about).slice(0, 500));
    },
  },
  {
    name: 'github', aliases: [], category: 'Search',
    desc: 'GitHub user ya repo ki info', usage: '<user> ya <owner/repo>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .github <user> ya .github <owner/repo>');
      if (ctx.text.includes('/')) {
        const d = await apiGet('https://api.github.com/repos/' + ctx.text.trim());
        if (!d || !d.full_name) return ctx.reply('❌ Repo nahi mila.');
        ctx.reply('💻 *' + d.full_name + '*\n⭐ Stars: ' + d.stargazers_count + ' | 🍴 Forks: ' + d.forks_count + '\n🛠️ ' + (d.language || 'N/A') + '\n\n' + (d.description || 'No description'));
      } else {
        const d = await apiGet('https://api.github.com/users/' + ctx.text.trim());
        if (!d || !d.login) return ctx.reply('❌ User nahi mila.');
        ctx.reply('👨‍💻 *' + d.login + '*\n👥 Followers: ' + d.followers + ' | 📦 Repos: ' + d.public_repos + '\n\n' + (d.bio || 'No bio'));
      }
    },
  },
  {
    name: 'npm', aliases: [], category: 'Search',
    desc: 'NPM package ki info', usage: '<package>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .npm <package>');
      const d = await apiGet('https://registry.npmjs.org/' + enc(ctx.args[0]) + '/latest');
      if (!d || !d.name) return ctx.reply('❌ Package nahi mila.');
      ctx.reply('📦 *' + d.name + '* v' + d.version + '\n\n' + (d.description || 'No description'));
    },
  },
  {
    name: 'pypi', aliases: [], category: 'Search',
    desc: 'Python package ki info', usage: '<package>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .pypi <package>');
      const d = await apiGet('https://pypi.org/pypi/' + enc(ctx.args[0]) + '/json');
      if (!d || !d.info) return ctx.reply('❌ Package nahi mila.');
      ctx.reply('🐍 *' + d.info.name + '* v' + d.info.version + '\n\n' + (d.info.summary || 'No summary'));
    },
  },
  {
    name: 'playstore', aliases: [], category: 'Search',
    desc: 'Play Store par app search', usage: '<app name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .playstore <app name>');
      ctx.reply('📱 Play Store:\nhttps://play.google.com/store/search?q=' + enc(ctx.text));
    },
  },
  {
    name: 'weather', aliases: [], category: 'Search',
    desc: 'Mausam ki jaankari', usage: '[city]',
    run: async (ctx) => {
      const city = ctx.text || 'Mumbai';
      const d = await apiGet('https://wttr.in/' + enc(city) + '?format=j1');
      const c = d && d.current_condition && d.current_condition[0];
      if (!c) return ctx.reply(FALLBACK);
      ctx.reply('🌤️ *' + city + '* ka mausam:\n🌡️ Temp: ' + c.temp_C + '°C (feels ' + c.FeelsLikeC + '°C)\n☁️ ' + (c.weatherDesc && c.weatherDesc[0] ? c.weatherDesc[0].value : '') + '\n💧 Humidity: ' + c.humidity + '%\n💨 Wind: ' + c.windspeedKmph + ' km/h');
    },
  },
  {
    name: 'dictionary', aliases: [], category: 'Search',
    desc: 'English word ka meaning', usage: '<word>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .dictionary <word>');
      const d = await apiGet('https://api.dictionaryapi.dev/api/v2/entries/en/' + enc(ctx.args[0]));
      const m = d && d[0] && d[0].meanings && d[0].meanings[0] && d[0].meanings[0].definitions && d[0].meanings[0].definitions[0];
      if (!m) return ctx.reply('❌ Is word ka meaning nahi mila.');
      let out = '📖 *' + d[0].word + '* (' + d[0].meanings[0].partOfSpeech + ')\n\n' + m.definition;
      if (m.example) out += '\n\n💬 Example: ' + m.example;
      ctx.reply(out);
    },
  },
  {
    name: 'translate', aliases: [], category: 'Search',
    desc: 'Text translate karo', usage: '[en|hi] <text> (default en->hi)',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .trt [en|hi] <text>\nExample: .trt en|hi hello');
      let pair = 'en|hi', q = ctx.text;
      const m = ctx.text.match(/^([a-z]{2})\|([a-z]{2})\s+(.+)/i);
      if (m) { pair = m[1].toLowerCase() + '|' + m[2].toLowerCase(); q = m[3]; }
      const d = await apiGet('https://api.mymemory.translated.net/get?q=' + enc(q) + '&langpair=' + enc(pair));
      const t = d && d.responseData && d.responseData.translatedText;
      if (!t) return ctx.reply(FALLBACK);
      ctx.reply('🌐 (' + pair + ')\n' + t);
    },
  },
  {
    name: 'currency', aliases: [], category: 'Search',
    desc: 'Currency convert karo', usage: '<amount> <FROM> to <TO>',
    run: async (ctx) => {
      const m = (ctx.text || '').match(/([\d.]+)?\s*([A-Za-z]{3})\s*(?:to|in)?\s*([A-Za-z]{3})/i);
      const amount = m && m[1] ? parseFloat(m[1]) : 1;
      const from = m && m[2] ? m[2].toUpperCase() : 'USD';
      const to = m && m[3] ? m[3].toUpperCase() : 'INR';
      if (!m) return ctx.reply('❌ Usage: .currency 100 USD to INR');
      const d = await apiGet('https://api.frankfurter.app/latest?from=' + from + '&to=' + to);
      if (!d || !d.rates || !d.rates[to]) return ctx.reply('❌ Rate nahi mila. Currency code check karo (e.g. USD, INR, EUR).');
      const val = (amount * d.rates[to]).toFixed(2);
      ctx.reply('💱 *' + amount + ' ' + from + '* = *' + val + ' ' + to + '*\n(1 ' + from + ' = ' + d.rates[to] + ' ' + to + ')');
    },
  },
  {
    name: 'quran', aliases: [], category: 'Search',
    desc: 'Quran ki ayah', usage: '[surah:ayah] (default 2:255)',
    run: async (ctx) => {
      const ref = ctx.args[0] || '2:255';
      const d = await apiGet('https://api.alquran.cloud/v1/ayah/' + enc(ref) + '/en.asad');
      if (!d || !d.data || !d.data.text) return ctx.reply('❌ Ayah nahi mili. Format: .quran 2:255');
      ctx.reply('☪️ Surah ' + d.data.surah.englishName + ' (' + ref + ')\n\n' + d.data.text.slice(0, 1000));
    },
  },
  {
    name: 'bible', aliases: [], category: 'Search',
    desc: 'Bible verse', usage: '[reference] (default john 3:16)',
    run: async (ctx) => {
      const ref = ctx.text || 'john 3:16';
      const d = await apiGet('https://bible-api.com/' + enc(ref));
      if (!d || !d.text) return ctx.reply('❌ Verse nahi mila. Format: .bible john 3:16');
      ctx.reply('✝️ *' + d.reference + '*\n\n' + strip(d.text).slice(0, 1000));
    },
  },
  {
    name: 'news', aliases: [], category: 'Search',
    desc: 'Aaj ki top headlines', usage: '',
    run: async (ctx) => {
      ctx.reply('📰 Top headlines:\nhttps://news.google.com/topstories?hl=hi&gl=IN&ceid=IN:hi\n\n⚠️ Note: bina key ke live news API nahi hai — link par taaza khabrein padho.');
    },
  },
  {
    name: 'cricket', aliases: [], category: 'Search',
    desc: 'Live cricket score link', usage: '',
    run: async (ctx) => {
      ctx.reply('🏏 Live score:\nhttps://www.cricbuzz.com/cricket-match/live-scores\n\n⚠️ Note: bina key ke live score API nahi hai — link par live score dekho.');
    },
  },
  {
    name: 'ifsc', aliases: [], category: 'Search',
    desc: 'IFSC code se bank details', usage: '<IFSC>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .ifsc <IFSC code>\nExample: .ifsc HDFC0001234');
      const d = await apiGet('https://ifsc.razorpay.com/' + enc(ctx.args[0].toUpperCase()));
      if (!d || !d.BANK) return ctx.reply('❌ IFSC code nahi mila. Code check karo.');
      ctx.reply('🏦 *' + d.BANK + '*\n📍 Branch: ' + d.BRANCH + '\n📌 ' + d.ADDRESS + '\n🏙️ ' + d.CITY + ', ' + d.STATE);
    },
  },
  {
    name: 'pincode', aliases: [], category: 'Search',
    desc: 'Pincode se post office details', usage: '<pincode>',
    run: async (ctx) => {
      if (!ctx.args[0] || !/^\d{6}$/.test(ctx.args[0])) return ctx.reply('❌ Usage: .pincode <6-digit pincode>');
      const d = await apiGet('https://api.postalpincode.in/pincode/' + ctx.args[0]);
      const p = d && d[0] && d[0].PostOffice && d[0].PostOffice[0];
      if (!p) return ctx.reply('❌ Is pincode ka data nahi mila.');
      ctx.reply('📮 *' + p.Name + '* (' + ctx.args[0] + ')\n🏙️ District: ' + p.District + '\n🗺️ State: ' + p.State);
    },
  },
  // ---- standalone short-names (aliases se upgrade) ----
  {
    name: 'img', aliases: [], category: 'Search',
    desc: 'Images search karo (shortcut)', usage: '<query>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .img <query>');
      ctx.reply('🖼️ Image search:\nhttps://www.google.com/search?tbm=isch&q=' + enc(ctx.text));
    },
  },
  {
    name: 'wikipedia', aliases: [], category: 'Search',
    desc: 'Wikipedia summary (shortcut)', usage: '<topic>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .wikipedia <topic>');
      const d = await apiGet('https://en.wikipedia.org/api/rest_v1/page/summary/' + enc(ctx.text));
      if (!d || !d.title) return ctx.reply(FALLBACK);
      ctx.reply('📚 *' + d.title + '*\n\n' + strip(d.extract).slice(0, 800));
    },
  },
  {
    name: 'gh', aliases: [], category: 'Search',
    desc: 'GitHub info (shortcut)', usage: '<user> ya <owner/repo>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .gh <user> ya .gh <owner/repo>');
      if (ctx.text.includes('/')) {
        const d = await apiGet('https://api.github.com/repos/' + ctx.text.trim());
        if (!d || !d.full_name) return ctx.reply('❌ Repo nahi mila.');
        ctx.reply('💻 *' + d.full_name + '*\n⭐ Stars: ' + d.stargazers_count + ' | 🍴 Forks: ' + d.forks_count);
      } else {
        const d = await apiGet('https://api.github.com/users/' + ctx.text.trim());
        if (!d || !d.login) return ctx.reply('❌ User nahi mila.');
        ctx.reply('👨‍💻 *' + d.login + '*\n👥 Followers: ' + d.followers + ' | 📦 Repos: ' + d.public_repos);
      }
    },
  },
  {
    name: 'app', aliases: [], category: 'Search',
    desc: 'Play Store app search (shortcut)', usage: '<app name>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .app <app name>');
      ctx.reply('📱 Play Store:\nhttps://play.google.com/store/search?q=' + enc(ctx.text));
    },
  },
  {
    name: 'dict', aliases: [], category: 'Search',
    desc: 'Word meaning (shortcut)', usage: '<word>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .dict <word>');
      const d = await apiGet('https://api.dictionaryapi.dev/api/v2/entries/en/' + enc(ctx.args[0]));
      const m = d && d[0] && d[0].meanings && d[0].meanings[0] && d[0].meanings[0].definitions && d[0].meanings[0].definitions[0];
      if (!m) return ctx.reply('❌ Is word ka meaning nahi mila.');
      ctx.reply('📖 *' + d[0].word + '*\n\n' + m.definition);
    },
  },
  {
    name: 'define', aliases: [], category: 'Search',
    desc: 'Word define karo (shortcut)', usage: '<word>',
    run: async (ctx) => {
      if (!ctx.args[0]) return ctx.reply('❌ Usage: .define <word>');
      const d = await apiGet('https://api.dictionaryapi.dev/api/v2/entries/en/' + enc(ctx.args[0]));
      const m = d && d[0] && d[0].meanings && d[0].meanings[0] && d[0].meanings[0].definitions && d[0].meanings[0].definitions[0];
      if (!m) return ctx.reply('❌ Is word ka meaning nahi mila.');
      ctx.reply('📖 *' + d[0].word + '* (' + d[0].meanings[0].partOfSpeech + ')\n\n' + m.definition);
    },
  },
  {
    name: 'trt', aliases: [], category: 'Search',
    desc: 'Translate (shortcut)', usage: '[en|hi] <text>',
    run: async (ctx) => {
      if (!ctx.text) return ctx.reply('❌ Usage: .trt [en|hi] <text>');
      let pair = 'en|hi', q = ctx.text;
      const m = ctx.text.match(/^([a-z]{2})\|([a-z]{2})\s+(.+)/i);
      if (m) { pair = m[1].toLowerCase() + '|' + m[2].toLowerCase(); q = m[3]; }
      const d = await apiGet('https://api.mymemory.translated.net/get?q=' + enc(q) + '&langpair=' + enc(pair));
      const t = d && d.responseData && d.responseData.translatedText;
      if (!t) return ctx.reply(FALLBACK);
      ctx.reply('🌐 (' + pair + ')\n' + t);
    },
  },
  {
    name: 'convert', aliases: [], category: 'Search',
    desc: 'Currency convert (shortcut)', usage: '<amount> <FROM> to <TO>',
    run: async (ctx) => {
      const m = (ctx.text || '').match(/([\d.]+)?\s*([A-Za-z]{3})\s*(?:to|in)?\s*([A-Za-z]{3})/i);
      if (!m) return ctx.reply('❌ Usage: .convert 100 USD to INR');
      const amount = m[1] ? parseFloat(m[1]) : 1;
      const from = m[2].toUpperCase(), to = m[3].toUpperCase();
      const d = await apiGet('https://api.frankfurter.app/latest?from=' + from + '&to=' + to);
      if (!d || !d.rates || !d.rates[to]) return ctx.reply('❌ Rate nahi mila.');
      ctx.reply('💱 *' + amount + ' ' + from + '* = *' + (amount * d.rates[to]).toFixed(2) + ' ' + to + '*');
    },
  },
  {
    name: 'ayah', aliases: [], category: 'Search',
    desc: 'Quran ayah (shortcut)', usage: '[surah:ayah]',
    run: async (ctx) => {
      const ref = ctx.args[0] || '2:255';
      const d = await apiGet('https://api.alquran.cloud/v1/ayah/' + enc(ref) + '/en.asad');
      if (!d || !d.data || !d.data.text) return ctx.reply('❌ Ayah nahi mili. Format: .ayah 2:255');
      ctx.reply('☪️ Surah ' + d.data.surah.englishName + ' (' + ref + ')\n\n' + d.data.text.slice(0, 1000));
    },
  },
  {
    name: 'verse', aliases: [], category: 'Search',
    desc: 'Bible verse (shortcut)', usage: '[reference]',
    run: async (ctx) => {
      const ref = ctx.text || 'john 3:16';
      const d = await apiGet('https://bible-api.com/' + enc(ref));
      if (!d || !d.text) return ctx.reply('❌ Verse nahi mila.');
      ctx.reply('✝️ *' + d.reference + '*\n\n' + strip(d.text).slice(0, 1000));
    },
  },
  {
    name: 'headlines', aliases: [], category: 'Search',
    desc: 'Top headlines (shortcut)', usage: '',
    run: async (ctx) => {
      ctx.reply('📰 Top headlines:\nhttps://news.google.com/topstories?hl=hi&gl=IN&ceid=IN:hi');
    },
  },
  {
    name: 'score', aliases: [], category: 'Search',
    desc: 'Live cricket score (shortcut)', usage: '',
    run: async (ctx) => {
      ctx.reply('🏏 Live score:\nhttps://www.cricbuzz.com/cricket-match/live-scores');
    },
  },
];
