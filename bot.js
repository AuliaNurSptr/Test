const TelegramBot = require("node-telegram-bot-api");
const os = require("os");
const fs = require("fs");

const { download } = require("./downloader");

const BOT_TOKEN = "8890160092:AAHrA5n4oyqHixMe1t7Y2wgsvwvfKg4691Y";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

/* =========================================
 💾     DATABASE LOKAL (SEDERHANA)
========================================= */
const DB_FILE = "./database.json";
let db = { users: {}, settings: { limitEnabled: true } };

if (fs.existsSync(DB_FILE)) {
try {
db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
if (!db.settings) db.settings = { limitEnabled: true };
} catch (err) {
console.error("Gagal Membaca Database, Membuat Baru...");
}
}

function saveDB() {
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* =========================================
 ⚙️     CONFIGURATION & SETTINGS
========================================= */
const CONFIG = {
BOT_NAME: "Yann TikTok Downloader",
OWNER: "YannSdk",
USERNAME: "@YannSdk",
OWNER_ID: 8629512168,
MAX_LINK: 5,
COOLDOWN: 500,
DAILY_LIMIT: 50,
RESET_TIME: 24 * 60 * 60 * 1000,
CHANNEL_URL: "https://t.me/tikdownloadapi",
PREMIUM_TEXT: `
💎 <b>UPGRADE KE PREMIUM</b> 💎

Dapatkan Akses Mengunduh <b>TANPA BATAS LIMIT HARIAN!</b>
<i>(Fitur Jeda Anti-Spam Tetap Berlaku Agar Bot Stabil).</i>

💰 <b>Daftar Harga Sewa :</b>
┣ 🥉 <b>1 Hari :</b> Rp 500
┣ 🥈 <b>7 Hari :</b> Rp 5.000
┗ 🥇 <b>30 Hari :</b> Rp 15.000

💳 <b>Metode Pembayaran :</b>
┣ <b>Dana/Gopay :</b> <code>0851-1121-1084</code>
┗ <b>QRIS :</b> Silakan Chat Owner Untuk Meminta Foto QRIS.

👇 <i>Setelah Transfer, Kirimkan Bukti Pembayaran Beserta <b>User ID</b> Kamu Ke Owner.</i>
`
};

/* =========================================
 📝    SETTING MENU COMMAND TAMPILAN
========================================= */
bot.setMyCommands([
{ command: "/start", description: "🚀 Mulai Menggunakan Bot" },
{ command: "/premium", description: "💎 Upgrade Premium (No Limit)" },
{ command: "/id", description: "🔍 Cek Info Akun & Premium" },
{ command: "/owner", description: "👨‍💻 Lihat Profile Pengguna Bot" },
{ command: "/status", description: "⚡ Cek Status Server" }
]);

const cooldown = new Map();
const requests = new Map();

/* =========================================
 🛠 HELPER: TRACKING, RESET & CEK PREMIUM
========================================= */
function checkAndResetUser(msg) {
const userId = msg.from.id.toString();
const now = Date.now();

if (!db.users[userId]) {
db.users[userId] = {
id: userId,
name: msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : ""),
username: msg.from.username || "Tidak Ada",
usage: 0,
isPremium: false,
premiumExpired: null,
lastReset: now
};
} else {
db.users[userId].name = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");
db.users[userId].username = msg.from.username || "Tidak Ada";
}

if (userId === CONFIG.OWNER_ID.toString()) {
db.users[userId].isPremium = true;
db.users[userId].premiumExpired = null;
}

if (now - db.users[userId].lastReset > CONFIG.RESET_TIME) {
db.users[userId].usage = 0;
db.users[userId].lastReset = now;
}

if (db.users[userId].isPremium && db.users[userId].premiumExpired) {
if (now > db.users[userId].premiumExpired) {
db.users[userId].isPremium = false;
db.users[userId].premiumExpired = null;
try {
bot.sendMessage(userId, `⚠️ <b>PEMBERITAHUAN</b>\n\nMasa Aktif <b>Premium</b> Kamu Telah Habis. Status Akun Kamu Sekarang Kembali Menjadi Reguler Dengan Limit Harian 50. Ketik /premium Jika Ingin Memperpanjang.`, { parse_mode: "HTML" });
} catch (e) {
}
}
}

saveDB();
return db.users[userId];
}

/* =========================================
 📩          EVENT COMMANDS UMUM
========================================= */

