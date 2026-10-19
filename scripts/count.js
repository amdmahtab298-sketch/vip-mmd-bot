// Registry count check — asserts >=300 unique command names.
// Missing node_modules (baileys/sharp/...) ko stub kar deta hai taaki
// count bina `npm install` ke bhi chal jaye.
const fs = require('fs');
const path = require('path');
const Module = require('module');

function makeStub() {
  const fn = function () { return proxy; };
  const proxy = new Proxy(fn, {
    get: (t, prop) => {
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === 'then') return undefined;
      return proxy;
    },
    apply: () => proxy,
    construct: () => proxy,
  });
  return proxy;
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain, ...rest) {
  try {
    return origLoad.call(this, request, parent, isMain, ...rest);
  } catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') return makeStub();
    throw e;
  }
};

const dir = path.join(__dirname, '..', 'commands');
const seen = new Map();   // name -> file
const aliasUse = new Map();// alias -> file
const perCat = {};
const shapeErrors = [];

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  let arr;
  try {
    arr = require(path.join(dir, f));
  } catch (e) {
    console.log(`❌ ${f} require fail: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(arr)) {
    console.log(`❌ ${f} ne array export nahi kiya`);
    process.exit(1);
  }
  for (const c of arr) {
    if (!c || typeof c.name !== 'string' || typeof c.run !== 'function' || typeof c.category !== 'string') {
      shapeErrors.push(`${f}: bad shape (${JSON.stringify(c && c.name)})`);
      continue;
    }
    perCat[c.category] = (perCat[c.category] || 0) + 1;
    const key = c.name.toLowerCase();
    if (seen.has(key)) console.log(`❌ DUP name "${c.name}" in ${f} (pehle: ${seen.get(key)})`);
    else seen.set(key, f);
    for (const a of c.aliases || []) {
      const ak = String(a).toLowerCase();
      if (seen.has(ak)) console.log(`⚠️ alias "${a}" (${f}) collides with command name`);
      else if (aliasUse.has(ak)) console.log(`⚠️ alias "${a}" dup: ${f} vs ${aliasUse.get(ak)}`);
      else aliasUse.set(ak, f);
    }
  }
}

console.log('\n📦 Per-category:');
for (const [cat, n] of Object.entries(perCat)) console.log(`   ${cat}: ${n}`);
console.log(`\n🔢 TOTAL unique commands: ${seen.size} (+${aliasUse.size} aliases)`);
if (shapeErrors.length) {
  console.log('❌ Shape errors:'); shapeErrors.forEach((e) => console.log('  ' + e));
  process.exit(1);
}
if (seen.size < 300) {
  console.log('❌ FAIL: 300 se kam commands!');
  process.exit(1);
}
console.log('✅ OK: 300+ unique commands!');
