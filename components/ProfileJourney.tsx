"use client";

import Link from "next/link";
import { ArrowRight, Award, Camera, ChevronRight, LifeBuoy, MessageCircleMore, ShoppingBasket, Sparkles } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { rupees } from "@/components/Inr";
import type { Order } from "@/lib/types";
import { useLang } from "@/components/LanguageProvider";
import { lx, type L8 } from "@/components/localText";

// The customer's repair journey on the profile page: a level that grows with every item
// saved from the bin, one-tap shortcuts, and their latest repairs with live status.

const T: Record<string, L8> = {
  lvl0: {"en": "New to Sudhaar", "hi": "Sudhaar में नए", "bn": "Sudhaar-এ নতুন", "mr": "Sudhaar मध्ये नवीन", "te": "Sudhaarకి కొత్త", "ta": "Sudhaar-க்கு புதியவர்", "or": "Sudhaarରେ ନୂଆ", "kn": "Sudhaarಗೆ ಹೊಸಬರು"},
  lvl1: {"en": "First Fix", "hi": "पहली मरम्मत", "bn": "প্রথম মেরামত", "mr": "पहिली दुरुस्ती", "te": "మొదటి రిపేర్", "ta": "முதல் பழுது நீக்கம்", "or": "ପ୍ରଥମ ମରାମତି", "kn": "ಮೊದಲ ರಿಪೇರಿ"},
  lvl2: {"en": "Repair Regular", "hi": "नियमित मरम्मतकर्ता", "bn": "নিয়মিত মেরামতকারী", "mr": "नियमित दुरुस्ती करणारे", "te": "రెగ్యులర్ రిపేర్", "ta": "வழக்கமான பழுதுநீக்குநர்", "or": "ନିୟମିତ ମରାମତିକାରୀ", "kn": "ನಿಯಮಿತ ರಿಪೇರಿಗಾರ"},
  lvl3: {"en": "Second-Life Hero", "hi": "सेकंड-लाइफ़ हीरो", "bn": "সেকেন্ড-লাইফ হিরো", "mr": "सेकंड-लाइफ हिरो", "te": "సెకండ్-లైఫ్ హీరో", "ta": "இரண்டாம் வாழ்வு நாயகர்", "or": "ସେକେଣ୍ଡ-ଲାଇଫ୍ ହିରୋ", "kn": "ಸೆಕೆಂಡ್-ಲೈಫ್ ಹೀರೋ"},
  lvl4: {"en": "Zero-Waste Champion", "hi": "ज़ीरो-वेस्ट चैंपियन", "bn": "জিরো-ওয়েস্ট চ্যাম্পিয়ন", "mr": "झिरो-वेस्ट चॅम्पियन", "te": "జీరో-వేస్ట్ ఛాంపియన్", "ta": "பூஜ்ஜிய கழிவு சாம்பியன்", "or": "ଜିରୋ-ୱେଷ୍ଟ ଚାମ୍ପିୟନ", "kn": "ಶೂನ್ಯ-ತ್ಯಾಜ್ಯ ಚಾಂಪಿಯನ್"},
  yourLevel: {"en": "Your repair level", "hi": "आपका मरम्मत लेवल", "bn": "আপনার মেরামত লেভেল", "mr": "तुमचा दुरुस्ती स्तर", "te": "మీ రిపేర్ స్థాయి", "ta": "உங்கள் பழுது நிலை", "or": "ଆପଣଙ୍କ ମରାମତି ସ୍ତର", "kn": "ನಿಮ್ಮ ರಿಪೇರಿ ಮಟ್ಟ"},
  toNext: {"en": "{n} more to reach {next}", "hi": "{next} तक पहुँचने के लिए {n} और", "bn": "{next}-এ পৌঁছাতে আর {n}টি", "mr": "{next} पर्यंत पोहोचण्यासाठी आणखी {n}", "te": "{next} చేరడానికి ఇంకా {n}", "ta": "{next} அடைய இன்னும் {n}", "or": "{next} ପାଇଁ ଆଉ {n}", "kn": "{next} ತಲುಪಲು ಇನ್ನೂ {n}"},
  top: {"en": "Top level reached. Thank you for repairing, not replacing!", "hi": "सबसे ऊँचा लेवल! बदलने की जगह मरम्मत के लिए धन्यवाद!", "bn": "সর্বোচ্চ লেভেল! বদলানোর বদলে মেরামতের জন্য ধন্যবাদ!", "mr": "सर्वोच्च स्तर! बदलण्याऐवजी दुरुस्तीसाठी धन्यवाद!", "te": "అత్యున్నత స్థాయి! మార్చకుండా రిపేర్ చేసినందుకు ధన్యవాదాలు!", "ta": "உச்ச நிலை! மாற்றாமல் பழுது பார்த்ததற்கு நன்றி!", "or": "ସର୍ବୋଚ୍ଚ ସ୍ତର! ବଦଳାଇବା ବଦଳରେ ମରାମତି ପାଇଁ ଧନ୍ୟବାଦ!", "kn": "ಅತ್ಯುನ್ನತ ಮಟ್ಟ! ಬದಲಿಸದೆ ರಿಪೇರಿ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ!"},
  bookings: {"en": "bookings", "hi": "बुकिंग", "bn": "বুকিং", "mr": "बुकिंग", "te": "బుకింగ్‌లు", "ta": "முன்பதிவுகள்", "or": "ବୁକିଂ", "kn": "ಬುಕಿಂಗ್‌ಗಳು"},
  inProgress: {"en": "in progress", "hi": "जारी", "bn": "চলছে", "mr": "सुरू", "te": "జరుగుతోంది", "ta": "நடைபெறுகிறது", "or": "ଚାଲିଛି", "kn": "ನಡೆಯುತ್ತಿದೆ"},
  openClaims: {"en": "open claims", "hi": "खुली शिकायतें", "bn": "খোলা অভিযোগ", "mr": "खुल्या तक्रारी", "te": "తెరిచిన ఫిర్యాదులు", "ta": "திறந்த கோரிக்கைகள்", "or": "ଖୋଲା ଅଭିଯୋଗ", "kn": "ತೆರೆದ ದೂರುಗಳು"},
  a1t: {"en": "Snap & Quote", "hi": "फ़ोटो से कीमत", "bn": "ছবি তুলে দাম", "mr": "फोटो काढा, किंमत मिळवा", "te": "ఫోటో తీయండి, ధర పొందండి", "ta": "படம் எடு, விலை பெறு", "or": "ଫଟୋ ନିଅ, ଦାମ ଜାଣ", "kn": "ಫೋಟೋ ತೆಗೆದು ಬೆಲೆ ಪಡೆಯಿರಿ"},
  a1s: {"en": "AI price in seconds", "hi": "सेकंडों में AI कीमत", "bn": "সেকেন্ডে AI দাম", "mr": "काही सेकंदात AI किंमत", "te": "సెకన్లలో AI ధర", "ta": "நொடிகளில் AI விலை", "or": "ସେକେଣ୍ଡରେ AI ଦାମ", "kn": "ಸೆಕೆಂಡುಗಳಲ್ಲಿ AI ಬೆಲೆ"},
  a2t: {"en": "Ghar Safai", "hi": "घर सफ़ाई", "bn": "ঘর সাফাই", "mr": "घर सफाई", "te": "ఘర్ సఫాయి", "ta": "கர் சஃபாய்", "or": "ଘର ସଫେଇ", "kn": "ಘರ್ ಸಫಾಯಿ"},
  a2s: {"en": "Many items, one pickup", "hi": "कई सामान, एक पिकअप", "bn": "অনেক জিনিস, একটি পিকআপ", "mr": "अनेक वस्तू, एक पिकअप", "te": "చాలా వస్తువులు, ఒకే పికప్", "ta": "பல பொருட்கள், ஒரே பிக்அப்", "or": "ଅନେକ ଜିନିଷ, ଗୋଟିଏ ପିକଅପ", "kn": "ಹಲವು ವಸ್ತುಗಳು, ಒಂದೇ ಪಿಕಪ್"},
  a3t: {"en": "Talk to Sudhaar", "hi": "Sudhaar से बात करें", "bn": "Sudhaar-এর সাথে কথা বলুন", "mr": "Sudhaar शी बोला", "te": "Sudhaarతో మాట్లాడండి", "ta": "Sudhaar-உடன் பேசுங்கள்", "or": "Sudhaar ସହ କଥା ହୁଅନ୍ତୁ", "kn": "Sudhaar ಜೊತೆ ಮಾತನಾಡಿ"},
  a3s: {"en": "Voice or chat agent", "hi": "आवाज़ या चैट एजेंट", "bn": "ভয়েস বা চ্যাট এজেন্ট", "mr": "आवाज किंवा चॅट एजंट", "te": "వాయిస్ లేదా చాట్ ఏజెంట్", "ta": "குரல் அல்லது அரட்டை முகவர்", "or": "ଭଏସ୍ କିମ୍ବା ଚାଟ୍ ଏଜେଣ୍ଟ", "kn": "ಧ್ವನಿ ಅಥವಾ ಚಾಟ್ ಏಜೆಂಟ್"},
  a4t: {"en": "Resolve Hub", "hi": "Resolve Hub", "bn": "Resolve Hub", "mr": "Resolve Hub", "te": "Resolve Hub", "ta": "Resolve Hub", "or": "Resolve Hub", "kn": "Resolve Hub"},
  a4s: {"en": "Warranty & claims", "hi": "वारंटी और शिकायतें", "bn": "ওয়ারেন্টি ও অভিযোগ", "mr": "वॉरंटी आणि तक्रारी", "te": "వారంటీ & ఫిర్యాదులు", "ta": "உத்தரவாதம் & கோரிக்கைகள்", "or": "ୱାରେଣ୍ଟି ଓ ଅଭିଯୋଗ", "kn": "ವಾರಂಟಿ & ದೂರುಗಳು"},
  recent: {"en": "Recent repairs", "hi": "हाल की मरम्मत", "bn": "সাম্প্রতিক মেরামত", "mr": "अलीकडील दुरुस्ती", "te": "ఇటీవలి రిపేర్లు", "ta": "சமீபத்திய பழுதுகள்", "or": "ସାମ୍ପ୍ରତିକ ମରାମତି", "kn": "ಇತ್ತೀಚಿನ ರಿಪೇರಿಗಳು"},
  seeAll: {"en": "See all", "hi": "सब देखें", "bn": "সব দেখুন", "mr": "सर्व पहा", "te": "అన్నీ చూడండి", "ta": "அனைத்தும் பார்", "or": "ସବୁ ଦେଖନ୍ତୁ", "kn": "ಎಲ್ಲಾ ನೋಡಿ"},
  nothing: {"en": "Nothing repaired yet", "hi": "अभी तक कुछ ठीक नहीं करवाया", "bn": "এখনো কিছু মেরামত হয়নি", "mr": "अजून काहीही दुरुस्त केले नाही", "te": "ఇంకా ఏమీ రిపేర్ చేయలేదు", "ta": "இன்னும் எதுவும் பழுது பார்க்கவில்லை", "or": "ଏପର୍ଯ୍ୟନ୍ତ କିଛି ମରାମତି ହୋଇନି", "kn": "ಇನ್ನೂ ಏನೂ ರಿಪೇರಿ ಮಾಡಿಲ್ಲ"},
  nothingSub: {"en": "Snap a photo of something broken. Gemini quotes it, and PayPal only holds the money until it's back home, fixed.", "hi": "किसी टूटी चीज़ की फ़ोटो लें। Gemini कीमत बताएगा, और PayPal पैसा तब तक सिर्फ़ होल्ड रखेगा जब तक चीज़ ठीक होकर घर न आ जाए।", "bn": "ভাঙা জিনিসের ছবি তুলুন। Gemini দাম বলবে, আর জিনিস ঠিক হয়ে বাড়ি না ফেরা পর্যন্ত PayPal টাকা শুধু হোল্ডে রাখবে।", "mr": "तुटलेल्या वस्तूचा फोटो काढा. Gemini किंमत सांगेल, आणि वस्तू दुरुस्त होऊन घरी येईपर्यंत PayPal पैसे फक्त होल्डवर ठेवेल.", "te": "పాడైన వస్తువు ఫోటో తీయండి. Gemini ధర చెబుతుంది, అది బాగై ఇంటికి వచ్చే వరకు PayPal డబ్బును హోల్డ్‌లో మాత్రమే ఉంచుతుంది.", "ta": "உடைந்த பொருளின் படம் எடுங்கள். Gemini விலை சொல்லும்; சரியாகி வீடு திரும்பும் வரை PayPal பணத்தை நிறுத்தி வைக்கும்.", "or": "ଭଙ୍ଗା ଜିନିଷର ଫଟୋ ନିଅନ୍ତୁ। Gemini ଦାମ କହିବ, ଏବଂ ଠିକ୍ ହୋଇ ଘରକୁ ନ ଫେରିବା ଯାଏଁ PayPal ଟଙ୍କା କେବଳ ହୋଲ୍ଡରେ ରଖିବ।", "kn": "ಮುರಿದ ವಸ್ತುವಿನ ಫೋಟೋ ತೆಗೆಯಿರಿ. Gemini ಬೆಲೆ ಹೇಳುತ್ತದೆ, ಸರಿಯಾಗಿ ಮನೆಗೆ ಬರುವವರೆಗೆ PayPal ಹಣವನ್ನು ಹೋಲ್ಡ್‌ನಲ್ಲಿ ಮಾತ್ರ ಇಡುತ್ತದೆ."},
  firstQuote: {"en": "Get my first AI quote", "hi": "मेरा पहला AI अनुमान पाएँ", "bn": "আমার প্রথম AI দাম নিন", "mr": "माझा पहिला AI अंदाज मिळवा", "te": "నా మొదటి AI ధర పొందండి", "ta": "என் முதல் AI விலையைப் பெறு", "or": "ମୋ ପ୍ରଥମ AI ଦାମ ପାଅ", "kn": "ನನ್ನ ಮೊದಲ AI ಬೆಲೆ ಪಡೆಯಿರಿ"},
  basket: {"en": "Ghar Safai · {n} items", "hi": "घर सफ़ाई · {n} सामान", "bn": "ঘর সাফাই · {n}টি জিনিস", "mr": "घर सफाई · {n} वस्तू", "te": "ఘర్ సఫాయి · {n} వస్తువులు", "ta": "கர் சஃபாய் · {n} பொருட்கள்", "or": "ଘର ସଫେଇ · {n} ଜିନିଷ", "kn": "ಘರ್ ಸಫಾಯಿ · {n} ವಸ್ತುಗಳು"},
};

