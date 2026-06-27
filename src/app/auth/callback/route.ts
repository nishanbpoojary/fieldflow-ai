import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const cacheControlHeader = "private, no-store, max-age=0, must-revalidate";

function redirectWithNoStore(requestUrl: URL, pathname: "/invite/accept" | "/login") {
  const response = NextResponse.redirect(new URL(pathname, requestUrl.origin));

  response.headers.set("Cache-Control", cacheControlHeader);

  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectWithNoStore(requestUrl, "/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectWithNoStore(requestUrl, "/login");
  }

  return redirectWithNoStore(requestUrl, "/invite/accept");
}
