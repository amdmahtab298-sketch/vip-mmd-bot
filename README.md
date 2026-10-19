# 🤖 VIP MMD Bot

WhatsApp ka all-in-one bot — **300+ commands**! Media downloader, sticker maker, group admin tools, fun, utilities, AI — sab kuch ek bot me.

Prefix: `.` (jaise `.dl`, `.menu`, `.tagall`)

## ✨ Features (9 categories, 337 commands)

| Category | Kya karta hai |
|---|---|
| 📥 Downloader | TikTok, Instagram, X, Facebook, Reddit, Pinterest, YouTube, Kwai, Moj, Josh, Rumble... link bhejo, video pao (Cobalt API) |
| 🔎 Search | Google, Wiki, lyrics, movie, anime, GitHub, weather, dictionary, translate, currency, pincode, IFSC... |
| 🎨 Sticker | Photo → sticker, meme sticker, text sticker, emoji mix, photo effects (blur, jail, wasted...) |
| 😂 Fun | Jokes, shayari, quotes, roast, truth/dare, horoscope, love-calc, hug/slap GIFs... |
| 👥 Group | `.tagall` / `.tag` / `.hidetag` (sabhi members chala sakte hain, 1-min cooldown), kick, promote, poll, anti-link, welcome... |
| 🛠️ Tools | QR, shortlink, calculator, password gen, EMI/GST, todo, timer, base64, morse... |
| 🤖 AI & Media | AI chat, image generate, text-to-voice, wallpaper, text→PDF, watermark... |
| ℹ️ Info | `.menu`, `.ping`, stats, broadcast (owner), ban/block (owner)... |
| ⚡ Extras | `.autosticker` (har photo auto-sticker), view-once saver (`.vv`), `.save` status saver, auto-react |

**Public-by-default:** downloader/search/sticker/fun/tools/AI sabke liye khula hai. Sirf group-admin wale (kick/promote/close...) aur owner wale (broadcast/ban/restart...) commands locked hain.

## 🚀 Deploy — step by step (Render, free, 24/7)

**Step 0 — Number already set hai ✅**
`config.js` me `pairingNumber` aur `ownerNumber` dono pehle se `9779714313486` set hai. Agar number badalna ho to batao, warna kuch karne ki zaroorat nahi.

**Step 1 — GitHub pe daalo**
1. [github.com](https://github.com) pe free account banao → **New repository** → naam `vip-mmd-bot` → Create.
2. Is ZIP ko extract karo aur saare files upload kar do (**Add file → Upload files** — seedha browser se hota hai, koi command nahi chahiye).

**Step 2 — Render pe deploy karo**
1. [render.com](https://render.com) pe **GitHub se sign up** karo (free).
2. Dashboard → **New → Blueprint** → apna `vip-mmd-bot` repo select karo → **Apply**.
3. `render.yaml` khud detect ho jayega — ye **Web Service** banayega (free plan). Deploy dabao, 2–4 minute lagega (`npm install` + start).

**Step 3 — Sundar pairing page se connect karo 📱**
1. Deploy hote hi Render tumhe ek **public URL** dega, jaise `https://vip-mmd-bot.onrender.com` — usko browser me kholo.
2. Wahan ek VIP-style dark pairing page khulega — number pehle se bhara hoga → **"🔑 Pairing Code Lao"** dabao.
3. Bada **8-digit code** + 60-second timer dikhega.
4. Phone me: WhatsApp → **Linked devices** → **Link a device** → **Link with phone number** → code daalo (60 sec ke andar).
5. Ho gaya! Page khud **"✅ Bot Online"** dashboard me badal jayega. Test: kisi chat me `.ping` likho, phir `.menu`.

> QR fallback: agar pairing code me dikkat aaye to Render ke Logs me QR bhi print hota hai — usko scan kar lo.

## 🌙 24/7 live kaise rakhe (zaroori!)

Render ka **free Web Service 15 minute idle rehne par so jata hai** (bot offline dikhega). Isse bachne ka standard free tareeka:

1. [UptimeRobot.com](https://uptimerobot.com) (free) ya [cron-job.org](https://cron-job.org) pe account banao.
2. Wahan ek **HTTP monitor** add karo: URL = `https://<tumhari-service>.onrender.com/health`, interval **har 5 minute**.
3. Bas! Ye ping bot ko sone nahi dega. Render free me **750 hours/month** milte hain — is trick se bot poore mahine 24/7 chal jayega, ek rupaya kharch nahi.

## ❓ Kya isko Vercel par deploy kar sakte hain?

**Nahi.** Vercel **serverless** hai — wahan har function kuch second chal ke band ho jata hai. WhatsApp bot ko **24/7 khula WebSocket connection** chahiye jo Vercel par tik hi nahi sakta (deploy hote hi bot mar jayega). Isliye **Render / Railway / VPS** hi sahi jagah hai — ye bot Render Web Service ke liye bana hai.

## ⚠️ 3 zaroori warnings

1. **Unofficial library hai** (Baileys) — WhatsApp ko pata chal sakta hai. **Hamesha SECONDARY number use karo**, apna main number kabhi mat lagao. Spam mat karo.
2. **Redeploy par session ud jayegi** — dobara pairing karni padegi (Step 3 repeat). Isse bachne ke liye owner command `.backupsession` hai — ye session files owner ko bhej deta hai, taaki wapas restore ho sake.
3. **Owner number daalna mat bhoolna** — warna owner commands kaam nahi karenge. (Abhi `9779714313486` set hai.)

## 💻 Local me chalana ho to

```bash
npm install
node index.js
# phir browser me kholo: http://localhost:3000
```

Command count check: `npm run count` (300+ assert karta hai).

---
Made for VIP Shorts Creator 🎬 — prefix `.` mat bhoolna!
