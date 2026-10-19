// commands/fun.js — 60 Fun commands
'use strict';
const { apiGet, apiGetBuffer } = require('../lib/api');
const H = require('../lib/helpers');
const config = require('../config');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const unescape = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const BALL = ['Haan bilkul, pakka! ✅', 'Nahi bhai, bhool jao ❌', 'Pakka, 100%! 💯', 'Mushkil hai, thoda time lagega ⏳', 'Haan, bas thoda dimaag lagao 🧠', 'Bilkul nahi, rehne do 😅', 'Haan, universe tumhare saath hai 🌌', 'Sayad... thoda confuse hai 🔮'];
const TRUTHS = [
  'Sach batao, sabse zyada paise tumne kiske peeche udaye hain? 😏',
  'Kabhi teacher/parent ko dhokha diya? Story batao 😂',
  'Tumhara sabse bada secret kya hai? Humein bata do 🤫',
  'Crush ka naam batao, screenshot mat lena 📸',
  'Phone me sabse weird photo kaunsa hai? 😜',
  'Kabhi jhooth bola aur phir pakde gaye? Kya hua tha? 👀',
  'Bina bataye kisike liye roye ho? Kab? 🥲',
  'Sabse embarrassing moment kya tha tumhara? 😳',
  'Kya tumne kabhi dusre ka homework copy kiya? 📚',
  'Agar 1 crore mil jaye to sabse pehle kya karoge? 💰',
];
const DARES = [
  'Abhi group me apni funny selfie bhejo! 📸',
  'Apna phone kisi dost ko de do 5 minute ke liye 📱',
  'Ek minute tak Hindi me gaana gao 🎤',
  'Apni crush ko "hi" message karo (abhi!) 😏',
  'Toilet me jaake "I am the king" zor se bolo 👑',
  '10 push-ups abhi karo, photo proof ke saath 💪',
  'Apne status pe "Main pagal hoon" likho 10 minute ke liye 🤪',
  'Kisi random number pe "good morning" bhejo 📩',
  'Apni purani chat ka sabse funny screenshot bhejo 😂',
  'Apna naam ulta likh ke bhej do 🔄',
];
const WYR = [
  'Hamesha bhookha rehna ya hamesha neend se bhar jaana? 🤔',
  'Udna ya paani me saans lena? 🕊️🌊',
  '1 crore cash ya sachha pyaar? 💰❤️',
  'Hamesha sach bolna ya hamesha jhooth? 🤥',
  'Bina phone 1 saal ya bina friends 1 mahina? 📱👥',
  'Past me jana ya future me? ⏰',
  'Famous hona ya rich hona? 🌟',
  'Kabhi bhookh na lagna ya kabhi neend na aana? 🍔😴',
];
const PUNS = [
  'Main to chai ka deewana hoon, kyunki life me "tea-m" work zaroori hai ☕',
  'Samosa ka dil chura liya, ab use "samosa dil" kehte hain 😋',
  'Maths se darr lagta hai, kyunki woh "problem" hi deta hai ➗',
  'Network slow hai? Shayad woh "down to earth" hai 🌍',
  'Doctor ne kaha relax karo, ab main "stress" ka "dessert" kha raha hoon 🍰',
  'Momos khao, "mo" se "mohabbat" ho jayegi 🥟',
  'Phone ki battery low? "Charge" lene ka time aa gaya ⚡',
  'Paani puri khake "dil full" ho gaya 💧',
];
const TWISTERS = [
  'Pakke ped par pakka papita, pakka ped ya pakka papita? 🌴',
  'Kachcha papita, pakka papita, pakke ped par pakka papita',
  'Chandu ke chacha ne Chandu ki chachi ko chandi ki chamach se chutney chatai 🥄',
  'She sells seashells by the seashore 🐚',
  'Red lorry, yellow lorry 🔴🟡',
  'Bholi bhabhi boli, bholi bhabhi ke bhole bhaiya bole 😄',
];
const RIDDLES = [
  { q: 'Aisi kaunsi cheez hai jo jitni badti hai, utni hi kam hoti hai?', a: 'Age (umar) 🎂' },
  { q: 'Kaunsi cheez tumhare paas hai, lekin dusre use zyada karte hain?', a: 'Tumhara naam 🪪' },
  { q: 'Bina pair ke daudta hai, bina muh ke bolta hai — kya hai?', a: 'Hawa 🌬️' },
  { q: 'Ek kamre me 10 log hain, 9 chale gaye, kitne bache?', a: '1 (jo gaya nahi!) 😂' },
  { q: 'Kaunsi cheez neeche jaate waqt upar aati hai?', a: 'Barish ☔ (baadal se neeche, nadi se upar)' },
  { q: 'Mere paas sheher hain par ghar nahi, jungle hain par ped nahi — kya hoon main?', a: 'Map 🗺️' },
];
const SHAYARI = [
  'Muskurahat tumhari dil ko chhu jaati hai,\nTumhari har baat humein bha jaati hai. 🌹',
  'Chand ko dekh ke sitare sharma gaye,\nTumko dekh ke hum muskurana bhool gaye. 🌙',
  'Dil se dil ki baat ho gayi,\nTumse milke zindagi khaas ho gayi. 💫',
  'Tere ishq me hum deewane ho gaye,\nZamane ke liye hum begane ho gaye. ❤️',
  'Har subah teri yaad aati hai,\nHar shaam teri baat satati hai. 🌅',
];
const SUVICHAR = [
  '🌅 "Safalta wahi paata hai jo haar nahi maanta."',
  '🌅 "Mehnat itni khamoshi se karo ki safalta shor macha de."',
  '🌅 "Jo kal tha, woh aaj nahi — badlav hi zindagi hai."',
  '🌅 "Mushkilein tumhe todne nahi, majboot banane aati hain."',
  '🌅 "Sapne woh nahi jo sote waqt dekhe, sapne woh jo sone na de."',
  '🌅 "Waqt sabka badalta hai, bas dhairya rakho."',
  '🌅 "Chhoti chhoti koshishein badi kamyabi laati hain."',
  '🌅 "Jo apne aap pe vishwas karta hai, woh duniya jeet leta hai."',
];
const MOTIVATE = [
  '💪 Tum haarne ke liye nahi, jeetne ke liye bane ho!',
  '🔥 Kal se behtar bano, bas yahi goal hai.',
  '🚀 Sapne bade rakho, mehnat usse badi.',
  '⭐ Tumhari kahani abhi khatam nahi hui hai.',
  '💯 Ek din mehnat rang layegi, bas ruke mat.',
  '🌟 Andhera kitna bhi ho, subah zaroor hoti hai.',
  '🏆 Champions kabhi haar nahi maante.',
  '⚡ Aaj ka struggle, kal ki strength hai.',
];
const WISDOM = [
  '🦉 "Kam bolo, zyada suno — gyaan badhega."',
  '🦉 "Gussa ek minute ka, pachtawa zindagi bhar ka."',
  '🦉 "Jo dusro ki izzat karta hai, wahi asli ameer hai."',
  '🦉 "Waqt se bada koi teacher nahi."',
  '🦉 "Seedha ped sabse pehle kaata jaata hai — thoda tedha bano."',
  '🦉 "Dusro ki galti se seekhna bhi buddhimani hai."',
  '🦉 "Santosh sabse bada dhan hai."',
  '🦉 "Bolne se pehle socho, kyunki teer wapas nahi aata."',
];
const ONELINERS = [
  '😂 "Main lazy nahi hoon, main energy save kar raha hoon."',
  '😂 "Dieting kal se, pakka... kal se."',
  '😂 "Mera phone mujhse zyada smart hai, yeh dukh hai."',
  '😂 "Neend meri best friend hai."',
  '😂 "Paise ped pe nahi ugte, par kharche zaroor ugte hain."',
  '😂 "Monday se nafrat, Sunday se pyaar."',
  '😂 "Main gym jata hoon... sapno me."',
  '😂 "WiFi slow ho to zindagi slow lagti hai."',
];
const ROASTS = [
  'Tumhare jokes itne purane hain ki museum me rakhne chahiye 😂',
  'Tumhara WiFi tumse tez hai, yeh socho 🐢',
  'Google bhi tumhare sawaalon se pareshan hai 🤖',
  'Tum itne bhole ho ki paani bhi tumse pooch ke behta hai 💧',
  'Tumhari selfie dekh ke camera ne resign kar diya 📸',
  'Tum itne slow ho ki snail ne tumhe overtake kar diya 🐌',
  'Tumhare paas dimaag hai, bas use karna bhool gaye 🧠',
  'Tumhara luck itna kharab hai ki lottery ticket bhi ro pade 🎰',
];
const COMPLIMENTS = [
  '✨ Tumhari smile din bana deti hai!',
  '🌟 Tum jaise dost sabko milne chahiye!',
  '💎 Tum bilkul diamond ho — rare aur precious!',
  '🎯 Tumhara sense of humor top class hai!',
  '🌈 Tum jahan jaate ho, wahan khushiyan le jaate ho!',
  '🔥 Tumhari energy sabse alag hai!',
  '💡 Tumhare ideas hamesha brilliant hote hain!',
  '🏆 Tum winner ho, bas trophy baaki hai!',
];
const PICKUPS = [
  'Kya tum WiFi ho? Kyunki main tumse connect ho gaya hoon 📶',
  'Tumhare paas map hai? Main tumhari aankhon me kho gaya hoon 🗺️',
  'Kya tum magician ho? Jab bhi tumhe dekhta hoon, sab gayab ho jaata hai ✨',
  'Tumhare bina meri life adhuri hai, jaise samosa bina chutney ke 😋',
  'Kya tum Google ho? Tum me sab kuch milta hai 🔍',
  'Tum itne sweet ho ki chai me cheeni ki zaroorat nahi ☕',
  'Kya tumhare paas band-aid hai? Main tumhare pyaar me gir gaya hoon 🩹',
  'Tumhare naam ka matlab khubsurti hona chahiye 💖',
];
const STATIC_JOKES = [
  'Santa: Mera beta bahut hoshiyar hai!\nBanta: Kaise?\nSanta: Usne exam me meri copy ki, phir bhi fail ho gaya — itna imaandar! 😂',
  'Teacher: Batao, 2+2 kitne hote hain?\nStudent: Mam, ye sawaal to aapko pata hona chahiye, aap teacher ho! 😜',
  'Pati: Tum hamesha mujhse ladti ho!\nPatni: Nahi, main to bas apne haq ke liye ladti hoon!\nPati: Wohi to problem hai, haq tumhara hi nikalta hai 😅',
  'Doctor: Tumhe aaram ki zaroorat hai.\nPatient: Kitne din ka?\nDoctor: Jab tak bill clear na ho jaye 💸',
  'Ek aadmi dukaan pe: Bhai, ye shirt kitne ki?\nDukaandaar: 500 ki.\nAadmi: Itni mehengi? Discount?\nDukaandaar: Theek hai, 499 ki le lo — 1 rupaya khushi ke liye 😂',
];
const GM_LINES = [
  '🌅 Good Morning! Naya din, nayi ummeed — aaj kuch bada karo!',
  '☀️ Suprabhat! Chai piyo, muskurayo, din banao!',
  '🌞 Good morning dost! Aaj ka din tumhara hai!',
  '🌻 Subah ho gayi! Utho, chamko, jeeto!',
  '🍵 Good Morning! Garam chai aur thandi hawa — perfect start!',
];
const GN_LINES = [
  '🌙 Good Night! Meethe sapne dekho, kal phir milenge!',
  '😴 Shubh ratri! Aaram karo, kal naya din hai!',
  '🌌 Good night dost! Chandni raat, sukoon bhari neend!',
  '💤 So jao ab, phone ko bhi aaram do! Good night!',
  '🌠 Good Night! Sapno me milte hain!',
];
const NHIE = [
  'Never have I ever... apne phone ka password bhoola ho 📱',
  'Never have I ever... bina ticket ke train me safar kiya ho 🚂',
  'Never have I ever... exam me cheating ki ho 📝',
  'Never have I ever... kisi ka message seen karke reply na kiya ho 👀',
  'Never have I ever... raat ko 3 baje momos khaye hon 🥟',
  'Never have I ever... crush ko stalk kiya ho 😏',
  'Never have I ever... jhooth bolke chhutti li ho 🏖️',
  'Never have I ever... barish me bheegke nacha ho 🌧️',
];
const WOULDYOU = [
  'Kya tum 1 crore ke liye 1 saal bina phone reh sakte ho? 📱',
  'Kya tum apna favorite khana hamesha ke liye chhod sakte ho? 🍕',
  'Kya tum bina soche apne crush ko propose kar sakte ho? 💌',
  'Kya tum 24 ghante bina sone reh sakte ho? 😴',
  'Kya tum apne best friend ka secret sabko bata sakte ho? 🤫',
  'Kya tum stage pe sabke saamne dance kar sakte ho? 💃',
];

