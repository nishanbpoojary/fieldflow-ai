"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import { validateProfileSettingsInput } from "@/features/settings/profile/data/profile-settings-validation";
import type {
  ProfileSettingsFormErrors,
  ProfileSettingsFormValues,
} from "@/features/settings/profile/types";
import { createClient } from "@/lib/supabase/client";

interface ProfileSettingsFormProps {
  initialDisplayName: string;
  initialJobTitle: string | null;
}

type SaveState = "idle" | "saving" | "success" | "error";

export function ProfileSettingsForm({
  initialDisplayName,
  initialJobTitle,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const displayNameId = useId();
  const displayNameHintId = useId();
  const displayNameErrorId = useId();
  const jobTitleId = useId();
  const jobTitleHintId = useId();
  const jobTitleErrorId = useId();
  const statusId = useId();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [errors, setErrors] = useState<ProfileSettingsFormErrors>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("idle");

    const validation = validateProfileSettingsInput({
      displayName,
      jobTitle,
    });

    setErrors(validation.errors);

    if (!validation.success) {
      return;
    }

    setSaveState("saving");

    const supabase = createClient();
    const args: {
      p_display_name: string;
      p_job_title?: string;
    } = {
      p_display_name: validation.values.displayName,
    };

    if (validation.values.jobTitle !== null) {
      args.p_job_title = validation.values.jobTitle;
    }

    const { error } = await supabase.rpc("update_own_profile", args);

    if (error) {
      setSaveState("error");
      return;
    }

    applySuccessfulValues(validation.values);
    setSaveState("success");
    router.refresh();
  }

  function applySuccessfulValues(values: ProfileSettingsFormValues) {
    setDisplayName(values.displayName);
    setJobTitle(values.jobTitle ?? "");
  }

  const displayNameDescription = errors.displayName
    ? `${displayNameHintId} ${displayNameErrorId}`
    : displayNameHintId;
  const jobTitleDescription = errors.jobTitle
    ? `${jobTitleHintId} ${jobTitleErrorId}`
    : jobTitleHintId;
  const isSaving = saveState === "saving";

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
      noValidate
    >
      <div className="border-b border-slate-100 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Editable details
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
          Personal display information
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          These fields are shown inside FieldFlow AI. Role, team, organization,
          and account status are managed separately.
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <label
            htmlFor={displayNameId}
            className="text-sm font-semibold text-slate-800"
          >
            Display Name
          </label>
          <p id={displayNameHintId} className="mt-1 text-sm text-slate-500">
            Required. Use the name you want shown in your workspace.
          </p>
          <input
            id={displayNameId}
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isSaving}
            aria-invalid={errors.displayName ? true : undefined}
            aria-describedby={displayNameDescription}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            maxLength={140}
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
            htmlFor={jobTitleId}
            className="text-sm font-semibold text-slate-800"
          >
            Job Title
          </label>
          <p id={jobTitleHintId} className="mt-1 text-sm text-slate-500">
            Optional. Use a professional designation such as Sales Executive or
            Operations Lead.
          </p>
          <input
            id={jobTitleId}
            name="jobTitle"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            disabled={isSaving}
            aria-invalid={errors.jobTitle ? true : undefined}
            aria-describedby={jobTitleDescription}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            maxLength={100}
          />
          {errors.jobTitle ? (
            <p
              id={jobTitleErrorId}
              className="mt-2 text-sm font-medium text-rose-700"
            >
              {errors.jobTitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <div
          id={statusId}
          aria-live="polite"
          className="min-h-6 text-sm font-medium"
        >
          {saveState === "success" ? (
            <p className="text-emerald-700" role="status">
              Profile details saved.
            </p>
          ) : saveState === "error" ? (
            <p className="text-rose-700" role="alert">
              We could not save your profile details right now. Please try
              again.
            </p>
          ) : saveState === "saving" ? (
            <p className="text-slate-600" role="status">
              Saving profile details...
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
