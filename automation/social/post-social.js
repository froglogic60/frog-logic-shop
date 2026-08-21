// Posts the monthly Frog Logic update to a Facebook Page and a linked
// Instagram professional account, via the Meta Graph API.
//
// Requires (as env vars / GitHub secrets):
//   META_ACCESS_TOKEN  - a long-lived USER access token (from the Access Token
//                        Debugger's "Extend Access Token" button). The script
//                        exchanges it for a Page token itself on every run.
//   FB_PAGE_ID         - your Facebook Page's numeric ID
//   IG_USER_ID         - your Instagram professional account's numeric ID
//
// Content is read from content/social-post.json, one folder up from this script.
// Edit that file each month before the scheduled run (or run manually via
// the "Run workflow" button in GitHub Actions).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRAPH = "https://graph.facebook.com/v20.0";

async function loadContent() {
  const raw = await readFile(
    path.join(__dirname, "..", "..", "content", "social-post.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

async function getPageToken(userToken, pageId) {
  // Posting to a Page's feed needs a Page token, not a user token. Rather
  // than storing one (fiddly to extract by hand), exchange the long-lived
  // user token for the Page token fresh on every run.
  const res = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${userToken}`);
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`Could not get Page token: ${JSON.stringify(body.error || body)}`);
  }
  return body.access_token;
}

async function postToFacebook(token, pageId, message) {
  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Facebook post failed: ${JSON.stringify(body)}`);
  console.log("Facebook post created:", body.id);
}

async function postToInstagram(token, igUserId, caption, imageUrl) {
  // Step 1: create a media container
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) throw new Error(`IG media container failed: ${JSON.stringify(createBody)}`);

  // Step 2: wait for Instagram to finish processing the image — publishing
  // immediately fails with "Media ID is not available" (code 9007).
  for (let i = 0; i < 20; i++) {
    const st = await fetch(
      `${GRAPH}/${createBody.id}?fields=status_code&access_token=${token}`
    ).then((r) => r.json());
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") {
      throw new Error(`IG media processing failed: ${JSON.stringify(st)}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Step 3: publish it
  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createBody.id, access_token: token }),
  });
  const publishBody = await publishRes.json();
  if (!publishRes.ok) throw new Error(`IG publish failed: ${JSON.stringify(publishBody)}`);
  console.log("Instagram post created:", publishBody.id);
}

async function main() {
  const required = ["META_ACCESS_TOKEN", "FB_PAGE_ID", "IG_USER_ID"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const { caption, image_url } = await loadContent();
  const token = await getPageToken(process.env.META_ACCESS_TOKEN, process.env.FB_PAGE_ID);

  await postToFacebook(token, process.env.FB_PAGE_ID, caption);
  await postToInstagram(token, process.env.IG_USER_ID, caption, image_url);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
