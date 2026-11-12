"use client";

import { BadgeCheck, CircleDashed, Clock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Order, OrderStatus, Quote } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { money } from "@/components/api";
import { useLang } from "@/components/LanguageProvider";
import { lx, type L8 } from "@/components/localText";
import { cn } from "@/lib/utils";

/**
 * Repair Trust Receipt: one proof trail from AI quote to partner payout.
 * Every step is green ONLY when the order holds the evidence for it (a PayPal id, a verified OTP
 * event, a real or human photo review). Nothing is marked done on status alone: no false greens.
 */
type State = "done" | "pending" | "warn" | "todo";
interface Step {
  label: string;
  state: State;
  detail: string;
  ref?: string;
  source?: string;
}

const T: Record<string, L8> = {
  title: { en: "Repair Trust Receipt", hi: "रिपेयर ट्रस्ट रसीद", bn: "রিপেয়ার ট্রাস্ট রসিদ", mr: "रिपेअर ट्रस्ट पावती", te: "రిపేర్ ట్రస్ట్ రసీదు", ta: "பழுது நம்பிக்கை ரசீது", or: "ରିପେୟାର ଟ୍ରଷ୍ଟ ରସିଦ", kn: "ರಿಪೇರಿ ಟ್ರಸ್ಟ್ ರಸೀದಿ" },
  proven: { en: "{d}/{n} proven", hi: "{d}/{n} प्रमाणित", bn: "{d}/{n} প্রমাণিত", mr: "{d}/{n} सिद्ध", te: "{d}/{n} నిరూపితం", ta: "{d}/{n} நிரூபிக்கப்பட்டது", or: "{d}/{n} ପ୍ରମାଣିତ", kn: "{d}/{n} ಸಾಬೀತು" },
  footer: {
    en: "A step turns green only when its evidence exists. PayPal references can be checked in the sandbox dashboard. Sandbox = test money; amounts are USD.",
    hi: "हर कदम तभी हरा होता है जब उसका सबूत मौजूद हो। PayPal रेफ़रेंस sandbox डैशबोर्ड में जाँचे जा सकते हैं। Sandbox = टेस्ट पैसा; रकम USD में है।",
    bn: "প্রমাণ থাকলে তবেই একটি ধাপ সবুজ হয়। PayPal রেফারেন্স sandbox ড্যাশবোর্ডে যাচাই করা যায়। Sandbox = টেস্ট টাকা; অঙ্ক USD-তে।",
    mr: "पुरावा असेल तरच टप्पा हिरवा होतो. PayPal संदर्भ sandbox डॅशबोर्डमध्ये तपासता येतात. Sandbox = चाचणी पैसे; रक्कम USD मध्ये.",
    te: "సాక్ష్యం ఉన్నప్పుడే దశ ఆకుపచ్చగా మారుతుంది. PayPal రిఫరెన్సులను sandbox డాష్‌బోర్డ్‌లో చూడవచ్చు. Sandbox = టెస్ట్ డబ్బు; మొత్తాలు USDలో.",
    ta: "சான்று இருந்தால் மட்டுமே ஒரு படி பச்சையாகும். PayPal குறிப்புகளை sandbox டாஷ்போர்டில் சரிபார்க்கலாம். Sandbox = சோதனைப் பணம்; தொகைகள் USD-யில்.",
    or: "ପ୍ରମାଣ ଥିଲେ ହିଁ ପଦକ୍ଷେପ ସବୁଜ ହୁଏ। PayPal ରେଫରେନ୍ସ sandbox ଡ୍ୟାସବୋର୍ଡରେ ଯାଞ୍ଚ କରିହେବ। Sandbox = ଟେଷ୍ଟ ଟଙ୍କା; ପରିମାଣ USDରେ।",
    kn: "ಸಾಕ್ಷ್ಯ ಇದ್ದಾಗ ಮಾತ್ರ ಹಂತ ಹಸಿರಾಗುತ್ತದೆ. PayPal ಉಲ್ಲೇಖಗಳನ್ನು sandbox ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಬಹುದು. Sandbox = ಪರೀಕ್ಷಾ ಹಣ; ಮೊತ್ತಗಳು USDಯಲ್ಲಿ.",
  },
  estimate: { en: "AI repair estimate", hi: "AI मरम्मत अनुमान", bn: "AI মেরামতের অনুমান", mr: "AI दुरुस्ती अंदाज", te: "AI రిపేర్ అంచనా", ta: "AI பழுது மதிப்பீடு", or: "AI ମରାମତି ଆକଳନ", kn: "AI ರಿಪೇರಿ ಅಂದಾಜು" },
  estimateDetail: { en: "{r} estimate; final price set by the karigar", hi: "{r} अनुमान; अंतिम कीमत कारीगर तय करेंगे", bn: "{r} অনুমান; চূড়ান্ত দাম কারিগর ঠিক করবেন", mr: "{r} अंदाज; अंतिम किंमत कारागीर ठरवतील", te: "{r} అంచనా; తుది ధర కారీగర్ నిర్ణయిస్తారు", ta: "{r} மதிப்பீடு; இறுதி விலையை கைவினைஞர் முடிவு செய்வார்", or: "{r} ଆକଳନ; ଶେଷ ଦାମ କାରିଗର ସ୍ଥିର କରିବେ", kn: "{r} ಅಂದಾಜು; ಅಂತಿಮ ಬೆಲೆಯನ್ನು ಕಾರಿಗರ್ ನಿರ್ಧರಿಸುತ್ತಾರೆ" },
  estimateRecorded: { en: "Estimate recorded with the booking", hi: "अनुमान बुकिंग के साथ दर्ज", bn: "বুকিংয়ের সাথে অনুমান সংরক্ষিত", mr: "बुकिंगसोबत अंदाज नोंदवला", te: "బుకింగ్‌తో అంచనా నమోదైంది", ta: "முன்பதிவுடன் மதிப்பீடு பதிவு", or: "ବୁକିଂ ସହ ଆକଳନ ରେକର୍ଡ", kn: "ಬುಕಿಂಗ್ ಜೊತೆ ಅಂದಾಜು ದಾಖಲಾಗಿದೆ" },
  hold: { en: "Customer approved payment hold", hi: "ग्राहक ने भुगतान होल्ड मंज़ूर किया", bn: "গ্রাহক পেমেন্ট হোল্ড অনুমোদন করেছেন", mr: "ग्राहकाने पेमेंट होल्ड मंजूर केले", te: "కస్టమర్ పేమెంట్ హోల్డ్‌ను ఆమోదించారు", ta: "வாடிக்கையாளர் கட்டண நிறுத்தத்தை ஒப்புதல் அளித்தார்", or: "ଗ୍ରାହକ ପେମେଣ୍ଟ ହୋଲ୍ଡ ଅନୁମୋଦନ କଲେ", kn: "ಗ್ರಾಹಕರು ಪಾವತಿ ಹೋಲ್ಡ್ ಅನುಮೋದಿಸಿದರು" },
  holdDetail: { en: "{a} authorized (intent AUTHORIZE, not captured)", hi: "{a} अधिकृत (होल्ड, अभी काटा नहीं गया)", bn: "{a} অনুমোদিত (হোল্ড, এখনো কাটা হয়নি)", mr: "{a} अधिकृत (होल्ड, अजून कापले नाही)", te: "{a} అధికారం పొందింది (హోల్డ్, ఇంకా తీసుకోలేదు)", ta: "{a} அங்கீகரிக்கப்பட்டது (நிறுத்தம், இன்னும் எடுக்கவில்லை)", or: "{a} ଅନୁମୋଦିତ (ହୋଲ୍ଡ, ଏପର୍ଯ୍ୟନ୍ତ କଟାଯାଇନି)", kn: "{a} ಅಧಿಕೃತ (ಹೋಲ್ಡ್, ಇನ್ನೂ ಕಡಿತವಾಗಿಲ್ಲ)" },
  waitingPP: { en: "Waiting for PayPal approval", hi: "PayPal मंज़ूरी का इंतज़ार", bn: "PayPal অনুমোদনের অপেক্ষা", mr: "PayPal मंजुरीची प्रतीक्षा", te: "PayPal ఆమోదం కోసం వేచి ఉంది", ta: "PayPal ஒப்புதலுக்காக காத்திருக்கிறது", or: "PayPal ଅନୁମୋଦନ ପାଇଁ ଅପେକ୍ଷା", kn: "PayPal ಅನುಮೋದನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ" },
  pickup: { en: "Pickup verified by OTP", hi: "पिकअप OTP से सत्यापित", bn: "পিকআপ OTP দিয়ে যাচাই", mr: "पिकअप OTP ने पडताळले", te: "పికప్ OTPతో ధృవీకరించబడింది", ta: "பிக்அப் OTP மூலம் சரிபார்க்கப்பட்டது", or: "ପିକଅପ OTP ଦ୍ୱାରା ଯାଞ୍ଚ", kn: "ಪಿಕಪ್ OTP ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" },
  arrival: { en: "Arrival verified by OTP", hi: "आगमन OTP से सत्यापित", bn: "আগমন OTP দিয়ে যাচাই", mr: "आगमन OTP ने पडताळले", te: "రాక OTPతో ధృవీకరించబడింది", ta: "வருகை OTP மூலம் சரிபார்க்கப்பட்டது", or: "ଆଗମନ OTP ଦ୍ୱାରା ଯାଞ୍ଚ", kn: "ಆಗಮನ OTP ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" },
  otpDetail: { en: "Customer-held code checked on the server; partners never see it", hi: "ग्राहक का कोड सर्वर पर जाँचा गया; पार्टनर इसे कभी नहीं देखते", bn: "গ্রাহকের কোড সার্ভারে যাচাই; পার্টনাররা কখনো দেখেন না", mr: "ग्राहकाचा कोड सर्व्हरवर तपासला; पार्टनर्स तो कधीच पाहत नाहीत", te: "కస్టమర్ కోడ్ సర్వర్‌లో తనిఖీ; భాగస్వాములు ఎప్పుడూ చూడరు", ta: "வாடிக்கையாளர் குறியீடு சர்வரில் சரிபார்க்கப்பட்டது; பங்குதாரர்கள் பார்க்க முடியாது", or: "ଗ୍ରାହକଙ୍କ କୋଡ ସର୍ଭରରେ ଯାଞ୍ଚ; ପାର୍ଟନର କେବେ ଦେଖନ୍ତି ନାହିଁ", kn: "ಗ್ರಾಹಕರ ಕೋಡ್ ಸರ್ವರ್‌ನಲ್ಲಿ ಪರಿಶೀಲನೆ; ಪಾಲುದಾರರು ಎಂದಿಗೂ ನೋಡುವುದಿಲ್ಲ" },
  review: { en: "Repair evidence reviewed", hi: "मरम्मत का सबूत जाँचा गया", bn: "মেরামতের প্রমাণ যাচাই", mr: "दुरुस्तीचा पुरावा तपासला", te: "రిపేర్ సాక్ష్యం సమీక్షించబడింది", ta: "பழுது சான்று சரிபார்க்கப்பட்டது", or: "ମରାମତି ପ୍ରମାଣ ଯାଞ୍ଚ", kn: "ರಿಪೇರಿ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" },
  reviewPending: { en: "Before/after photos compared when the karigar finishes", hi: "कारीगर का काम पूरा होने पर पहले/बाद की फ़ोटो की तुलना", bn: "কারিগর শেষ করলে আগে/পরের ছবি মেলানো হবে", mr: "कारागीराचे काम झाल्यावर आधी/नंतरचे फोटो तुलना", te: "కారీగర్ పూర్తి చేశాక ముందు/తర్వాత ఫోటోల పోలిక", ta: "கைவினைஞர் முடித்ததும் முன்/பின் புகைப்பட ஒப்பீடு", or: "କାରିଗର ଶେଷ କଲେ ପୂର୍ବ/ପରର ଫଟୋ ତୁଳନା", kn: "ಕಾರಿಗರ್ ಮುಗಿಸಿದಾಗ ಮೊದಲು/ನಂತರದ ಫೋಟೋ ಹೋಲಿಕೆ" },
  delivery: { en: "Delivery confirmed by OTP", hi: "डिलीवरी OTP से पुष्ट", bn: "ডেলিভারি OTP দিয়ে নিশ্চিত", mr: "डिलिव्हरी OTP ने निश्चित", te: "డెలివరీ OTPతో నిర్ధారించబడింది", ta: "டெலிவரி OTP மூலம் உறுதிசெய்யப்பட்டது", or: "ଡେଲିଭରି OTP ଦ୍ୱାରା ନିଶ୍ଚିତ", kn: "ಡೆಲಿವರಿ OTP ಮೂಲಕ ದೃಢೀಕರಿಸಲಾಗಿದೆ" },
  deliveryDetail: { en: "Payment is only captured after this code", hi: "इस कोड के बाद ही भुगतान लिया जाता है", bn: "এই কোডের পরেই পেমেন্ট নেওয়া হয়", mr: "या कोडनंतरच पेमेंट घेतले जाते", te: "ఈ కోడ్ తర్వాతే చెల్లింపు తీసుకుంటారు", ta: "இந்தக் குறியீட்டுக்குப் பிறகே பணம் எடுக்கப்படும்", or: "ଏହି କୋଡ ପରେ ହିଁ ପେମେଣ୍ଟ ନିଆଯାଏ", kn: "ಈ ಕೋಡ್ ನಂತರವೇ ಪಾವತಿ ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತದೆ" },
  captured: { en: "Payment captured", hi: "भुगतान लिया गया", bn: "পেমেন্ট নেওয়া হয়েছে", mr: "पेमेंट घेतले", te: "చెల్లింపు తీసుకోబడింది", ta: "பணம் எடுக்கப்பட்டது", or: "ପେମେଣ୍ଟ ନିଆଗଲା", kn: "ಪಾವತಿ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ" },
  capturedDetail: { en: "{a} captured", hi: "{a} लिया गया", bn: "{a} নেওয়া হয়েছে", mr: "{a} घेतले", te: "{a} తీసుకోబడింది", ta: "{a} எடுக்கப்பட்டது", or: "{a} ନିଆଗଲା", kn: "{a} ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ" },
  refundedPart: { en: ", {a} refunded", hi: ", {a} वापस किया गया", bn: ", {a} ফেরত", mr: ", {a} परत केले", te: ", {a} తిరిగి ఇచ్చారు", ta: ", {a} திருப்பித் தரப்பட்டது", or: ", {a} ଫେରସ୍ତ", kn: ", {a} ಮರುಪಾವತಿ" },
  notCaptured: { en: "Not captured yet: money is still only held", hi: "अभी नहीं लिया गया: पैसा सिर्फ़ होल्ड पर है", bn: "এখনো নেওয়া হয়নি: টাকা শুধু হোল্ডে আছে", mr: "अजून घेतले नाही: पैसे फक्त होल्डवर", te: "ఇంకా తీసుకోలేదు: డబ్బు హోల్డ్‌లో మాత్రమే ఉంది", ta: "இன்னும் எடுக்கவில்லை: பணம் நிறுத்தத்தில் மட்டும் உள்ளது", or: "ଏପର୍ଯ୍ୟନ୍ତ ନିଆଯାଇନି: ଟଙ୍କା କେବଳ ହୋଲ୍ଡରେ", kn: "ಇನ್ನೂ ತೆಗೆದುಕೊಂಡಿಲ್ಲ: ಹಣ ಹೋಲ್ಡ್‌ನಲ್ಲಿ ಮಾತ್ರ" },
  payouts: { en: "Partner payouts", hi: "पार्टनर भुगतान", bn: "পার্টনার পেআউট", mr: "पार्टनर पेआउट", te: "భాగస్వామి చెల్లింపులు", ta: "பங்குதாரர் கொடுப்பனவுகள்", or: "ପାର୍ଟନର ପେଆଉଟ", kn: "ಪಾಲುದಾರ ಪಾವತಿಗಳು" },
  payoutsPending: { en: "Sent only after a confirmed capture", hi: "पक्के भुगतान के बाद ही भेजा जाता है", bn: "নিশ্চিত পেমেন্টের পরেই পাঠানো হয়", mr: "निश्चित पेमेंटनंतरच पाठवले जाते", te: "నిర్ధారిత చెల్లింపు తర్వాతే పంపబడుతుంది", ta: "உறுதியான பணம் எடுத்த பிறகே அனுப்பப்படும்", or: "ନିଶ୍ଚିତ ପେମେଣ୍ଟ ପରେ ହିଁ ପଠାଯାଏ", kn: "ದೃಢೀಕೃತ ಪಾವತಿಯ ನಂತರವೇ ಕಳುಹಿಸಲಾಗುತ್ತದೆ" },
  karigar: { en: "Karigar", hi: "कारीगर", bn: "কারিগর", mr: "कारागीर", te: "కారీగర్", ta: "கைவினைஞர்", or: "କାରିଗର", kn: "ಕಾರಿಗರ್" },
  saathi: { en: "Saathi", hi: "साथी", bn: "সাথী", mr: "साथी", te: "సాథీ", ta: "சாத்தி", or: "ସାଥୀ", kn: "ಸಾಥಿ" },
  realGemini: { en: "Real Gemini", hi: "असली Gemini", bn: "আসল Gemini", mr: "खरे Gemini", te: "నిజమైన Gemini", ta: "உண்மையான Gemini", or: "ପ୍ରକୃତ Gemini", kn: "ನಿಜವಾದ Gemini" },
  estimateTable: { en: "Estimate table", hi: "अनुमान तालिका", bn: "অনুমান টেবিল", mr: "अंदाज तक्ता", te: "అంచనా పట్టిక", ta: "மதிப்பீட்டு அட்டவணை", or: "ଆକଳନ ଟେବୁଲ", kn: "ಅಂದಾಜು ಕೋಷ್ಟಕ" },
  human: { en: "Human reviewer", hi: "टीम द्वारा जाँच", bn: "টিমের যাচাই", mr: "टीमकडून तपासणी", te: "బృందం సమీక్ష", ta: "குழு சரிபார்ப்பு", or: "ଟିମ୍ ଯାଞ୍ଚ", kn: "ತಂಡದ ಪರಿಶೀಲನೆ" },
  aiUnavailable: { en: "AI unavailable", hi: "AI उपलब्ध नहीं", bn: "AI পাওয়া যায়নি", mr: "AI उपलब्ध नाही", te: "AI అందుబాటులో లేదు", ta: "AI கிடைக்கவில்லை", or: "AI ଉପଲବ୍ଧ ନାହିଁ", kn: "AI ಲಭ್ಯವಿಲ್ಲ" },
  ppSandbox: { en: "PayPal sandbox", hi: "PayPal sandbox", bn: "PayPal sandbox", mr: "PayPal sandbox", te: "PayPal sandbox", ta: "PayPal sandbox", or: "PayPal sandbox", kn: "PayPal sandbox" },
  simulated: { en: "Simulated (no PayPal keys)", hi: "सिम्युलेटेड (PayPal कुंजी नहीं)", bn: "সিমুলেটেড (PayPal কী নেই)", mr: "सिम्युलेटेड (PayPal की नाही)", te: "సిమ్యులేటెడ్ (PayPal కీలు లేవు)", ta: "உருவகப்படுத்தப்பட்டது (PayPal விசைகள் இல்லை)", or: "ସିମୁଲେଟେଡ (PayPal କି ନାହିଁ)", kn: "ಸಿಮ್ಯುಲೇಟೆಡ್ (PayPal ಕೀಗಳಿಲ್ಲ)" },
  ppConfirmed: { en: "PayPal confirmed", hi: "PayPal ने पुष्टि की", bn: "PayPal নিশ্চিত করেছে", mr: "PayPal ने पुष्टी केली", te: "PayPal నిర్ధారించింది", ta: "PayPal உறுதிசெய்தது", or: "PayPal ନିଶ୍ଚିତ କଲା", kn: "PayPal ದೃಢೀಕರಿಸಿದೆ" },
  batchSubmitted: { en: "Batch submitted, not yet confirmed received", hi: "बैच भेजा गया, मिलने की पुष्टि बाकी", bn: "ব্যাচ পাঠানো হয়েছে, প্রাপ্তি নিশ্চিত হয়নি", mr: "बॅच पाठवली, मिळाल्याची पुष्टी बाकी", te: "బ్యాచ్ పంపబడింది, అందినట్లు ఇంకా నిర్ధారణ కాలేదు", ta: "தொகுப்பு அனுப்பப்பட்டது, பெறப்பட்டது இன்னும் உறுதியாகவில்லை", or: "ବ୍ୟାଚ ପଠାଗଲା, ପ୍ରାପ୍ତି ନିଶ୍ଚିତ ହୋଇନି", kn: "ಬ್ಯಾಚ್ ಕಳುಹಿಸಲಾಗಿದೆ, ಸ್ವೀಕೃತಿ ಇನ್ನೂ ದೃಢಪಟ್ಟಿಲ್ಲ" },
};

