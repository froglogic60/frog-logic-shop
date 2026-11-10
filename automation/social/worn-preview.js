// Makes one "tee worn by people" Reel without posting it, so it can be looked
// at first. Writes automation/social/promo/worn-preview.mp4 (overwritten each
// time).   N=0 node worn-preview.js    N = which Saturday in the rotation.
const fs = require("fs");
const path = require("path");
const { loadSiteData, wornPost } = require("./lib.js");
const { makeWorn } = require("./reel.js");

(async () => {
  const n = parseInt(process.env.N || "0", 10) || 0;
  const post = wornPost(n, loadSiteData(), new Date().toISOString().slice(0, 10));
  if (!post) throw new Error("no tee with a product photo found");
  const out = path.join(__dirname, "promo", "worn-preview.mp4");
  if (fs.existsSync(out)) fs.unlinkSync(out);
  fs.writeFileSync(out, ""); // makeWorn replaces this
  const ok = await makeWorn(out, post.worn);
  if (!ok) { fs.unlinkSync(out); process.exit(1); }
  console.log("\n" + post.caption);
})().catch((e) => { console.error(e); process.exit(1); });
