const providers = require("./providers");

const TIMEOUT = 10000;

async function tryProvider(provider, url) {
try {
console.log(`[ MENCOBA ] ${provider.name}`);

const data = await Promise.race([
provider.run(url),
new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), TIMEOUT))
]);

if (!data || (!data.video && !data.images)) {
throw new Error("No Media Found");
}

console.log(`[ SUKSES ] ${provider.name}`);
return {
success: true,
provider: provider.name,
...data
};

} catch (e) {
console.log(`[ GAGAL ] ${provider.name} - ${e.message}`);
return null;
}
}

async function download(url) {
for (const provider of providers) {
const result = await tryProvider(provider, url);
if (result) {
return result;
}
}
return { success: false };
}

module.exports = { download };