// Video-first posting (Sam, 7 Nov 2026: insights show video posts reach far
// more people than still pictures). Every post picture is turned into a 9 s
// vertical Reel by reel.py and published as an Instagram Reel (shared to the
// feed) plus a Facebook Page video.
//
// The MP4 is fetched by Meta from jsDelivr pinned to the exact commit that
// added it (COMMIT_SHA, set by the workflow after it pushes), because a
// jsDelivr @main link can serve a cached older copy of the branch for hours.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const GRAPH = "https://graph.facebook.com/v20.0";
const REPO = "froglogic60/frog-logic-shop";

// jpg -> mp4 next to it. Returns the mp4 path, or null if it could not be made
// (the post then goes out as a picture, as before).
function makeReel(jpgPath) {
  const mp4 = jpgPath.replace(/\.jpg$/, ".mp4");
  try {
    execFileSync("python3", [path.join(__dirname, "reel.py"), jpgPath, mp4], { stdio: "inherit" });
    return fs.existsSync(mp4) ? mp4 : null;
  } catch (e) {
    console.error("Reel could not be made, falling back to a picture:", e.message);
    return null;
  }
}

// ---- tees worn by people (Sam, 10 Nov 2026) --------------------------------
// Printify's mockup library has photographs of people wearing each tee. They
// are served from the same public image address as the front photo in
// mockups.json, with a different camera number, so no API key is needed.
// Camera numbers checked in Printify on 10 Nov 2026 for the unisex tee every
// Frog Logic tee is printed on.
const WORN_CAMERAS = [
  [92662, "lifestyle"],   // close up, denim jacket
  [92573, "person-2"],
  [92576, "person-6"],
  [101996, "duo-2"],
  [92572, "person-1"],
];

// worn = { src: front photo address from mockups.json, title, line, price }.
// Writes the Reel over mp4Path. Returns true if it was made; on any problem
// it returns false and the ordinary Reel already at mp4Path is left alone.
async function makeWorn(mp4Path, worn) {
  try {
    const m = String(worn.src).match(/\/mockup\/([0-9a-f]+)\/(\d+)\/\d+\//);
    if (!m) throw new Error("no product photo address for this tee");
    const dir = fs.mkdtempSync(path.join(require("os").tmpdir(), "worn-"));
    const files = [];
    for (const [cam, label] of (worn.cameras || WORN_CAMERAS)) {
      if (files.length >= 4) break;
      const url = `https://images-api.printify.com/mockup/${m[1]}/${m[2]}/${cam}/tee.jpg?camera_label=${label}`;
      const r = await fetch(url).catch(() => null);
      if (!r || !r.ok) { console.error(`worn photo ${label} not available (${r ? r.status : "no reply"})`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 20000) { console.error(`worn photo ${label} too small to be a photo`); continue; }
      const f = path.join(dir, label + ".jpg");
      fs.writeFileSync(f, buf);
      files.push(f);
    }
    if (files.length < 2) throw new Error("fewer than two photographs came back");
    const { ensureFonts } = require("./gfonts.js");
    const fontDir = await ensureFonts(path.join(__dirname, ".gfonts"));
    // DM Sans isn't in ensureFonts' list (same fetch as xmas-card.cjs).
    const dm = path.join(fontDir, "DMSans-var.ttf");
    if (!fs.existsSync(dm) || fs.statSync(dm).size < 10000) {
      const fr = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf");
      if (!fr.ok) throw new Error("DM Sans download failed: " + fr.status);
      fs.writeFileSync(dm, Buffer.from(await fr.arrayBuffer()));
    }
    const tmp = mp4Path.replace(/\.mp4$/, ".worn.mp4");
    execFileSync("python3", [path.join(__dirname, "worn.py"), tmp, worn.title, worn.line || "", worn.price, ...files],
      { stdio: "inherit", env: { ...process.env, FONT_DIR: fontDir, SHAPE: worn.shape || "" } });
    fs.renameSync(tmp, mp4Path);
    return true;
  } catch (e) {
    console.error("Worn Reel could not be made, keeping the ordinary one:", e.message);
    return false;
  }
}

function videoUrlFor(repoPath) {
  const ref = process.env.COMMIT_SHA || "main";
  return `https://cdn.jsdelivr.net/gh/${REPO}@${ref}/${repoPath}`;
}

async function waitForVideo(url) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (r && r.ok) return;
    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error(`Video never became reachable: ${url}`);
}

// Instagram first (the fussier one), then Facebook. If anything fails before
// Instagram has published, the error carries igPosted=false so the caller can
// fall back to a picture post and the day isn't lost.
async function publishReel({ videoUrl, igCaption, fbCaption, token }) {
  const fail = (msg, igPosted) => Object.assign(new Error(msg), { igPosted });
  await waitForVideo(videoUrl).catch((e) => { throw fail(e.message, false); });
  const create = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "REELS", video_url: videoUrl, caption: igCaption, share_to_feed: true, access_token: token }),
  }).then((r) => r.json());
  if (!create.id) throw fail(`IG reel container failed: ${JSON.stringify(create)}`, false);
  let done = false;
  for (let i = 0; i < 60; i++) {
    const st = await fetch(`${GRAPH}/${create.id}?fields=status_code,status&access_token=${token}`).then((r) => r.json());
    if (st.status_code === "FINISHED") { done = true; break; }
    if (st.status_code === "ERROR") throw fail(`IG reel processing failed: ${JSON.stringify(st)}`, false);
    await new Promise((res) => setTimeout(res, 5000));
  }
  if (!done) throw fail("IG reel still processing after 5 minutes; nothing published", false);
  const pub = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: create.id, access_token: token }),
  }).then((r) => r.json());
  if (!pub.id) throw fail(`IG publish failed: ${JSON.stringify(pub)}`, false);
  console.log("Instagram reel created:", pub.id);

  const fb = await fetch(`${GRAPH}/${process.env.FB_PAGE_ID}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: videoUrl, description: fbCaption, access_token: token }),
  }).then((r) => r.json());
  if (!fb.id) throw fail(`Facebook video failed (Instagram already posted): ${JSON.stringify(fb)}`, true);
  console.log("Facebook video created:", fb.id);
  return { instagramId: pub.id, facebookId: fb.id };
}

module.exports = { makeReel, makeWorn, videoUrlFor, publishReel };
