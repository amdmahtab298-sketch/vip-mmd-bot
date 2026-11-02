// Shared in-memory state — index.js aur saare command files isi ko use karte hain.
// (Render free tier par restart hone par reset ho jata hai — ye expected hai.)
module.exports = {
  cooldowns: new Map(),      // `${sender}:${command}` -> timestamp
  banned: new Set(),         // banned user JIDs
  autostickerChats: new Set(),// auto-sticker ON wale chats
  autoreactChats: new Set(),  // auto-react ON wale chats
  antilinkChats: new Set(),   // anti-link ON wale groups
  antiabuseOff: new Set(),    // anti-abuse OFF wale groups (default ON hai sab groups me)
  botOffChats: new Set(),     // .botoff wale groups — wahan bot bilkul band (sirf .boton se chaalu)
  aiMahtabOn: new Set(),      // 'its Mahtab AI' ON wale groups — wahan har message ka AI jawab jata hai
  aiChatState: new Map(),     // chatId -> { busy, lastAt, queue[], mem[] } (AI jawab ki line + yaad)
  blockedStickers: new Map(), // chatId -> Set<sticker hash> (banned stickers; DB me bhi save hota hai)
  stickerBlockLoaded: false,  // boot par DB se blocklist load ho gayi?
  abuseWarns: new Map(),      // `${chatId}:${sender}` -> { count, firstAt } (3-strike system)
  welcomeOffChats: new Set(), // welcome OFF wale groups (default ON hai sab groups me; DB me save hota hai)
  floodOff: new Set(),        // flood guard OFF wale groups (default ON; DB me save hota hai)
  antiforwardOn: new Set(),   // anti-forward ON wale groups (default OFF; DB me save hota hai)
  nightOn: new Set(),         // night mode ON wale groups (DB me save hota hai)
  nightLocked: new Set(),     // jin groups ko BOT ne raat me lock kiya hai (DB me save hota hai)
  engageOn: new Set(),        // auto-engage (good morning/quiz/active-member) ON wale groups (DB me save)
  ytUpdateOn: new Set(),      // YouTube update alert ON wale groups (.ytupdate on se; DB me save)
  abusePunishOn: new Set(),   // gaali-saza seedhi (spam->remove) ON wale groups (.abusepunish on se; DB me save)
  points: new Map(),          // chatId -> Map(senderKey -> { p, name, day, dayP }) (DB me save hota hai)
  pointsDirty: new Set(),     // chatId jinke points DB me save karne baaki hain
  lidToPhone: new Map(),      // LID digits -> asli phone digits (seekhi hui mapping; DB me save hoti hai)
  lidMapDirty: false,         // lidToPhone me badlav save karna baaki hai
  goodbyeChats: new Set(),   // goodbye ON wale groups
  stickerWm: new Map(),      // sender -> { pack, author }
  todos: new Map(),          // sender -> [notes]
  seenUsers: new Set(),      // stats
  seenChats: new Set(),      // broadcast target list
  pollVotes: new Map(),      // poll tracking
  msgCount: 0,
  startTime: Date.now(),
};
