const axios = require("axios");

const providers = [
{
name: "YANN-API",
run: async (url) => {
const { data } = await axios.get('https://api.yannclipper.net/ttdl', {
params: { url: url }
});

if (!data || !data.result || !data.result.status) {
throw new Error("Data Kosong Atau Gagal Ditarik Dari API");
}

const meta = data.result;

const result = {
title: meta.description || "Tidak Ada Deskripsi",
author: meta.author || "Tidak Diketahui",
stats: {
likes: meta.stats?.likes || "-",
views: meta.stats?.views || "-"
}
};

if (meta.video_url) {
result.video = meta.video_url;
}

if (meta.audio_url) {
result.audio = meta.audio_url;
}

return result;
}
},
{
name: "YANN-API (V1)",
run: async (url) => {
const res = (await axios.post('https://www.tikwm.com/api/', {}, {
params: { url, hd: 1, web: 1, count: 12 }
})).data.data;

if (!res) throw new Error("Data Not Found");

const result = {
title: res.title,
author: res.author?.nickname || res.author?.unique_id,
stats: { views: res.play_count, likes: res.digg_count }
};

if (res.images && res.images.length > 0) {
result.images = res.images;
} else {
const video = res.hdplay || res.play;
result.video = video?.startsWith("http") ? video : `https://www.tikwm.com${video}`;
}

const music = res.music || res.music_info?.play;
if (music) {
result.audio = music?.startsWith("http") ? music : `https://www.tikwm.com${music}`;
}

return result;
}
},
{
name: "YANN-API (V2)",
run: async (url) => {
const params = new URLSearchParams({ url, hd: "1" });
const { data } = await axios.post("https://tikwm.com/api/", params);

if (!data.data) throw new Error("Data Not Found");

const result = {
title: data.data.title,
author: data.data.author?.nickname,
audio: data.data.music
};

if (data.data.images && data.data.images.length > 0) {
result.images = data.data.images;
} else {
result.video = data.data.hdplay || data.data.play;
}

return result;
}
},
{
name: "YANN-API (V3)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/tiktok', {
params: { url: url }
});
if (!data || !data.result) {
throw new Error("Data Kosong Dari API Utama");
}
const meta = data.result;
let finalLikes = "-";
let finalViews = "-";
let metaV4 = null;
try {
const backup = await axios.get('https://api.yanndixs.tech/Tiktok4', {
params: { url: url }
});
if (backup.data && backup.data.result) {
metaV4 = backup.data.result;
finalLikes = metaV4.stats?.likes || "-";
finalViews = metaV4.stats?.views || "-";
}
} catch (e) {}
if (meta.cover && meta.cover.includes("photomode") && metaV4) {
const resultFoto = {
title: metaV4.title || "Tidak Ada Deskripsi",
author: metaV4.author?.nickname || metaV4.author?.fullname || "Tidak Diketahui",
stats: {
likes: finalLikes,
views: finalViews
}
};
if (metaV4.data && Array.isArray(metaV4.data)) {
const photos = metaV4.data.filter(item => item.type === "photo").map(item => item.url);
if (photos.length > 0) resultFoto.images = photos;
}
if (metaV4.music_info?.url) resultFoto.audio = metaV4.music_info.url;
return resultFoto;
}
const resultVideo = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author || "Tidak Diketahui",
stats: {
likes: finalLikes,
views: finalViews
}
};
if (meta.video_hd || meta.video) {
resultVideo.video = meta.video_hd || meta.video;
}
if (meta.music) {
resultVideo.audio = meta.music;
}
return resultVideo;
}
},
{
name: "YANN-API (V4)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/Tiktok2', {
params: { url: url }
});
if (!data || !data.result) throw new Error("Data Kosong Dari API Tiktok2");
const meta = data.result;
let finalLikes = "-";
let finalViews = "-";
try {
const backup = await axios.get('https://api.yanndixs.tech/Tiktok4', {
params: { url: url }
});
if (backup.data && backup.data.result) {
finalLikes = backup.data.result.stats?.likes || "-";
finalViews = backup.data.result.stats?.views || "-";
}
} catch (e) {}
const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: "Tidak Diketahui",
stats: {
likes: finalLikes,
views: finalViews
}
};
if (meta.images && Array.isArray(meta.images) && meta.images.length > 0) {
result.images = meta.images;
} else if (meta.video_hd || meta.video_sd) {
result.video = meta.video_hd || meta.video_sd;
}
if (meta.mp3) result.audio = meta.mp3;
return result;
}
},
{
name: "YANN-API (V5)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/Tiktok2s', {
params: { url: url }
});
if (!data || !data.result || !data.result.data) throw new Error("Data Kosong Dari API Tiktok2s");
const meta = data.result.data;
const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author?.nickname || "Tidak Diketahui",
stats: {
likes: meta.digg_count || "-",
views: meta.play_count || "-"
}
};
if (meta.images && Array.isArray(meta.images) && meta.images.length > 0) {
result.images = meta.images;
} else if (meta.hdplay || meta.play) {
result.video = meta.hdplay || meta.play;
}
if (meta.music) result.audio = meta.music;
return result;
}
},
{
name: "YANN-API (V6)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/Tiktok4', {
params: { url: url }
});
if (!data || !data.result) throw new Error("Data Kosong Dari API Tiktok4");
const meta = data.result;
const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author?.nickname || meta.author?.fullname || "Tidak Diketahui",
stats: {
likes: meta.stats?.likes || "-",
views: meta.stats?.views || "-"
}
};
if (meta.data && Array.isArray(meta.data)) {
const photos = meta.data.filter(item => item.type === "photo").map(item => item.url);
if (photos.length > 0) {
result.images = photos;
} else {
const hdVideo = meta.data.find(item => item.type === "nowatermark_hd")?.url;
const sdVideo = meta.data.find(item => item.type === "nowatermark")?.url;
if (hdVideo || sdVideo) result.video = hdVideo || sdVideo;
}
}
if (meta.music_info && meta.music_info.url) {
result.audio = meta.music_info.url;
}
return result;
}
},
{
name: "YANN-API (V7)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/Tiktok5', {
params: { url: url }
});
if (!data || !data.result || !data.result.data) throw new Error("Data Kosong / Gagal Dari API Tiktok5");
const meta = data.result.data;
const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author?.nickname || "Tidak Diketahui",
stats: {
likes: meta.digg_count || "-",
views: meta.play_count || "-"
}
};
if (meta.images && Array.isArray(meta.images) && meta.images.length > 0) {
result.images = meta.images;
} else if (meta.play) {
result.video = meta.play;
}
if (meta.music) result.audio = meta.music;
return result;
}
},
{
name: "YANN-API (V8)",
run: async (url) => {
const { data } = await axios.get('https://api.yanndixs.tech/Tiktok6', {
params: { url: url }
});
if (!data || !data.result) throw new Error("Data Kosong Atau Gagal Ditarik Dari API Pribadi");
const meta = data.result;
const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author?.nickname || "Tidak Diketahui",
stats: {
likes: meta.digg_count || "-",
views: meta.play_count || "-"
}
};
if (meta.images && Array.isArray(meta.images) && meta.images.length > 0) {
result.images = meta.images;
} else if (meta.hdplay || meta.play) {
result.video = meta.hdplay || meta.play;
}
if (meta.music) result.audio = meta.music;
return result;
}
},
{
name: "YANN-API (V9)",
run: async (url) => {
const { data } = await axios.get('https://www.tikwm.com/api/', {
params: { url: url, hd: 1 }
});

if (!data || data.code !== 0 || !data.data) {
throw new Error("Server TikWM Sedang Sibuk / Gagal Ngambil Data");
}

const meta = data.data;

const result = {
title: meta.title || "Tidak Ada Deskripsi",
author: meta.author?.nickname || "Tidak Diketahui",
stats: {
likes: meta.digg_count || "-",
views: meta.play_count || "-"
}
};

if (meta.images && Array.isArray(meta.images) && meta.images.length > 0) {
result.images = meta.images;
}
else {
result.video = meta.hdplay || meta.play;
}

if (meta.music) {
result.audio = meta.music;
}

return result;
}
},
{
name: "YANN-API (ULTRA HD)",
run: async (url) => {
const { data } = await axios.get("https://tiktok-scraper7.p.rapidapi.com", {
headers: {
"X-RapidAPI-Key": "ca5c6d6fa3mshfcd2b0a0feac6b7p140e57jsn72684628152a"
},
params: {
url,
hd: 1
}
});

const result = {
title: data.data.title || "Tidak Ada Deskripsi"
};

if (
data.data.images &&
Array.isArray(data.data.images) &&
data.data.images.length > 0
) {
result.images = data.data.images;
} else {
result.video = data.data.hdplay || data.data.play;
}

if (data.data.music) {
result.audio = data.data.music;
}

return result;
}
}
];

module.exports = providers;