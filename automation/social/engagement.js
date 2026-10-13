// Weekly engagement read-out for the Facebook page and Instagram account.
// Runs from .github/workflows/engagement.yml every Monday. Pulls the last
// 28 days of posts from both, counts likes / comments / shares (and reach,
// where Meta lets us see it), splits them into Bespoke Planner posts and
// everything else, and writes automation/social/engagement.json plus one
// line on the Desk. Nothing is posted; it only reads.
//
// Why: Sam asked (13 Oct 2026) for the planner to go out four times a week
// and then "maybe you can keep an eye on the engagement?" — this is the eye.
// It uses the same page token the poster uses, so nothing new to set up.
//
// Env (same GitHub secrets as daily-social.yml):
//   META_ACCESS_TOKEN, FB_PAGE_ID, IG_USER_ID
const fs = require("fs");
const path = require("path");

const GRAPH = "https://graph.facebook.com/v21.0";
const OUT = path.join(__dirname, "engagement.json");
const CALENDAR = path.join(__dirname, "..", "..", "content", "calendar.json");
const DAYS = 28;
const PLANNER = /bespoke planner/i;

async function gql(url) {
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(`${url.split("?")[0]} → ${j.error.message}`);
  return j;
}

async function pageToken(userToken, pageId) {
  const j = await gql(`${GRAPH}/${pageId}?fields=access_token&access_token=${userToken}`);
  return j.access_token;
}

// Follow Graph paging until the posts are older than the window.
async function paged(url, since) {
  const out = [];
  let next = url;
  while (next) {
    const j = await gql(next);
    for (const row of j.data || []) {
      const t = Date.parse(row.created_time || row.timestamp);
      if (t < since) return out;
      out.push(row);
    }
    next = j.paging && j.paging.next;
  }
  return out;
}

async function facebook(token, pageId, since) {
  const fields = "message,created_time,permalink_url,shares,likes.summary(true).limit(0),comments.summary(true).limit(0)";
  const rows = await paged(`${GRAPH}/${pageId}/posts?fields=${fields}&limit=50&access_token=${token}`, since);
  const posts = [];
  for (const r of rows) {
    const p = {
      platform: "facebook", id: r.id, when: r.created_time, url: r.permalink_url,
      text: (r.message || "").split("\n")[0].slice(0, 90),
      planner: PLANNER.test(r.message || ""),
      likes: r.likes?.summary?.total_count ?? 0,
      comments: r.comments?.summary?.total_count ?? 0,
      shares: r.shares?.count ?? 0,
    };
    // Reach needs read_insights; if the token can't see it, carry on without.
    try {
      const ins = await gql(`${GRAPH}/${r.id}/insights?metric=post_impressions_unique&access_token=${token}`);
      p.reach = ins.data?.[0]?.values?.[0]?.value ?? null;
    } catch { p.reach = null; }
    posts.push(p);
  }
  return posts;
}

async function instagram(token, igId, since) {
  const fields = "caption,timestamp,permalink,like_count,comments_count";
  const rows = await paged(`${GRAPH}/${igId}/media?fields=${fields}&limit=50&access_token=${token}`, since);
  const posts = [];
  for (const r of rows) {
    const p = {
      platform: "instagram", id: r.id, when: r.timestamp, url: r.permalink,
      text: (r.caption || "").split("\n")[0].slice(0, 90),
      planner: PLANNER.test(r.caption || ""),
      likes: r.like_count ?? 0,
      comments: r.comments_count ?? 0,
      shares: 0,
    };
    try {
      const ins = await gql(`${GRAPH}/${r.id}/insights?metric=reach,saved&access_token=${token}`);
      for (const m of ins.data || []) p[m.name] = m.values?.[0]?.value ?? null;
    } catch { p.reach = null; }
    posts.push(p);
  }
  return posts;
}

function summarise(posts) {
  const groups = { planner: posts.filter((p) => p.planner), other: posts.filter((p) => !p.planner) };
  const avg = (arr, k) => arr.length ? +(arr.reduce((s, p) => s + (p[k] || 0), 0) / arr.length).toFixed(2) : 0;
  const out = {};
  for (const [name, arr] of Object.entries(groups)) {
    const withReach = arr.filter((p) => p.reach != null);
    out[name] = {
      posts: arr.length,
      likesPerPost: avg(arr, "likes"),
      commentsPerPost: avg(arr, "comments"),
      sharesPerPost: avg(arr, "shares"),
      reachPerPost: withReach.length ? Math.round(withReach.reduce((s, p) => s + p.reach, 0) / withReach.length) : null,
      interactionsPerPost: avg(arr.map((p) => ({ x: (p.likes || 0) + (p.comments || 0) + (p.shares || 0) + (p.saved || 0) })), "x"),
    };
  }
  return out;
}

(async () => {
  for (const k of ["META_ACCESS_TOKEN", "FB_PAGE_ID", "IG_USER_ID"]) {
    if (!process.env[k]) { console.error("Missing env: " + k); process.exit(1); }
  }
  const since = Date.now() - DAYS * 86400000;
  const token = await pageToken(process.env.META_ACCESS_TOKEN, process.env.FB_PAGE_ID);
  const fb = await facebook(token, process.env.FB_PAGE_ID, since);
  const ig = await instagram(token, process.env.IG_USER_ID, since);
  const posts = [...fb, ...ig].sort((a, b) => Date.parse(b.when) - Date.parse(a.when));

  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { history: [] };
  const report = {
    note: "Last 28 days of Facebook + Instagram posts, split into Bespoke Planner posts and everything else. Written every Monday by engagement.yml; read it before deciding whether four planner posts a week is too many.",
    updated: new Date().toISOString().slice(0, 10),
    windowDays: DAYS,
    summary: { all: summarise(posts), facebook: summarise(fb), instagram: summarise(ig) },
    posts,
    history: [...(prev.history || []).filter((h) => h.date !== new Date().toISOString().slice(0, 10)).slice(-25),
      { date: new Date().toISOString().slice(0, 10), ...summarise(posts) }],
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");

  // One line on the Desk so Sam sees it without opening anything.
  const s = report.summary.all;
  const line = `Engagement (last ${DAYS} days): planner posts ${s.planner.posts} × ${s.planner.interactionsPerPost} interactions each` +
    (s.planner.reachPerPost != null ? ` (reach ${s.planner.reachPerPost})` : "") +
    ` · other posts ${s.other.posts} × ${s.other.interactionsPerPost}` +
    (s.other.reachPerPost != null ? ` (reach ${s.other.reachPerPost})` : "");
  try {
    const cal = JSON.parse(fs.readFileSync(CALENDAR, "utf8"));
    const date = new Date().toISOString().slice(0, 10);
    let day = cal.days.find((d) => d.date === date);
    if (!day) { day = { date, items: [] }; cal.days.push(day); cal.days.sort((a, b) => a.date.localeCompare(b.date)); }
    day.items = day.items.filter((i) => !/^Engagement \(/.test(i.what));
    day.items.push({ what: line, who: "robot" });
    cal.updated = date;
    fs.writeFileSync(CALENDAR, JSON.stringify(cal, null, 2) + "\n");
  } catch (e) { console.warn("Desk not updated:", e.message); }

  console.log(line);
  console.log(`facebook ${fb.length} posts, instagram ${ig.length} posts; reach ${posts.some((p) => p.reach != null) ? "available" : "not available with this token"}`);
})().catch((e) => { console.error(e); process.exit(1); });
