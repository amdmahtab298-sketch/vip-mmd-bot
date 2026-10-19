// ============================================================
// VIP MMD Bot — Tools Commands (62 commands)
// category: Tools | PUBLIC-BY-DEFAULT (no admin/owner/group locks)
// ============================================================
const crypto = require('crypto');
const H = require('../lib/helpers');
const { apiGet, apiGetBuffer } = require('../lib/api');

// usage hint helper
const need = (args, u, reply) => {
  if (!args.length) { reply('❌ Usage: ' + u); return false; }
  return true;
};

// module-local stopwatch state
const stopwatches = new Map();
// module-local todos fallback if store missing
const localTodos = new Map();
const todosOf = (ctx) => {
  if (ctx.store && ctx.store.todos instanceof Map) return ctx.store.todos;
  return localTodos;
};

module.exports = [

// ---------- QR ----------
{ name: 'qr', aliases: ['qrgen'], category: 'Tools', desc: 'Text se QR code image banao', usage: '.qr <text>', cooldownMs: 5000,
  run: async (ctx) => { try {
    if (!need(ctx.args, '.qr <text>', ctx.reply)) return;
    const text = ctx.text.trim();
    const buf = await apiGetBuffer('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(text));
    if (!buf) return ctx.reply('❌ QR generate nahi ho paya. Thodi der baad try karo.');
    await H.sendImage(ctx.sock, ctx.chatId, buf, '🔳 QR ready!', ctx.msg);
  } catch (e) { ctx.reply('❌ QR banate waqt error aaya. Dobara try karo.'); } } },

{ name: 'qrcode', aliases: [], category: 'Tools', desc: 'Text se QR code image banao (alias)', usage: '.qrcode <text>', cooldownMs: 5000,
  run: async (ctx) => { try {
    if (!need(ctx.args, '.qrcode <text>', ctx.reply)) return;
    const text = ctx.text.trim();
    const buf = await apiGetBuffer('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(text));
    if (!buf) return ctx.reply('❌ QR generate nahi ho paya. Thodi der baad try karo.');
    await H.sendImage(ctx.sock, ctx.chatId, buf, '🔳 QR ready!', ctx.msg);
  } catch (e) { ctx.reply('❌ QR banate waqt error aaya. Dobara try karo.'); } } },

// ---------- Shortlink ----------
{ name: 'shortlink', aliases: ['slink'], category: 'Tools', desc: 'Lambi URL ko chhota karo (TinyURL)', usage: '.shortlink <url>', cooldownMs: 5000,
  run: async (ctx) => { try {
    if (!need(ctx.args, '.shortlink <url>', ctx.reply)) return;
    const r = await apiGet('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(ctx.args[0]), { transformResponse: x => x });
    if (!r) return ctx.reply('❌ Short link ban nahi paya. URL sahi hai? Dobara try karo.');
    ctx.reply('🔗 ' + r);
  } catch (e) { ctx.reply('❌ Link short karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'short', aliases: [], category: 'Tools', desc: 'Lambi URL ko chhota karo (alias)', usage: '.short <url>', cooldownMs: 5000,
  run: async (ctx) => { try {
    if (!need(ctx.args, '.short <url>', ctx.reply)) return;
    const r = await apiGet('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(ctx.args[0]), { transformResponse: x => x });
    if (!r) return ctx.reply('❌ Short link ban nahi paya. URL sahi hai? Dobara try karo.');
    ctx.reply('🔗 ' + r);
  } catch (e) { ctx.reply('❌ Link short karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'tiny', aliases: [], category: 'Tools', desc: 'Lambi URL ko chhota karo (alias)', usage: '.tiny <url>', cooldownMs: 5000,
  run: async (ctx) => { try {
    if (!need(ctx.args, '.tiny <url>', ctx.reply)) return;
    const r = await apiGet('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(ctx.args[0]), { transformResponse: x => x });
    if (!r) return ctx.reply('❌ Short link ban nahi paya. URL sahi hai? Dobara try karo.');
    ctx.reply('🔗 ' + r);
  } catch (e) { ctx.reply('❌ Link short karte waqt error aaya. Dobara try karo.'); } } },

// ---------- Calculator ----------
{ name: 'calc', aliases: ['c'], category: 'Tools', desc: 'Expression calculate karo', usage: '.calc <expression>  (jaise: .calc (50*3)+20)',
  run: async (ctx) => { try {
    const expr = ctx.text.trim();
    if (!expr) return ctx.reply('❌ Usage: .calc <expression>  (jaise: .calc (50*3)+20)');
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return ctx.reply('🔢 Sirf numbers aur + - * / ( ) % allowed hai.');
    try {
      const val = Function('"use strict";return (' + expr + ')')();
      if (typeof val !== 'number' || !isFinite(val)) return ctx.reply('❌ Result valid number nahi hai.');
      ctx.reply('= ' + val);
    } catch (e) { ctx.reply('❌ Expression samajh nahi aayi. Dobara check karo.'); }
  } catch (e) { ctx.reply('❌ Calculation me error aaya. Dobara try karo.'); } } },

{ name: 'calculator', aliases: [], category: 'Tools', desc: 'Expression calculate karo (alias)', usage: '.calculator <expression>',
  run: async (ctx) => { try {
    const expr = ctx.text.trim();
    if (!expr) return ctx.reply('❌ Usage: .calculator <expression>');
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return ctx.reply('🔢 Sirf numbers aur + - * / ( ) % allowed hai.');
    try {
      const val = Function('"use strict";return (' + expr + ')')();
      if (typeof val !== 'number' || !isFinite(val)) return ctx.reply('❌ Result valid number nahi hai.');
      ctx.reply('= ' + val);
    } catch (e) { ctx.reply('❌ Expression samajh nahi aayi. Dobara check karo.'); }
  } catch (e) { ctx.reply('❌ Calculation me error aaya. Dobara try karo.'); } } },

// ---------- Timer ----------
{ name: 'timer', aliases: [], category: 'Tools', desc: 'Seconds me timer set karo', usage: '.timer <seconds>',
  run: async (ctx) => { try {
    const secs = parseInt(ctx.args[0], 10);
    if (!secs || secs <= 0) return ctx.reply('❌ Usage: .timer <seconds>  (jaise: .timer 30)');
    if (secs > 86400) return ctx.reply('❌ 24 ghante se zyada ka timer nahi set kar sakte.');
    ctx.reply('⏱️ Timer set: ' + secs + 's');
    setTimeout(() => { try { ctx.reply('⏰ Time up! ' + secs + ' second ho gaye!'); } catch (e) {} }, secs * 1000);
  } catch (e) { ctx.reply('❌ Timer set karte waqt error aaya. Dobara try karo.'); } } },

// ---------- Password ----------
{ name: 'password', aliases: ['pw'], category: 'Tools', desc: 'Strong random password banao', usage: '.password [length]  (default 12)',
  run: async (ctx) => { try {
    let len = parseInt(ctx.args[0], 10) || 12;
    if (isNaN(len)) len = 12;
    len = Math.max(4, Math.min(64, len));
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) pwd += chars[bytes[i] % chars.length];
    ctx.reply('🔑 ' + pwd);
  } catch (e) { ctx.reply('❌ Password banate waqt error aaya. Dobara try karo.'); } } },

{ name: 'passgen', aliases: [], category: 'Tools', desc: 'Strong random password banao (alias)', usage: '.passgen [length]',
  run: async (ctx) => { try {
    let len = parseInt(ctx.args[0], 10) || 12;
    if (isNaN(len)) len = 12;
    len = Math.max(4, Math.min(64, len));
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) pwd += chars[bytes[i] % chars.length];
    ctx.reply('🔑 ' + pwd);
  } catch (e) { ctx.reply('❌ Password banate waqt error aaya. Dobara try karo.'); } } },

// ---------- UUID ----------
{ name: 'uuid', aliases: [], category: 'Tools', desc: 'Random UUID generate karo', usage: '.uuid',
  run: async (ctx) => { try { ctx.reply('🆔 ' + crypto.randomUUID()); }
    catch (e) { ctx.reply('❌ UUID banate waqt error aaya. Dobara try karo.'); } } },

{ name: 'guid', aliases: [], category: 'Tools', desc: 'Random GUID generate karo (alias)', usage: '.guid',
  run: async (ctx) => { try { ctx.reply('🆔 ' + crypto.randomUUID()); }
    catch (e) { ctx.reply('❌ GUID banate waqt error aaya. Dobara try karo.'); } } },

// ---------- Base64 ----------
{ name: 'base64', aliases: ['b64'], category: 'Tools', desc: 'Base64 me encode/decode karo', usage: '.base64 encode <text>  |  .base64 decode <b64>',
  run: async (ctx) => { try {
    const mode = (ctx.args[0] || '').toLowerCase();
    const rest = ctx.args.slice(1).join(' ');
    if (!rest) return ctx.reply('❌ Usage: .base64 encode <text>  |  .base64 decode <b64>');
    if (mode === 'encode') ctx.reply('📦 ' + Buffer.from(rest, 'utf8').toString('base64'));
    else if (mode === 'decode') {
      try { ctx.reply('📦 ' + Buffer.from(rest.trim(), 'base64').toString('utf8')); }
      catch (e) { ctx.reply('❌ Valid base64 string nahi hai.'); }
    } else ctx.reply('❌ Usage: .base64 encode <text>  |  .base64 decode <b64>');
  } catch (e) { ctx.reply('❌ Base64 me error aaya. Dobara try karo.'); } } },

{ name: 'encode', aliases: [], category: 'Tools', desc: 'Text ko base64 me encode karo', usage: '.encode <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.encode <text>', ctx.reply)) return;
    ctx.reply('📦 ' + Buffer.from(ctx.text.trim(), 'utf8').toString('base64'));
  } catch (e) { ctx.reply('❌ Encode karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'decode', aliases: [], category: 'Tools', desc: 'Base64 string ko decode karo', usage: '.decode <base64>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.decode <base64>', ctx.reply)) return;
    try { ctx.reply('📦 ' + Buffer.from(ctx.args.join('').trim(), 'base64').toString('utf8')); }
    catch (e) { ctx.reply('❌ Valid base64 string nahi hai.'); }
  } catch (e) { ctx.reply('❌ Decode karte waqt error aaya. Dobara try karo.'); } } },

// ---------- Binary ----------
{ name: 'binary', aliases: ['bin'], category: 'Tools', desc: 'Text ko binary me badlo (wapas bhi)', usage: '.binary <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .binary <text>');
    if (/^[01\s]+$/.test(t)) {
      const dec = t.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
      ctx.reply('🔢 ' + dec);
    } else {
      const enc = [...t].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      ctx.reply('🔢 ' + enc);
    }
  } catch (e) { ctx.reply('❌ Binary me error aaya. Dobara try karo.'); } } },

// ---------- Morse ----------
{ name: 'morse', aliases: [], category: 'Tools', desc: 'Text ko morse code me badlo (wapas bhi)', usage: '.morse <text>',
  run: async (ctx) => { try {
    const MORSE = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
    const RMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .morse <text>');
    if (/^[.\-\s\/]+$/.test(t)) {
      const dec = t.trim().split(' / ').map(w => w.split(/\s+/).map(s => RMORSE[s] || '?').join('')).join(' ');
      ctx.reply('📻 ' + dec);
    } else {
      const enc = t.toUpperCase().split('').map(c => c === ' ' ? '/' : (MORSE[c] || '?')).join(' ');
      ctx.reply('📻 ' + enc);
    }
  } catch (e) { ctx.reply('❌ Morse me error aaya. Dobara try karo.'); } } },

// ---------- Hex ----------
{ name: 'hex', aliases: [], category: 'Tools', desc: 'Text ko hex me badlo (wapas bhi)', usage: '.hex <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .hex <text>');
    const nospace = t.replace(/\s/g, '');
    if (/^[0-9a-fA-F]+$/.test(nospace) && nospace.length % 2 === 0 && nospace.length >= 4 && /[0-9]/.test(nospace)) {
      try { ctx.reply('🔷 ' + Buffer.from(nospace, 'hex').toString('utf8')); return; }
      catch (e) {}
    }
    ctx.reply('🔷 ' + Buffer.from(t, 'utf8').toString('hex'));
  } catch (e) { ctx.reply('❌ Hex me error aaya. Dobara try karo.'); } } },

// ---------- Color ----------
{ name: 'color', aliases: [], category: 'Tools', desc: 'Hex color ka RGB breakdown dekho', usage: '.color <hex>  (jaise: .color #ff0000)',
  run: async (ctx) => { try {
    const hex = (ctx.args[0] || '').trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return ctx.reply('❌ Usage: .color <hex>  (jaise: .color #ff0000)');
    const h = hex.replace('#', '').toUpperCase();
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    ctx.reply('🎨 #' + h + '\nR:' + r + ' G:' + g + ' B:' + b + '\n(Naam-wali color image nahi bana sakta, isliye text me bhej diya)');
  } catch (e) { ctx.reply('❌ Color me error aaya. Dobara try karo.'); } } },

{ name: 'colour', aliases: [], category: 'Tools', desc: 'Hex color ka RGB breakdown dekho (alias)', usage: '.colour <hex>',
  run: async (ctx) => { try {
    const hex = (ctx.args[0] || '').trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return ctx.reply('❌ Usage: .colour <hex>  (jaise: .colour #ff0000)');
    const h = hex.replace('#', '').toUpperCase();
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    ctx.reply('🎨 #' + h + '\nR:' + r + ' G:' + g + ' B:' + b + '\n(Naam-wali color image nahi bana sakta, isliye text me bhej diya)');
  } catch (e) { ctx.reply('❌ Color me error aaya. Dobara try karo.'); } } },

// ---------- Counts ----------
{ name: 'wordcount', aliases: ['wc'], category: 'Tools', desc: 'Text me words gino', usage: '.wordcount <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .wordcount <text>');
    ctx.reply('📝 Words: ' + t.split(/\s+/).length);
  } catch (e) { ctx.reply('❌ Count karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'charcount', aliases: ['cc'], category: 'Tools', desc: 'Text me characters gino (space ke bina)', usage: '.charcount <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .charcount <text>');
    ctx.reply('🔤 Characters (space ke bina): ' + t.replace(/\s/g, '').length);
  } catch (e) { ctx.reply('❌ Count karte waqt error aaya. Dobara try karo.'); } } },

