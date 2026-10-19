// sharp-based image tools: stickers, effects, meme text, watermark.
// Koi bhi function throw kar sakta hai — callers hamesha try/catch me rakhein.
const sharp = require('sharp');

const esc = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Image -> 512x512 webp sticker
async function toStickerBuffer(buffer) {
  return sharp(buffer)
    .resize(512, 512, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 80 })
    .toBuffer();
}

// Sticker/webp -> PNG image
async function stickerToPng(buffer) {
  return sharp(buffer).png().toBuffer();
}

// Center square crop -> PNG
async function cropSquare(buffer) {
  const meta = await sharp(buffer).metadata();
  const side = Math.min(meta.width || 512, meta.height || 512);
  return sharp(buffer)
    .extract({
      left: Math.floor(((meta.width || side) - side) / 2),
      top: Math.floor(((meta.height || side) - side) / 2),
      width: side,
      height: side,
    })
    .png()
    .toBuffer();
}

// Text -> sticker (ttp style)
async function textSticker(text, { size = 72 } = {}) {
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <text x="256" y="280" font-size="${size}" text-anchor="middle" fill="#ffffff"
      stroke="#000000" stroke-width="3" font-family="sans-serif" font-weight="bold">${esc(text)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

// Meme: top/bottom text overlay -> sticker
async function memeSticker(buffer, top = '', bottom = '') {
  const meta = await sharp(buffer).metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;
  const fs = Math.max(28, Math.floor(w / 10));
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <text x="${w / 2}" y="${fs + 14}" font-size="${fs}" text-anchor="middle" fill="#ffffff"
      stroke="#000000" stroke-width="3" font-family="sans-serif" font-weight="bold">${esc(top.toUpperCase())}</text>
    <text x="${w / 2}" y="${h - 20}" font-size="${fs}" text-anchor="middle" fill="#ffffff"
      stroke="#000000" stroke-width="3" font-family="sans-serif" font-weight="bold">${esc(bottom.toUpperCase())}</text>
  </svg>`;
  return sharp(buffer).composite([{ input: Buffer.from(svg) }]).webp({ quality: 85 }).toBuffer();
}

// Photo effects -> PNG
async function imageEffect(buffer, effect) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;
  let s = sharp(buffer);

  switch (effect) {
    case 'blur':
      s = s.blur(14);
      break;
    case 'grayscale':
      s = s.grayscale();
      break;
    case 'invert':
      s = s.negate();
      break;
    case 'trigger': {
      const red = `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#ff0000"/></svg>`;
      s = s.modulate({ saturation: 1.6 }).composite([{ input: Buffer.from(red), blend: 'overlay' }]);
      break;
    }
    case 'wasted': {
      const fs = Math.floor(w / 7);
      const svg = `<svg width="${w}" height="${h}">
        <text x="${w / 2}" y="${h / 2}" font-size="${fs}" text-anchor="middle" fill="none"
          stroke="#000000" stroke-width="4" font-family="sans-serif" font-weight="bold">WASTED</text>
        <text x="${w / 2}" y="${h / 2}" font-size="${fs}" text-anchor="middle" fill="#c9a227"
          font-family="sans-serif" font-weight="bold">WASTED</text>
      </svg>`;
      s = s.grayscale().composite([{ input: Buffer.from(svg) }]);
      break;
    }
    case 'jail': {
      const barW = Math.max(10, Math.floor(w / 10));
      let rects = '';
      for (let x = 0; x < w; x += barW * 2) rects += `<rect x="${x}" y="0" width="${barW}" height="${h}" fill="#111111"/>`;
      const svg = `<svg width="${w}" height="${h}">${rects}</svg>`;
      s = s.composite([{ input: Buffer.from(svg) }]);
      break;
    }
    case 'circle': {
      const mask = `<svg width="${w}" height="${h}"><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2}" fill="#ffffff"/></svg>`;
      s = s.composite([{ input: Buffer.from(mask), blend: 'dest-in' }]);
      break;
    }
    default:
      break;
  }
  return s.png().toBuffer();
}

// Bottom-right watermark text -> PNG
async function watermarkImage(buffer, text) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;
  const fs = Math.max(18, Math.floor(w / 22));
  const svg = `<svg width="${w}" height="${h}">
    <text x="${w - 16}" y="${h - 16}" font-size="${fs}" text-anchor="end" fill="#ffffff"
      stroke="#000000" stroke-width="2" font-family="sans-serif" font-weight="bold" opacity="0.9">© ${esc(text)}</text>
  </svg>`;
  return sharp(buffer).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
}

module.exports = { toStickerBuffer, stickerToPng, cropSquare, textSticker, memeSticker, imageEffect, watermarkImage };
