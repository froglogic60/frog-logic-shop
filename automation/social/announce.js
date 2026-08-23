// One-off announcement post (Facebook Page + Instagram), separate from the
// three scheduled daily posts so it can never clash with them.
//
// Content lives in announce.json: the card text plus the caption. The image is
// rendered here at run time in the house style — same renderer as daily.js —
// so nothing binary ever needs committing by hand.
//
//   node announce.js generate   -> writes queue/<name>.jpg
//   node announce.js post       -> publishes it (after the workflow has
//                                  committed the jpg, so Instagram can fetch it)
//
// Secrets: META_ACCESS_TOKEN, FB_PAGE_ID, IG_USER_ID.
const fs = require("fs");
const path = require("path");
const { makeRenderer } = require("./render2.js");

const GRAPH = "https://graph.facebook.com/v20.0";
const RAW_BASE = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/queue";
const QUEUE = path.join(__dirname, "queue");
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, "announce.json"), "utf8"));

async function generate() {
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

async function post() {
  const imageUrl = `${RAW_BASE}/${spec.name}.jpg`;
  const token = await getPageToken(process.env.META_ACCESS_TOKEN, process.env.FB_PAGE_ID);
  await waitForUrl(imageUrl);

  const fb = await fetch(`${GRAPH}/${process.env.FB_PAGE_ID}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, message: spec.caption, access_token: token }),
  }).then((r) => r.json());
  if (!fb.id) throw new Error(`Facebook post failed: ${JSON.stringify(fb)}`);
  console.log("Facebook post created:", fb.id);

  const create = await fetch(`${GRAPH}/${process.env.IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: spec.caption, access_token: token }),
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
(mode === "generate" ? generate() : mode === "post" ? post() : Promise.reject(new Error("usage: node announce.js generate|post")))
  .catch((err) => { console.error(err); process.exit(1); });
