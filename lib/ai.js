// ---------------- AI features (Google Gemini, free tier) ----------------
// GEMINI_API_KEY Render ke env me hoti hai — na ho to saari AI cheezein null
// deti hain aur bot apne purane tareeke (static quiz bank) par chalta rehta hai.
const axios = require('axios');

// Ek hi Gemini key saare models ke liye chalti hai — model code me chuna jata hai.
// Google samay-samay par purane model naye users ke liye band karta rehta hai
// (2.5-flash ke saath yahi hua), isliye bot models ko ek-ek karke try karta hai
// aur jo chal jaye use yaad rakh leta hai — AI apne aap chalta rehta hai.
const MODEL_CHAIN = () => [...new Set([process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'].filter(Boolean))];
let goodModel = '';
const enabled = () => !!process.env.GEMINI_API_KEY;

async function gemini(prompt, jsonMode = false, temperature = 0.9) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const models = goodModel ? [goodModel, ...MODEL_CHAIN().filter((m) => m !== goodModel)] : MODEL_CHAIN();
  for (const model of models) {
    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        },
        { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: 20000 }
      );
      const txt = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (txt.trim()) {
        if (goodModel !== model) { goodModel = model; console.log('🤖 Gemini model chal raha hai:', model); }
        return txt.trim();
      }
    } catch (e) {
      console.log(`🤖 Gemini model ${model} fail:`, e.response?.data?.error?.message || e.message);
    }
  }
  return null;
}

// YouTube par ek bilkul naya quiz sawal — { q, options[4] } ya null.
// recent = pehle aa chuke sawal (repeat rokne ke liye AI ko diye jate hain).
async function genQuiz(recent = []) {
  const avoid = (recent || []).slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join('\n');
  const prompt =
    'Tum ek mazedaar quiz master ho. YouTube ke baare me EK bilkul naya quiz sawal banao, asaan Hindi-Hinglish mix me.\n' +
    'Topic in me se koi ek chuno (har baar alag): YouTube ki history, YouTube Shorts, monetization (paisa kamana), famous creators (MrBeast, T-Series jaise), YouTube ke records, Play Button awards, YouTube ke features, sabse zyada dekhi gayi videos.\n' +
    'Sirf pakke, mashhoor facts par sawal banao jin ka ek hi saaf sahi jawab ho. Sawal chhota aur saaf ho, 4 options do — ek sahi, baaki teen aise galat jo sochne par majboor karein. Options chhote rakho.\n' +
    (avoid ? `Ye sawal pehle aa chuke hain — inhe ya inke bilkul jaise sawal repeat mat karo:\n${avoid}\n` : '') +
    'Jawab SIRF is JSON roop me do: {"q": "sawal", "options": ["opt1", "opt2", "opt3", "opt4"]}';
  const raw = await gemini(prompt, true, 0.95);
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const q = String(obj.q || '').trim();
    const opts = [...new Set((obj.options || []).map((o) => String(o || '').trim()).filter(Boolean))].slice(0, 4);
    if (q.length < 8 || opts.length !== 4) return null;
    return { q: q.slice(0, 240), options: opts.map((o) => o.slice(0, 90)) };
  } catch {
    return null;
  }
}

// YouTube ke official update ka chhota Hinglish saar (group me bhejne ke liye).
async function summarizeUpdate(item) {
  const prompt =
    'Neeche YouTube ka ek official update hai. Ise WhatsApp group ke liye chhote, asaan Hinglish me 3-4 line me samjhao — kya naya aaya hai aur creators/members ke liye iska kya matlab hai. Sirf summary likho, apni taraf se koi extra line ya heading mat jodo.\n\n' +
    `Title: ${item.title}\nSource: ${item.source || ''}\nDetails: ${String(item.desc || '').slice(0, 1200)}`;
  const out = await gemini(prompt, false, 0.5);
  return out ? out.slice(0, 700) : null;
}

// ---------------- YouTube update sources (RSS/Atom) ----------------
const FEEDS = [
  { name: 'YouTube Official Blog', url: 'https://blog.youtube/rss/' },
  { name: 'Creator Insider', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCGg-UqjRgzhYDPJMr-9HXCg' },
];

function cleanText(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function tagOf(block, tag) {
  const m = block.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : '';
}

// Feed padh ke naye items ki list (newest pehle) — galti par khaali list.
async function fetchFeedItems(url, limit = 5) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (its Mahtab Bot)' },
      responseType: 'text',
    });
    const xml = String(data || '');
    const out = [];
    const pushItem = (id, title, link, desc, published) => {
      if (id && title) out.push({ id, title: cleanText(title), link: link || '', desc: cleanText(desc).slice(0, 900), published: published || '' });
    };
    if (xml.includes('<item')) {
      for (const b of xml.split(/<item[\s>]/).slice(1)) {
        const link = tagOf(b, 'link');
        pushItem(tagOf(b, 'guid') || link, tagOf(b, 'title'), link, tagOf(b, 'description'), tagOf(b, 'pubDate'));
        if (out.length >= limit) break;
      }
    } else if (xml.includes('<entry')) {
      for (const b of xml.split(/<entry[\s>]/).slice(1)) {
        const lm = b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) || b.match(/<link[^>]*href="([^"]+)"/);
        pushItem(tagOf(b, 'id'), tagOf(b, 'title'), lm ? lm[1] : '', tagOf(b, 'media:description') || tagOf(b, 'summary'), tagOf(b, 'published'));
        if (out.length >= limit) break;
      }
    }
    return out;
  } catch (e) {
    console.log('📺 feed fail:', url.slice(0, 40), e.message);
    return [];
  }
}

// Group chat ke liye AI jawab. Pehle GEMINI (sahi jawab deta hai) — sirf
// sabse bharosa-mand model par, 8 second ki sakht seema ke saath, taaki group
// intezaar na kare. Gemini fail/limit ho tab muft Pollinations backup.
// (Pollinations akela galat facts de deta hai — 'Delhi ki jagah Mumbai capital'
// wali galti test me pakdi gayi thi, isliye wo sirf backup hai.)
async function chatReply(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const model = goodModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9 } },
        { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: 8000 }
      );
      const t = (data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '').trim();
      if (t) { goodModel = model; return t; }
    } catch (e) { /* neeche Pollinations backup */ }
  }
  try {
    const { data } = await axios.get('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 12000,
      responseType: 'text',
      transformResponse: [(d) => d],
    });
    const t = String(data || '').trim();
    if (t) return t;
  } catch (e) { /* dono fail */ }
  return null;
}

module.exports = { enabled, genQuiz, summarizeUpdate, FEEDS, fetchFeedItems, chatReply };
