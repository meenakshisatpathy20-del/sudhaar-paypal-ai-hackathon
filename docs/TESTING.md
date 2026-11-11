# Testing Sudhaar

Every result here can be re-run. Labels follow our evidence rule: **runtime-verified** = executed and observed; **source-verified** = in code, not separately executed.

## 1. Repair lifecycle and security test (runtime-verified, 27/27)

```bash
# terminal 1: a simulated-mode server (no PayPal/Gemini keys), so the whole flow runs without a PayPal popup
PAYPAL_CLIENT_ID= PAYPAL_CLIENT_SECRET= GEMINI_API_KEY= DATA_DIR=./data-test npm start
# terminal 2
npm run test:flow -- http://localhost:3000
```

| # | Check | Result |
|---|---|---|
| 1-4 | Quote → karigar offers → order → PayPal authorization (intent AUTHORIZE) | PASS |
| 5-6 | Customer sees both OTPs; no OTP inside any activity message | PASS |
| 7-8 | Saathi sees only the assigned order and **never** receives OTPs | PASS |
| 9-10 | **Wrong pickup OTP rejected**; right OTP accepted | PASS |
| 11-13 | Drop at karigar, start repair, after-photo upload (file signature checked) | PASS |
| 14 | **AI unavailable → repair is NOT auto-approved**; payment held, `needsReview` | PASS |
| 15 | Human reviewer approves; action recorded with source `admin` | PASS |
| 16-18 | Out for delivery; **wrong delivery OTP rejected and nothing captured** | PASS |
| 19-21 | Right delivery OTP → capture id recorded → payouts recorded only after capture | PASS |
| 22 | No OTP in any event text at the end of the flow | PASS |
| 23-24 | A second, freshly signed-up customer **cannot** open the order (404) | PASS |
| 25-26 | Anonymous requests cannot read the admin API or reset data (401) | PASS |
| 27 | `/api/config` exposes no secret | PASS |

## 2. Private photos (runtime-verified)

| Request | Result |
|---|---|
| Anonymous GET of someone's photo | **401** |
| Uploader (same browser) GET of own photo | 200 |
| Text file renamed to `.jpg` | **400** "That file is not a valid image" |

## 3. Real PayPal sandbox (runtime-verified)

- Server start-up check: `PayPal sandbox accepted the Client ID and Secret.`
- Repair Agent booking created real sandbox order `76L12884SR3255233` (intent AUTHORIZE); the PayPal v6 button rendered for approval.
- `npm run smoke:paypal` exercises the PayPal APIs directly with your `.env`.

## 4. Gemini AI in 8 languages (runtime-verified)

The same broken-mixer description in each language, through `/api/quote` and `/api/tts`:

| Lang | AI source | Category | Notes language | Spoken audio |
|---|---|---|---|---|
| en | gemini | small-appliance | English | 200 OK |
| hi | gemini | small-appliance | Hindi | 200 OK |
| bn | gemini | small-appliance | Bengali | 200 OK |
| mr | gemini | small-appliance | Marathi | 200 OK |
| te | gemini | small-appliance | Telugu | 200 OK |
| ta | gemini | small-appliance | Tamil | 200 OK |
| or | gemini | small-appliance | Odia | 200 OK |
| kn | gemini | small-appliance | Kannada | 200 OK |

The Repair Agent replied in Hindi and Tamil when asked in those languages.

**Resilience:** when `gemini-flash-latest` returned `503 high demand` / `504 DEADLINE_EXCEEDED` during testing, requests switched to `gemini-flash-lite-latest` and stayed on it for 5 minutes (circuit breaker in `lib/llm.ts`), so the demo never hangs.

## 5. Voice

- **Speech input:** Web Speech API (Chrome/Edge, all 8 locales). The mic button hides itself where unsupported and explains a denied permission. *(source-verified)*
- **Spoken replies:** an installed browser voice when the device has one, otherwise Gemini TTS from `/api/tts` *(runtime-verified, table above)*.
- **Phone line (Bolna):** optional; the website hides the number and "Call me" until `VOICE_PHONE_NUMBER` / `BOLNA_*` are set. Phone cancellation needs the caller's 4-digit PIN as well as caller ID. *(source-verified)*

## Known gaps (kept visible on purpose)

- Reauthorization of holds older than the PayPal honor period is not automated.
- The lifecycle test runs in simulated PayPal mode; sandbox approval needs a human in the PayPal popup.
