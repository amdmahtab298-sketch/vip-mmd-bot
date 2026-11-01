// Group management commands — 43 commands
const H = require('../lib/helpers');
const KV = require('../lib/kv');
const AI = require('../lib/ai');
const crypto = require('crypto');

function targetFrom(msg, args) {
  const q = H.getQuotedSender(msg);
  if (q) return q;
  const m = H.getMentioned(msg) || [];
  if (m.length) return m[0];
  if (args[0] && /^\d+$/.test(args[0])) return args[0] + '@s.whatsapp.net';
  return null;
}

function mentionsOf(md) {
  return md.participants
    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    .map(p => p.id);
}

module.exports = [
  {
    name: 'tagall', aliases: [], category: 'Group',
    desc: 'Saare members ko tag karo', usage: '.tagall [message]',
    groupOnly: true, cooldownMs: 60000,
    run: async (ctx) => {
      const { sock, msg, text, chatId, reply } = ctx;
      try {
        const members = await H.getGroupMembers(sock, chatId);
        const t = text || '📢 Attention everyone!';
        await sock.sendMessage(chatId, { text: t, mentions: members }, { quoted: msg });
      } catch (e) { await reply('❌ Tagall nahi ho paya. Phir se try karo.'); }
    }
  },
  {
    name: 'tag', aliases: [], category: 'Group',
    desc: 'Kisi member ko tag karo', usage: '.tag @user [message]',
    groupOnly: true, cooldownMs: 60000,
    run: async (ctx) => {
      const { sock, msg, args, text, chatId, reply } = ctx;
      try {
        let targets = H.getMentioned(msg) || [];
        if (!targets.length) {
          const q = H.getQuotedSender(msg);
          if (q) targets = [q];
        }
        if (!targets.length && args[0] && /^\d+$/.test(args[0])) {
          targets = [args[0] + '@s.whatsapp.net'];
        }
        if (!targets.length) { await reply('❌ Kise tag karu? ' + '.tag @user [message]'); return; }
        await sock.sendMessage(chatId, { text: text || '👋', mentions: targets }, { quoted: msg });
      } catch (e) { await reply('❌ Tag nahi ho paya. Phir se try karo.'); }
    }
  },
  {
    name: 'hidetag', aliases: [], category: 'Group',
    desc: 'Bina dikhe saare members ko tag karo', usage: '.hidetag [message]',
    groupOnly: true, cooldownMs: 60000,
    run: async (ctx) => {
      const { sock, msg, text, chatId, reply } = ctx;
      try {
        const members = await H.getGroupMembers(sock, chatId);
        await sock.sendMessage(chatId, { text: text || '📢', mentions: members }, { quoted: msg });
      } catch (e) { await reply('❌ Hidetag nahi ho paya. Phir se try karo.'); }
    }
  },
  {
    name: 'announce', aliases: [], category: 'Group',
    desc: 'Saare members ko announcement bhejo', usage: '.announce <text>',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, msg, text, chatId, reply } = ctx;
      if (!text) { await reply('❌ Text likho: .announce <text>'); return; }
      try {
        const members = await H.getGroupMembers(sock, chatId);
        await sock.sendMessage(chatId, { text: '📢 *Announcement*\n\n' + text, mentions: members }, { quoted: msg });
      } catch (e) { await reply('❌ Announcement nahi ho paya. Phir se try karo.'); }
    }
  },
  {
    name: 'kick', aliases: [], category: 'Group',
    desc: 'Member ko group se nikalo', usage: '.kick @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise nikalna hai? .kick @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        await reply('👢 Nikal diya!');
      } catch (e) { await reply('❌ Kick nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'remove', aliases: [], category: 'Group',
    desc: 'Member ko group se hatao', usage: '.remove @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise hatana hai? .remove @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        await reply('👢 Nikal diya!');
      } catch (e) { await reply('❌ Remove nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'add', aliases: [], category: 'Group',
    desc: 'Naye member ko group me add karo', usage: '.add <number> [number...]',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, args, chatId, reply } = ctx;
      const jids = args.filter(a => /^\d+$/.test(a)).map(n => n + '@s.whatsapp.net');
      if (!jids.length) { await reply('❌ Number likho: .add 919876543210'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, jids, 'add');
        await reply('✅ ' + jids.length + ' member add kar diye!');
      } catch (e) { await reply('❌ Add nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'invite', aliases: [], category: 'Group',
    desc: 'Number se member ko invite karo', usage: '.invite <number> [number...]',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, args, chatId, reply } = ctx;
      const jids = args.filter(a => /^\d+$/.test(a)).map(n => n + '@s.whatsapp.net');
      if (!jids.length) { await reply('❌ Number likho: .invite 919876543210'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, jids, 'add');
        await reply('✅ ' + jids.length + ' member invite kar diye!');
      } catch (e) { await reply('❌ Invite nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'promote', aliases: [], category: 'Group',
    desc: 'Member ko admin banao', usage: '.promote @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise admin banana hai? .promote @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'promote');
        await reply('⬆️ Admin bana diya!');
      } catch (e) { await reply('❌ Promote nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'admin', aliases: [], category: 'Group',
    desc: 'Member ko admin banao (promote alias)', usage: '.admin @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise admin banana hai? .admin @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'promote');
        await reply('⬆️ Admin bana diya!');
      } catch (e) { await reply('❌ Admin nahi bana paye. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'demote', aliases: [], category: 'Group',
    desc: 'Admin se member banao', usage: '.demote @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise demote karna hai? .demote @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'demote');
        await reply('⬇️ Admin se hata diya!');
      } catch (e) { await reply('❌ Demote nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'deadmin', aliases: [], category: 'Group',
    desc: 'Admin ko hatao (demote alias)', usage: '.deadmin @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, args, chatId, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kise deadmin karna hai? .deadmin @user'); return; }
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'demote');
        await reply('⬇️ Admin se hata diya!');
      } catch (e) { await reply('❌ Deadmin nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'mute', aliases: [], category: 'Group',
    desc: 'Member ko mute karo', usage: '.mute @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      await ctx.reply('🔇 WhatsApp API me kisi ek member ko mute karne ka option nahi hai. Poora group band karna ho to .close use karo.');
    }
  },
  {
    name: 'unmute', aliases: [], category: 'Group',
    desc: 'Member ko unmute karo', usage: '.unmute @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      await ctx.reply('🔇 WhatsApp API me kisi ek member ko mute karne ka option nahi hai. Poora group band karna ho to .close use karo.');
    }
  },
  {
    name: 'antilink', aliases: [], category: 'Group',
    desc: 'Group link bhejne walon ko roko', usage: '.antilink on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'on') {
        store.antilinkChats.add(chatId);
        await reply('🔗 Anti-link ON! Ab link bhejne wala delete hoga.');
      } else {
        store.antilinkChats.delete(chatId);
        await reply('🔗 Anti-link OFF!');
      }
    }
  },
  {
    name: 'antiabuse', aliases: ['nogaali'], category: 'Group',
    desc: 'Gaali-galoj auto-delete + warning (default ON)', usage: '.antiabuse on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.antiabuseOff.add(chatId);
        await reply('🚫 Anti-abuse OFF! Ab gaali wale message delete nahi honge.');
      } else if (args[0] === 'on') {
        store.antiabuseOff.delete(chatId);
        await reply('🚫 Anti-abuse ON! Gaali wala message auto-delete hoga + warning milegi (bot ka group admin hona zaroori hai).');
      } else {
        await reply(store.antiabuseOff.has(chatId)
          ? '🚫 Anti-abuse abhi OFF hai. ON karne ke liye: .antiabuse on'
          : '🚫 Anti-abuse abhi ON hai (default) — gaali = delete + warning. Band karne ke liye: .antiabuse off');
      }
    }
  },
  {
    name: 'resetwarn', aliases: ['clearwarn'], category: 'Group',
    desc: 'Kisi member ki anti-abuse warnings saaf karo', usage: '.resetwarn @user',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { msg, args, chatId, store, reply } = ctx;
      const target = targetFrom(msg, args);
      if (!target) { await reply('❌ Kiski warnings saaf karu? .resetwarn @user'); return; }
      const key = chatId + ':' + target;
      if (store.abuseWarns.has(key)) {
        store.abuseWarns.delete(key);
        await reply('✅ Warnings saaf kar di gayi. Ab uski count 0 se shuru hogi.');
      } else {
        await reply('ℹ️ Is member ki koi warning nahi hai.');
      }
    }
  },
  {
    name: 'blocksticker', aliases: ['bsticker'], category: 'Group',
    desc: 'Kisi sticker ko is group me ban karo (us sticker ko reply karke)', usage: '.blocksticker (sticker par reply)',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, chatId, store, reply } = ctx;
      const qm = H.getQuotedMessage(msg);
      if (!qm?.stickerMessage) { await reply('❌ Kisi sticker ko REPLY karke .blocksticker likho — wahi sticker ban hoga.'); return; }
      let hash = H.stickerHashFromContent(qm);
      if (!hash) {
        const buf = await H.downloadRaw(sock, { key: msg.key, message: qm });
        if (buf) hash = crypto.createHash('sha256').update(buf).digest('hex');
      }
      if (!hash) { await reply('❌ Sticker ki pehchan nahi mil payi, dobara try karo.'); return; }
      if (!store.blockedStickers.has(chatId)) store.blockedStickers.set(chatId, new Set());
      const set = store.blockedStickers.get(chatId);
      if (set.has(hash)) { await reply('ℹ️ Ye sticker is group me pehle se banned hai.'); return; }
      set.add(hash);
      await KV.persistStickerBlock(chatId);
      await reply(`🚫 Sticker ban ho gaya! Ab koi bhi member (admin/owner ko chhod kar) ye sticker bhejega to bot use auto-delete kar dega. (Is group me total banned: ${set.size})`);
    }
  },
  {
    name: 'unblocksticker', aliases: ['ubsticker'], category: 'Group',
    desc: 'Banned sticker ko wapas allow karo (us sticker ko reply karke)', usage: '.unblocksticker (sticker par reply)',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, chatId, store, reply } = ctx;
      const qm = H.getQuotedMessage(msg);
      if (!qm?.stickerMessage) { await reply('❌ Kisi sticker ko REPLY karke .unblocksticker likho.'); return; }
      let hash = H.stickerHashFromContent(qm);
      if (!hash) {
        const buf = await H.downloadRaw(sock, { key: msg.key, message: qm });
        if (buf) hash = crypto.createHash('sha256').update(buf).digest('hex');
      }
      if (!hash) { await reply('❌ Sticker ki pehchan nahi mil payi, dobara try karo.'); return; }
      const set = store.blockedStickers.get(chatId);
      if (!set || !set.has(hash)) { await reply('ℹ️ Ye sticker is group me banned hi nahi hai.'); return; }
      set.delete(hash);
      await KV.persistStickerBlock(chatId);
      await reply(`✅ Sticker unban ho gaya! Ab ye sticker group me chalega. (Bache hue banned: ${set.size})`);
    }
  },
  {
    name: 'stickerblocklist', aliases: ['sblocklist', 'blockstickers'], category: 'Group',
    desc: 'Is group me kitne sticker banned hain, dekho', usage: '.stickerblocklist',
    groupOnly: true,
    run: async (ctx) => {
      const { chatId, store, reply } = ctx;
      const set = store.blockedStickers.get(chatId);
      const n = set ? set.size : 0;
      if (!n) { await reply('✅ Is group me koi sticker banned nahi hai. Ban karne ke liye sticker ko reply karke .blocksticker likho (admin).'); return; }
      await reply(`🚫 Is group me *${n}* sticker banned hain.\nJo bhi member banned sticker bhejega, bot use auto-delete kar dega (bot ka group admin hona zaroori).\nHatane ke liye: sticker ko reply karke .unblocksticker (admin).`);
    }
  },
  {
    name: 'linkoff', aliases: [], category: 'Group',
    desc: 'Anti-link band karo', usage: '.linkoff',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      ctx.store.antilinkChats.delete(ctx.chatId);
      await ctx.reply('🔗 Anti-link OFF');
    }
  },
  {
    name: 'welcome', aliases: [], category: 'Group',
    desc: 'Naye member welcome message on/off (default ON hai)', usage: '.welcome on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.welcomeOffChats.add(chatId);
        await KV.persistWelcomeOff();
        await reply('👋 Welcome message OFF! (is group me ab naye member par welcome nahi aayega)');
      } else {
        store.welcomeOffChats.delete(chatId);
        await KV.persistWelcomeOff();
        await reply('👋 Welcome message ON! (waise ye default hi ON rehta hai)');
      }
    }
  },
  {
    name: 'welcomeoff', aliases: [], category: 'Group',
    desc: 'Welcome message band karo', usage: '.welcomeoff',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      ctx.store.welcomeOffChats.add(ctx.chatId);
      await KV.persistWelcomeOff();
      await ctx.reply('👋 Welcome message OFF!');
    }
  },
  {
    name: 'goodbye', aliases: [], category: 'Group',
    desc: 'Jane wale member ka goodbye on/off', usage: '.goodbye on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'on') {
        store.goodbyeChats.add(chatId);
        await reply('👋 Goodbye message ON!');
      } else {
        store.goodbyeChats.delete(chatId);
        await reply('👋 Goodbye message OFF!');
      }
    }
  },
  {
    name: 'floodguard', aliases: ['flood'], category: 'Group',
    desc: 'Flood control on/off (default ON hai) — tez-tez message par warning, 3rd par 10 min auto-delete', usage: '.floodguard on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.floodOff.add(chatId);
        await KV.persistSet('settings:floodOff', store.floodOff);
        await reply('🛡️ Flood guard OFF! Ab is group me flood check nahi hoga.');
      } else {
        store.floodOff.delete(chatId);
        await KV.persistSet('settings:floodOff', store.floodOff);
        await reply('🛡️ Flood guard ON! (waise ye default hi ON rehta hai)\n10 second me 7+ message = warning, teesri warning = 10 minute auto-delete.');
      }
    }
  },
  {
    name: 'antiforward', aliases: ['noforward'], category: 'Group',
    desc: "'Forwarded many times' wale message auto-delete on/off (default OFF)", usage: '.antiforward on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.antiforwardOn.delete(chatId);
        await KV.persistSet('settings:antiforwardOn', store.antiforwardOn);
        await reply('↪️ Anti-forward OFF!');
      } else {
        store.antiforwardOn.add(chatId);
        await KV.persistSet('settings:antiforwardOn', store.antiforwardOn);
        await reply('↪️ Anti-forward ON! Ab jo message bohot baar forward hua hoga (Forwarded many times), bot use delete kar dega (admin/owner ko chhod kar).');
      }
    }
  },
  {
    name: 'nightmode', aliases: ['night'], category: 'Group',
    desc: 'Night mode on/off — raat 12 se subah 6 group auto-lock (sirf admin bol sakenge)', usage: '.nightmode on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.nightOn.delete(chatId);
        await KV.persistSet('settings:nightOn', store.nightOn);
        await reply('🌙 Night mode OFF! (Agar group abhi bot ke lock me hai to agle check me khul jayega.)');
      } else {
        store.nightOn.add(chatId);
        await KV.persistSet('settings:nightOn', store.nightOn);
        await reply('🌙 Night mode ON! Har raat 12:00 baje group auto-lock ho jayega (sirf admin message kar sakenge) aur subah 6:00 baje khud khul jayega.\n(Bot ka group admin hona zaroori hai.)');
      }
    }
  },
  {
    name: 'engage', aliases: [], category: 'Group',
    desc: 'Auto-engage on/off — roz 8am good morning, 1pm quiz poll, 8pm sabse active member', usage: '.engage on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.engageOn.delete(chatId);
        await KV.persistSet('settings:engageOn', store.engageOn);
        await reply('🎯 Auto-engage OFF!');
      } else {
        store.engageOn.add(chatId);
        await KV.persistSet('settings:engageOn', store.engageOn);
        await reply('🎯 Auto-engage ON!\n🌅 Subah 8:00 — Good morning message\n🧠 Dopahar 1:00 — Quiz poll\n🏆 Raat 8:00 — Aaj ke sabse active member ka elaan');
      }
    }
  },
  {
    name: 'abusepunish', aliases: ['gaalisaza'], category: 'Group',
    desc: 'Gaali-saza seedhi on/off — 10+ gaali = 1h spam, phir 3h, phir 5h, phir group se remove', usage: '.abusepunish on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.abusePunishOn.delete(chatId);
        await KV.persistSet('settings:abusePunishOn', store.abusePunishOn);
        await reply('⚖️ Gaali-saza seedhi OFF! Ab is group me sirf delete + warning chalega (purana system).');
      } else {
        store.abusePunishOn.add(chatId);
        await KV.persistSet('settings:abusePunishOn', store.abusePunishOn);
        await reply('⚖️ Gaali-saza seedhi ON!\nIs group me ab ye niyam chalega:\n• *10 se zyada gaali* = 1 ghante ka SPAM (is dauran gaali wala message hi delete hoga, aam baat chalegi)\n• Spam ke dauran phir gaali = spam *3 ghante*\n• Phir gaali = spam *5 ghante*\n• Phir bhi gaali = rule-todne ka sandesh + group se *REMOVE*\n(Admin aur owner isse bahar hain. Remove ke liye bot ka group admin hona zaroori hai.)');
      }
    }
  },
  {
    name: 'ytupdate', aliases: ['ytupdates'], category: 'Group',
    desc: 'YouTube update alert on/off — naya YouTube update aate hi bot AI ke saar ke saath group me bhej dega', usage: '.ytupdate on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.ytUpdateOn.delete(chatId);
        await KV.persistSet('settings:ytUpdateOn', store.ytUpdateOn);
        await reply('📺 YouTube update alert OFF!');
      } else {
        store.ytUpdateOn.add(chatId);
        await KV.persistSet('settings:ytUpdateOn', store.ytUpdateOn);
        await reply('📺 YouTube update alert ON!\nAb jab bhi YouTube koi naya update/feature layega, bot khud official khabar padh ke AI ke Hinglish saar ke saath yahan bhej dega — sabse pehle tumhe pata chalega! 🚨');
      }
    }
  },
  {
    name: 'aiquiz', aliases: ['ytquiz'], category: 'Group',
    desc: 'Abhi ke abhi AI se ek fresh YouTube quiz poll banao', usage: '.aiquiz',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      await reply('🧠 AI se fresh YouTube quiz ban raha hai, ek second...');
      const hist = await KV.loadQuizHist();
      const q = await AI.genQuiz(hist);
      if (q) {
        await KV.saveQuizHist(q.q, hist);
        await sock.sendMessage(chatId, { poll: { name: '🧠 YouTube Quiz: ' + q.q, values: q.options, selectableCount: 1 } });
      } else {
        // AI band/fail — purana bank wala sawal, aur wajah bhi bata do
        const bank = [
          { q: 'YouTube kab launch hua tha?', o: ['2005', '2007', '2003', '2010'] },
          { q: 'YouTube ko Google ne kitne me kharida tha?', o: ['$1.65 Billion', '$500 Million', '$3 Billion', '$850 Million'] },
          { q: 'Pehla YouTube video kaun sa tha?', o: ['Me at the Zoo', 'Hello World', 'My First Video', 'San Diego Trip'] },
        ];
        const b = bank[Math.floor(Math.random() * bank.length)];
        await sock.sendMessage(chatId, { poll: { name: '🧠 Quiz: ' + b.q, values: b.o, selectableCount: 1 } });
        await reply(AI.enabled() ? '(AI se jawab nahi aaya, bank wala sawal diya hai — thodi der baad phir try karo)' : '(Note: AI abhi ON nahi hai — key lagte hi har quiz AI se fresh banega)');
      }
    }
  },
  {
    name: 'points', aliases: ['mypoints'], category: 'Group',
    desc: 'Apne points dekho (group me active rehne par milte hain)', usage: '.points',
    groupOnly: true,
    run: async (ctx) => {
      const { chatId, sender, msg, store, reply } = ctx;
      const pMap = await KV.loadPoints(chatId);
      // Asli number wali key (LID mile to mapping se) — warna purani LID entry bhi dekho
      const pk = H.pointsKeyFor(msg, sender, store.lidToPhone);
      let foundKey = pk.key;
      let rec = foundKey ? pMap.get(foundKey) : null;
      if (!rec && pk.lidDigits) { rec = pMap.get(pk.lidDigits); if (rec) foundKey = pk.lidDigits; }
      if (!rec || !rec.p) { await reply('🏆 Tumhare abhi 0 points hain. Group me message karo, points kamao!'); return; }
      const sorted = [...pMap.entries()].sort((a, b) => (b[1].p || 0) - (a[1].p || 0));
      const rank = sorted.findIndex(([k]) => k === foundKey) + 1;
      await reply(`🏆 Tumhare points: *${rec.p}*\n📊 Is group me tumhari rank: *#${rank}* (kul ${sorted.length} members me)\nAaj ke points: ${rec.dayP || 0} — .top se leaderboard dekho!`);
    }
  },
  {
    name: 'top', aliases: ['leaderboard', 'top10'], category: 'Group',
    desc: 'Group ke top 10 sabse zyada points wale members', usage: '.top',
    groupOnly: true,
    run: async (ctx) => {
      const { chatId, store, reply } = ctx;
      const pMap = await KV.loadPoints(chatId);
      const sorted = [...pMap.entries()].filter(([, v]) => v && v.p > 0).sort((a, b) => b[1].p - a[1].p).slice(0, 10);
      if (!sorted.length) { await reply('🏆 Abhi tak kisi ke points nahi bane. Pehle message karo aur points kamao!'); return; }
      // Display hamesha ASLI number se (koi purani LID-key bachi ho to mapping se number dikhao)
      const disp = (k) => (store.lidToPhone && store.lidToPhone.get(k)) || k;
      const medals = ['🥇', '🥈', '🥉'];
      const lines = sorted.map(([k, v], i) => `${medals[i] || (i + 1) + '.'} @${disp(k)} — *${v.p}* points`);
      await ctx.sock.sendMessage(chatId, {
        text: `🏆 *Group Leaderboard — Top ${sorted.length}*\n\n${lines.join('\n')}\n\nGroup me active raho, points bhadhao! 💪`,
        mentions: sorted.map(([k]) => disp(k) + '@s.whatsapp.net'),
      }).catch(async () => { await reply(lines.join('\n')); });
    }
  },
  {
    name: 'byeoff', aliases: [], category: 'Group',
    desc: 'Goodbye message band karo', usage: '.byeoff',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      ctx.store.goodbyeChats.delete(ctx.chatId);
      await ctx.reply('👋 Goodbye message OFF!');
    }
  },
  {
    name: 'group', aliases: [], category: 'Group',
    desc: 'Group settings dikhao', usage: '.group',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        await reply('⚙️ *Group settings*\n🔒 Locked: ' + (md.restrict ? 'Ha' : 'Nahi') + '\n📢 Announcement mode: ' + (md.announce ? 'ON' : 'OFF') + '\n👥 Members: ' + md.participants.length);
      } catch (e) { await reply('❌ Group info nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'gc', aliases: [], category: 'Group',
    desc: 'Group settings dikhao (group alias)', usage: '.gc',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        await reply('⚙️ *Group settings*\n🔒 Locked: ' + (md.restrict ? 'Ha' : 'Nahi') + '\n📢 Announcement mode: ' + (md.announce ? 'ON' : 'OFF') + '\n👥 Members: ' + md.participants.length);
      } catch (e) { await reply('❌ Group info nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'open', aliases: [], category: 'Group',
    desc: 'Group khol do (sab message kar sakte hain)', usage: '.open',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await reply('🔓 Group khol diya! Ab sab message kar sakte hain.');
      } catch (e) { await reply('❌ Open nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'close', aliases: [], category: 'Group',
    desc: 'Group band karo (sirf admin)', usage: '.close',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await reply('🔒 Group band! Ab sirf admin message kar sakte hain.');
      } catch (e) { await reply('❌ Close nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'lock', aliases: [], category: 'Group',
    desc: 'Group settings lock karo', usage: '.lock',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupSettingUpdate(chatId, 'locked');
        await reply('🔒 Group settings lock kar diye!');
      } catch (e) { await reply('❌ Lock nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'unlock', aliases: [], category: 'Group',
    desc: 'Group settings unlock karo', usage: '.unlock',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupSettingUpdate(chatId, 'unlocked');
        await reply('🔓 Group settings unlock kar diye!');
      } catch (e) { await reply('❌ Unlock nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'linkgc', aliases: [], category: 'Group',
    desc: 'Group ka invite link dikhao', usage: '.linkgc',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const code = await H.groupInviteCode(sock, chatId);
        if (code) await reply('🔗 Group link:\nhttps://chat.whatsapp.com/' + code);
        else await reply('❌ Bot admin nahi hai, link nahi nikal sakta.');
      } catch (e) { await reply('❌ Bot admin nahi hai, link nahi nikal sakta.'); }
    }
  },
  {
    name: 'grouplink', aliases: [], category: 'Group',
    desc: 'Group ka invite link (linkgc alias)', usage: '.grouplink',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const code = await H.groupInviteCode(sock, chatId);
        if (code) await reply('🔗 Group link:\nhttps://chat.whatsapp.com/' + code);
        else await reply('❌ Bot admin nahi hai, link nahi nikal sakta.');
      } catch (e) { await reply('❌ Bot admin nahi hai, link nahi nikal sakta.'); }
    }
  },
  {
    name: 'revoke', aliases: [], category: 'Group',
    desc: 'Purana invite link cancel karke naya banao', usage: '.revoke',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupRevokeInvite(chatId);
        const code = await H.groupInviteCode(sock, chatId);
        await reply(code ? '🔄 Naya group link:\nhttps://chat.whatsapp.com/' + code : '🔄 Purana link revoke ho gaya, par naya link nahi mil paya.');
      } catch (e) { await reply('❌ Revoke nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'resetlink', aliases: [], category: 'Group',
    desc: 'Invite link reset karo (revoke alias)', usage: '.resetlink',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        await sock.groupRevokeInvite(chatId);
        const code = await H.groupInviteCode(sock, chatId);
        await reply(code ? '🔄 Naya group link:\nhttps://chat.whatsapp.com/' + code : '🔄 Purana link revoke ho gaya, par naya link nahi mil paya.');
      } catch (e) { await reply('❌ Reset nahi ho paya. Bot ko admin banao pehle!'); }
    }
  },
  {
    name: 'poll', aliases: [], category: 'Group',
    desc: 'Poll banao: .poll sawal | option1 | option2', usage: '.poll <sawal> | <option1> | <option2> ...',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, text, chatId, reply } = ctx;
      const parts = (text || '').split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length < 3) { await reply('❌ Aise likho: .poll Pasandida khana? | Biryani | Pizza | Dosa'); return; }
      try {
        await sock.sendMessage(chatId, {
          poll: { name: parts[0], values: parts.slice(1, 13), selectableCount: 1 }
        });
      } catch (e) { await reply('❌ Poll nahi ban paya. Phir se try karo.'); }
    }
  },
  {
    name: 'vote', aliases: [], category: 'Group',
    desc: 'Poll me vote kaise kare', usage: '.vote',
    groupOnly: true,
    run: async (ctx) => {
      await ctx.reply('🗳️ Poll ke option pe tap karke vote karo!');
    }
  },
  {
    name: 'listadmin', aliases: [], category: 'Group',
    desc: 'Saare admins ki list dikhao', usage: '.listadmin',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        const admins = md.participants.filter(p => p.admin);
        if (!admins.length) { await reply('❌ Koi admin nahi mila.'); return; }
        const lines = admins.map((p, i) => (i + 1) + '. @' + H.num(p.id));
        await sock.sendMessage(chatId, { text: '👑 *Group Admins* (' + admins.length + ')\n\n' + lines.join('\n'), mentions: admins.map(p => p.id) });
      } catch (e) { await reply('❌ Admin list nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'admins', aliases: [], category: 'Group',
    desc: 'Saare admins ki list (listadmin alias)', usage: '.admins',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        const admins = md.participants.filter(p => p.admin);
        if (!admins.length) { await reply('❌ Koi admin nahi mila.'); return; }
        const lines = admins.map((p, i) => (i + 1) + '. @' + H.num(p.id));
        await sock.sendMessage(chatId, { text: '👑 *Group Admins* (' + admins.length + ')\n\n' + lines.join('\n'), mentions: admins.map(p => p.id) });
      } catch (e) { await reply('❌ Admin list nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'listonline', aliases: [], category: 'Group',
    desc: 'Kaun online hai dikhao', usage: '.listonline',
    groupOnly: true,
    run: async (ctx) => {
      await ctx.reply('🟢 Real-time online list WhatsApp API se nahi milti, bhai.');
    }
  },
  {
    name: 'online', aliases: [], category: 'Group',
    desc: 'Kaun online hai (listonline alias)', usage: '.online',
    groupOnly: true,
    run: async (ctx) => {
      await ctx.reply('🟢 Real-time online list WhatsApp API se nahi milti, bhai.');
    }
  },
  {
    name: 'groupinfo', aliases: [], category: 'Group',
    desc: 'Group ki poori jaankari', usage: '.groupinfo',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        const desc = (md.desc || '').slice(0, 200);
        const created = md.creation ? new Date(md.creation * 1000).toLocaleDateString('en-IN') : 'pata nahi';
        await reply('👥 *' + (md.subject || 'Group') + '*\n' + (desc ? '📝 ' + desc + '\n' : '') + '👤 Members: ' + md.participants.length + '\n📅 Created: ' + created);
      } catch (e) { await reply('❌ Group info nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'ginfo', aliases: [], category: 'Group',
    desc: 'Group info (groupinfo alias)', usage: '.ginfo',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        const desc = (md.desc || '').slice(0, 200);
        const created = md.creation ? new Date(md.creation * 1000).toLocaleDateString('en-IN') : 'pata nahi';
        await reply('👥 *' + (md.subject || 'Group') + '*\n' + (desc ? '📝 ' + desc + '\n' : '') + '👤 Members: ' + md.participants.length + '\n📅 Created: ' + created);
      } catch (e) { await reply('❌ Group info nahi mil payi. Phir se try karo.'); }
    }
  },
  {
    name: 'membercount', aliases: [], category: 'Group',
    desc: 'Kitne members hain dikhao', usage: '.membercount',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        await reply('👥 Total members: ' + md.participants.length);
      } catch (e) { await reply('❌ Count nahi mil paya. Phir se try karo.'); }
    }
  },
  {
    name: 'totalmember', aliases: [], category: 'Group',
    desc: 'Total members (membercount alias)', usage: '.totalmember',
    groupOnly: true,
    run: async (ctx) => {
      const { sock, chatId, reply } = ctx;
      try {
        const md = await sock.groupMetadata(chatId);
        await reply('👥 Total members: ' + md.participants.length);
      } catch (e) { await reply('❌ Count nahi mil paya. Phir se try karo.'); }
    }
  },
  {
    name: 'del', aliases: [], category: 'Group',
    desc: 'Quoted message delete karo', usage: '.del (message quote karo)',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { sock, msg, reply } = ctx;
      try {
        const ok = await H.deleteQuoted(sock, msg);
        await reply(ok ? '🗑️ Delete ho gaya!' : '❌ Delete nahi hua (bot admin hona chahiye).');
      } catch (e) { await reply('❌ Delete nahi hua (bot admin hona chahiye).'); }
    }
  },
  {
    name: 'pin', aliases: [], category: 'Group',
    desc: 'Message pin karo', usage: '.pin (message quote karo)',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { reply } = ctx;
      // Baileys v6 pin API unstable — honest reply, never fake success
      try {
        await reply('📌 Message pin ka API is version me stable nahi hai — WhatsApp me manually pin kar lo.');
      } catch (e) { /* reply itself failed, nothing more to do */ }
    }
  },
  {
    name: 'unpin', aliases: [], category: 'Group',
    desc: 'Message unpin karo', usage: '.unpin (message quote karo)',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { reply } = ctx;
      // Baileys v6 pin API unstable — honest reply, never fake success
      try {
        await reply('📌 Message pin ka API is version me stable nahi hai — WhatsApp me manually pin kar lo.');
      } catch (e) { /* reply itself failed, nothing more to do */ }
    }
  }
];
