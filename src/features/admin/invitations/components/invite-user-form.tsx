"use client";

import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";

import type { OrganizationInviteTeamOption } from "@/features/admin/users/types";

type InviteUserRole = "sales_executive" | "manager";

type InviteUserResult =
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

type InviteUserMessageTone = "success" | "error";

type SubmitState = "idle" | "pending" | "success" | "error";

interface InviteUserFormProps {
  teams: OrganizationInviteTeamOption[];
}

interface InviteUserFormValues {
  email: string;
  role: InviteUserRole;
  teamId: string;
  jobTitle: string;
}

interface InviteUserFormErrors {
  email?: string;
  teamId?: string;
}

export const invitationResultMessages: Record<
  InviteUserResult,
  { tone: InviteUserMessageTone; message: string }
> = {
  sent: {
    tone: "success",
    message:
      "Invitation sent. The recipient can use the email link to complete account setup.",
  },
  already_invited: {
    tone: "error",
    message: "An invitation has already been sent for this person.",
  },
  delivery_state_unknown: {
    tone: "error",
    message:
      "Delivery could not be confirmed. Please ask the recipient to check their email before sending another invitation.",
  },
  delivery_failed: {
    tone: "error",
    message:
      "The earlier invitation could not be delivered. Please contact an administrator before trying again.",
  },
  manager_unavailable: {
    tone: "error",
    message: "This team already has a Manager.",
  },
  conflict: {
    tone: "error",
    message: "This email cannot be invited at this time.",
  },
  invalid_request: {
    tone: "error",
    message: "Please review the form details and try again.",
  },
  forbidden: {
    tone: "error",
    message: "Invitations are currently unavailable. Please try again later.",
  },
  unauthenticated: {
    tone: "error",
    message: "Invitations are currently unavailable. Please try again later.",
  },
  unavailable: {
    tone: "error",
    message: "Invitations are currently unavailable. Please try again later.",
  },
};

const knownInvitationResults = new Set<InviteUserResult>(
  Object.keys(invitationResultMessages) as InviteUserResult[],
);

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isKnownInvitationResult(
  value: unknown,
): value is InviteUserResult {
  return (
    typeof value === "string" &&
    knownInvitationResults.has(value as InviteUserResult)
  );
}

export function parseInvitationApiResult(body: unknown): InviteUserResult {
  if (
    !isRecord(body) ||
    Object.keys(body).length !== 1 ||
    !isKnownInvitationResult(body.result)
  ) {
    return "unavailable";
  }

  return body.result;
}

export function getInvitationResultMessage(result: InviteUserResult) {
  return invitationResultMessages[result];
}

export function buildInviteUserRequestPayload(values: InviteUserFormValues) {
  return {
    email: values.email.trim(),
    role: values.role,
    teamId: values.teamId,
    jobTitle: normalizeWhitespace(values.jobTitle) || null,
  };
}

export function isInviteSubmitDisabled({
  hasTeamOptions,
  isPending,
}: {
  hasTeamOptions: boolean;
  isPending: boolean;
}) {
  return isPending || !hasTeamOptions;
}

function validateInviteUserForm(values: InviteUserFormValues) {
  const errors: InviteUserFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter an email address.";
  }

  if (!values.teamId) {
    errors.teamId = "Choose a team for this invitation.";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}

