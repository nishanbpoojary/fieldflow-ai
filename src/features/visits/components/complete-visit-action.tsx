"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { VisitStatus } from "@/features/visits/types";
import { createClient } from "@/lib/supabase/client";

interface CompleteVisitActionProps {
  visitPlanId: string;
  visitStatus: VisitStatus;
  isSalesExecutive: boolean;
  onSuccess: () => void;
}

const completionErrorMessage =
  "We could not complete this visit. Refresh the page and try again.";

export function CompleteVisitAction({
  visitPlanId,
  visitStatus,
  isSalesExecutive,
  onSuccess,
}: CompleteVisitActionProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isValidationError, setIsValidationError] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [nextFollowUpAction, setNextFollowUpAction] = useState("");

  if (!isSalesExecutive || visitStatus !== "pending") {
    return null;
  }

  function resetForm() {
    setOutcome("");
    setNotes("");
    setNextFollowUpAction("");
    setErrorMessage("");
    setIsValidationError(false);
  }

  function closeForm() {
    if (isSaving) return;
    resetForm();
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedOutcome = outcome.trim();
    const normalizedNotes = notes.trim();
    const normalizedNextFollowUpAction = nextFollowUpAction.trim();

    if (!normalizedOutcome || !normalizedNotes) {
      setErrorMessage("Enter both an outcome and completion notes.");
      setIsValidationError(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setIsValidationError(false);

    try {
      const { error } = await supabase.rpc("complete_assigned_visit_plan", {
        p_visit_plan_id: visitPlanId,
        p_outcome: normalizedOutcome,
        p_notes: normalizedNotes,
        p_next_follow_up_action: normalizedNextFollowUpAction,
      });

      if (error) {
        setErrorMessage(completionErrorMessage);
        setIsValidationError(false);
        setIsSaving(false);
        return;
      }
    } catch {
      setErrorMessage(completionErrorMessage);
      setIsValidationError(false);
      setIsSaving(false);
      return;
    }

    resetForm();
    setIsOpen(false);
    setIsSaving(false);
    onSuccess();
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 min-h-11 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
      >
        Complete visit
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5"
      aria-labelledby={`complete-visit-${visitPlanId}`}
    >
      <fieldset disabled={isSaving} className="space-y-4">
        <legend
          id={`complete-visit-${visitPlanId}`}
          className="text-sm font-semibold text-slate-950"
        >
          Complete this visit
        </legend>

        <label className="block text-sm font-medium text-slate-700">
          Outcome
          <input
            aria-describedby={
              isValidationError
                ? `complete-visit-error-${visitPlanId}`
                : undefined
            }
            aria-invalid={isValidationError || undefined}
            type="text"
            required
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder="What was the visit outcome?"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Completion notes
          <textarea
            aria-describedby={
              isValidationError
                ? `complete-visit-error-${visitPlanId}`
                : undefined
            }
            aria-invalid={isValidationError || undefined}
            required
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Record the useful details from this visit"
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Next follow-up action <span className="font-normal text-slate-400">(optional)</span>
          <textarea
            rows={2}
            value={nextFollowUpAction}
            onChange={(event) => setNextFollowUpAction(event.target.value)}
            placeholder="Add the next action, if one was agreed"
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
          />
        </label>

        {errorMessage ? (
          <p
            id={`complete-visit-error-${visitPlanId}`}
            role="alert"
            className="text-sm font-medium text-rose-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeForm}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:bg-blue-400"
          >
            {isSaving ? "Saving completion…" : "Save completion"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
