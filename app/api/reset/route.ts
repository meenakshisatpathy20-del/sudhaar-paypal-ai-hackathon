import { resetDB } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { FlowError } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";

// Admin only: clears orders and test data (accounts and onboarded karigars are kept). Handy before recording a demo.
export function POST(req: Request) {
  try {
    requireRole(req, "admin");
    if (process.env.ALLOW_RESET === "off") throw new FlowError("Reset is disabled on this deployment", 403);
    rateLimit(req, "reset", 3);
    resetDB();
    return ok({ reset: true });
  } catch (e) {
    return fail(e);
  }
}
