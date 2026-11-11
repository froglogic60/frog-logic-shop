// Etsy listing videos of people wearing each tee (Sam, 10 Nov 2026).
// For every tee with a product photo, makes a square, silent, photographs-only
// video (about 11 s, inside Etsy's 5-15 s rule) from Printify's model photos.
// Writes automation/social/videos/worn/<catalogue id>.mp4. Posts nothing.
const fs = require("fs");
const path = require("path");
const { loadSiteData, wornPost } = require("./lib.js");
const { makeWorn } = require("./reel.js");

// SET=xmas: the "Socially Hibernating" Christmas tees and hoodies (Sam, 11 Nov
// 2026). They are not in the site's tee list, so the Printify product, the
// colour/size to show and the camera numbers are written out here (read from
// Printify's mockup library, Etsy store, on 11 Nov). One video per design,
// made from the UK product and used on the UK and US listings alike.
const TEE_CAMS = null; // the usual tee cameras in reel.js
const HOODIE_CAMS = [[102766, "lifestyle"], [98427, "person-1"], [98428, "person-2"], [98429, "person-3"], [98430, "person-4"]];
const XMAS = [
  ["xmas-tee", "6ad1f93db7243250ec0835ef", 11974, TEE_CAMS],
  ["xmas-tee-bright", "6ad79245b0c1203caf059074", 12100, TEE_CAMS],
  ["xmas-tee-mono", "6ad7929ac087d2314b0fa4ff", 12100, TEE_CAMS],
  ["xmas-hoodie", "6ad1f9398ed12a970600ce7a", 32912, HOODIE_CAMS],
  ["xmas-hoodie-bright", "6ad79240c087d2314b0fa449", 32912, HOODIE_CAMS],
  ["xmas-hoodie-mono", "6ad79296c087d2314b0fa4f8", 32912, HOODIE_CAMS],
];

(async () => {
  const dir = path.join(__dirname, "videos", "worn");
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.SET === "xmas") {
    let ok = 0;
    for (const [name, pid, variant, cams] of XMAS) {
      const out = path.join(dir, name + ".mp4");
      fs.writeFileSync(out, "");
      const worn = { src: `https://images-api.printify.com/mockup/${pid}/${variant}/0/x.jpg`, title: "", line: "", price: "", shape: "square" };
      if (cams) worn.cameras = cams;
      const made = await makeWorn(out, worn);
      if (made) ok++; else fs.unlinkSync(out);
      console.log(`${made ? "ok    " : "FAILED"} ${name}`);
    }
    console.log(`\n${ok} of ${XMAS.length} made`);
    if (!ok) process.exit(1);
    return;
  }
  const site = loadSiteData();
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
