"use client";

// Browser speech helpers (Web Speech API): speech-to-text for input, text-to-speech for replies.
// Works in Chrome/Edge (desktop + Android). Falls back gracefully where unsupported.
// Each app language uses its Indian locale (hi-IN, bn-IN, ta-IN …); voices depend on the device.

import { type Lang, langMeta } from "@/lib/i18n";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export function speechSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startListening(lang: Lang, onText: (text: string, final: boolean) => void, onEnd: () => void, onError: (msg: string) => void) {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    onError("Voice input is not supported in this browser. Try Chrome.");
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = langMeta(lang).locale;
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    let text = "";
    let final = false;
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
      final = e.results[i].isFinal;
    }
    onText(text, final);
  };
  rec.onend = onEnd;
  rec.onerror = (e) => onError(e.error === "not-allowed" ? "Microphone permission was denied." : `Voice error: ${e.error}`);
  rec.start();
  return () => rec.stop();
}

let audio: HTMLAudioElement | null = null;
let speakSeq = 0;

function browserVoice(locale: string) {
  const voices = window.speechSynthesis.getVoices();
  const two = locale.slice(0, 2);
  return voices.find((v) => v.lang.replace("_", "-") === locale) ?? voices.find((v) => v.lang.startsWith(two) && v.lang.includes("IN")) ?? voices.find((v) => v.lang.startsWith(two));
}

/**
 * Read a reply aloud in the chosen language. Uses an installed browser voice when the device has
 * one for that language (instant); otherwise asks the server for Gemini text-to-speech, so Tamil,
 * Odia, Kannada and the rest are spoken even on desktops with only English voices.
 */
export async function speak(text: string, lang: Lang) {
  if (typeof window === "undefined") return;
  stopSpeaking();
  const seq = ++speakSeq;
  const locale = langMeta(lang).locale;
  const clean = text.replace(/[*_`#>]/g, "").replace(/\$(\d)/g, "$1 dollars ");
  const voice = "speechSynthesis" in window ? browserVoice(locale) : undefined;
  if (voice) {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = locale;
    u.voice = voice;
    window.speechSynthesis.speak(u);
    return;
  }
  try {
    const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: clean, lang }) });
    if (!res.ok || seq !== speakSeq) return;
    const url = URL.createObjectURL(await res.blob());
    if (seq !== speakSeq) return;
    audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch {
    // Last resort: let the browser try with its default voice.
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = locale;
      window.speechSynthesis.speak(u);
    }
  }
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  speakSeq++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio = null;
  }
}