function loveScore(n1, n2) {
  const s = (n1 + '|' + n2).toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 101;
}
function loveLine(score) {
  if (score >= 90) return '💍 Shaadi pakki! Perfect jodi!';
  if (score >= 70) return '💖 Bahut strong connection hai!';
  if (score >= 50) return '😊 Kaafi achhi tuning hai!';
  if (score >= 30) return '🤔 Thodi mehnat karni padegi!';
  return '😅 Dost hi bane raho, behtar hoga!';
}
function lovePair(ctx) {
  const raw = (ctx.text || '').trim();
  let n1, n2;
  if (raw.includes('|')) { const p = raw.split('|'); n1 = p[0].trim(); n2 = p[1].trim(); }
  else { const p = raw.split(/\s+/).filter(Boolean); n1 = p[0]; n2 = p[1]; }
  if (!n1) n1 = 'Tum';
  if (!n2) n2 = 'Crush';
  return [n1, n2];
}

module.exports = [
  { name: 'joke', aliases: [], category: 'Fun', desc: 'Random joke', usage: '.joke', run: async (ctx) => {
    try { const j = await apiGet('https://official-joke-api.appspot.com/random_joke');
      if (j && j.setup) return ctx.reply('😂 ' + j.setup + '\n' + j.punchline); } catch (e) {}
    ctx.reply('😂 ' + pick(STATIC_JOKES));
  } },
  { name: 'shayari', aliases: [], category: 'Fun', desc: 'Hindi shayari', usage: '.shayari', run: async (ctx) => { ctx.reply(pick(SHAYARI)); } },
  { name: 'quote', aliases: [], category: 'Fun', desc: 'Inspirational quote', usage: '.quote', run: async (ctx) => {
    try { const q = await apiGet('https://api.zenquotes.io/api/random');
      if (q && q[0] && q[0].q) return ctx.reply('💬 "' + q[0].q + '" — ' + (q[0].a || 'Unknown')); } catch (e) {}
    ctx.reply('💬 "Mehnat ka phal meetha hota hai." — Desi Wisdom');
  } },
  { name: 'quotes', aliases: [], category: 'Fun', desc: 'Inspirational quote', usage: '.quotes', run: async (ctx) => {
    try { const q = await apiGet('https://api.zenquotes.io/api/random');
      if (q && q[0] && q[0].q) return ctx.reply('💬 "' + q[0].q + '" — ' + (q[0].a || 'Unknown')); } catch (e) {}
    ctx.reply('💬 "Jo jeeta wahi sikandar." — Desi Wisdom');
  } },
  { name: 'fact', aliases: [], category: 'Fun', desc: 'Random interesting fact', usage: '.fact', run: async (ctx) => {
    try { const f = await apiGet('https://uselessfacts.jsph.pl/api/v2/facts/random');
      if (f && f.text) return ctx.reply('🧠 Fact: ' + f.text); } catch (e) {}
    ctx.reply('🧠 Fact: Madhumakkhi apne wazan se 50 guna zyada bojh utha sakti hai! 🐝');
  } },
  { name: 'facts', aliases: [], category: 'Fun', desc: 'Random interesting fact', usage: '.facts', run: async (ctx) => {
    try { const f = await apiGet('https://uselessfacts.jsph.pl/api/v2/facts/random');
      if (f && f.text) return ctx.reply('🧠 Fact: ' + f.text); } catch (e) {}
    ctx.reply('🧠 Fact: Octopus ke 3 dil hote hain! 🐙');
  } },
  { name: '8ball', aliases: [], category: 'Fun', desc: 'Magic 8-ball answers', usage: '.8ball <sawaal>', run: async (ctx) => { ctx.reply('🔮 ' + pick(BALL)); } },
  { name: 'truth', aliases: [], category: 'Fun', desc: 'Truth question', usage: '.truth', run: async (ctx) => { ctx.reply('🤔 Truth: ' + pick(TRUTHS)); } },
  { name: 'dare', aliases: [], category: 'Fun', desc: 'Dare challenge', usage: '.dare', run: async (ctx) => { ctx.reply('😈 Dare: ' + pick(DARES)); } },
  { name: 'roast', aliases: [], category: 'Fun', desc: 'Funny roast', usage: '.roast [naam]', run: async (ctx) => {
    const t = (ctx.text || '').trim() || 'tum'; ctx.reply('🔥 ' + t + ', ' + pick(ROASTS));
  } },
  { name: 'compliment', aliases: [], category: 'Fun', desc: 'Sweet compliment', usage: '.compliment [naam]', run: async (ctx) => { ctx.reply(pick(COMPLIMENTS)); } },
  { name: 'pickup', aliases: [], category: 'Fun', desc: 'Pickup line', usage: '.pickup', run: async (ctx) => { ctx.reply('💘 ' + pick(PICKUPS)); } },
  { name: 'riddle', aliases: [], category: 'Fun', desc: 'Paheli with answer', usage: '.riddle', run: async (ctx) => {
    const r = pick(RIDDLES); ctx.reply('🧩 ' + r.q + '\n\nJawab: ' + r.a);
  } },
  { name: 'wyr', aliases: [], category: 'Fun', desc: 'Would you rather', usage: '.wyr', run: async (ctx) => { ctx.reply(pick(WYR)); } },
  { name: 'trivia', aliases: [], category: 'Fun', desc: 'Trivia question + answer', usage: '.trivia', run: async (ctx) => {
    try { const d = await apiGet('https://opentdb.com/api.php?amount=1&type=multiple');
      const r = d && d.results && d.results[0];
      if (r && r.question) return ctx.reply('❓ ' + unescape(r.question) + '\n\n✅ Answer: ' + unescape(r.correct_answer)); } catch (e) {}
    ctx.reply('❓ Bharat ka rashtriya pashu kaunsa hai?\n\n✅ Answer: Bengal Tiger 🐯');
  } },
  { name: 'meme', aliases: [], category: 'Fun', desc: 'Random meme image', usage: '.meme', run: async (ctx) => {
    try { const m = await apiGet('https://meme-api.com/gimme');
      if (m && m.url) { const buf = await apiGetBuffer(m.url);
        if (buf) return H.sendImage(ctx.sock, ctx.chatId, buf, m.title || '😂 Meme', ctx.msg); } } catch (e) {}
    ctx.reply('😅 Meme load nahi hua, thodi der baad try karo!');
  } },
  { name: 'memes', aliases: [], category: 'Fun', desc: 'Random meme image', usage: '.memes', run: async (ctx) => {
    try { const m = await apiGet('https://meme-api.com/gimme');
      if (m && m.url) { const buf = await apiGetBuffer(m.url);
        if (buf) return H.sendImage(ctx.sock, ctx.chatId, buf, m.title || '😂 Meme', ctx.msg); } } catch (e) {}
    ctx.reply('😅 Meme load nahi hua, thodi der baad try karo!');
  } },
  { name: 'darkjoke', aliases: [], category: 'Fun', desc: 'Dark humor joke', usage: '.darkjoke', run: async (ctx) => {
    try { const j = await apiGet('https://v2.jokeapi.dev/joke/Dark?type=single');
      if (j && j.joke) return ctx.reply('🌚 ' + j.joke); } catch (e) {}
    ctx.reply('🌚 Meri zindagi bhi ek dark joke hai — punchline kabhi nahi aata.');
  } },
  { name: 'pun', aliases: [], category: 'Fun', desc: 'Funny pun', usage: '.pun', run: async (ctx) => { ctx.reply(pick(PUNS)); } },
  { name: 'twister', aliases: [], category: 'Fun', desc: 'Tongue twister', usage: '.twister', run: async (ctx) => { ctx.reply('👅 ' + pick(TWISTERS)); } },
  { name: 'couple', aliases: [], category: 'Fun', desc: 'Love match calculator', usage: '.couple <naam1> | <naam2>', run: async (ctx) => {
    const [n1, n2] = lovePair(ctx); const s = loveScore(n1, n2);
    ctx.reply('❤️ ' + n1 + ' + ' + n2 + ' = ' + s + '% match!\n' + loveLine(s));
  } },
  { name: 'ship', aliases: [], category: 'Fun', desc: 'Love match calculator', usage: '.ship <naam1> | <naam2>', run: async (ctx) => {
    const [n1, n2] = lovePair(ctx); const s = loveScore(n1, n2);
    ctx.reply('🚢 ' + n1 + ' + ' + n2 + ' = ' + s + '% match!\n' + loveLine(s));
  } },
  { name: 'love', aliases: [], category: 'Fun', desc: 'Love match calculator', usage: '.love <naam1> | <naam2>', run: async (ctx) => {
    const [n1, n2] = lovePair(ctx); const s = loveScore(n1, n2);
    ctx.reply('❤️ ' + n1 + ' + ' + n2 + ' = ' + s + '% match!\n' + loveLine(s));
  } },
  { name: 'lovecalc', aliases: [], category: 'Fun', desc: 'Love match calculator', usage: '.lovecalc <naam1> | <naam2>', run: async (ctx) => {
    const [n1, n2] = lovePair(ctx); const s = loveScore(n1, n2);
    ctx.reply('❤️ ' + n1 + ' + ' + n2 + ' = ' + s + '% match!\n' + loveLine(s));
  } },
  { name: 'luck', aliases: [], category: 'Fun', desc: "Today's luck percentage", usage: '.luck', run: async (ctx) => {
    ctx.reply('🍀 Tumhara aaj ka luck: ' + rnd(1, 100) + '%');
  } },
  { name: 'horoscope', aliases: [], category: 'Fun', desc: 'Daily horoscope', usage: '.horoscope [sign]', run: async (ctx) => {
    const sign = (ctx.args[0] || 'aries').toLowerCase();
    try { const d = await apiGet('https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=' + encodeURIComponent(sign) + '&day=today');
      const h = d && d.data && d.data.horoscope_data;
      if (h) return ctx.reply('🔮 ' + sign.charAt(0).toUpperCase() + sign.slice(1) + ' — Aaj ka rashifal:\n\n' + String(h).slice(0, 600)); } catch (e) {}
    ctx.reply('🔮 Aaj taare keh rahe hain: muskurate raho, sab achha hoga! ✨');
  } },
  { name: 'rashifal', aliases: [], category: 'Fun', desc: 'Daily horoscope', usage: '.rashifal [rashi]', run: async (ctx) => {
    const sign = (ctx.args[0] || 'aries').toLowerCase();
    try { const d = await apiGet('https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=' + encodeURIComponent(sign) + '&day=today');
      const h = d && d.data && d.data.horoscope_data;
      if (h) return ctx.reply('🔮 ' + sign.charAt(0).toUpperCase() + sign.slice(1) + ' — Aaj ka rashifal:\n\n' + String(h).slice(0, 600)); } catch (e) {}
    ctx.reply('🔮 Aaj taare keh rahe hain: muskurate raho, sab achha hoga! ✨');
  } },
  { name: 'suvichar', aliases: [], category: 'Fun', desc: 'Hindi suvichar', usage: '.suvichar', run: async (ctx) => { ctx.reply(pick(SUVICHAR)); } },
  { name: 'goodmorning', aliases: [], category: 'Fun', desc: 'Good morning wish', usage: '.goodmorning', run: async (ctx) => { ctx.reply(pick(GM_LINES)); } },
  { name: 'gm', aliases: [], category: 'Fun', desc: 'Good morning wish', usage: '.gm', run: async (ctx) => { ctx.reply(pick(GM_LINES)); } },
  { name: 'goodnight', aliases: [], category: 'Fun', desc: 'Good night wish', usage: '.goodnight', run: async (ctx) => { ctx.reply(pick(GN_LINES)); } },
  { name: 'gn', aliases: [], category: 'Fun', desc: 'Good night wish', usage: '.gn', run: async (ctx) => { ctx.reply(pick(GN_LINES)); } },
  { name: 'birthday', aliases: [], category: 'Fun', desc: 'Birthday wish', usage: '.birthday [naam]', run: async (ctx) => {
    const n = (ctx.text || '').trim() || 'dost';
    ctx.reply('🎂 Happy Birthday ' + n + '! 🎉\nDher saari khushiyan, sehat aur safalta mile. Cake khilana mat bhoolna! 🍰');
  } },
  { name: 'wish', aliases: [], category: 'Fun', desc: 'Birthday wish', usage: '.wish [naam]', run: async (ctx) => {
    const n = (ctx.text || '').trim() || 'dost';
    ctx.reply('🎂 Happy Birthday ' + n + '! 🎉\nDher saari khushiyan, sehat aur safalta mile. Cake khilana mat bhoolna! 🍰');
  } },
  { name: 'hug', aliases: [], category: 'Fun', desc: 'Send a hug gif', usage: '.hug', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '🤗 Ek pyaara sa hug tumhare liye!', ctx.msg); } } catch (e) {}
    ctx.reply('🤗 Ek virtual hug bhej raha hoon — mehsoos karo!');
  } },
  { name: 'slap', aliases: [], category: 'Fun', desc: 'Send a slap gif', usage: '.slap', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '👋 Thappad! Sudhar jao!', ctx.msg); } } catch (e) {}
    ctx.reply('👋 Virtual thappad! Sudhar jao!');
  } },
  { name: 'kiss', aliases: [], category: 'Fun', desc: 'Send a kiss gif', usage: '.kiss', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '😘 Ek pyaara sa kiss!', ctx.msg); } } catch (e) {}
    ctx.reply('😘 Ek flying kiss tumhare naam!');
  } },
  { name: 'pat', aliases: [], category: 'Fun', desc: 'Send a pat gif', usage: '.pat', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '🤲 Shabaash! Sir pe haath!', ctx.msg); } } catch (e) {}
    ctx.reply('🤲 Shabaash! Sir pe pyaar bhara haath!');
  } },
  { name: 'cuddle', aliases: [], category: 'Fun', desc: 'Send a cuddle gif', usage: '.cuddle', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '🤗 Cuddle time!', ctx.msg); } } catch (e) {}
    ctx.reply('🤗 Virtual cuddle — garam aur pyaara!');
  } },
  { name: 'bonk', aliases: [], category: 'Fun', desc: 'Send a bonk gif', usage: '.bonk', run: async (ctx) => {
    try { const d = await apiGet('https://api.waifu.pics/sfw/' + ctx.command);
      if (d && d.url) { const buf = await apiGetBuffer(d.url);
        if (buf) return H.sendVideo(ctx.sock, ctx.chatId, buf, '🔨 Bonk! Dimaag thikane lagao!', ctx.msg); } } catch (e) {}
    ctx.reply('🔨 Bonk! Thoda dimaag lagao!');
  } },
  { name: 'happy', aliases: [], category: 'Fun', desc: 'Happy mood reply', usage: '.happy', run: async (ctx) => { ctx.reply('😄 Wah! Khushi baanto, khushi badhao!'); } },
  { name: 'sad', aliases: [], category: 'Fun', desc: 'Sad mood reply', usage: '.sad', run: async (ctx) => { ctx.reply('🥲 Are are, udaas mat ho — ye waqt bhi guzar jayega!'); } },
  { name: 'angry', aliases: [], category: 'Fun', desc: 'Angry mood reply', usage: '.angry', run: async (ctx) => { ctx.reply('😡 Shaant! Gehra saans lo... ab muskurayo 😌'); } },
  { name: 'sleepy', aliases: [], category: 'Fun', desc: 'Sleepy mood reply', usage: '.sleepy', run: async (ctx) => { ctx.reply('😴 Neend aa rahi hai? Ek chai piyo aur phir so jao!'); } },
  { name: 'coffee', aliases: [], category: 'Fun', desc: 'Coffee fun line', usage: '.coffee', run: async (ctx) => { ctx.reply('☕ Coffee bina life adhuri hai — ek sip me saari tension gayab!'); } },
  { name: 'tea', aliases: [], category: 'Fun', desc: 'Chai fun line', usage: '.tea', run: async (ctx) => { ctx.reply('🍵 Chai sirf drink nahi, emotion hai! Ek kadak chai ho jaye?'); } },
  { name: 'hi', aliases: [], category: 'Fun', desc: 'Greeting', usage: '.hi', run: async (ctx) => { ctx.reply('👋 Namaste! Kaise ho? .menu likho saare commands ke liye.'); } },
  { name: 'bye', aliases: [], category: 'Fun', desc: 'Farewell', usage: '.bye', run: async (ctx) => { ctx.reply('👋 Bye bye! Phir milenge.'); } },
  { name: 'sorry', aliases: [], category: 'Fun', desc: 'Apology reply', usage: '.sorry', run: async (ctx) => { ctx.reply('💛 Koi baat nahi, maaf kiya!'); } },
  { name: 'thanks', aliases: [], category: 'Fun', desc: 'Thanks reply', usage: '.thanks', run: async (ctx) => { ctx.reply('😊 Are koi baat nahi!'); } },
  { name: 'iq', aliases: [], category: 'Fun', desc: 'Fun IQ test', usage: '.iq', run: async (ctx) => {
    ctx.reply('🧠 Tumhara IQ: ' + rnd(95, 160) + ' — Einstein Sharma!');
  } },
  { name: 'smart', aliases: [], category: 'Fun', desc: 'Smart compliment', usage: '.smart', run: async (ctx) => { ctx.reply('😎 Tum to bade smart ho!'); } },
  { name: 'dumb', aliases: [], category: 'Fun', desc: 'Playful tease', usage: '.dumb', run: async (ctx) => { ctx.reply('😜 Aaj thoda slow chal raha hai kya?'); } },
  { name: 'aks', aliases: [], category: 'Fun', desc: 'Ask anything, fun answer', usage: '.aks <sawaal>', run: async (ctx) => { ctx.reply('🔮 ' + pick(BALL)); } },
  { name: 'wouldyou', aliases: [], category: 'Fun', desc: 'Would you rather (Hinglish)', usage: '.wouldyou', run: async (ctx) => { ctx.reply(pick(WOULDYOU)); } },
  { name: 'neverhave', aliases: [], category: 'Fun', desc: 'Never have I ever', usage: '.neverhave', run: async (ctx) => { ctx.reply(pick(NHIE)); } },
  { name: 'iever', aliases: [], category: 'Fun', desc: 'Never have I ever', usage: '.iever', run: async (ctx) => { ctx.reply(pick(NHIE)); } },
  { name: 'motivate', aliases: [], category: 'Fun', desc: 'Motivational line', usage: '.motivate', run: async (ctx) => { ctx.reply(pick(MOTIVATE)); } },
  { name: 'wisdom', aliases: [], category: 'Fun', desc: 'Wisdom quote', usage: '.wisdom', run: async (ctx) => { ctx.reply(pick(WISDOM)); } },
  { name: 'oneline', aliases: [], category: 'Fun', desc: 'Funny one-liner', usage: '.oneline', run: async (ctx) => { ctx.reply(pick(ONELINERS)); } },
];
