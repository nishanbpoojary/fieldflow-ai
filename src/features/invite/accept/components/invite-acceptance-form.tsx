"use client";

import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { validateInviteCompletionForm } from "@/features/invite/accept/data/invite-completion-validation";
import type {
  InviteCompletionFormErrors,
  InviteCompletionResult,
} from "@/features/invite/accept/types";

interface InviteAcceptanceFormProps {
  initialDisplayName: string;
}

type SubmitState = "idle" | "saving" | "success" | "error";

function resultToMessage(result: InviteCompletionResult) {
  if (result === "manager_unavailable") {
    return "This invitation cannot be completed right now. Please contact your FieldFlow AI administrator.";
  }

  return "We could not complete this invitation right now. Please try again or contact your FieldFlow AI administrator.";
}

export function InviteAcceptanceForm({
  initialDisplayName,
}: InviteAcceptanceFormProps) {
  const router = useRouter();
  const displayNameId = useId();
  const displayNameHintId = useId();
  const displayNameErrorId = useId();
  const passwordId = useId();
  const passwordHintId = useId();
  const passwordErrorId = useId();
  const confirmPasswordId = useId();
  const confirmPasswordHintId = useId();
  const confirmPasswordErrorId = useId();
  const formStatusId = useId();
  const errorSummaryRef = useRef<HTMLParagraphElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<InviteCompletionFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("idle");
    setServerMessage(null);

    const validation = validateInviteCompletionForm({
      displayName,
      password,
      confirmPassword,
    });

    setErrors(validation.errors);

    if (!validation.success) {
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }

    setSubmitState("saving");

    try {
      const response = await fetch("/api/invite/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: validation.values.displayName,
          password: validation.values.password,
        }),
      });
      const body = (await response.json()) as {
        result?: InviteCompletionResult;
      };

      if (
        response.ok &&
        (body.result === "activated" || body.result === "already_active")
      ) {
        setPassword("");
        setConfirmPassword("");
        setSubmitState("success");
        router.replace("/");
        router.refresh();
        return;
      }

      setSubmitState("error");
      setServerMessage(resultToMessage(body.result ?? "unavailable"));
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } catch {
      setSubmitState("error");
      setServerMessage(resultToMessage("unavailable"));
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
    }
  }

  const isSaving = submitState === "saving";
  const displayNameDescription = errors.displayName
    ? `${displayNameHintId} ${displayNameErrorId}`
    : displayNameHintId;
  const passwordDescription = errors.password
    ? `${passwordHintId} ${passwordErrorId}`
    : passwordHintId;
  const confirmPasswordDescription = errors.confirmPassword
    ? `${confirmPasswordHintId} ${confirmPasswordErrorId}`
    : confirmPasswordHintId;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
      <div aria-live="polite" className="min-h-6">
        {hasErrors ? (
          <p
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            Please review the highlighted fields before continuing.
          </p>
        ) : serverMessage ? (
          <p
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {serverMessage}
          </p>
        ) : submitState === "saving" ? (
          <p role="status" className="text-sm font-medium text-slate-600">
            Completing your account...
          </p>
        ) : submitState === "success" ? (
          <p role="status" className="text-sm font-medium text-emerald-700">
            Account completed. Opening your workspace...
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={displayNameId}
          className="block text-sm font-semibold text-slate-800"
        >
          Full name
        </label>
        <p id={displayNameHintId} className="mt-1 text-sm text-slate-500">
          Use the name you want shown in your FieldFlow AI workspace.
        </p>
        <input
          id={displayNameId}
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={isSaving}
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={displayNameDescription}
          maxLength={140}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {errors.displayName ? (
          <p
            id={displayNameErrorId}
            className="mt-2 text-sm font-medium text-rose-700"
          >
            {errors.displayName}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="block text-sm font-semibold text-slate-800"
        >
          New password
        </label>
        <p id={passwordHintId} className="mt-1 text-sm text-slate-500">
          Choose a password for this FieldFlow AI account.
        </p>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSaving}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={passwordDescription}
          maxLength={256}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {errors.password ? (
          <p
            id={passwordErrorId}
            className="mt-2 text-sm font-medium text-rose-700"
          >
            {errors.password}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={confirmPasswordId}
          className="block text-sm font-semibold text-slate-800"
        >
          Confirm password
        </label>
        <p id={confirmPasswordHintId} className="mt-1 text-sm text-slate-500">
          Re-enter the same password to avoid typos.
        </p>
        <input
          id={confirmPasswordId}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSaving}
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={confirmPasswordDescription}
          maxLength={256}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {errors.confirmPassword ? (
          <p
            id={confirmPasswordErrorId}
            className="mt-2 text-sm font-medium text-rose-700"
          >
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isSaving ? "Completing account..." : "Complete account"}
      </button>

      <div id={formStatusId} aria-live="polite" className="sr-only">
        {submitState === "saving"
          ? "Completing account."
          : submitState === "success"
            ? "Account completed."
            : ""}
      </div>
    </form>
  );
}
