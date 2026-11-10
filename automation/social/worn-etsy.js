// Etsy listing videos of people wearing each tee (Sam, 10 Nov 2026).
// For every tee with a product photo, makes a square, silent, photographs-only
// video (about 11 s, inside Etsy's 5-15 s rule) from Printify's model photos.
// Writes automation/social/videos/worn/<catalogue id>.mp4. Posts nothing.
const fs = require("fs");
const path = require("path");
const { loadSiteData, wornPost } = require("./lib.js");
const { makeWorn } = require("./reel.js");

(async () => {
  const site = loadSiteData();
  const dir = path.join(__dirname, "videos", "worn");
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set();
  let made = 0, failed = 0;
  for (let n = 0; n < 60; n++) {
    const post = wornPost(n, site, "2099-01-01");
    if (!post || seen.has(post.page)) continue;
    seen.add(post.page);
    const id = post.worn.src.match(/\/([a-z0-9-]+)-frog-logic-tee\.jpg/);
    const name = (id ? id[1] : post.page).replace(/-tee$/, "");
    const out = path.join(dir, name + ".mp4");
    fs.writeFileSync(out, "");
    const ok = await makeWorn(out, { ...post.worn, shape: "square" });
    if (ok) made++; else { failed++; fs.unlinkSync(out); }
    console.log(`${ok ? "ok    " : "FAILED"} ${name}`);
  }
  console.log(`\n${made} made, ${failed} failed`);
  if (!made) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
