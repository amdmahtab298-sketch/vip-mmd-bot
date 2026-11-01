// Welcome photo card — naye member ki DP ke saath stylish card (sharp + SVG).
// DP na mile (privacy) to naam ke pehle akshar wala avatar ban jata hai.
// Koi bhi galti ho to throw karega — caller text-welcome par gir jayega.
const sharp = require('sharp');
const axios = require('axios');

const esc = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

async function welcomeCard({ ppUrl, displayName, groupName, memberNo }) {
  const W = 1200;
  const H = 630;
  let ppBlock;
  let ppBuf = null;
  if (ppUrl) {
    try {
      const r = await axios.get(ppUrl, {
        responseType: 'arraybuffer',
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36' },
      });
      ppBuf = Buffer.from(r.data);
    } catch { ppBuf = null; }
  }
  if (ppBuf) {
    const ppPng = await sharp(ppBuf).resize(280, 280, { fit: 'cover' }).png().toBuffer();
    ppBlock = `<image href="data:image/png;base64,${ppPng.toString('base64')}" x="460" y="70" width="280" height="280" clip-path="url(#ppClip)"/>`;
  } else {
    const letter = esc((String(displayName || 'N').replace(/\D/g, '').charAt(0) || 'N'));
    ppBlock = `<circle cx="600" cy="210" r="140" fill="#3b2d5c"/><text x="600" y="272" font-size="160" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">${letter}</text>`;
  }
  const memberLine = memberNo ? `${esc(cut(groupName || 'Group', 30))} • Member #${memberNo}` : esc(cut(groupName || 'Group', 34));
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#141428"/><stop offset="1" stop-color="#3d1d5e"/>
    </linearGradient>
    <clipPath id="ppClip"><circle cx="600" cy="210" r="140"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="110" cy="70" r="95" fill="#ffffff" opacity="0.05"/>
  <circle cx="1130" cy="570" r="140" fill="#ffffff" opacity="0.05"/>
  <circle cx="600" cy="210" r="148" fill="none" stroke="#ffb300" stroke-width="6"/>
  ${ppBlock}
  <text x="600" y="438" font-size="66" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">WELCOME</text>
  <text x="600" y="498" font-size="40" fill="#ffd54f" text-anchor="middle" font-family="Arial, sans-serif">${esc(cut(displayName || '', 26))}</text>
  <text x="600" y="552" font-size="30" fill="#cfcfe8" text-anchor="middle" font-family="Arial, sans-serif">${memberLine}</text>
  <text x="600" y="602" font-size="24" fill="#8f8fb8" text-anchor="middle" font-family="Arial, sans-serif">its Mahtab Bot</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { welcomeCard };
