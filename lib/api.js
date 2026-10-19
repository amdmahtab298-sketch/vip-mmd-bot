// Safe HTTP helpers — kabhi throw nahi karte, fail hone par null dete hain.
// Handlers me hamesha null-check karo aur friendly fallback reply do.
const axios = require('axios');

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

// GET -> parsed JSON/text, ya null
async function apiGet(url, opts = {}) {
  try {
    const r = await axios.get(url, {
      timeout: 12000,
      headers: { 'User-Agent': UA },
      ...opts,
    });
    return r.data;
  } catch {
    return null;
  }
}

// GET -> Buffer (images, audio, files), ya null
async function apiGetBuffer(url, opts = {}) {
  try {
    const r = await axios.get(url, {
      timeout: 25000,
      responseType: 'arraybuffer',
      maxContentLength: 150 * 1024 * 1024,
      headers: { 'User-Agent': UA },
      ...opts,
    });
    return Buffer.from(r.data);
  } catch {
    return null;
  }
}

module.exports = { apiGet, apiGetBuffer };
