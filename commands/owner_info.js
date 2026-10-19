// owner_info.js — Info + Owner command set for VIP MMD Bot (Baileys v6, CommonJS)
const H = require('../lib/helpers');
const config = require('../config');
const fs = require('fs');
const path = require('path');

function fmtUptime() {
  const s = Math.floor(process.uptime());
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h + 'h ' + m + 'm ' + sec + 's';
}

function ownerJid() {
  return (config.ownerNumber || '').replace(/\D/g, '') + '@s.whatsapp.net';
}

async function safeErr(reply) {
  try { await reply('❌ Kuch galat ho gaya, dobara try karo.'); } catch (e) {}
}

function resolveTarget(ctx) {
  try {
    const men = H.getMentioned(ctx.msg);
    if (men && men[0]) return men[0];
    const q = H.getQuotedSender(ctx.msg);
    if (q) return q;
    if (ctx.args && ctx.args[0]) {
      const d = String(ctx.args[0]).replace(/\D/g, '');
      if (d) return d + '@s.whatsapp.net';
    }
  } catch (e) {}
  return null;
}

async function doBroadcast(ctx, groupsOnly) {
  const { sock, text, store, reply } = ctx;
  if (!text) {
    try { await reply('❌ Message likho! Usage: ' + config.prefix + 'broadcast <message>'); } catch (e) {}
    return;
  }
  let chats = [];
  try { chats = store && store.seenChats ? [...store.seenChats] : []; } catch (e) { chats = []; }
  if (groupsOnly) chats = chats.filter(j => typeof j === 'string' && j.endsWith('@g.us'));
  chats = chats.slice(0, 50);
  let n = 0;
  for (const c of chats) {
    try {
      await sock.sendMessage(c, { text: '📢 *Broadcast*\n\n' + text });
      n++;
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {}
  }
  try { await reply('📢 ' + n + (groupsOnly ? ' groups' : ' chats') + ' me bheja!'); } catch (e) {}
}

const RULES_TEXT = '📋 Rules:\n1. Spam mat karo\n2. Illegal content mat bhejo\n3. Admin ke instructions follow karo\n4. Masti karo, pareshan nahi!';

module.exports = [
  {
    name: 'menu',
    aliases: ['allmenu'],
    category: 'Info',
    desc: 'Saare commands category-wise dekho.',
    usage: '.menu',
    run: async (ctx) => {
      try {
        const { registry, reply } = ctx;
        const groups = {};
        const order = [];
        for (const c of registry) {
          const cat = c.category || 'Misc';
          if (!groups[cat]) { groups[cat] = []; order.push(cat); }
          groups[cat].push(c);
        }
        await reply('🤖 *' + config.botName + '*\n📜 Total commands: ' + registry.length + '\n\nNeeche categories hain:');
        for (const cat of order) {
          const cmds = groups[cat];
          const seen = {};
          const names = [];
          for (const c of cmds) {
            const all = [c.name].concat(c.aliases || []);
            for (const n of all) {
              const key = config.prefix + n;
              if (!seen[key]) { seen[key] = true; names.push(key); }
            }
          }
          await reply('*📌 ' + cat + ' (' + cmds.length + ')*\n' + names.join(' '));
        }
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'help',
    aliases: ['h'],
    category: 'Info',
    desc: 'Kisi command ki detail dekho.',
    usage: '.help <command>',
    run: async (ctx) => {
      try {
        const { args, registry, reply } = ctx;
        if (!args[0]) { await reply('📜 Poora menu: ' + config.prefix + 'menu'); return; }
        const q = String(args[0]).toLowerCase().replace(/^\./, '');
        const c = registry.find(x => x.name === q || (x.aliases || []).indexOf(q) !== -1);
        if (!c) { await reply('❌ "' + q + '" naam ka command nahi mila.'); return; }
        await reply('📌 ' + config.prefix + c.name + '\n📝 ' + (c.desc || '—') + '\n💡 Usage: ' + (c.usage || config.prefix + c.name));
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'ping',
    aliases: ['p'],
    category: 'Info',
    desc: 'Bot ka response time check karo.',
    usage: '.ping',
    run: async (ctx) => {
      try {
        const t = Date.now();
        await ctx.reply('🏓 Pong! ' + (Date.now() - t) + 'ms');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'speed',
    aliases: ['spd'],
    category: 'Info',
    desc: 'Bot ki speed test karo.',
    usage: '.speed',
    run: async (ctx) => {
      try {
        const t = Date.now();
        await ctx.reply('⚡ Speed: ' + (Date.now() - t) + 'ms');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'runtime',
    aliases: ['rt'],
    category: 'Info',
    desc: 'Bot kitne time se chal raha hai.',
    usage: '.runtime',
    run: async (ctx) => {
      try {
        await ctx.reply('⏱️ Uptime: ' + fmtUptime());
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'uptime',
    aliases: ['up'],
    category: 'Info',
    desc: 'Bot ka uptime dekho.',
    usage: '.uptime',
    run: async (ctx) => {
      try {
        await ctx.reply('⏱️ Uptime: ' + fmtUptime());
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'botinfo',
    aliases: ['binfo'],
    category: 'Info',
    desc: 'Bot ki poori jankari.',
    usage: '.botinfo',
    run: async (ctx) => {
      try {
        await ctx.reply('🤖 ' + config.botName + '\n📌 Version: ' + config.version + '\n🔤 Prefix: ' + config.prefix + '\n📜 Commands: ' + ctx.registry.length + '\n⏱️ Uptime: ' + fmtUptime());
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'info',
    aliases: ['about'],
    category: 'Info',
    desc: 'Bot ke baare me jankari.',
    usage: '.info',
    run: async (ctx) => {
      try {
        await ctx.reply('🤖 ' + config.botName + '\n📌 Version: ' + config.version + '\n🔤 Prefix: ' + config.prefix + '\n📜 Commands: ' + ctx.registry.length + '\n⏱️ Uptime: ' + fmtUptime());
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'owner',
    aliases: ['own'],
    category: 'Info',
    desc: 'Bot ke owner ka contact.',
    usage: '.owner',
    run: async (ctx) => {
      try {
        await ctx.reply('👑 Owner: wa.me/' + (config.ownerNumber || '').replace(/\D/g, ''));
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'creator',
    aliases: ['dev'],
    category: 'Info',
    desc: 'Bot ke creator ka contact.',
    usage: '.creator',
    run: async (ctx) => {
      try {
        await ctx.reply('👑 Owner: wa.me/' + (config.ownerNumber || '').replace(/\D/g, ''));
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'rules',
    aliases: ['rule'],
    category: 'Info',
    desc: 'Bot ke rules dekho.',
    usage: '.rules',
    run: async (ctx) => {
      try {
        await ctx.reply(RULES_TEXT);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'tos',
    aliases: ['terms'],
    category: 'Info',
    desc: 'Terms of service dekho.',
    usage: '.tos',
    run: async (ctx) => {
      try {
        await ctx.reply(RULES_TEXT);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'listcmd',
    aliases: ['lc'],
    category: 'Info',
    desc: 'Har category me kitne commands hain.',
    usage: '.listcmd',
    run: async (ctx) => {
      try {
        const { registry, reply } = ctx;
        const groups = {};
        const order = [];
        for (const c of registry) {
          const cat = c.category || 'Misc';
          if (!groups[cat]) { groups[cat] = 0; order.push(cat); }
          groups[cat]++;
        }
        let out = '📜 ' + registry.length + ' commands:';
        for (const cat of order) out += '\n▪️ ' + cat + ': ' + groups[cat];
        await reply(out);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'cmds',
    aliases: ['cmdlist'],
    category: 'Info',
    desc: 'Commands ki category-wise ginti.',
    usage: '.cmds',
    run: async (ctx) => {
      try {
        const { registry, reply } = ctx;
        const groups = {};
        const order = [];
        for (const c of registry) {
          const cat = c.category || 'Misc';
          if (!groups[cat]) { groups[cat] = 0; order.push(cat); }
          groups[cat]++;
        }
        let out = '📜 ' + registry.length + ' commands:';
        for (const cat of order) out += '\n▪️ ' + cat + ': ' + groups[cat];
        await reply(out);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'stats',
    aliases: ['stat'],
    category: 'Info',
    desc: 'Bot ke usage stats dekho.',
    usage: '.stats',
    run: async (ctx) => {
      try {
        const s = ctx.store || {};
        const msgCount = s.msgCount || 0;
        const users = s.seenUsers ? s.seenUsers.size : 0;
        const chats = s.seenChats ? s.seenChats.size : 0;
        await ctx.reply('📊 Stats:\n💬 Messages: ' + msgCount + '\n👥 Users: ' + users + '\n💭 Chats: ' + chats);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'users',
    aliases: ['userlist'],
    category: 'Info',
    desc: 'Kitne users ne bot use kiya.',
    usage: '.users',
    run: async (ctx) => {
      try {
        const n = ctx.store && ctx.store.seenUsers ? ctx.store.seenUsers.size : 0;
        await ctx.reply('👥 Total users: ' + n);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'broadcast',
    aliases: ['bcast'],
    category: 'Info',
    desc: 'Sab chats me message bhejo (owner only).',
    usage: '.broadcast <message>',
    ownerOnly: true,
    run: async (ctx) => { await doBroadcast(ctx, false); }
  },
  {
    name: 'bc',
    aliases: [],
    category: 'Info',
    desc: 'broadcast ka shortcut (owner only).',
    usage: '.bc <message>',
    ownerOnly: true,
    run: async (ctx) => { await doBroadcast(ctx, false); }
  },
  {
    name: 'bcgc',
    aliases: [],
    category: 'Info',
    desc: 'Sirf groups me broadcast karo (owner only).',
    usage: '.bcgc <message>',
    ownerOnly: true,
    run: async (ctx) => { await doBroadcast(ctx, true); }
  },
  {
    name: 'setprefix',
    aliases: ['sprefix'],
    category: 'Info',
    desc: 'Bot ka command prefix badlo (owner only).',
    usage: '.setprefix <naya prefix>',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const p = ctx.args[0];
        if (!p) { await ctx.reply('❌ Prefix do! Usage: ' + config.prefix + 'setprefix <naya prefix>'); return; }
        config.prefix = p;
        await ctx.reply('🔤 Prefix ab: ' + p);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'prefix',
    aliases: ['pref'],
    category: 'Info',
    desc: 'Current prefix dekho.',
    usage: '.prefix',
    run: async (ctx) => {
      try {
        await ctx.reply('🔤 Current prefix: ' + config.prefix);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'setname',
    aliases: ['sname'],
    category: 'Info',
    desc: 'Bot ka naam badlo (owner only).',
    usage: '.setname <naya naam>',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        if (ctx.text) config.botName = ctx.text;
        await ctx.reply('🤖 Bot ka naam ab: ' + config.botName);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'botname',
    aliases: ['bname'],
    category: 'Info',
    desc: 'Bot ka naam dekho.',
    usage: '.botname',
    run: async (ctx) => {
      try {
        await ctx.reply('🤖 ' + config.botName);
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'block',
    aliases: [],
    category: 'Info',
    desc: 'Kisi user ko block karo (owner only).',
    usage: '.block @user',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const target = resolveTarget(ctx);
        if (!target) { await ctx.reply('❌ Kisi ko mention/tag karo ya number do! Usage: ' + config.prefix + 'block @user'); return; }
        try {
          await ctx.sock.updateBlockStatus(target, 'block');
        } catch (e) { await ctx.reply('❌ Block nahi ho paya.'); return; }
        await ctx.reply('🚫 Blocked!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'unblock',
    aliases: ['ublock'],
    category: 'Info',
    desc: 'Kisi user ko unblock karo (owner only).',
    usage: '.unblock @user',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const target = resolveTarget(ctx);
        if (!target) { await ctx.reply('❌ Kisi ko mention/tag karo ya number do! Usage: ' + config.prefix + 'unblock @user'); return; }
        try {
          await ctx.sock.updateBlockStatus(target, 'unblock');
        } catch (e) { await ctx.reply('❌ Unblock nahi ho paya.'); return; }
        await ctx.reply('✅ Unblocked!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'blocklist',
    aliases: ['blist'],
    category: 'Info',
    desc: 'Blocked users ki list (owner only).',
    usage: '.blocklist',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        let l = [];
        try {
          l = await ctx.sock.fetchBlocklist() || [];
        } catch (e) { await ctx.reply('❌ Blocklist nahi mil payi.'); return; }
        if (l.length) await ctx.reply('🚫 Blocked:\n' + l.map(H.num).join('\n'));
        else await ctx.reply('Koi blocked nahi hai.');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'join',
    aliases: [],
    category: 'Info',
    desc: 'Invite link se group join karo (owner only).',
    usage: '.join <invite link>',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const link = ctx.args[0];
        if (!link) { await ctx.reply('❌ Group invite link do! Usage: ' + config.prefix + 'join <invite link>'); return; }
        const code = String(link).split('/').pop().split('?')[0];
        try {
          await ctx.sock.groupAcceptInvite(code);
        } catch (e) { await ctx.reply('❌ Join nahi ho paya. Link check karo.'); return; }
        await ctx.reply('✅ Group join ho gaya!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'leave',
    aliases: [],
    category: 'Info',
    desc: 'Current group se bot ko nikalo (owner only).',
    usage: '.leave',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        if (!ctx.isGroup) { await ctx.reply('❌ Ye command sirf group me chalegi!'); return; }
        try {
          await ctx.sock.groupLeave(ctx.chatId);
        } catch (e) { await ctx.reply('❌ Leave nahi ho paya.'); }
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'restart',
    aliases: ['reboot'],
    category: 'Info',
    desc: 'Bot restart karo (owner only).',
    usage: '.restart',
    ownerOnly: true,
    run: async (ctx) => {
      try { await ctx.reply('🔄 Restart ho raha hai...'); } catch (e) {}
      setTimeout(() => process.exit(0), 1200);
    }
  },
  {
    name: 'shutdown',
    aliases: ['off'],
    category: 'Info',
    desc: 'Bot band karo (owner only).',
    usage: '.shutdown',
    ownerOnly: true,
    run: async (ctx) => {
      try { await ctx.reply('👋 Bot band ho raha hai.'); } catch (e) {}
      setTimeout(() => process.exit(0), 1200);
    }
  },
  {
    name: 'ban',
    aliases: [],
    category: 'Info',
    desc: 'Kisi user ko bot se ban karo (owner only).',
    usage: '.ban @user',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const target = resolveTarget(ctx);
        if (!target) { await ctx.reply('❌ Kisi ko mention/tag karo ya number do! Usage: ' + config.prefix + 'ban @user'); return; }
        if (!ctx.store.banned) ctx.store.banned = new Set();
        ctx.store.banned.add(target);
        await ctx.reply('🔨 Banned!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'unban',
    aliases: [],
    category: 'Info',
    desc: 'Kisi user ka ban hatao (owner only).',
    usage: '.unban @user',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const target = resolveTarget(ctx);
        if (!target) { await ctx.reply('❌ Kisi ko mention/tag karo ya number do! Usage: ' + config.prefix + 'unban @user'); return; }
        if (ctx.store.banned) ctx.store.banned.delete(target);
        await ctx.reply('✅ Unbanned!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'banlist',
    aliases: [],
    category: 'Info',
    desc: 'Banned users ki list (owner only).',
    usage: '.banlist',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const b = ctx.store && ctx.store.banned ? [...ctx.store.banned] : [];
        if (b.length) await ctx.reply('🔨 Banned users:\n' + b.map(H.num).join('\n'));
        else await ctx.reply('Koi banned nahi hai.');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'backupsession',
    aliases: ['baksess'],
    category: 'Info',
    desc: 'Session files owner ko bhejo (owner only).',
    usage: '.backupsession',
    ownerOnly: true,
    run: async (ctx) => {
      try {
        const dir = path.join(__dirname, '..', 'session');
        let files = [];
        try {
          files = fs.readdirSync(dir);
        } catch (e) { await ctx.reply('❌ Session folder nahi mila.'); return; }
        files = files.filter(f => {
          try { return fs.statSync(path.join(dir, f)).isFile(); } catch (e) { return false; }
        });
        let sent = 0;
        for (const f of files) {
          try {
            await ctx.sock.sendMessage(ownerJid(), {
              document: fs.readFileSync(path.join(dir, f)),
              fileName: f,
              mimetype: 'application/octet-stream'
            });
            sent++;
            await new Promise(r => setTimeout(r, 800));
          } catch (e) {}
        }
        await ctx.reply('✅ Session backup owner ko bhej diya (' + sent + ' files).');
      } catch (e) { await safeErr(ctx.reply); }
    }
  },
  {
    name: 'reportbug',
    aliases: ['bug'],
    category: 'Info',
    desc: 'Owner ko bug report bhejo.',
    usage: '.reportbug <kya problem hai>',
    run: async (ctx) => {
      try {
        const { sock, text, sender, reply } = ctx;
        if (!text) { await reply('❌ Bug describe karo! Usage: ' + config.prefix + 'reportbug <kya problem hai>'); return; }
        try {
          await sock.sendMessage(ownerJid(), { text: '🐞 Bug report from ' + sender + ':\n' + text });
        } catch (e) { await reply('❌ Report nahi bheja ja saka.'); return; }
        await reply('✅ Report owner ko bhej diya!');
      } catch (e) { await safeErr(ctx.reply); }
    }
  }
];