// Command /start
bot.onText(/\/start/, async (msg) => {
const chatId = msg.chat.id;
const welcomeText = `
👑 <b>WELCOME TO ${CONFIG.BOT_NAME.toUpperCase()}</b> 👑

Bot Ini Adalah Alat Premium Untuk Mengunduh Media Dari TikTok <b>Tanpa Watermark</b> Dengan Kecepatan Tinggi. Dan Juga Dilengkapi Dengan Backup Server Hingga 10+

✨ <b>Fitur Unggulan :</b>
┣ 🎬 Video HD Quality
┣ 🎵 Audio MP3 Jernih
┣ 🖼 Download Slide Foto Massal
┣ 📍 Support Rest Api Pribadi
┗ ⚡ Multi-Provider / Multi Scraping Engine

👇 <i>Silakan Kirim Link Video/Slide/Foto/Story TikTok Untuk Mulai Mengunduh!</i>
`;
bot.sendMessage(chatId, welcomeText, {
parse_mode: "HTML",
reply_markup: {
inline_keyboard: [
[{ text: "📢 Channel Official", url: CONFIG.CHANNEL_URL }],
[{ text: "👨‍💻 Hubungi Owner", url: `https://t.me/${CONFIG.USERNAME.replace("@", "")}` }]
]
}
});
});

// Command /owner
bot.onText(/\/owner/, (msg) => {
bot.sendMessage(msg.chat.id, `
👨‍💻 <b>PROFIL OWNER</b>

👤 <b>Nama :</b> ${CONFIG.OWNER}
🌐 <b>Username :</b> ${CONFIG.USERNAME}
🆔 <b>ID :</b> <code>${CONFIG.OWNER_ID}</code>

<i>Jika Ada Kendala, Error, Atau Ingin Kerjasama, Silakan Hubungi Owner.</i>
`, { parse_mode: "HTML" });
});

// Command /id
bot.onText(/\/id/, (msg) => {
const user = msg.from;
const userDb = checkAndResetUser(msg);

let statusText = "👤 Reguler";
if (userDb.isPremium) {
if (userDb.premiumExpired) {
const msLeft = Math.max(0, userDb.premiumExpired - Date.now());
const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
statusText = `💎 Premium (${daysLeft} Hari ${hoursLeft} Jam Tersisa)`;
} else {
statusText = "💎 Premium (Permanen)";
}
}

const text = `
🛂 <b>INFORMASI AKUN KAMU</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Nama :</b> ${user.first_name} ${user.last_name || ""}
🌐 <b>Username :</b> ${user.username ? "@" + user.username : "Tidak Disetting"}
🆔 <b>User ID :</b> <code>${user.id}</code>
💬 <b>Chat ID :</b> <code>${msg.chat.id}</code>
🌟 <b>Status :</b> <b>${statusText}</b>
━━━━━━━━━━━━━━━━━━━━
<i>ID Ini Berguna Jika Kamu Butuh Bantuan Dari Owner.</i>
`;
bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
});

// Command /premium
bot.onText(/\/premium/, (msg) => {
bot.sendMessage(msg.chat.id, CONFIG.PREMIUM_TEXT, {
parse_mode: "HTML",
reply_markup: {
inline_keyboard: [
[{ text: "💬 Konfirmasi Ke Owner", url: `https://t.me/${CONFIG.USERNAME.replace("@", "")}` }]
]
}
});
});

// Command /status
bot.onText(/\/status/, async (msg) => {
const chatId = msg.chat.id;
const start = Date.now();
const reply = await bot.sendMessage(chatId, "<i>📊 Mengumpulkan Metrik Server...</i>", { parse_mode: "HTML" });
const end = Date.now();

const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
const usedMem = (totalMem - freeMem).toFixed(0);
const uptime = process.uptime();
const uptimeStr = `${Math.floor(uptime / 3600)}j ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}d`;

const totalUsers = Object.keys(db.users).length;
const limitStatus = db.settings.limitEnabled ? "AKTIF ✅" : "NONAKTIF ❌";

const text = `
⚡ <b>SERVER & BOT STATUS</b> ⚡
━━━━━━━━━━━━━━━━━━━━
⏱️ <b>Response :</b> <code>${end - start} ms</code>
🖥️ <b>RAM :</b> <code>${usedMem}MB / ${totalMem}MB</code>
🤖 <b>Uptime :</b> <code>${uptimeStr}</code>

👥 <b>BOT METRICS</b>
┣ <b>Total User :</b> <code>${totalUsers} Users</code>
┗ <b>Limit System :</b> <code>${limitStatus}</code>
━━━━━━━━━━━━━━━━━━━━
`;
bot.editMessageText(text, { chat_id: chatId, message_id: reply.message_id, parse_mode: "HTML" });
});

/* =========================================
 🔐 EVENT COMMANDS ADMIN / OWNER ONLY
========================================= */