// ---------- Text transforms ----------
{ name: 'reverse', aliases: ['rev'], category: 'Tools', desc: 'Text ko ulta karo', usage: '.reverse <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.reverse <text>', ctx.reply)) return;
    ctx.reply('🔄 ' + [...ctx.text.trim()].reverse().join(''));
  } catch (e) { ctx.reply('❌ Reverse karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'uppercase', aliases: [], category: 'Tools', desc: 'Text ko CAPS me karo', usage: '.uppercase <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.uppercase <text>', ctx.reply)) return;
    ctx.reply('🔠 ' + ctx.text.trim().toUpperCase());
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'upper', aliases: [], category: 'Tools', desc: 'Text ko CAPS me karo (alias)', usage: '.upper <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.upper <text>', ctx.reply)) return;
    ctx.reply('🔠 ' + ctx.text.trim().toUpperCase());
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'lowercase', aliases: [], category: 'Tools', desc: 'Text ko small letters me karo', usage: '.lowercase <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.lowercase <text>', ctx.reply)) return;
    ctx.reply('🔡 ' + ctx.text.trim().toLowerCase());
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'lower', aliases: [], category: 'Tools', desc: 'Text ko small letters me karo (alias)', usage: '.lower <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.lower <text>', ctx.reply)) return;
    ctx.reply('🔡 ' + ctx.text.trim().toLowerCase());
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'capitalize', aliases: ['cap'], category: 'Tools', desc: 'Pehla letter bada karo', usage: '.capitalize <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.capitalize <text>', ctx.reply)) return;
    const t = ctx.text.trim().toLowerCase();
    ctx.reply('✏️ ' + t.charAt(0).toUpperCase() + t.slice(1));
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

