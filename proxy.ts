import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Convention Next 16 : proxy.ts remplace middleware.ts (déprécié).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tout sauf : assets Next, favicon, images statiques et routes API
     * (la route cron gère sa propre auth par CRON_SECRET).
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