bot.onText(/\/users/, (msg) => {
if (msg.chat.id !== CONFIG.OWNER_ID) return;

const usersArr = Object.values(db.users);
const premiumCount = usersArr.filter(u => u.isPremium).length;

let txt = `👥 <b>STATISTIK PENGGUNA</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
txt += `Total User : <b>${usersArr.length}</b>\nUser Premium : <b>${premiumCount}</b>\n\n`;
txt += `📜 <b>Daftar 30 User Terakhir :</b>\n`;

usersArr.slice(-30).forEach((u, i) => {
let premInfo = "";
if (u.isPremium) {
if (u.premiumExpired) {
const d = Math.floor(Math.max(0, u.premiumExpired - Date.now()) / 86400000);
premInfo = `[${d} Hari]`;
} else {
premInfo = `[∞]`;
}
}

const limitStr = u.isPremium ? `💎 Unlimited ${premInfo}` : `${u.usage}/${CONFIG.DAILY_LIMIT}`;
txt += `${i + 1}. ${u.name} (@${u.username}) | ID : <code>${u.id}</code> | Limit : ${limitStr}\n`;
});

bot.sendMessage(msg.chat.id, txt, { parse_mode: "HTML" });
});

bot.onText(/\/addprem (\d+)(?:\s+(\d+))?/, (msg, match) => {
if (msg.chat.id !== CONFIG.OWNER_ID) return;
const targetId = match[1];
const days = match[2] ? parseInt(match[2]) : null;

if (db.users[targetId]) {
db.users[targetId].isPremium = true;

let expText = "Permanen (Selamanya)";
if (days) {
const msToAdd = days * 24 * 60 * 60 * 1000;
db.users[targetId].premiumExpired = Date.now() + msToAdd;
expText = `${days} Hari`;
} else {
db.users[targetId].premiumExpired = null;
}

saveDB();
bot.sendMessage(msg.chat.id, `✅ <b>SUKSES :</b> User ID <code>${targetId}</code> Telah Menjadi Premium 💎 selama <b>${expText}</b>.`, { parse_mode: "HTML" });
bot.sendMessage(targetId, `🎉 <b>SELAMAT!</b>\nStatus Akun Kamu Kini Telah Diupgrade Menjadi <b>PREMIUM</b> 💎 Oleh Owner.\n\n⏳ <b>Masa Aktif :</b> ${expText}\n\nNikmati Download Media Tanpa Batas Limit Harian!`, { parse_mode: "HTML" });
} else {
bot.sendMessage(msg.chat.id, `❌ User ID Tidak Ditemukan Di Database. Pastikan Mereka Sudah Pernah Chat Bot Minimal 1x.`);
}
});

bot.onText(/\/delprem (\d+)/, (msg, match) => {
if (msg.chat.id !== CONFIG.OWNER_ID) return;
const targetId = match[1];

if (db.users[targetId]) {
db.users[targetId].isPremium = false;
db.users[targetId].premiumExpired = null;
saveDB();
bot.sendMessage(msg.chat.id, `✅ <b>SUKSES :</b> Status Premium User ID <code>${targetId}</code> Telah Dicabut.`, { parse_mode: "HTML" });
} else {
bot.sendMessage(msg.chat.id, `❌ User ID Tidak Ditemukan.`);
}
});

bot.onText(/\/limiton/, (msg) => {
if (msg.chat.id !== CONFIG.OWNER_ID) return;
db.settings.limitEnabled = true;
saveDB();
bot.sendMessage(msg.chat.id, "✅ Sistem Limit Harian <b>DIAKTIFKAN</b>.", { parse_mode: "HTML" });
});

bot.onText(/\/limitoff/, (msg) => {
if (msg.chat.id !== CONFIG.OWNER_ID) return;
db.settings.limitEnabled = false;
saveDB();
bot.sendMessage(msg.chat.id, "❌ Sistem Limit Harian <b>DIMATIKAN</b> (Semua User Bebas Pakai).", { parse_mode: "HTML" });
});


/* =========================================
 🚀         MAIN DOWNLOAD LOGIC
========================================= */
bot.on("message", async (msg) => {
const chatId = msg.chat.id;
const text = msg.text || "";

let userData = null;
if (text || msg.photo || msg.video) {
userData = checkAndResetUser(msg);
}

if (!text || text.startsWith("/") || !text.includes("tiktok")) return;

if (db.settings.limitEnabled && !userData.isPremium) {
if (userData.usage >= CONFIG.DAILY_LIMIT) {
const timeLapse = Date.now() - userData.lastReset;
const msLeft = Math.max(0, CONFIG.RESET_TIME - timeLapse);
const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

return bot.sendMessage(chatId, `🚫 <b>LIMIT HARIAN HABIS</b>\n\nLimit Kamu (${CONFIG.DAILY_LIMIT}/${CONFIG.DAILY_LIMIT}) Sudah Tercapai Hari Ini.\nLimit Akan Direset Dalam Waktu <b>${hoursLeft} Jam ${minsLeft} Menit</b>.\n\n💎 Ingin Tanpa Batas? Ketik /premium`, { parse_mode: "HTML" });
}
}

const count = requests.get(chatId) || 0;
if (count >= CONFIG.MAX_LINK) {
cooldown.set(chatId, Date.now() + CONFIG.COOLDOWN);
requests.set(chatId, 0);
return bot.sendMessage(chatId, `🚫 <b>COOLDOWN ANTI-SPAM</b>\n\nKamu Telah Mengirim ${CONFIG.MAX_LINK} Link Berturut-Turut. Mohon Tunggu <b>${CONFIG.COOLDOWN / 1000} Detik</b> Sebelum Menggunakan Bot Lagi.`, { parse_mode: "HTML" });
}

if (cooldown.has(chatId)) {
const timeLeft = Math.ceil((cooldown.get(chatId) - Date.now()) / 1000);
if (timeLeft > 0) {
return bot.sendMessage(chatId, `⏳ <i>Mohon Tunggu <b>${timeLeft} Detik</b> Lagi...</i>`, { parse_mode: "HTML" });
}
cooldown.delete(chatId);
}

requests.set(chatId, count + 1);

const loadingText = `🔎 <b>MENGANALISA TAUTAN...</b>\n━━━━━━━━━━━━━━━━━━━━\n<i>Mohon Tunggu Sebentar, Bot Sedang Mengambil Data Media Resolusi Terbaik...</i>`;
const loading = await bot.sendMessage(chatId, loadingText, { parse_mode: "HTML" });

try {
const data = await download(text);

if (!data.success) {
return bot.editMessageText(`❌ <b>GAGAL MENGUNDUH</b>\n\nSemua Provider Sedang Sibuk Atau Video/Link Tersebut Sudah Dihapus. Coba Lagi Nanti.`, { 
chat_id: chatId, 
message_id: loading.message_id,
parse_mode: "HTML"
});
}

await bot.deleteMessage(chatId, loading.message_id);

userData.usage += 1;
saveDB();

const maxTitleLength = 850;
let safeTitle = data.title || "Tidak Ada Deskripsi";
if (safeTitle.length > maxTitleLength) {
safeTitle = safeTitle.substring(0, maxTitleLength) + "...";
}

const limitDisplay = userData.isPremium ? "♾️ <b>Unlimited</b> 💎" : `${userData.usage}/${CONFIG.DAILY_LIMIT}`;

const caption = `
✅ <b>BERHASIL DIUNDUH</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Judul :</b> <i>${safeTitle}</i>
👤 <b>Author :</b> <code>${data.author || "Tidak Diketahui"}</code>
📊 <b>Statistik :</b> ❤️ ${data.stats?.likes || "-"} | 👁 ${data.stats?.views || "-"}
⚙️ <b>Server :</b> <code>${data.provider}</code>
🔋 <b>Limit Terpakai:</b> ${limitDisplay}

🤖 <b>Powered By :</b> <a href="${CONFIG.CHANNEL_URL}">${CONFIG.BOT_NAME}</a>
`;

const premiumKeyboard = {
inline_keyboard: [
[
{ text: "📢 Update", url: CONFIG.CHANNEL_URL },
{ text: "👑 Owner", url: `https://t.me/${CONFIG.USERNAME.replace("@", "")}` }
]
]
};