{ name: 'title', aliases: [], category: 'Tools', desc: 'Har word ka pehla letter bada karo', usage: '.title <text>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.title <text>', ctx.reply)) return;
    ctx.reply('✏️ ' + ctx.text.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  } catch (e) { ctx.reply('❌ Convert karte waqt error aaya. Dobara try karo.'); } } },

// ---------- BMI ----------
{ name: 'bmi', aliases: [], category: 'Tools', desc: 'BMI calculate karo (weight kg, height ft)', usage: '.bmi <weight_kg> <height_ft>  (jaise: .bmi 70 5.8)',
  run: async (ctx) => { try {
    const w = parseFloat(ctx.args[0]), ft = parseFloat(ctx.args[1]);
    if (!w || !ft || w <= 0 || ft <= 0) return ctx.reply('❌ Usage: .bmi <weight_kg> <height_ft>  (jaise: .bmi 70 5.8)');
    const hm = ft * 0.3048;
    const bmi = w / (hm * hm);
    const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal ✅' : bmi < 30 ? 'Overweight' : 'Obese';
    ctx.reply('⚖️ BMI: ' + bmi.toFixed(1) + ' (' + cat + ')');
  } catch (e) { ctx.reply('❌ BMI me error aaya. Dobara try karo.'); } } },

