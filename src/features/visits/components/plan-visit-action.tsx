"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  VisitPlanningOptions,
  VisitPriority,
} from "@/features/visits/types";
import { createClient } from "@/lib/supabase/client";

interface PlanVisitActionProps {
  isManager: boolean;
  options: VisitPlanningOptions | null;
  defaultDate: string;
}

const priorities: { value: VisitPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const planVisitErrorMessage =
  "We could not plan this visit. Refresh the page and try again.";

function getFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isVisitPriority(value: string): value is VisitPriority {
  return value === "high" || value === "medium" || value === "low";
}

export function PlanVisitAction({
  isManager,
  options,
  defaultDate,
}: PlanVisitActionProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isValidationError, setIsValidationError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isManager) {
    return null;
  }

  const hasCustomerOptions = (options?.customers.length ?? 0) > 0;
  const hasSalesExecutiveOptions = (options?.salesExecutives.length ?? 0) > 0;
  const canSubmit = hasCustomerOptions && hasSalesExecutiveOptions;

  function closePanel() {
    if (isSaving) return;
    setErrorMessage("");
    setIsValidationError(false);
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerId = getFormValue(formData, "customerId");
    const assignedSalesExecutiveId = getFormValue(
      formData,
      "assignedSalesExecutiveId",
    );
    const scheduledDate = getFormValue(formData, "scheduledDate");
    const scheduledTime = getFormValue(formData, "scheduledTime");
    const priority = getFormValue(formData, "priority");
    const planningNote = getFormValue(formData, "planningNote");

    if (
      !customerId ||
      !assignedSalesExecutiveId ||
      !scheduledDate ||
      !scheduledTime ||
      !isVisitPriority(priority)
    ) {
      setErrorMessage("Select a customer, assignee, date, time, and priority.");
      setIsValidationError(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setIsValidationError(false);
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc("create_assigned_visit_plan", {
        p_customer_id: customerId,
        p_assigned_sales_executive_id: assignedSalesExecutiveId,
        p_scheduled_date: scheduledDate,
        p_scheduled_time: scheduledTime,
        p_priority: priority,
        p_planning_note: planningNote || undefined,
      });

      if (error) {
        setErrorMessage(planVisitErrorMessage);
        setIsValidationError(false);
        setIsSaving(false);
        return;
      }
    } catch {
      setErrorMessage(planVisitErrorMessage);
      setIsValidationError(false);
      setIsSaving(false);
      return;
    }

    form.reset();
    setIsOpen(false);
    setIsSaving(false);
    setSuccessMessage(
      "Visit planned. The live schedule has been refreshed with the new pending visit.",
    );
    router.refresh();
  }

  return (
    <section
      aria-labelledby="plan-visit-action-title"
      className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm shadow-blue-100/50 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Manager action
          </p>
          <h2
            id="plan-visit-action-title"
            className="mt-1 text-base font-semibold text-slate-950"
          >
            Plan and assign a visit
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-900/80">
            Create a pending visit plan using authorized team customers and
            sales executives.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMessage("");
            setIsValidationError(false);
            setSuccessMessage("");
            setIsOpen((current) => !current);
          }}
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
        >
          {isOpen ? "Close planner" : "Plan visit"}
        </button>
      </div>

      {successMessage ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
        >
          {successMessage}
        </p>
      ) : null}

      {isOpen ? (
        canSubmit ? (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <fieldset disabled={isSaving} className="contents">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Customer
                <select
                  aria-describedby={
                    isValidationError ? "plan-visit-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="customerId"
                  required
                  defaultValue=""
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                >
                  <option value="" disabled>
                    Select an authorized customer
                  </option>
                  {options?.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName} - {customer.territory}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Assigned sales executive
                <select
                  aria-describedby={
                    isValidationError ? "plan-visit-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="assignedSalesExecutiveId"
                  required
                  defaultValue=""
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                >
                  <option value="" disabled>
                    Select an authorized sales executive
                  </option>
                  {options?.salesExecutives.map((executive) => (
                    <option key={executive.id} value={executive.id}>
                      {executive.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Scheduled date
                <input
                  aria-describedby={
                    isValidationError ? "plan-visit-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="scheduledDate"
                  type="date"
                  min={defaultDate}
                  defaultValue={defaultDate}
                  required
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Scheduled time
                <input
                  aria-describedby={
                    isValidationError ? "plan-visit-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="scheduledTime"
                  type="time"
                  required
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Priority
                <select
                  aria-describedby={
                    isValidationError ? "plan-visit-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="priority"
                  required
                  defaultValue="medium"
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Planning note{" "}
                <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  name="planningNote"
                  rows={3}
                  placeholder="Add route context, meeting goals, or prep notes"
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              {errorMessage ? (
                <p
                  id="plan-visit-form-error"
                  role="alert"
                  className="text-sm font-medium text-rose-700 sm:col-span-2"
                >
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePanel}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:bg-blue-400"
                >
                  {isSaving ? "Planning visit..." : "Create pending visit"}
                </button>
              </div>
            </fieldset>
          </form>
        ) : (
          <div
            className="mt-5 rounded-xl border border-dashed border-blue-200 bg-white/70 p-6 text-center"
            role="status"
          >
            <p className="text-sm font-semibold text-slate-800">
              Planning options are not available yet
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-500">
              A manager needs at least one authorized customer and one
              authorized sales executive before a visit can be planned.
            </p>
          </div>
        )
      ) : null}
    </section>
  );
}
