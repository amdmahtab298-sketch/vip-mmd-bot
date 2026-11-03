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
// onProgress mile to download ki live % progress bhi milti hai (chat me dikhane ke liye).
async function cobaltDownload(url, opts = {}, onProgress) {
  const meta = await cobaltResolve(url, opts);
  if (!meta) return null;
  const buffer = onProgress
    ? await downloadWithProgress(meta.fileUrl, undefined, (loaded, total) => onProgress({ stage: 'download', loaded, total }))
    : await downloadToBuffer(meta.fileUrl);
  if (!buffer) return null;
  return { buffer, filename: meta.filename };
}

// File URL -> Buffer, live progress ke saath (onProgress(loaded, total))
// Chat me download % dikhane ke liye — stream se gin ke batata hai.
async function downloadWithProgress(fileUrl, referer, onProgress) {
  try {
    const r = await axios.get(fileUrl, {
      responseType: 'stream',
      timeout: 90000,
      maxContentLength: 250 * 1024 * 1024,
      headers: { 'User-Agent': UA, Referer: referer || 'https://cobalt.tools/' },
    });
    const total = parseInt(r.headers['content-length'] || '0', 10);
    const chunks = [];
    let loaded = 0;
    let lastCall = 0;
    await new Promise((resolve, reject) => {
      r.data.on('data', (c) => {
        chunks.push(c);
        loaded += c.length;
        if (onProgress && total > 0) {
          const now = Date.now();
          if (now - lastCall >= 800) { lastCall = now; onProgress(loaded, total); }
        }
      });
      r.data.on('end', resolve);
      r.data.on('error', reject);
    });
    if (onProgress && total > 0) onProgress(loaded, total);
    const buf = Buffer.concat(chunks);
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

// Kwai/Kuaishou direct extraction (share page se mp4 nikalo).
// onProgress(stage) mile to page/download ki progress bhi batata hai.
async function kwaiDirect(url, onProgress) {
  try {
    // Kuaishou/Kwai page ke andar chhupa original mp4 nikaalo (share page ke JSON se).
    // Unicode-escapes (\u002F, \u0026) pehle saaf karo warna CDN link toot jata hai.
    const unesc = (s) => String(s)
      .replace(/\\u002F/g, '/')
      .replace(/\\u0026/g, '&')
      .replace(/\\u003D/g, '=')
      .replace(/\\\//g, '/');
    // Page fetch — TLS reset jaisi aarzi network galtiyon par ek retry (datacenter
    // network se Kuaishou kabhi-kabhi pehla connection kaat deta hai).
    let r = null;
    let lastErr = null;
    for (let attempt = 1; attempt <= 2 && !r; attempt++) {
      try {
        r = await axios.get(url, {
          timeout: 12000,
          maxRedirects: 8,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
            'Referer': 'https://www.kuaishou.com/',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } catch (e) {
        lastErr = e;
        console.log(`🎬 kwai: page fetch attempt ${attempt} fail:`, e.message);
        if (attempt < 2) await new Promise((res) => setTimeout(res, 1500));
      }
    }
    if (!r) throw lastErr || new Error('page fetch fail');
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
    // Do chakkar: pehle saare mirrors ek baar, phir (aarzi fail par) ek baar aur.
    for (let pass = 1; pass <= 2; pass++) {
      for (const fileUrl of candidates) {
        const buffer = onProgress
          ? await downloadWithProgress(fileUrl, 'https://www.kuaishou.com/', (loaded, total) => onProgress({ stage: 'download', loaded, total }))
          : await downloadToBuffer(fileUrl, 'https://www.kuaishou.com/');
        if (buffer) {
          console.log('🎬 kwai download OK:', (buffer.length / 1048576).toFixed(2), 'MB <-', new URL(fileUrl).host);
          return { buffer, filename: 'kwai.mp4' };
        }
      }
      if (pass < 2) await new Promise((res) => setTimeout(res, 1200));
    }
    console.log('🎬 kwai: koi candidate download nahi hua');
    return null;
  } catch (e) {
    console.log('🎬 kwai fail:', e.message);
    return null;
  }
}

// Photo-slideshow wale share (jo /fw/photo/ par jate hain) ke liye Kuaishou ka
// apna share-API: share page khud POST /rest/wd/ugH5App/photo/simple/info
// bulata hai — wahi bulakar photo ki asal jaankari lo. Taaza share par photo/
// video mil jata hai; purana/band share ho to API mana kar deta hai (result
// 223 — Kuaishou ke apne website par bhi wo bina login ke nahi khulta, jaanch
// karke dekha hai). Mana wale ko {type:'blocked'} bol ke laotao taaki command
// user ko asli wajah bata sake, ulta 'link galat hai' wala dosh nahi.
async function kwaiPhotoPost(url) {
  const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
  try {
    const page = await axios.get(url, { timeout: 12000, maxRedirects: 8, headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
    const finalUrl = (page.request && page.request.res && page.request.res.responseUrl) || url;
    const u = new URL(finalUrl);
    const q = u.searchParams;
    const photoId = (u.pathname.match(/\/fw\/photo\/([A-Za-z0-9_-]+)/) || [])[1] || q.get('photoId') || '';
    const shareToken = q.get('shareToken') || '';
    if (!photoId || !shareToken) return null;
    const body = {
      shareToken, photoId, isLongVideo: false,
      kpn: q.get('kpn') || 'KUAISHOU',
      efid: q.get('efid') || undefined, fid: q.get('fid') || undefined,
      shareObjectId: q.get('shareObjectId') || undefined,
      shareMethod: q.get('shareMethod') || undefined,
      shareId: q.get('shareId') || undefined,
      shareResourceType: q.get('shareResourceType') || undefined,
      shareChannel: q.get('cc') || undefined,
      subBiz: q.get('subBiz') || undefined,
    };
    const r = await axios.post('https://v.m.chenzhongtech.com/rest/wd/ugH5App/photo/simple/info?kpn=' + encodeURIComponent(body.kpn), body, {
      timeout: 12000,
      headers: { 'User-Agent': UA, 'Referer': finalUrl, 'Content-Type': 'application/json' },
    });
    const d = r.data || {};
    if (d.result !== 1 || !d.photo) {
      console.log('🎬 kwai photo API mana:', d.result, d.error_msg || '');
      return { type: 'blocked', code: d.result || 0 };
    }
    const vids = [];
    const imgs = [];
    const walk = (o, path) => {
      if (typeof o === 'string') {
        const s = o.replace(/\\u002F/g, '/').replace(/\\\//g, '/');
        if (/^https:/.test(s)) {
          if (/\.mp4(\?|$)/.test(s)) vids.push(s);
          else if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(s) && !/uhead|emotion|\/bs2\//.test(s) && /img|image|cover|atlas|photo/i.test(path)) imgs.push(s);
        }
        return;
      }
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach((v) => walk(v, path)); return; }
      for (const k of Object.keys(o)) walk(o[k], path + '.' + k);
    };
    walk(d.photo, 'photo');
    const caption = typeof d.photo.caption === 'string' ? d.photo.caption : '';
    if (vids.length) return { type: 'video', urls: [...new Set(vids)], caption };
    if (imgs.length) return { type: 'images', urls: [...new Set(imgs)].slice(0, 10), caption };
    return { type: 'blocked', code: -1 };
  } catch (e) {
    console.log('🎬 kwai photo API fail:', e.message);
    return null;
  }
}

module.exports = { cobaltDownload, cobaltResolve, kwaiDirect, downloadToBuffer, kwaiPhotoPost };
