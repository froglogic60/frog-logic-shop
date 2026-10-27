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

const page = (status, text) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Frog Logic download</title><body style="font-family:system-ui,sans-serif;max-width:34rem;margin:3rem auto;padding:0 1rem;line-height:1.5"><h1 style="font-size:1.3rem">${text}</h1><p>Write to <a href="mailto:hello@froglogic.co.uk">hello@froglogic.co.uk</a> with your order email and I'll send you a fresh link straight away.</p><p><a href="https://froglogic.co.uk/">Back to Frog Logic</a></p></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } },
  );

export default async (req) => {
  const u = new URL(req.url);
  const file = u.searchParams.get("f") || "";
  const expires = Number(u.searchParams.get("e") || 0);
  const sig = u.searchParams.get("s") || "";

  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(file) || !expires || !sig) return page(400, "That download link isn't complete.");

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

  const p = findFile(file);
  if (!p) return page(404, "That file can't be found.");

  return new Response(fs.readFileSync(p), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${file}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
};

export const config = { path: "/api/download" };
