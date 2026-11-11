import { aiEnabled } from "@/lib/config";
import { fail } from "@/lib/http";
import { gemini } from "@/lib/llm";
import { FlowError } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";

// Spoken replies in every Sudhaar language. Browsers only speak languages that have a voice
// installed (most desktops have no Tamil, Odia or Kannada voice), so the client falls back to
// Gemini text-to-speech here. Output is WAV, cached briefly in memory for repeated "Listen" taps.

const MODELS = ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts"];
const cache = new Map<string, Buffer>();

function wavFromPcm(pcm: Buffer, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export async function POST(req: Request) {
  try {
    rateLimit(req, "tts", 60);
    if (!aiEnabled()) throw new FlowError("Voice replies need the Gemini key", 503);
    const { text, lang } = (await req.json()) as { text?: string; lang?: string };
    const clean = String(text ?? "").replace(/[*_`#>]/g, "").trim().slice(0, 700);
    if (!clean) throw new FlowError("Nothing to read");
    const key = `${lang}:${clean}`;
    let wav = cache.get(key);
    if (!wav) {
      let lastErr: unknown;
      for (const model of MODELS) {
        try {
          const r = await gemini().models.generateContent({
            model,
            contents: `Read this aloud warmly and clearly, in its own language, as a helpful Indian customer-support voice:\n${clean}`,
            config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
          });
          const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
          if (!part?.data) throw new Error("No audio returned");
          const bytes = Buffer.from(part.data, "base64");
          const rate = Number(/rate=(\d+)/i.exec(part.mimeType ?? "")?.[1] ?? 24000);
          wav = /wav/i.test(part.mimeType ?? "") ? bytes : wavFromPcm(bytes, rate);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!wav) throw lastErr ?? new Error("Text-to-speech failed");
      if (cache.size > 100) cache.delete(cache.keys().next().value as string);
      cache.set(key, wav);
    }
    return new Response(new Uint8Array(wav), { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=600" } });
  } catch (e) {
    return fail(e);
  }
}
