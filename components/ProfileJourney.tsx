"use client";

import Link from "next/link";
import { ArrowRight, Award, Camera, ChevronRight, LifeBuoy, MessageCircleMore, ShoppingBasket, Sparkles } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { rupees } from "@/components/Inr";
import type { Order } from "@/lib/types";

// The customer's repair journey on the profile page: a level that grows with every item
// saved from the bin, one-tap shortcuts, and their latest repairs with live status.

const LEVELS = [
  { name: "New to Sudhaar", min: 0, color: "from-teal-500 to-cyan-700" },
  { name: "First Fix", min: 1, color: "from-amber-400 to-orange-500" },
  { name: "Repair Regular", min: 3, color: "from-emerald-400 to-teal-600" },
  { name: "Second-Life Hero", min: 6, color: "from-sky-500 to-indigo-600" },
  { name: "Zero-Waste Champion", min: 10, color: "from-fuchsia-500 to-rose-600" },
];

const ACTIONS = [
  { href: "/fix", icon: Camera, title: "Snap & Quote", sub: "AI price in seconds", tint: "bg-orange-50 text-orange-600 ring-orange-200" },
  { href: "/ghar-safai", icon: ShoppingBasket, title: "Ghar Safai", sub: "Many items, one pickup", tint: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { href: "/agent", icon: MessageCircleMore, title: "Talk to Sudhaar", sub: "Voice or chat agent", tint: "bg-sky-50 text-sky-700 ring-sky-200" },
  { href: "/resolve", icon: LifeBuoy, title: "Resolve Hub", sub: "Warranty & claims", tint: "bg-violet-50 text-violet-700 ring-violet-200" },
];

export function ProfileJourney({ orders, itemsRepaired, openClaims }: { orders: Order[]; itemsRepaired: number; openClaims: number }) {
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
            <Award className="size-4" /> Your repair level
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{level.name}</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/90">
            {next ? `${next.min - itemsRepaired} more ${next.min - itemsRepaired === 1 ? "repair" : "repairs"} to reach ${next.name}` : "Top level reached. Thank you for repairing, not replacing!"}
          </p>
        </div>
        <CardContent className="grid grid-cols-3 gap-2 pt-4 text-center">
          <div>
            <p className="font-display text-xl font-bold">{orders.length}</p>
            <p className="text-[11px] text-muted-foreground">bookings</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{active}</p>
            <p className="text-[11px] text-muted-foreground">in progress</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{openClaims}</p>
            <p className="text-[11px] text-muted-foreground">open claims</p>
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
              <p className="mt-2 text-sm font-semibold leading-tight">{a.title}</p>
              <p className="text-[11px] text-muted-foreground">{a.sub}</p>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Recent repairs</h2>
              {orders.length > 0 && (
                <Link href="/repairs" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                  See all <ChevronRight className="size-3.5" />
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                <Sparkles className="mx-auto size-6 text-gold" />
                <p className="mt-2 text-sm font-semibold">Nothing repaired yet</p>
                <p className="text-xs text-muted-foreground">Snap a photo of something broken. Gemini quotes it, and PayPal only holds the money until it&apos;s back home, fixed.</p>
                <Link href="/fix" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  Get my first AI quote <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{o.kind === "basket" ? `Ghar Safai · ${o.jobs?.length ?? 0} items` : o.item}</p>
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