{ name: 'bmicalc', aliases: [], category: 'Tools', desc: 'BMI calculate karo (alias)', usage: '.bmicalc <weight_kg> <height_ft>',
  run: async (ctx) => { try {
    const w = parseFloat(ctx.args[0]), ft = parseFloat(ctx.args[1]);
    if (!w || !ft || w <= 0 || ft <= 0) return ctx.reply('❌ Usage: .bmicalc <weight_kg> <height_ft>  (jaise: .bmicalc 70 5.8)');
    const hm = ft * 0.3048;
    const bmi = w / (hm * hm);
    const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal ✅' : bmi < 30 ? 'Overweight' : 'Obese';
    ctx.reply('⚖️ BMI: ' + bmi.toFixed(1) + ' (' + cat + ')');
  } catch (e) { ctx.reply('❌ BMI me error aaya. Dobara try karo.'); } } },

// ---------- Age ----------
{ name: 'age', aliases: [], category: 'Tools', desc: 'Date of birth se age nikalo', usage: '.age <YYYY-MM-DD>  (jaise: .age 2000-05-20)',
  run: async (ctx) => { try {
    const d = ctx.args[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return ctx.reply('❌ Usage: .age <YYYY-MM-DD>  (jaise: .age 2000-05-20)');
    const b = new Date(d + 'T00:00:00'), now = new Date();
    if (isNaN(b.getTime()) || b > now) return ctx.reply('❌ Valid past date daalo.');
    let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), dd = now.getDate() - b.getDate();
    if (dd < 0) { m--; dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    ctx.reply('🎂 Age: ' + y + ' saal, ' + m + ' mahine, ' + dd + ' din');
  } catch (e) { ctx.reply('❌ Age me error aaya. Dobara try karo.'); } } },

{ name: 'agecalc', aliases: [], category: 'Tools', desc: 'Date of birth se age nikalo (alias)', usage: '.agecalc <YYYY-MM-DD>',
  run: async (ctx) => { try {
    const d = ctx.args[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return ctx.reply('❌ Usage: .agecalc <YYYY-MM-DD>');
    const b = new Date(d + 'T00:00:00'), now = new Date();
    if (isNaN(b.getTime()) || b > now) return ctx.reply('❌ Valid past date daalo.');
    let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), dd = now.getDate() - b.getDate();
    if (dd < 0) { m--; dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    ctx.reply('🎂 Age: ' + y + ' saal, ' + m + ' mahine, ' + dd + ' din');
  } catch (e) { ctx.reply('❌ Age me error aaya. Dobara try karo.'); } } },

// ---------- EMI ----------
{ name: 'emi', aliases: [], category: 'Tools', desc: 'Loan EMI calculate karo', usage: '.emi <principal> <annual_rate%> <months>  (jaise: .emi 500000 9 36)',
  run: async (ctx) => { try {
    const P = parseFloat(ctx.args[0]), annual = parseFloat(ctx.args[1]), n = parseInt(ctx.args[2], 10);
    if (!P || !annual || !n || P <= 0 || annual <= 0 || n <= 0) return ctx.reply('❌ Usage: .emi <principal> <annual_rate%> <months>  (jaise: .emi 500000 9 36)');
    const r = annual / 12 / 100;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    ctx.reply('💰 Monthly EMI: ₹' + emi.toFixed(2) + '\nTotal payable: ₹' + (emi * n).toFixed(2) + '\nTotal interest: ₹' + (emi * n - P).toFixed(2));
  } catch (e) { ctx.reply('❌ EMI me error aaya. Dobara try karo.'); } } },

{ name: 'emicalc', aliases: [], category: 'Tools', desc: 'Loan EMI calculate karo (alias)', usage: '.emicalc <principal> <annual_rate%> <months>',
  run: async (ctx) => { try {
    const P = parseFloat(ctx.args[0]), annual = parseFloat(ctx.args[1]), n = parseInt(ctx.args[2], 10);
    if (!P || !annual || !n || P <= 0 || annual <= 0 || n <= 0) return ctx.reply('❌ Usage: .emicalc <principal> <annual_rate%> <months>');
    const r = annual / 12 / 100;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    ctx.reply('💰 Monthly EMI: ₹' + emi.toFixed(2) + '\nTotal payable: ₹' + (emi * n).toFixed(2) + '\nTotal interest: ₹' + (emi * n - P).toFixed(2));
  } catch (e) { ctx.reply('❌ EMI me error aaya. Dobara try karo.'); } } },

// ---------- GST ----------
{ name: 'gst', aliases: [], category: 'Tools', desc: 'GST add karke total nikalo', usage: '.gst <amount> [rate%]  (default 18%)',
  run: async (ctx) => { try {
    const amt = parseFloat(ctx.args[0]), rate = parseFloat(ctx.args[1]) || 18;
    if (!amt || amt <= 0) return ctx.reply('❌ Usage: .gst <amount> [rate%]  (jaise: .gst 1000 18)');
    const g = amt * rate / 100;
    ctx.reply('🧾 Amount: ₹' + amt.toFixed(2) + '\nGST (' + rate + '%): ₹' + g.toFixed(2) + '\nTotal: ₹' + (amt + g).toFixed(2));
  } catch (e) { ctx.reply('❌ GST me error aaya. Dobara try karo.'); } } },

{ name: 'gstcalc', aliases: [], category: 'Tools', desc: 'GST add karke total nikalo (alias)', usage: '.gstcalc <amount> [rate%]',
  run: async (ctx) => { try {
    const amt = parseFloat(ctx.args[0]), rate = parseFloat(ctx.args[1]) || 18;
    if (!amt || amt <= 0) return ctx.reply('❌ Usage: .gstcalc <amount> [rate%]');
    const g = amt * rate / 100;
    ctx.reply('🧾 Amount: ₹' + amt.toFixed(2) + '\nGST (' + rate + '%): ₹' + g.toFixed(2) + '\nTotal: ₹' + (amt + g).toFixed(2));
  } catch (e) { ctx.reply('❌ GST me error aaya. Dobara try karo.'); } } },

// ---------- Discount ----------
{ name: 'discount', aliases: ['disc'], category: 'Tools', desc: 'Discount ke baad final price nikalo', usage: '.discount <price> <percent%>  (jaise: .discount 2000 25)',
  run: async (ctx) => { try {
    const p = parseFloat(ctx.args[0]), pc = parseFloat(ctx.args[1]);
    if (!p || isNaN(pc) || p <= 0 || pc < 0 || pc > 100) return ctx.reply('❌ Usage: .discount <price> <percent%>  (jaise: .discount 2000 25)');
    const save = p * pc / 100;
    ctx.reply('🏷️ Price: ₹' + p.toFixed(2) + '\nDiscount (' + pc + '%): -₹' + save.toFixed(2) + '\nFinal price: ₹' + (p - save).toFixed(2));
  } catch (e) { ctx.reply('❌ Discount me error aaya. Dobara try karo.'); } } },

// ---------- Percent ----------
{ name: 'percent', aliases: ['pct'], category: 'Tools', desc: 'X ka Y% nikalo', usage: '.percent <x> <of y>  (jaise: .percent 20 of 1000)',
  run: async (ctx) => { try {
    const nums = ctx.args.map(a => parseFloat(a)).filter(a => !isNaN(a));
    if (nums.length < 2) return ctx.reply('❌ Usage: .percent <x> <of y>  (jaise: .percent 20 of 1000)');
    const [x, y] = nums;
    ctx.reply('📊 ' + x + '% of ' + y + ' = ' + (x / 100 * y));
  } catch (e) { ctx.reply('❌ Percent me error aaya. Dobara try karo.'); } } },

// ---------- Average ----------
{ name: 'average', aliases: [], category: 'Tools', desc: 'Numbers ka average nikalo', usage: '.average <n1> <n2> ...  (jaise: .average 10 20 30)',
  run: async (ctx) => { try {
    const nums = ctx.args.map(a => parseFloat(a)).filter(a => !isNaN(a));
    if (!nums.length) return ctx.reply('❌ Usage: .average <n1> <n2> ...  (jaise: .average 10 20 30)');
    ctx.reply('📊 Average: ' + (nums.reduce((a, b) => a + b, 0) / nums.length));
  } catch (e) { ctx.reply('❌ Average me error aaya. Dobara try karo.'); } } },

{ name: 'avg', aliases: [], category: 'Tools', desc: 'Numbers ka average nikalo (alias)', usage: '.avg <n1> <n2> ...',
  run: async (ctx) => { try {
    const nums = ctx.args.map(a => parseFloat(a)).filter(a => !isNaN(a));
    if (!nums.length) return ctx.reply('❌ Usage: .avg <n1> <n2> ...');
    ctx.reply('📊 Average: ' + (nums.reduce((a, b) => a + b, 0) / nums.length));
  } catch (e) { ctx.reply('❌ Average me error aaya. Dobara try karo.'); } } },

// ---------- Random ----------
{ name: 'random', aliases: [], category: 'Tools', desc: 'Min-max ke beech random number', usage: '.random [min] [max]  (default 1 100)',
  run: async (ctx) => { try {
    let min = parseInt(ctx.args[0], 10), max = parseInt(ctx.args[1], 10);
    if (isNaN(min)) min = 1; if (isNaN(max)) max = 100;
    if (min > max) [min, max] = [max, min];
    const n = crypto.randomInt(min, max + 1);
    ctx.reply('🎲 Random (' + min + '-' + max + '): ' + n);
  } catch (e) { ctx.reply('❌ Random me error aaya. Dobara try karo.'); } } },

{ name: 'rand', aliases: [], category: 'Tools', desc: 'Min-max ke beech random number (alias)', usage: '.rand [min] [max]',
  run: async (ctx) => { try {
    let min = parseInt(ctx.args[0], 10), max = parseInt(ctx.args[1], 10);
    if (isNaN(min)) min = 1; if (isNaN(max)) max = 100;
    if (min > max) [min, max] = [max, min];
    const n = crypto.randomInt(min, max + 1);
    ctx.reply('🎲 Random (' + min + '-' + max + '): ' + n);
  } catch (e) { ctx.reply('❌ Random me error aaya. Dobara try karo.'); } } },

{ name: 'dice', aliases: [], category: 'Tools', desc: 'Pasa pheko (1-6)', usage: '.dice',
  run: async (ctx) => { try {
    ctx.reply('🎲 Dice: ' + crypto.randomInt(1, 7));
  } catch (e) { ctx.reply('❌ Dice me error aaya. Dobara try karo.'); } } },

{ name: 'coin', aliases: [], category: 'Tools', desc: 'Sikka uchhalo (Heads/Tails)', usage: '.coin',
  run: async (ctx) => { try {
    ctx.reply('🪙 ' + (crypto.randomInt(0, 2) === 0 ? 'Heads' : 'Tails'));
  } catch (e) { ctx.reply('❌ Coin me error aaya. Dobara try karo.'); } } },

{ name: 'flip', aliases: [], category: 'Tools', desc: 'Sikka uchhalo (alias)', usage: '.flip',
  run: async (ctx) => { try {
    ctx.reply('🪙 ' + (crypto.randomInt(0, 2) === 0 ? 'Heads' : 'Tails'));
  } catch (e) { ctx.reply('❌ Coin me error aaya. Dobara try karo.'); } } },

// ---------- Choose / Pick ----------
{ name: 'choose', aliases: [], category: 'Tools', desc: 'Options me se ek random chuno', usage: '.choose <a, b, c>  (comma se alag karo)',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .choose <a, b, c>');
    const opts = (t.includes(',') ? t.split(',') : t.split(/\s+/)).map(s => s.trim()).filter(Boolean);
    if (!opts.length) return ctx.reply('❌ Usage: .choose <a, b, c>');
    ctx.reply('🤔 Maine chuna: ' + opts[crypto.randomInt(0, opts.length)]);
  } catch (e) { ctx.reply('❌ Choose me error aaya. Dobara try karo.'); } } },

