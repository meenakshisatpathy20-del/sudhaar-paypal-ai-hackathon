// End-to-end lifecycle + security test against a running Sudhaar server.
// Usage: npm run test:flow -- http://localhost:3000   (works in simulated or sandbox mode; sandbox needs a PayPal-approved order, so run it simulated)
const BASE = process.argv[2] ?? "http://localhost:3000";
let pass = 0, failN = 0;
const check = (name, cond, extra = "") => { (cond ? pass++ : failN++); console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); };
function session() {
  let cookie = "";
  return async (path, body, method) => {
    const res = await fetch(BASE + path, { method: method ?? (body ? "POST" : "GET"), headers: { "content-type": "application/json", cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) if (c.startsWith("sudhaar_session=")) cookie = c.split(";")[0];
    let j; try { j = await res.json(); } catch { j = {}; }
    return { status: res.status, ...j };
  };
}
const cust = session(), saathi = session(), kar = session(), admin = session(), other = session();
await cust("/api/auth/demo", { role: "customer" });
const q = await cust("/api/quote", { description: "Mixer grinder jar blade is loose" });
check("quote created", q.quote?.id, `source=${q.quote?.source}`);
const ks = await cust(`/api/karigars?quoteId=${q.quote.id}`);
const list = ks.karigars ?? ks.matches ?? ks;
const karigarId = q.offers?.[0]?.karigar?.id;
check("karigars listed", karigarId, karigarId);
const created = await cust("/api/orders", { quoteId: q.quote.id, karigarId }); if (!created.order) console.log("      order error:", created.status, created.error);
check("order created", created.order?.id, `paypalOrder=${created.paypalOrderId}`);
const id = created.order.id;
const ap = await cust(`/api/orders/${id}/approve`, { paypalOrderId: created.paypalOrderId });
check("payment authorized", ap.order?.status === "authorized", `auth=${ap.order?.paypal?.authorizationId}`);
const mine = await cust(`/api/orders/${id}`);
const o = mine.order;
check("customer sees OTPs", /^\d{4,6}$/.test(o.pickupOtp) && /^\d{4,6}$/.test(o.deliveryOtp));
check("no OTP in customer event text", !o.events.some((e) => e.message.includes(o.pickupOtp) || e.message.includes(o.deliveryOtp)));

await saathi("/api/auth/demo", { role: "saathi" });
const sv = await saathi(`/api/orders/${id}`);
check("saathi can view assigned order", sv.order?.id === id);
check("saathi gets no OTPs", sv.order && !sv.order.pickupOtp && !sv.order.deliveryOtp && !JSON.stringify(sv.order).includes(o.pickupOtp));
const wrong = await saathi(`/api/orders/${id}/action`, { action: "pickup", otp: "0000" === o.pickupOtp ? "1111" : "0000" });
check("wrong pickup OTP rejected", wrong.status >= 400, wrong.error);
const pk = await saathi(`/api/orders/${id}/action`, { action: "pickup", otp: o.pickupOtp });
check("right pickup OTP accepted", pk.order?.status === "picked_up", pk.error ?? "");
const drop = await saathi(`/api/orders/${id}/action`, { action: "drop_at_karigar" });
check("dropped at karigar", drop.order?.status === "at_karigar", drop.error ?? "");

await kar("/api/auth/demo", { role: "karigar" });
const sr = await kar(`/api/orders/${id}/action`, { action: "start_repair" });
check("karigar started repair", sr.order?.status === "repairing", sr.error ?? "");
// upload a tiny real PNG as after photo
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const fd = new FormData(); fd.append("file", new Blob([png], { type: "image/png" }), "a.png");
const up = await (await fetch(BASE + "/api/uploads", { method: "POST", body: fd })).json();
check("after photo uploaded", up.file);
const mr = await kar(`/api/orders/${id}/action`, { action: "mark_repaired", afterPhoto: up.file });
const cc = mr.order?.completionCheck;
console.log("      completion check:", JSON.stringify(cc));
if (cc?.source !== "gemini") check("no-AI check does NOT auto-pass (held for human)", mr.order?.status === "repairing" && cc?.passed === false && cc?.needsReview === true, mr.error ?? "");

let status = mr.order?.status;
await admin("/api/auth/demo", { role: "admin" });
if (status !== "repaired") {
  const rv = await admin(`/api/orders/${id}/review`, { approve: true });
  check("human reviewer approves", rv.order?.status === "repaired", rv.error ?? "");
}
const ofd = await saathi(`/api/orders/${id}/action`, { action: "out_for_delivery" });
check("out for delivery", ofd.order?.status === "out_for_delivery", ofd.error ?? "");
const wd = await saathi(`/api/orders/${id}/action`, { action: "deliver", otp: "999999" });
check("wrong delivery OTP rejected (no capture)", wd.status >= 400);
const afterWrong = await cust(`/api/orders/${id}`);
check("still not captured after wrong OTP", !afterWrong.order.paypal.captureId);
const dl = await saathi(`/api/orders/${id}/action`, { action: "deliver", otp: o.deliveryOtp });
check("right delivery OTP -> delivered/captured", ["delivered", "paid_out"].includes(dl.order?.status), dl.error ?? "");
const fin = (await cust(`/api/orders/${id}`)).order;
check("capture id recorded", fin.paypal.captureId, fin.paypal.captureId);
check("payouts recorded", fin.payouts.length >= 2, fin.payouts.map((p) => `${p.to}:${p.amount}:${p.status}`).join(" "));
check("no OTP in any event text (final)", !fin.events.some((e) => e.message.includes(o.pickupOtp) || e.message.includes(o.deliveryOtp)));

// Cross-account isolation: a fresh customer signs up and must not see this order.
const ph = "9" + String(Date.now()).slice(-9);
const su = await other("/api/auth/signup", { name: "Test Two", phone: ph, pin: "4321", address: "Test lane" });
check("second customer signed up", su.status < 400, su.error ?? "");
const peek = await other(`/api/orders/${id}`);
check("other customer cannot view order", peek.status === 404 || peek.status === 403, `status=${peek.status}`);
const anonAdmin = await session()("/api/admin");
check("anonymous cannot read admin API", anonAdmin.status === 401 || anonAdmin.status === 403, `status=${anonAdmin.status}`);
const anonReset = await session()("/api/reset", {});
check("anonymous cannot reset", anonReset.status === 401 || anonReset.status === 403, `status=${anonReset.status}`);
const cfg = await session()("/api/config");
check("config exposes no secret", !/secret|password/i.test(JSON.stringify(cfg).replace(/demoBuyer":null/, "")));
console.log(`\n${pass} passed, ${failN} failed. Order ${id}`);