const LEVELS = [
  { key: "lvl0", min: 0, color: "from-teal-500 to-cyan-700" },
  { key: "lvl1", min: 1, color: "from-amber-400 to-orange-500" },
  { key: "lvl2", min: 3, color: "from-emerald-400 to-teal-600" },
  { key: "lvl3", min: 6, color: "from-sky-500 to-indigo-600" },
  { key: "lvl4", min: 10, color: "from-fuchsia-500 to-rose-600" },
];

const ACTIONS = [
  { href: "/fix", icon: Camera, title: "a1t", sub: "a1s", tint: "bg-orange-50 text-orange-600 ring-orange-200" },
  { href: "/ghar-safai", icon: ShoppingBasket, title: "a2t", sub: "a2s", tint: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { href: "/agent", icon: MessageCircleMore, title: "a3t", sub: "a3s", tint: "bg-sky-50 text-sky-700 ring-sky-200" },
  { href: "/resolve", icon: LifeBuoy, title: "a4t", sub: "a4s", tint: "bg-violet-50 text-violet-700 ring-violet-200" },
];

export function ProfileJourney({ orders, itemsRepaired, openClaims }: { orders: Order[]; itemsRepaired: number; openClaims: number }) {
  const { lang } = useLang();
  const t = (k: string, v?: Record<string, string | number>) => lx(T[k], lang, v);
  const idx = LEVELS.reduce((acc, l, i) => (itemsRepaired >= l.min ? i : acc), 0);
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const pct = next ? Math.min(100, Math.round(((itemsRepaired - level.min) / (next.min - level.min)) * 100)) : 100;
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const active = orders.filter((o) => !["paid_out", "delivered", "cancelled"].includes(o.status)).length;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-br ${level.color} p-5 text-white`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Award className="size-4" /> {t("yourLevel")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{t(level.key)}</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/90">
            {next ? t("toNext", { n: next.min - itemsRepaired, next: t(next.key) }) : t("top")}
          </p>
        </div>
        <CardContent className="grid grid-cols-3 gap-2 pt-4 text-center">
          <div>
            <p className="font-display text-xl font-bold">{orders.length}</p>
            <p className="text-[11px] text-muted-foreground">{t("bookings")}</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{active}</p>
            <p className="text-[11px] text-muted-foreground">{t("inProgress")}</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{openClaims}</p>
            <p className="text-[11px] text-muted-foreground">{t("openClaims")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="group rounded-2xl bg-card p-3 ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`inline-flex size-9 items-center justify-center rounded-xl ring-1 ${a.tint}`}>
                <a.icon className="size-4.5" />
              </span>
              <p className="mt-2 text-sm font-semibold leading-tight">{t(a.title)}</p>
              <p className="text-[11px] text-muted-foreground">{t(a.sub)}</p>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{t("recent")}</h2>
              {orders.length > 0 && (
                <Link href="/repairs" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                  {t("seeAll")} <ChevronRight className="size-3.5" />
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                <Sparkles className="mx-auto size-6 text-gold" />
                <p className="mt-2 text-sm font-semibold">{t("nothing")}</p>
                <p className="text-xs text-muted-foreground">{t("nothingSub")}</p>
                <Link href="/fix" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  {t("firstQuote")} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{o.kind === "basket" ? t("basket", { n: o.jobs?.length ?? 0 }) : o.item}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {o.id} · {new Date(o.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {rupees(o.total)}
                        </p>
                      </div>
                      <StatusPill status={o.status} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