{ name: 'pick', aliases: [], category: 'Tools', desc: 'Options me se ek random chuno (alias)', usage: '.pick <a, b, c>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .pick <a, b, c>');
    const opts = (t.includes(',') ? t.split(',') : t.split(/\s+/)).map(s => s.trim()).filter(Boolean);
    if (!opts.length) return ctx.reply('❌ Usage: .pick <a, b, c>');
    ctx.reply('🤔 Maine chuna: ' + opts[crypto.randomInt(0, opts.length)]);
  } catch (e) { ctx.reply('❌ Pick me error aaya. Dobara try karo.'); } } },

// ---------- Shuffle / Sort / Len ----------
{ name: 'shuffle', aliases: [], category: 'Tools', desc: 'Words ko random order me mix karo', usage: '.shuffle <words...>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.shuffle <words...>', ctx.reply)) return;
    const arr = [...ctx.args];
    for (let i = arr.length - 1; i > 0; i--) { const j = crypto.randomInt(0, i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    ctx.reply('🔀 ' + arr.join(' '));
  } catch (e) { ctx.reply('❌ Shuffle me error aaya. Dobara try karo.'); } } },

{ name: 'sort', aliases: [], category: 'Tools', desc: 'Words/numbers ko sort karo', usage: '.sort <words ya numbers...>',
  run: async (ctx) => { try {
    if (!need(ctx.args, '.sort <words ya numbers...>', ctx.reply)) return;
    const arr = [...ctx.args];
    const allNum = arr.every(a => !isNaN(parseFloat(a)));
    arr.sort(allNum ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
    ctx.reply('↕️ ' + arr.join(' '));
  } catch (e) { ctx.reply('❌ Sort me error aaya. Dobara try karo.'); } } },

{ name: 'len', aliases: ['length'], category: 'Tools', desc: 'Text ki length gino (space ke bina)', usage: '.len <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .len <text>');
    ctx.reply('📏 Length (space ke bina): ' + t.replace(/\s/g, '').length);
  } catch (e) { ctx.reply('❌ Length me error aaya. Dobara try karo.'); } } },

