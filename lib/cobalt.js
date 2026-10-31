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
async function downloadToBuffer(fileUrl, referer) {
  try {
    const r = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 90000,
      maxContentLength: 250 * 1024 * 1024,
      headers: { 'User-Agent': UA, Referer: referer || 'https://cobalt.tools/' },
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
    // Candidate order: (1) mainMvUrls — asal video ke CDN mirrors (sabse bharosemand),
    // (2) jaane-maane keys, (3) page ki koi bhi .mp4 (manifest wali signed link aakhir me,
    // kyunki wo aksar server se download nahi hoti — purana bug yahi tha).
    const candidates = [];
    const mm = html.match(/"mainMvUrls"\s*:\s*\[([\s\S]{0,6000}?)\]/);
    if (mm) {
      const re = /"url"\s*:\s*"(https:[^"]+?)"/g;
      let u;
      while ((u = re.exec(mm[1])) !== null) candidates.push(unesc(u[1]));
    }
    const k = html.match(/"(?:photoUrl|playUrl|videoUrl|srcNoMark|noWatermarkUrl)"\s*:\s*"(https:[^"]+?)"/);
    if (k) candidates.push(unesc(k[1]));
    const any = html.match(/(https:[^"'\s\\]+\.mp4[^"'\s\\]*)/);
    if (any) candidates.push(unesc(any[1]));
    console.log('🎬 kwai: page mila, video candidates =', candidates.length);
    for (const fileUrl of candidates) {
      const buffer = await downloadToBuffer(fileUrl, 'https://www.kuaishou.com/');
      if (buffer) {
        console.log('🎬 kwai download OK:', (buffer.length / 1048576).toFixed(2), 'MB <-', new URL(fileUrl).host);
        return { buffer, filename: 'kwai.mp4' };
      }
    }
    console.log('🎬 kwai: koi candidate download nahi hua');
    return null;
  } catch (e) {
    console.log('🎬 kwai fail:', e.message);
    return null;
  }
}

module.exports = { cobaltDownload, cobaltResolve, kwaiDirect, downloadToBuffer };
