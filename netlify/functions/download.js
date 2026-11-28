// Paid downloads, served only through a signed link.
//
// Until 27 Oct 2026 every paid PDF sat at a public, guessable address
// (froglogic.co.uk/digital/<File>.pdf) that Google was free to index, so
// anyone could take a £2 printable or a £395 Organisation Pack without paying.
// Now netlify.toml answers those addresses with a 404, and the only way to a
// paid file is a link the Stripe webhook writes after payment:
//
//   /api/download?f=<File.pdf>&e=<expiry, unix seconds>&s=<signature>
//
// The signature is an HMAC of the file name and expiry, keyed with the
// Stripe secret key that is already set on the site, so no new secret is
// needed. A link works for LINK_DAYS days. The free Pond Guides stay public.
//
// 28 Nov 2026: the paid files were still sitting in this PUBLIC repository (and
// in the published site folder, held back only by the 404 rules). They now live
// in a PRIVATE repository, PAID_FILES_REPO. When PAID_FILES_TOKEN is set (a
// read-only key for that one repository, kept in Netlify's settings, never in
// code or logs) each download is fetched from there at the moment the buyer
// uses their link. Until the token is set, the old bundled copy is used, so
// this file is safe to publish before the switch.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LINK_DAYS = 90;

function key() {
  const k = process.env.DOWNLOAD_KEY || process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("No signing key: STRIPE_SECRET_KEY is missing");
  return k;
}

function sign(file, expires) {
  return crypto.createHmac("sha256", key()).update(`${file}|${expires}`).digest("base64url");
}

// Used by stripe-webhook.js to write the links in the download email.
export function signedDownloadUrl(site, file, days = LINK_DAYS) {
  const expires = Math.floor(Date.now() / 1000) + days * 86400;
  const q = new URLSearchParams({ f: file, e: String(expires), s: sign(file, expires) });
  return `${site}/api/download?${q}`;
}

// netlify.toml bundles digital/** with this function; where it lands depends on
// the bundler, so look in the likely places.
function findFile(file) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), process.env.LAMBDA_TASK_ROOT, here, path.join(here, ".."), path.join(here, "..", "..")].filter(Boolean);
  for (const r of roots) {
    const p = path.join(r, "digital", file);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const PAID_REPO = process.env.PAID_FILES_REPO || "froglogic60/frog-logic-paid-files";

// Fetch one file from the private store. Returns an ArrayBuffer, or null if the
// file isn't there. Throws on anything else. The token is only ever sent to
// api.github.com and is never written to a log or a response.
async function fromPrivateStore(file) {
  const token = process.env.PAID_FILES_TOKEN;
  if (!token) return undefined; // not switched on yet
  const res = await fetch(`https://api.github.com/repos/${PAID_REPO}/contents/${encodeURIComponent(file)}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github.raw+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "frog-logic-download",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`private store answered ${res.status}`);
  return await res.arrayBuffer();
}

const page = (status, text) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Frog Logic download</title><body style="font-family:system-ui,sans-serif;max-width:34rem;margin:3rem auto;padding:0 1rem;line-height:1.5"><h1 style="font-size:1.3rem">${text}</h1><p>Write to <a href="mailto:hello@froglogic.co.uk">hello@froglogic.co.uk</a> with your order email and I'll send you a fresh link straight away.</p><p><a href="https://froglogic.co.uk/">Back to Frog Logic</a></p></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } },
  );

export default async (req) => {
  const u = new URL(req.url);
  // Health check (no file, no secrets): are the PDFs bundled and is a key set?
  if (u.searchParams.get("check") === "1") {
    let store = "off";
    if (process.env.PAID_FILES_TOKEN) {
      try {
        store = (await fromPrivateStore("When-Words-Go.pdf")) ? "ok" : "missing";
      } catch (e) {
        store = "error";
      }
    }
    return Response.json({ files: findFile("When-Words-Go.pdf") ? "ok" : "missing", store, key: !!(process.env.DOWNLOAD_KEY || process.env.STRIPE_SECRET_KEY) });
  }
  const file = u.searchParams.get("f") || "";
  const expires = Number(u.searchParams.get("e") || 0);
  const sig = u.searchParams.get("s") || "";

  if (!/^[A-Za-z0-9._-]+\.(pdf|xlsx)$/.test(file) || !expires || !sig) return page(400, "That download link isn't complete.");

  let good = false;
  try {
    const want = Buffer.from(sign(file, expires));
    const got = Buffer.from(sig);
    good = want.length === got.length && crypto.timingSafeEqual(want, got);
  } catch (e) {
    return page(500, "Downloads aren't set up properly right now.");
  }
  if (!good) return page(403, "That download link doesn't look right.");
  if (expires < Date.now() / 1000) return page(410, "That download link has expired.");

  let body;
  try {
    body = await fromPrivateStore(file);
  } catch (e) {
    console.error(`download: ${file}: ${e.message}`);
    return page(502, "That download isn't available right now.");
  }
  if (body === undefined) {
    // Private store not switched on: the bundled copy, as before.
    const p = findFile(file);
    body = p ? fs.readFileSync(p) : null;
  }
  if (!body) return page(404, "That file can't be found.");

  return new Response(body, {
    status: 200,
    headers: {
      // .xlsx added 8 Nov 2026 for the ADHD Money Kit spreadsheet.
      "content-type": file.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
      "content-disposition": `attachment; filename="${file}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
};

export const config = { path: "/api/download" };
