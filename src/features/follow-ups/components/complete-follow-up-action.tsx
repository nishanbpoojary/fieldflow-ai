"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { FollowUpState } from "@/features/follow-ups/types";
import { createClient } from "@/lib/supabase/client";

interface CompleteFollowUpActionProps {
  followUpId: string;
  state: FollowUpState;
  isSalesExecutive: boolean;
  onSuccess: () => void;
}

const completionErrorMessage =
  "We could not complete this follow-up. Refresh the page and try again.";

export function CompleteFollowUpAction({
  followUpId,
  state,
  isSalesExecutive,
  onSuccess,
}: CompleteFollowUpActionProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isSalesExecutive || state !== "open") {
    return null;
  }

  function resetForm() {
    setCompletionNote("");
    setErrorMessage("");
  }

  function closeForm() {
    if (isSaving) return;
    resetForm();
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCompletionNote = completionNote.trim();

    if (!normalizedCompletionNote) {
      setErrorMessage("Enter a completion note before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc("complete_assigned_follow_up", {
        p_follow_up_id: followUpId,
        p_completion_note: normalizedCompletionNote,
      });

      if (error) {
        setErrorMessage(completionErrorMessage);
        setIsSaving(false);
        return;
      }
    } catch {
      setErrorMessage(completionErrorMessage);
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
        Complete follow-up
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5"
      aria-labelledby={`complete-follow-up-${followUpId}`}
    >
      <fieldset disabled={isSaving} className="space-y-4">
        <legend
          id={`complete-follow-up-${followUpId}`}
          className="text-sm font-semibold text-slate-950"
        >
          Complete this follow-up
        </legend>

        <label className="block text-sm font-medium text-slate-700">
          Completion note
          <textarea
            required
            rows={4}
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            placeholder="Record what was completed and any useful context"
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
          />
        </label>

        {errorMessage ? (
          <p role="alert" className="text-sm font-medium text-rose-700">
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