export function InviteUserForm({ teams }: InviteUserFormProps) {
  const emailId = useId();
  const emailHintId = useId();
  const emailErrorId = useId();
  const roleId = useId();
  const roleHintId = useId();
  const teamId = useId();
  const teamHintId = useId();
  const teamErrorId = useId();
  const jobTitleId = useId();
  const jobTitleHintId = useId();
  const statusId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteUserRole>("sales_executive");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [errors, setErrors] = useState<InviteUserFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<{
    tone: InviteUserMessageTone;
    text: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitState === "pending") {
      return;
    }

    const values: InviteUserFormValues = {
      email,
      role,
      teamId: selectedTeamId,
      jobTitle,
    };
    const validation = validateInviteUserForm(values);

    setErrors(validation.errors);
    setMessage(null);

    if (!validation.success) {
      setSubmitState("error");
      setTimeout(() => statusRef.current?.focus(), 0);
      return;
    }

    setSubmitState("pending");

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildInviteUserRequestPayload(values)),
      });
      const body = (await response.json()) as unknown;
      const result = parseInvitationApiResult(body);
      const resultMessage = getInvitationResultMessage(result);

      setSubmitState(resultMessage.tone === "success" ? "success" : "error");
      setMessage({ tone: resultMessage.tone, text: resultMessage.message });

      if (result === "sent") {
        setEmail("");
        setRole("sales_executive");
        setSelectedTeamId(teams[0]?.id ?? "");
        setJobTitle("");
      }

      setTimeout(() => statusRef.current?.focus(), 0);
    } catch {
      const resultMessage = getInvitationResultMessage("unavailable");

      setSubmitState("error");
      setMessage({ tone: resultMessage.tone, text: resultMessage.message });
      setTimeout(() => statusRef.current?.focus(), 0);
    }
  }

  const isPending = submitState === "pending";
  const hasTeamOptions = teams.length > 0;
  const isSubmitDisabled = isInviteSubmitDisabled({
    hasTeamOptions,
    isPending,
  });
  const emailDescription = errors.email
    ? `${emailHintId} ${emailErrorId}`
    : emailHintId;
  const teamDescription = errors.teamId
    ? `${teamHintId} ${teamErrorId}`
    : teamHintId;

  return (
    <section
      aria-labelledby="invite-user-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Invite user
          </p>
          <h2
            id="invite-user-title"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Send an organization invitation
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Invite a Manager or Sales Executive into an authorized team. The
            secure server route handles organization scope, Manager/team
            conflicts, and email delivery.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Email invite
        </span>
      </div>

      <form className="mt-5 grid gap-5" onSubmit={handleSubmit} noValidate>
        <div
          aria-live="polite"
          className="min-h-6"
        >
          {message ? (
            <p
              id={statusId}
              ref={statusRef}
              tabIndex={-1}
              role={message.tone === "error" ? "alert" : "status"}
              className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 ${
                message.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500"
                  : "border-rose-200 bg-rose-50 text-rose-700 focus-visible:ring-rose-500"
              }`}
            >
              {message.text}
            </p>
          ) : submitState === "pending" ? (
            <p role="status" className="text-sm font-medium text-slate-600">
              Sending invitation...
            </p>
          ) : !hasTeamOptions ? (
            <p
              id={statusId}
              ref={statusRef}
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
            >
              No authorized teams are available for invitations.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label
              htmlFor={emailId}
              className="block text-sm font-semibold text-slate-800"
            >
              Email address
            </label>
            <p id={emailHintId} className="mt-1 text-sm text-slate-500">
              Use the recipient&apos;s work email address.
            </p>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              required
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={emailDescription}
              maxLength={254}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="colleague@example.com"
            />
            {errors.email ? (
              <p
                id={emailErrorId}
                className="mt-2 text-sm font-medium text-rose-700"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={roleId}
              className="block text-sm font-semibold text-slate-800"
            >
              Role
            </label>
            <p id={roleHintId} className="mt-1 text-sm text-slate-500">
              Choose the app role for this invitation.
            </p>
            <select
              id={roleId}
              name="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as InviteUserRole)
              }
              disabled={isPending}
              aria-describedby={roleHintId}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="sales_executive">Sales Executive</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={teamId}
              className="block text-sm font-semibold text-slate-800"
            >
              Team
            </label>
            <p id={teamHintId} className="mt-1 text-sm text-slate-500">
              Team options are limited to your authorized organization.
            </p>
            <select
              id={teamId}
              name="teamId"
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={isPending || !hasTeamOptions}
              required
              aria-invalid={errors.teamId ? true : undefined}
              aria-describedby={teamDescription}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {hasTeamOptions ? (
                teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))
              ) : (
                <option value="">No teams available</option>
              )}
            </select>
            {errors.teamId ? (
              <p
                id={teamErrorId}
                className="mt-2 text-sm font-medium text-rose-700"
              >
                {errors.teamId}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={jobTitleId}
              className="block text-sm font-semibold text-slate-800"
            >
              Job title
            </label>
            <p id={jobTitleHintId} className="mt-1 text-sm text-slate-500">
              Optional professional designation shown after onboarding.
            </p>
            <input
              id={jobTitleId}
              name="jobTitle"
              type="text"
              autoComplete="organization-title"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              disabled={isPending}
              aria-describedby={jobTitleHintId}
              maxLength={80}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Sales Executive"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            The browser sends only email, role, team, and optional job title.
          </p>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400 sm:w-auto"
          >
            {isPending ? "Sending invitation..." : "Send invitation"}
          </button>
        </div>
      </form>
    </section>
  );
}
