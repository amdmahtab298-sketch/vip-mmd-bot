// Cobalt API client — video downloader backend.
// Wahi approach jo VIP MAIL Android app ke Download tab me use hota hai:
// TikTok / Instagram / X / Facebook / Reddit / Pinterest / YouTube etc.
const axios = require('axios');

const COBALT_API = 'https://cobalt-api.kwiatekmiki.com';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

// Cobalt se direct file URL nikalo
async function cobaltResolve(url, { quality = '720', audio = false } = {}) {
  try {
    const r = await axios.post(
      COBALT_API,
      { url, videoQuality: quality, downloadMode: audio ? 'audio' : 'auto' },
      {
        timeout: 20000,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA },
      }
    );
    const d = r.data;
    if (!d || d.status === 'error' || !d.url) return null;
    return { fileUrl: d.url, filename: d.filename || (audio ? 'audio.mp3' : 'video.mp4') };
  } catch {
    return null;
  }
}

// File URL -> Buffer
async function downloadToBuffer(fileUrl) {
  try {
    const r = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 90000,
      maxContentLength: 250 * 1024 * 1024,
      headers: { 'User-Agent': UA, Referer: 'https://cobalt.tools/' },
    });
    const buf = Buffer.from(r.data);
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

// Full pipeline: page URL -> { buffer, filename } | null
async function cobaltDownload(url, opts = {}) {
  const meta = await cobaltResolve(url, opts);
  if (!meta) return null;
  const buffer = await downloadToBuffer(meta.fileUrl);
  if (!buffer) return null;
  return { buffer, filename: meta.filename };
}

// Kwai/Kuaishou direct extraction fallback (share page se mp4 nikalo)
async function kwaiDirect(url) {
  try {
    // Kuaishou/Kwai page ke andar chhupa original mp4 nikaalo (share page ke JSON se).
    // Unicode-escapes (\u002F, \u0026) pehle saaf karo warna CDN link toot jata hai.
    const unesc = (s) => String(s)
      .replace(/\\u002F/g, '/')
      .replace(/\\u0026/g, '&')
      .replace(/\\u003D/g, '=')
      .replace(/\\\//g, '/');
    const r = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 8,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        'Referer': 'https://www.kuaishou.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = typeof r.data === 'string' ? r.data : JSON.stringify(r.data || '');
    let m = html.match(/"(?:photoUrl|playUrl|videoUrl|srcNoMark|noWatermarkUrl)"\s*:\s*"(https:[^"]+?)"/);
    let fileUrl = m && unesc(m[1]);
    if (!fileUrl) {
      m = html.match(/(https:[^"'\s\\]+\.mp4[^"'\s\\]*)/);
      fileUrl = m && unesc(m[1]);
    }
    if (!fileUrl) return null;
    const buffer = await downloadToBuffer(fileUrl);
    return buffer ? { buffer, filename: 'kwai.mp4' } : null;
  } catch {
    return null;
  }
}

module.exports = { cobaltDownload, cobaltResolve, kwaiDirect, downloadToBuffer };