const ORDER: OrderStatus[] = ["awaiting_payment", "authorized", "picked_up", "at_karigar", "repairing", "repaired", "out_for_delivery", "delivered", "paid_out"];
const reached = (o: Order, s: OrderStatus) => o.status !== "cancelled" && ORDER.indexOf(o.status) >= ORDER.indexOf(s);
const eventAt = (o: Order, s: OrderStatus) => o.events.find((e) => e.status === s)?.at;
const time = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : undefined);

export function buildTrustSteps(o: Order, quote: Quote | null | undefined, lang: Lang = "en"): Step[] {
  const t = (k: string, v?: Record<string, string | number>) => lx(T[k], lang, v);
  const sandbox = o.paypal.mode === "sandbox";
  const pp = sandbox ? t("ppSandbox") : t("simulated");
  const check = o.completionCheck;
  const reviewSource = check?.source === "gemini" ? t("realGemini") : check?.source === "admin" ? t("human") : check ? t("aiUnavailable") : undefined;
  const payoutsOk = o.payouts.length > 0 && o.payouts.every((p) => /SUCCESS|COMPLETED/i.test(p.status));
  const payoutsFailed = o.payouts.some((p) => /FAIL|DENIED|RETURNED|BLOCKED/i.test(p.status));
  const refunded = o.paypal.refunds.reduce((s, r) => s + r.amount, 0);

  return [
    {
      label: t("estimate"),
      state: quote || o.quoteId ? "done" : "todo",
      detail: quote ? t("estimateDetail", { r: `${money(quote.repairLow)}–${money(quote.repairHigh)}` }) : t("estimateRecorded"),
      ref: o.quoteId,
      source: quote ? (quote.source === "gemini" ? t("realGemini") : t("estimateTable")) : undefined,
    },
    {
      label: t("hold"),
      state: o.paypal.authorizationId ? "done" : o.status === "cancelled" ? "warn" : "todo",
      detail: o.paypal.authorizationId ? t("holdDetail", { a: money(o.paypal.heldAmount ?? o.total) }) : t("waitingPP"),
      ref: o.paypal.authorizationId,
      source: pp,
    },
    {
      label: o.mode === "pickup" ? t("pickup") : t("arrival"),
      state: reached(o, "picked_up") || (o.mode === "home-visit" && reached(o, "repairing")) ? "done" : "todo",
      detail: t("otpDetail"),
      ref: time(eventAt(o, "picked_up") ?? eventAt(o, "repairing")),
    },
    {
      label: t("review"),
      state: check?.passed ? "done" : check?.needsReview ? "pending" : check ? "warn" : "todo",
      // The AI's own reasoning is shown as written (it is the evidence itself).
      detail: check ? check.reasoning : t("reviewPending"),
      source: reviewSource,
    },
    {
      label: t("delivery"),
      state: reached(o, "delivered") ? "done" : "todo",
      detail: t("deliveryDetail"),
      ref: time(eventAt(o, "delivered")),
    },
    {
      label: t("captured"),
      state: o.paypal.captureId ? "done" : reached(o, "delivered") ? "pending" : "todo",
      detail: o.paypal.captureId ? t("capturedDetail", { a: money(o.paypal.capturedAmount ?? o.total) }) + (refunded ? t("refundedPart", { a: money(refunded) }) : "") : t("notCaptured"),
      ref: o.paypal.captureId,
      source: o.paypal.captureId ? pp : undefined,
    },
    {
      label: t("payouts"),
      state: payoutsFailed ? "warn" : payoutsOk ? "done" : o.paypal.payoutBatchId ? "pending" : "todo",
      detail: o.payouts.length
        ? o.payouts.map((p) => `${p.label ?? (p.to === "karigar" ? t("karigar") : t("saathi"))} ${money(p.amount)}: ${p.status}`).join(" · ")
        : t("payoutsPending"),
      ref: o.paypal.payoutBatchId,
      source: o.paypal.payoutBatchId ? (!sandbox ? t("simulated") : payoutsOk ? t("ppConfirmed") : t("batchSubmitted")) : undefined,
    },
  ];
}

