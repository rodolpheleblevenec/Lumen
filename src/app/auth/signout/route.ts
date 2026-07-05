import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/http";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${publicOrigin(request)}/login`, {
    status: 302,
  });
}
