// One-off and scheduled announcement posts (Facebook Page + Instagram),
// separate from the three scheduled daily posts so they can never clash.
//
// Content lives in announce.json (one-off, run by hand) or announce-queue.json
// (a dated queue, checked once a day). The image is rendered here at run time in
// the house style — same renderer as daily.js — so nothing binary is ever
// committed by hand.
//
//   node announce.js generate       -> renders queue/<name>.jpg from announce.json
//   node announce.js post           -> publishes it (after the workflow has
//                                      committed the jpg, so Instagram can fetch it)
//
//   node announce.js due-generate   -> if a queue entry is due today, renders it
//                                      and leaves a .due marker; otherwise no-op
//   node announce.js due-post       -> publishes what .due names, then marks the
//                                      queue entry posted; no marker = no-op
//
// Secrets: META_ACCESS_TOKEN, FB_PAGE_ID, IG_USER_ID.
const fs = require("fs");
const path = require("path");
const { makeRenderer } = require("./render2.js");

const GRAPH = "https://graph.facebook.com/v20.0";
const RAW_BASE = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/queue";
const QUEUE = path.join(__dirname, "queue");
const QUEUE_FILE = path.join(__dirname, "announce-queue.json");
const DUE_MARKER = path.join(__dirname, ".due");

function readSpec() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "announce.json"), "utf8"));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// First unposted entry whose date has arrived. Dates in the past still fire —
// a missed run catches up rather than silently dropping the post.
function findDue() {
  if (!fs.existsSync(QUEUE_FILE)) return null;
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const now = today();
  return queue.find((e) => !e.posted && e.postOn <= now) || null;
}

async function render(spec) {
  const renderer = makeRenderer({
    logoFile: path.join(__dirname, "..", "..", "assets", "frog-logic-mark-sm.png"),
  });
  const post = { kind: "note", item: { tag: spec.tag, title: spec.title, body: spec.body } };
  const out = path.join(QUEUE, `${spec.name}.jpg`);
  await renderer.renderToJpeg(renderer.svgFor(post, 0), out);
  console.log(`Generated ${spec.name}.jpg — "${spec.title}"`);
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

async function publish(spec) {
  const imageUrl = `${RAW_BASE}/${spec.name}.jpg`;
  const token = await getPageToken(process.env.META_ACCESS_TOKEN, process.env.FB_PAGE_ID);
  await waitForUrl(imageUrl);
  // Same channel doors as the daily posts: the bare domain becomes /fb on
  // Facebook and /ig on Instagram, so the visitor counter can tell them apart.
  const forFacebook  = spec.caption.replace(/froglogic\.co\.uk(?![\/\w])/g, "froglogic.co.uk/fb");
  const forInstagram = spec.caption.replace(/froglogic\.co\.uk(?![\/\w])/g, "froglogic.co.uk/ig");

  const fb = await fetch(`${GRAPH}/${process.env.FB_PAGE_ID}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, message: forFacebook, access_token: token }),
  }).then((r) => r.json());
  if (!fb.id) throw new Error(`Facebook post failed: ${JSON.stringify(fb)}`);
  console.log("Facebook post created:", fb.id);

  const create = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: forInstagram, access_token: token }),
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

async function dueGenerate() {
  if (fs.existsSync(DUE_MARKER)) fs.unlinkSync(DUE_MARKER);
  const entry = findDue();
  if (!entry) { console.log(`Nothing due on ${today()}.`); return; }
  await render(entry);
  fs.writeFileSync(DUE_MARKER, entry.name);
}

async function duePost() {
  if (!fs.existsSync(DUE_MARKER)) { console.log("No post due — nothing to publish."); return; }
  const name = fs.readFileSync(DUE_MARKER, "utf8").trim();
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const entry = queue.find((e) => e.name === name);
  if (!entry) throw new Error(`Queue entry disappeared: ${name}`);
  await publish(entry);
  entry.posted = true;
  entry.postedAt = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + "\n");
  fs.unlinkSync(DUE_MARKER);
  console.log(`Marked "${entry.title}" posted.`);
}

const mode = process.argv[2];
const run =
  mode === "generate" ? render(readSpec()) :
  mode === "post" ? publish(readSpec()) :
  mode === "due-generate" ? dueGenerate() :
  mode === "due-post" ? duePost() :
  Promise.reject(new Error("usage: node announce.js generate|post|due-generate|due-post"));
run.catch((err) => { console.error(err); process.exit(1); });
