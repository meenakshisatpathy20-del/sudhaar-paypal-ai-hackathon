import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { uploadsDir } from "@/lib/db";
import { currentAccount } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { FlowError } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";
import { saveUpload } from "@/lib/snapshot";

const TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    rateLimit(req, "upload", 60);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new FlowError("No file uploaded");
    const ext = TYPES[file.type];
    if (!ext) throw new FlowError("Only JPEG, PNG or WebP images are accepted");
    if (file.size > MAX_BYTES) throw new FlowError("Image is larger than 4 MB");
    // Opaque, unguessable id (128 bits) so a photo URL cannot be enumerated.
    const name = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    // Check the real file signature, not just the browser-supplied MIME type.
    const magic: Record<string, (b: Buffer) => boolean> = {
      ".jpg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
      ".png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      ".webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
    };
    if (bytes.length < 12 || !magic[ext](bytes)) throw new FlowError("That file is not a valid image");
    fs.writeFileSync(path.join(uploadsDir(), name), bytes);
    await saveUpload(name, bytes);
    const res = ok({ file: name, url: `/api/uploads/${name}` });
    // A visitor without an account (Snap & Quote before sign-in) may view only the photos they uploaded.
    if (!currentAccount(req)) {
      const prev = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)sudhaar_up=([^;]*)/)?.[1] ?? "";
      const list = [...decodeURIComponent(prev).split(",").filter(Boolean), name].slice(-12).join(",");
      res.headers.append("Set-Cookie", `sudhaar_up=${encodeURIComponent(list)}; Path=/api/uploads; HttpOnly; SameSite=Lax; Max-Age=86400`);
    }
    return res;
  } catch (e) {
    return fail(e);
  }
}