if (data.images && data.images.length > 0) {
const mediaGroup = data.images.slice(0, 10).map((img, index) => ({
type: "photo",
media: img,
caption: index === 0 ? caption : "", 
parse_mode: "HTML"
}));
await bot.sendMediaGroup(chatId, mediaGroup);
await bot.sendMessage(chatId, `👆 <i>Itu Untuk Semua Foto.</i>`, { 
parse_mode: "HTML",
reply_markup: premiumKeyboard 
});
}
else if (data.video) {
await bot.sendVideo(chatId, data.video, { 
caption: caption, 
parse_mode: "HTML",
reply_markup: premiumKeyboard 
});
}

if (data.audio) {
await bot.sendAudio(chatId, data.audio, { 
caption: `🎵 <b>Audio Dari Video Di Atas</b>\n🤖 @${(await bot.getMe()).username}`,
parse_mode: "HTML"
});
}

} catch (e) {
console.log("[ERROR EVENT]", e.message);
try {
await bot.editMessageText(`⚠️ <b>TERJADI KESALAHAN SERVER</b>\n\nSistem Gagal Memproses Tautan Kamu. Pastikan Link Valid Dan Bukan Akun Private.`, { 
chat_id: chatId, 
message_id: loading.message_id,
parse_mode: "HTML"
});
} catch (err) {}
}
});