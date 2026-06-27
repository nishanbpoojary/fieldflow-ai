import { NextResponse } from "next/server";

import { validateInviteCompletionInput } from "@/features/invite/accept/data/invite-completion-validation";
import type { InviteCompletionResult } from "@/features/invite/accept/types";
import { resolveInviteRecipientAccess } from "@/lib/auth/invite-recipient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const cacheControlHeader = "private, no-store, max-age=0, must-revalidate";
const maxRequestBodyLength = 4096;

type CompleteResponse = {
  result:
    | InviteCompletionResult
    | "invalid_request"
    | "unauthenticated"
    | "forbidden";
};

function jsonResponse(body: CompleteResponse, init: ResponseInit) {
  const response = NextResponse.json(body, init);

  response.headers.set("Cache-Control", cacheControlHeader);

  return response;
}

function isJsonContentType(contentType: string | null) {
  return contentType?.toLowerCase().split(";")[0].trim() === "application/json";
}

function isSameOriginRequest(request: Request, requestUrl: URL) {
  const origin = request.headers.get("Origin");

  return origin !== null && origin === requestUrl.origin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyAllowedKeys(value: Record<string, unknown>) {
  return Object.keys(value).every(
    (key) => key === "displayName" || key === "password",
  );
}

async function parseRequestBody(request: Request) {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > maxRequestBodyLength) {
    return null;
  }

  const text = await request.text();

  if (text.length > maxRequestBodyLength) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (!isRecord(parsed) || !hasOnlyAllowedKeys(parsed)) {
      return null;
    }

    const { displayName, password } = parsed;

    if (typeof displayName !== "string" || typeof password !== "string") {
      return null;
    }

    return { displayName, password };
  } catch {
    return null;
  }
}

function mapActivationResult(
  outcome: string | undefined,
  activated: boolean | undefined,
) {
  if (activated && outcome === "activated") {
    return { result: "activated" as const, status: 200 };
  }

  if (activated && outcome === "already_active") {
    return { result: "already_active" as const, status: 200 };
  }

  if (outcome === "manager_unavailable") {
    return { result: "manager_unavailable" as const, status: 409 };
  }

  return { result: "unavailable" as const, status: 503 };
}

async function completeInvitation(
  recipientProfileId: string,
  displayName: string,
) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("accept_organization_invitation", {
    p_recipient_profile_id: recipientProfileId,
    p_display_name: displayName,
  });

  if (error) {
    return { result: "unavailable" as const, status: 503 };
  }

  const activation = data?.[0];

  return mapActivationResult(activation?.outcome, activation?.activated);
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (!isJsonContentType(request.headers.get("Content-Type"))) {
    return jsonResponse({ result: "invalid_request" }, { status: 415 });
  }

  if (!isSameOriginRequest(request, requestUrl)) {
    return jsonResponse({ result: "forbidden" }, { status: 403 });
  }

  const body = await parseRequestBody(request);

  if (!body) {
    return jsonResponse({ result: "invalid_request" }, { status: 400 });
  }

  const validation = validateInviteCompletionInput(body);

  if (!validation.success) {
    return jsonResponse({ result: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await resolveInviteRecipientAccess(supabase);

  if (access.status === "unauthenticated") {
    return jsonResponse({ result: "unauthenticated" }, { status: 401 });
  }

  if (access.status !== "invited" && access.status !== "active") {
    return jsonResponse({ result: "unavailable" }, { status: 403 });
  }

  if (access.status === "active") {
    try {
      const mapped = await completeInvitation(
        access.id,
        validation.values.displayName,
      );

      return jsonResponse({ result: mapped.result }, { status: mapped.status });
    } catch {
      return jsonResponse({ result: "unavailable" }, { status: 503 });
    }
  }

  try {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: validation.values.password,
    });

    if (passwordError) {
      return jsonResponse({ result: "unavailable" }, { status: 503 });
    }
  } catch {
    return jsonResponse({ result: "unavailable" }, { status: 503 });
  }

  try {
    const mapped = await completeInvitation(
      access.id,
      validation.values.displayName,
    );

    return jsonResponse({ result: mapped.result }, { status: mapped.status });
  } catch {
    return jsonResponse({ result: "unavailable" }, { status: 503 });
  }
}