const ICON: Record<State, React.ReactNode> = {
  done: <BadgeCheck className="size-4 text-emerald-600" />,
  pending: <Clock className="size-4 text-amber-500" />,
  warn: <TriangleAlert className="size-4 text-red-500" />,
  todo: <CircleDashed className="size-4 text-muted-foreground" />,
};

export function TrustReceipt({ order, quote }: { order: Order; quote?: Quote | null }) {
  const { lang } = useLang();
  const steps = buildTrustSteps(order, quote, lang);
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <section className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm ring-1 ring-emerald-200" aria-label="Repair Trust Receipt">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="size-5 text-emerald-600" /> {lx(T.title, lang)}
        </h2>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-emerald-200">{lx(T.proven, lang, { d: done, n: steps.length })}</span>
      </div>
      <ol className="relative space-y-3 border-l-2 border-dashed border-emerald-200 pl-4">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[1.6rem] top-0 rounded-full bg-white p-0.5">{ICON[s.state]}</span>
            <p className={cn("text-sm font-semibold", s.state === "todo" && "text-muted-foreground")}>{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.detail}</p>
            {(s.ref || s.source) && (
              <p className="mt-0.5 flex flex-wrap gap-1.5 text-[11px]">
                {s.source && <span className="rounded bg-white/80 px-1.5 py-px ring-1 ring-border">{s.source}</span>}
                {s.ref && <code className="break-all rounded bg-white/80 px-1.5 py-px font-mono ring-1 ring-border">{s.ref}</code>}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-muted-foreground">{lx(T.footer, lang)}</p>
    </section>
  );
}
