// Group management commands — 43 commands
const H = require('../lib/helpers');

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
    desc: 'Gaali-galoj auto-delete + 3-strike remove (default ON)', usage: '.antiabuse on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'off') {
        store.antiabuseOff.add(chatId);
        await reply('🚫 Anti-abuse OFF! Ab gaali wale message delete nahi honge.');
      } else if (args[0] === 'on') {
        store.antiabuseOff.delete(chatId);
        await reply('🚫 Anti-abuse ON! Gaali wala message auto-delete hoga, 3 warnings par member REMOVE hoga (bot ka group admin hona zaroori hai).');
      } else {
        await reply(store.antiabuseOff.has(chatId)
          ? '🚫 Anti-abuse abhi OFF hai. ON karne ke liye: .antiabuse on'
          : '🚫 Anti-abuse abhi ON hai (default) — 3-strike system active. Band karne ke liye: .antiabuse off');
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
    desc: 'Naye member welcome message on/off', usage: '.welcome on/off',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      const { args, chatId, store, reply } = ctx;
      if (args[0] === 'on') {
        store.welcomeChats.add(chatId);
        await reply('👋 Welcome message ON!');
      } else {
        store.welcomeChats.delete(chatId);
        await reply('👋 Welcome message OFF!');
      }
    }
  },
  {
    name: 'welcomeoff', aliases: [], category: 'Group',
    desc: 'Welcome message band karo', usage: '.welcomeoff',
    groupOnly: true, adminOnly: true,
    run: async (ctx) => {
      ctx.store.welcomeChats.delete(ctx.chatId);
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
