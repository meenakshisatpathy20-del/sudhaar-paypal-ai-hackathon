import fs from "node:fs";
import path from "node:path";
import { currentAccount } from "@/lib/auth";
import { uploadsDir } from "@/lib/db";
import { loadUpload } from "@/lib/snapshot";

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = path.basename((await params).name);
  // Repair photos are private: signed-in accounts, or the anonymous visitor who uploaded this file.
  const mine = decodeURIComponent((req.headers.get("cookie") ?? "").match(/(?:^|;\s*)sudhaar_up=([^;]*)/)?.[1] ?? "").split(",");
  const seeded = !/^\d{10,}-[0-9a-f]+\./.test(name); // bundled demo images (synthetic) stay public
  if (!seeded && !currentAccount(req) && !mine.includes(name)) return new Response("Sign in to view this photo", { status: 401 });
  const full = path.join(uploadsDir(), name);
  if (!fs.existsSync(full)) {
    // After a restart the disk is empty: fetch the photo back from the saved copy (lib/snapshot.ts).
    const saved = /^[\w-]+\.(jpg|png|webp)$/.test(name) ? await loadUpload(name) : null;
    if (!saved) return new Response("Not found", { status: 404 });
    fs.writeFileSync(full, saved);
  }
  return new Response(fs.readFileSync(full), {
    headers: { "Content-Type": MIME[path.extname(name)] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
