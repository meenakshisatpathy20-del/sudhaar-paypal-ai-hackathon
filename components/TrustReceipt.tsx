"use client";

import { BadgeCheck, CircleDashed, Clock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Order, OrderStatus, Quote } from "@/lib/types";
import { money } from "@/components/api";
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

const ORDER: OrderStatus[] = ["awaiting_payment", "authorized", "picked_up", "at_karigar", "repairing", "repaired", "out_for_delivery", "delivered", "paid_out"];
const reached = (o: Order, s: OrderStatus) => o.status !== "cancelled" && ORDER.indexOf(o.status) >= ORDER.indexOf(s);
const eventAt = (o: Order, s: OrderStatus) => o.events.find((e) => e.status === s)?.at;
const time = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : undefined);

export function buildTrustSteps(o: Order, quote?: Quote | null): Step[] {
  const sandbox = o.paypal.mode === "sandbox";
  const pp = sandbox ? "PayPal sandbox" : "Simulated (no PayPal keys)";
  const check = o.completionCheck;
  const reviewSource = check?.source === "gemini" ? "Real Gemini" : check?.source === "admin" ? "Human reviewer" : check ? "AI unavailable" : undefined;
  const payoutsOk = o.payouts.length > 0 && o.payouts.every((p) => /SUCCESS|COMPLETED/i.test(p.status));
  const payoutsFailed = o.payouts.some((p) => /FAIL|DENIED|RETURNED|BLOCKED/i.test(p.status));
  const refunded = o.paypal.refunds.reduce((s, r) => s + r.amount, 0);

  return [
    {
      label: "AI repair estimate",
      state: quote || o.quoteId ? "done" : "todo",
      detail: quote ? `${money(quote.repairLow)}–${money(quote.repairHigh)} estimate; final price set by the karigar` : "Estimate recorded with the booking",
      ref: o.quoteId,
      source: quote ? (quote.source === "gemini" ? "Real Gemini" : "Deterministic estimate") : undefined,
    },
    {
      label: "Customer approved payment hold",
      state: o.paypal.authorizationId ? "done" : o.status === "cancelled" ? "warn" : "todo",
      detail: o.paypal.authorizationId ? `${money(o.paypal.heldAmount ?? o.total)} authorized (intent AUTHORIZE, not captured)` : "Waiting for PayPal approval",
      ref: o.paypal.authorizationId,
      source: pp,
    },
    {
      label: o.mode === "pickup" ? "Pickup verified by OTP" : "Arrival verified by OTP",
      state: reached(o, "picked_up") || (o.mode === "home-visit" && reached(o, "repairing")) ? "done" : "todo",
      detail: "Customer-held code checked on the server; partners never see it",
      ref: time(eventAt(o, "picked_up") ?? eventAt(o, "repairing")),
    },
    {
      label: "Repair evidence reviewed",
      state: check?.passed ? "done" : check?.needsReview ? "pending" : check ? "warn" : "todo",
      detail: check ? check.reasoning : "Before/after photos compared when the karigar finishes",
      source: reviewSource,
    },
    {
      label: "Delivery confirmed by OTP",
      state: reached(o, "delivered") ? "done" : "todo",
      detail: "Payment is only captured after this code",
      ref: time(eventAt(o, "delivered")),
    },
    {
      label: "Payment captured",
      state: o.paypal.captureId ? "done" : reached(o, "delivered") ? "pending" : "todo",
      detail: o.paypal.captureId ? `${money(o.paypal.capturedAmount ?? o.total)} captured${refunded ? `, ${money(refunded)} refunded` : ""}` : "Not captured yet: money is still only held",
      ref: o.paypal.captureId,
      source: o.paypal.captureId ? pp : undefined,
    },
    {
      label: "Partner payouts",
      state: payoutsFailed ? "warn" : payoutsOk ? "done" : o.paypal.payoutBatchId ? "pending" : "todo",
      detail: o.payouts.length
        ? o.payouts.map((p) => `${p.label ?? (p.to === "karigar" ? "Karigar" : "Saathi")} ${money(p.amount)}: ${p.status}`).join(" · ")
        : "Sent only after a confirmed capture",
      ref: o.paypal.payoutBatchId,
      source: o.paypal.payoutBatchId ? (!sandbox ? "Simulated (no PayPal keys)" : payoutsOk ? "PayPal confirmed" : "Batch submitted, not yet confirmed received") : undefined,
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
  const steps = buildTrustSteps(order, quote);
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <section className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm ring-1 ring-emerald-200" aria-label="Repair Trust Receipt">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="size-5 text-emerald-600" /> Repair Trust Receipt
        </h2>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-emerald-200">
          {done}/{steps.length} proven
        </span>
      </div>
      <ol className="relative space-y-3 border-l-2 border-dashed border-emerald-200 pl-4">
        {steps.map((s) => (
          <li key={s.label} className="relative">
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
      <p className="mt-3 text-[11px] text-muted-foreground">
        A step turns green only when its evidence exists. PayPal references can be checked in the sandbox dashboard. Sandbox = test money; amounts are USD.
      </p>
    </section>
  );
}
