// its Mahtab Bot — configuration
// Deploy se PEHLE ownerNumber aur pairingNumber me apna number daalo
// (country code ke saath, bina + ke, e.g. '919876543210')
module.exports = {
  prefix: '.',                  // command prefix, e.g. .dl .menu .tagall
  botName: 'its Mahtab Bot',
  version: '1.0.0',

  ownerNumber: '9779714313486',   // <-- APNA number (owner-only commands isi ke liye)
  pairingNumber: '9779714313486', // <-- jis number pe bot chalega (pairing code isi pe aayega)

  sessionDir: './session',       // Baileys auth session yahan save hogi
  cooldownMs: 3000,             // default per-user per-command cooldown (3s anti-spam)
};
