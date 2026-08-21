// Generates and publishes one Frog Logic social post (Facebook Page +
// Instagram). Which post is decided deterministically from the date and the
// SLOT env var (0, 1 or 2 — the three daily runs), following the standing
// content mix. Content comes from bank.json plus the live site's own
// product data; images are rendered in the house style at run time.
//
// Usage:
//   SLOT=0 node daily.js generate   -> writes queue/<date>-<slot>.jpg + .json
//   SLOT=0 node daily.js post       -> publishes that file (after the
//                                      workflow has committed it, so the
//                                      image has a public raw.githubusercontent
//                                      URL for Instagram to fetch)
//
// Secrets (GitHub Actions): META_ACCESS_TOKEN (long-lived user token — a
// Page token is derived on every run), FB_PAGE_ID, IG_USER_ID.
const fs = require("fs");
const path = require("path");
const { loadSiteData, scheduleFor, buildPost } = require("./lib.js");
const { makeRenderer } = require("./render2.js");

const GRAPH = "https://graph.facebook.com/v20.0";
const RAW_BASE = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/queue";
const QUEUE = path.join(__dirname, "queue");

function today() {
  const d = new Date();
  return { d, iso: d.toISOString().slice(0, 10) };
}

function slotNum() {
  const s = parseInt(process.env.SLOT ?? "0", 10);
  if (![0, 1, 2].includes(s)) throw new Error("SLOT must be 0, 1 or 2");
  return s;
}

async function generate() {
  const { d, iso } = today();
  const slot = slotNum();
  const bank = JSON.parse(fs.readFileSync(path.join(__dirname, "bank.json"), "utf8"));
  const site = loadSiteData();
  const sched = scheduleFor(d, slot);
  const post = buildPost(sched, bank, site);
  const renderer = makeRenderer({
    logoFile: path.join(__dirname, "..", "..", "assets", "frog-logic-mark-sm.png"),
  });
  const name = `${iso}-${slot}`;
  const jpg = path.join(QUEUE, `${name}.jpg`);
  await renderer.renderToJpeg(renderer.svgFor(post, sched.occurrence), jpg);
  fs.writeFileSync(path.join(QUEUE, `${name}.json`), JSON.stringify({
    caption: post.caption, kind: post.kind, image: `${name}.jpg`,
  }, null, 2));

  // Housekeeping: drop queue files older than 7 days so the repo stays small.
  const cutoff = Date.now() - 7 * 86400000;
  for (const f of fs.readdirSync(QUEUE)) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})-\d\./);
    if (m && Date.parse(m[1]) < cutoff) fs.unlinkSync(path.join(QUEUE, f));
  }
  console.log(`Generated ${name} (${post.kind}): ${post.caption.split("\n")[0]}`);
}

async function getPageToken(userToken, pageId) {
  const body = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${userToken}`).then((r) => r.json());
  if (!body.access_token) throw new Error(`Could not get Page token: ${JSON.stringify(body.error || body)}`);
  return body.access_token;
}

async function waitForUrl(url) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (r && r.ok) return;
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error(`Image never became reachable: ${url}`);
}

async function post() {
  const { iso } = today();
  const slot = slotNum();
  const name = `${iso}-${slot}`;
  const meta = JSON.parse(fs.readFileSync(path.join(QUEUE, `${name}.json`), "utf8"));
  const imageUrl = `${RAW_BASE}/${meta.image}`;
  const token = await getPageToken(process.env.META_ACCESS_TOKEN, process.env.FB_PAGE_ID);

  await waitForUrl(imageUrl);

  // Facebook: photo post (image + caption).
  const fb = await fetch(`${GRAPH}/${process.env.FB_PAGE_ID}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, message: meta.caption, access_token: token }),
  }).then((r) => r.json());
  if (!fb.id) throw new Error(`Facebook post failed: ${JSON.stringify(fb)}`);
  console.log("Facebook post created:", fb.id);

  // Instagram: container -> wait until processed -> publish.
  const create = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: meta.caption, access_token: token }),
  }).then((r) => r.json());
  if (!create.id) throw new Error(`IG media container failed: ${JSON.stringify(create)}`);
  for (let i = 0; i < 20; i++) {
    const st = await fetch(`${GRAPH}/${create.id}?fields=status_code&access_token=${token}`).then((r) => r.json());
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new Error(`IG media processing failed: ${JSON.stringify(st)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
  const pub = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: create.id, access_token: token }),
  }).then((r) => r.json());
  if (!pub.id) throw new Error(`IG publish failed: ${JSON.stringify(pub)}`);
  console.log("Instagram post created:", pub.id);
}

const mode = process.argv[2];
(mode === "generate" ? generate() : mode === "post" ? post() : Promise.reject(new Error("usage: node daily.js generate|post")))
  .catch((err) => { console.error(err); process.exit(1); });
