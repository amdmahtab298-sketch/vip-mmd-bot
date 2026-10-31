// Shared in-memory state — index.js aur saare command files isi ko use karte hain.
// (Render free tier par restart hone par reset ho jata hai — ye expected hai.)
module.exports = {
  cooldowns: new Map(),      // `${sender}:${command}` -> timestamp
  banned: new Set(),         // banned user JIDs
  autostickerChats: new Set(),// auto-sticker ON wale chats
  autoreactChats: new Set(),  // auto-react ON wale chats
  antilinkChats: new Set(),   // anti-link ON wale groups
  antiabuseOff: new Set(),    // anti-abuse OFF wale groups (default ON hai sab groups me)
  blockedStickers: new Map(), // chatId -> Set<sticker hash> (banned stickers; DB me bhi save hota hai)
  stickerBlockLoaded: false,  // boot par DB se blocklist load ho gayi?
  abuseWarns: new Map(),      // `${chatId}:${sender}` -> { count, firstAt } (3-strike system)
  welcomeChats: new Set(),    // welcome ON wale groups
  goodbyeChats: new Set(),   // goodbye ON wale groups
  stickerWm: new Map(),      // sender -> { pack, author }
  todos: new Map(),          // sender -> [notes]
  seenUsers: new Set(),      // stats
  seenChats: new Set(),      // broadcast target list
  pollVotes: new Map(),      // poll tracking
  msgCount: 0,
  startTime: Date.now(),
};