// ---------- Palindrome / Anagram ----------
{ name: 'palindrome', aliases: ['palin'], category: 'Tools', desc: 'Check karo text palindrome hai ya nahi', usage: '.palindrome <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .palindrome <text>');
    const clean = t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPal = clean.length > 0 && clean === [...clean].reverse().join('');
    ctx.reply(isPal ? '✅ Haan! Ye palindrome hai.' : '❌ Nahi, ye palindrome nahi hai.');
  } catch (e) { ctx.reply('❌ Check me error aaya. Dobara try karo.'); } } },

{ name: 'anagram', aliases: [], category: 'Tools', desc: 'Do words anagram hain ya nahi check karo', usage: '.anagram <word1> <word2>',
  run: async (ctx) => { try {
    if (ctx.args.length < 2) return ctx.reply('❌ Usage: .anagram <word1> <word2>');
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
    const a = norm(ctx.args[0]), b = norm(ctx.args.slice(1).join(''));
    const isAna = a.length > 0 && a === b;
    ctx.reply(isAna ? '✅ Haan! Ye anagram hain.' : '❌ Nahi, ye anagram nahi hain.');
  } catch (e) { ctx.reply('❌ Check me error aaya. Dobara try karo.'); } } },

// ---------- Leap year ----------
{ name: 'leapyear', aliases: ['leap'], category: 'Tools', desc: 'Saal leap year hai ya nahi', usage: '.leapyear <year>  (jaise: .leapyear 2028)',
  run: async (ctx) => { try {
    const y = parseInt(ctx.args[0], 10);
    if (!y || y < 1) return ctx.reply('❌ Usage: .leapyear <year>  (jaise: .leapyear 2028)');
    const leap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    ctx.reply(leap ? '✅ ' + y + ' leap year hai! (366 din)' : '❌ ' + y + ' leap year nahi hai. (365 din)');
  } catch (e) { ctx.reply('❌ Check me error aaya. Dobara try karo.'); } } },

