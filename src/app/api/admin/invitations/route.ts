import { NextResponse } from "next/server";

import { validateInvitationRequestBody } from "@/features/admin/invitations/data/invitation-request-validation";
import { getTrustedAppOrigin } from "@/lib/app-origin";
import { requireOrganizationAdmin } from "@/lib/auth/organization-admin";
import type { createSupabaseAdminClient as createSupabaseAdminClientType } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const cacheControlHeader = "private, no-store, max-age=0, must-revalidate";
const maxRequestBodyLength = 4096;
const invitationDurationMs = 7 * 24 * 60 * 60 * 1000;

type InvitationResponseResult =
  | "sent"
  | "already_invited"
  | "delivery_state_unknown"
  | "delivery_failed"
  | "manager_unavailable"
  | "conflict"
  | "invalid_request"
  | "forbidden"
  | "unauthenticated"
  | "unavailable";

type InvitationResponse = {
  result: InvitationResponseResult;
};

type InvitationCommandRow = {
  invitation_id?: unknown;
  invitation_status?: unknown;
  outcome?: unknown;
  newly_created?: unknown;
};

type NewPendingReservation = InvitationCommandRow & {
  invitation_id: string;
  invitation_status: "pending";
  outcome: "created";
  newly_created: true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: InvitationResponse, init: ResponseInit) {
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
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getCommandRow(data: unknown): InvitationCommandRow | null {
  if (!Array.isArray(data) || data.length !== 1) {
    return null;
  }

  const row = data[0];

  if (typeof row !== "object" || row === null || Array.isArray(row)) {
    return null;
  }

  return row;
}

function mapReserveError(error: unknown): InvitationResponse {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";

  if (message === "invitation_manager_already_assigned") {
    return { result: "manager_unavailable" };
  }

  if (message === "invitation_conflict") {
    return { result: "conflict" };
  }

  if (
    message === "invitation_invalid_input" ||
    message === "invitation_target_unavailable"
  ) {
    return { result: "invalid_request" };
  }

  if (message === "invitation_actor_unavailable") {
    return { result: "forbidden" };
  }

  return { result: "unavailable" };
}

function mapReserveErrorStatus(result: InvitationResponseResult) {
  if (result === "invalid_request") {
    return 400;
  }

  if (result === "forbidden") {
    return 403;
  }

  if (result === "manager_unavailable" || result === "conflict") {
    return 409;
  }

  return 503;
}

function mapExistingReservation(row: InvitationCommandRow): InvitationResponse {
  if (row.outcome !== "already_reserved" || row.newly_created !== false) {
    return { result: "unavailable" };
  }

  if (row.invitation_status === "sent") {
    return { result: "already_invited" };
  }

  if (row.invitation_status === "pending") {
    return { result: "delivery_state_unknown" };
  }

  if (row.invitation_status === "send_failed") {
    return { result: "delivery_failed" };
  }

  return { result: "unavailable" };
}

function isNewPendingReservation(
  row: InvitationCommandRow,
): row is NewPendingReservation {
  return (
    row.outcome === "created" &&
    row.newly_created === true &&
    row.invitation_status === "pending" &&
    typeof row.invitation_id === "string"
  );
}

function isSuccessfulMarkSent(data: unknown) {
  const row = getCommandRow(data);

  return row?.outcome === "sent" && row.invitation_status === "sent";
}

function isCredibleAuthInviteSuccess(result: unknown) {
  if (!isRecord(result)) {
    return false;
  }

  if ("error" in result && result.error !== null) {
    return false;
  }

  const { data } = result;

  if (!isRecord(data)) {
    return false;
  }

  const { user } = data;

  return isRecord(user) && typeof user.id === "string" && user.id.trim() !== "";
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
  const validation = validateInvitationRequestBody(body);

  if (!validation.success) {
    return jsonResponse({ result: "invalid_request" }, { status: 400 });
  }

  let organizationAdmin: Awaited<ReturnType<typeof requireOrganizationAdmin>>;

  try {
    organizationAdmin = await requireOrganizationAdmin();
  } catch {
    return jsonResponse({ result: "forbidden" }, { status: 403 });
  }

  const trustedAppOrigin = getTrustedAppOrigin();

  if (!trustedAppOrigin) {
    return jsonResponse({ result: "unavailable" }, { status: 503 });
  }

  const redirectTo = `${trustedAppOrigin}/auth/callback`;
  const expiresAt = new Date(Date.now() + invitationDurationMs).toISOString();
  let admin: ReturnType<typeof createSupabaseAdminClientType>;
  let reserveData: unknown;
  let reserveError: unknown;

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    admin = createSupabaseAdminClient();
    const reserveResult = await admin.rpc("reserve_organization_invitation", {
      p_actor_profile_id: organizationAdmin.id,
      p_invited_email: validation.values.email,
      p_target_role: validation.values.role,
      p_target_team_id: validation.values.teamId,
      p_job_title: validation.values.jobTitle ?? undefined,
      p_expires_at: expiresAt,
    });

    reserveData = reserveResult.data;
    reserveError = reserveResult.error;
  } catch {
    return jsonResponse({ result: "unavailable" }, { status: 503 });
  }

  if (reserveError) {
    const mapped = mapReserveError(reserveError);

    return jsonResponse(mapped, {
      status: mapReserveErrorStatus(mapped.result),
    });
  }

  const reservation = getCommandRow(reserveData);

  if (!reservation) {
    return jsonResponse({ result: "unavailable" }, { status: 503 });
  }

  if (!isNewPendingReservation(reservation)) {
    const mapped = mapExistingReservation(reservation);

    return jsonResponse(mapped, {
      status: mapped.result === "unavailable" ? 503 : 200,
    });
  }

  try {
    const inviteResult = await admin.auth.admin.inviteUserByEmail(
      validation.values.email,
      { redirectTo },
    );

    if (!isCredibleAuthInviteSuccess(inviteResult)) {
      return jsonResponse(
        { result: "delivery_state_unknown" },
        { status: 202 },
      );
    }
  } catch {
    return jsonResponse(
      { result: "delivery_state_unknown" },
      { status: 202 },
    );
  }

  let sentData: unknown;
  let sentError: unknown;

  try {
    const sentResult = await admin.rpc("mark_organization_invitation_sent", {
      p_actor_profile_id: organizationAdmin.id,
      p_invitation_id: reservation.invitation_id,
    });

    sentData = sentResult.data;
    sentError = sentResult.error;
  } catch {
    return jsonResponse(
      { result: "delivery_state_unknown" },
      { status: 202 },
    );
  }

  if (sentError || !isSuccessfulMarkSent(sentData)) {
    return jsonResponse(
      { result: "delivery_state_unknown" },
      { status: 202 },
    );
  }

  return jsonResponse({ result: "sent" }, { status: 200 });
}