// ---------- Day of ----------
{ name: 'dayof', aliases: [], category: 'Tools', desc: 'Date ka weekday nikalo', usage: '.dayof <YYYY-MM-DD>  (jaise: .dayof 2026-12-25)',
  run: async (ctx) => { try {
    const d = ctx.args[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return ctx.reply('❌ Usage: .dayof <YYYY-MM-DD>  (jaise: .dayof 2026-12-25)');
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt.getTime())) return ctx.reply('❌ Valid date daalo.');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hin = ['Ravivar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar'];
    ctx.reply('📅 ' + d + ' = ' + days[dt.getDay()] + ' (' + hin[dt.getDay()] + ')');
  } catch (e) { ctx.reply('❌ Date me error aaya. Dobara try karo.'); } } },

// ---------- Countdown ----------
{ name: 'countdown', aliases: ['cd'], category: 'Tools', desc: 'Date tak kitne din bache (ya ho gaye)', usage: '.countdown <YYYY-MM-DD>',
  run: async (ctx) => { try {
    const d = ctx.args[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return ctx.reply('❌ Usage: .countdown <YYYY-MM-DD>  (jaise: .countdown 2026-12-31)');
    const target = new Date(d + 'T00:00:00'), now = new Date();
    if (isNaN(target.getTime())) return ctx.reply('❌ Valid date daalo.');
    const days = Math.round((target - now) / 86400000);
    if (days > 0) ctx.reply('⏳ ' + d + ' me ' + days + ' din bache hain!');
    else if (days < 0) ctx.reply('📆 ' + d + ' ko ' + Math.abs(days) + ' din ho gaye.');
    else ctx.reply('🎉 Aaj hi hai! ' + d);
  } catch (e) { ctx.reply('❌ Countdown me error aaya. Dobara try karo.'); } } },

// ---------- Stopwatch ----------
{ name: 'stopwatch', aliases: ['sw'], category: 'Tools', desc: 'Stopwatch start/stop karo', usage: '.stopwatch start  |  .stopwatch stop',
  run: async (ctx) => { try {
    const sub = (ctx.args[0] || '').toLowerCase();
    const key = ctx.sender;
    if (sub === 'start') {
      stopwatches.set(key, Date.now());
      ctx.reply('⏱️ Stopwatch START! Rokne ke liye: .stopwatch stop');
    } else if (sub === 'stop') {
      const t0 = stopwatches.get(key);
      if (!t0) return ctx.reply('❌ Pehle .stopwatch start karo.');
      const ms = Date.now() - t0;
      stopwatches.delete(key);
      const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
      ctx.reply('⏱️ Elapsed: ' + h + 'h ' + (m % 60) + 'm ' + (s % 60) + 's (' + ms + ' ms)');
    } else {
      if (stopwatches.has(key)) {
        const t0 = stopwatches.get(key);
        stopwatches.delete(key);
        ctx.reply('⏱️ Stopwatch STOP! Elapsed: ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
      } else {
        stopwatches.set(key, Date.now());
        ctx.reply('⏱️ Stopwatch START! Rokne ke liye: .stopwatch');
      }
    }
  } catch (e) { ctx.reply('❌ Stopwatch me error aaya. Dobara try karo.'); } } },

// ---------- Todo / Note ----------
{ name: 'todo', aliases: [], category: 'Tools', desc: 'Apna todo/note save karo', usage: '.todo <note>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .todo <note>');
    const m = todosOf(ctx);
    const arr = m.get(ctx.sender) || [];
    arr.push(t);
    m.set(ctx.sender, arr);
    ctx.reply('✅ Note save ho gaya! (Total: ' + arr.length + ')');
  } catch (e) { ctx.reply('❌ Note save me error aaya. Dobara try karo.'); } } },

{ name: 'addtodo', aliases: [], category: 'Tools', desc: 'Apna todo/note save karo (alias)', usage: '.addtodo <note>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .addtodo <note>');
    const m = todosOf(ctx);
    const arr = m.get(ctx.sender) || [];
    arr.push(t);
    m.set(ctx.sender, arr);
    ctx.reply('✅ Note save ho gaya! (Total: ' + arr.length + ')');
  } catch (e) { ctx.reply('❌ Note save me error aaya. Dobara try karo.'); } } },

{ name: 'listtodo', aliases: ['todos'], category: 'Tools', desc: 'Apne saare todos dekho', usage: '.listtodo',
  run: async (ctx) => { try {
    const arr = todosOf(ctx).get(ctx.sender) || [];
    if (!arr.length) return ctx.reply('📝 Koi todo nahi hai. Pehle .todo se add karo.');
    ctx.reply('📝 Tumhare todos:\n' + arr.map((t, i) => (i + 1) + '. ' + t).join('\n'));
  } catch (e) { ctx.reply('❌ List me error aaya. Dobara try karo.'); } } },

{ name: 'deltodo', aliases: ['deltodos'], category: 'Tools', desc: 'Todo ko number se delete karo', usage: '.deltodo <number>',
  run: async (ctx) => { try {
    const idx = parseInt(ctx.args[0], 10);
    const m = todosOf(ctx);
    const arr = m.get(ctx.sender) || [];
    if (!idx || idx < 1 || idx > arr.length) return ctx.reply('❌ Usage: .deltodo <number>  (1 se ' + arr.length + ' tak)');
    const removed = arr.splice(idx - 1, 1)[0];
    m.set(ctx.sender, arr);
    ctx.reply('🗑️ Delete ho gaya: ' + removed);
  } catch (e) { ctx.reply('❌ Delete me error aaya. Dobara try karo.'); } } },

{ name: 'note', aliases: [], category: 'Tools', desc: 'Quick note save karo (todo jaisa)', usage: '.note <text>',
  run: async (ctx) => { try {
    const t = ctx.text.trim();
    if (!t) return ctx.reply('❌ Usage: .note <text>');
    const m = todosOf(ctx);
    const arr = m.get(ctx.sender) || [];
    arr.push(t);
    m.set(ctx.sender, arr);
    ctx.reply('✅ Note save ho gaya! (Total: ' + arr.length + ')');
  } catch (e) { ctx.reply('❌ Note save me error aaya. Dobara try karo.'); } } },

];
