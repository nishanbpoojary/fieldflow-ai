"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  TaskCreationOptions,
  TaskPriority,
} from "@/features/tasks/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

interface CreateTaskActionProps {
  isManager: boolean;
  options: TaskCreationOptions | null;
  defaultDate: string;
}

const internalTaskValue = "__internal_task__";

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const createTaskErrorMessage =
  "We could not create this task. Refresh the page and try again.";

type CreateAssignedTaskArgs =
  Database["public"]["Functions"]["create_assigned_task"]["Args"];

function getFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isTaskPriority(value: string): value is TaskPriority {
  return value === "high" || value === "medium" || value === "low";
}

export function CreateTaskAction({
  isManager,
  options,
  defaultDate,
}: CreateTaskActionProps) {
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

  const hasSalesExecutiveOptions = (options?.salesExecutives.length ?? 0) > 0;

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
    const assignedSalesExecutiveId = getFormValue(
      formData,
      "assignedSalesExecutiveId",
    );
    const title = getFormValue(formData, "title");
    const dueDate = getFormValue(formData, "dueDate");
    const priority = getFormValue(formData, "priority");
    const relatedCustomerValue = getFormValue(formData, "relatedCustomerId");
    const planningNote = getFormValue(formData, "planningNote");
    const relatedCustomerId =
      relatedCustomerValue === internalTaskValue ? null : relatedCustomerValue;

    if (
      !assignedSalesExecutiveId ||
      !title ||
      !dueDate ||
      !isTaskPriority(priority) ||
      !relatedCustomerValue
    ) {
      setErrorMessage(
        "Select an assignee, task type, due date, priority, and enter a title.",
      );
      setIsValidationError(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setIsValidationError(false);
    setSuccessMessage("");

    try {
      const rpcArgs = {
        p_assigned_sales_executive_id: assignedSalesExecutiveId,
        p_title: title,
        p_due_date: dueDate,
        p_priority: priority,
        p_related_customer_id: relatedCustomerId,
        p_planning_note: planningNote || null,
      } as unknown as CreateAssignedTaskArgs;

      const { error } = await supabase.rpc("create_assigned_task", rpcArgs);

      if (error) {
        setErrorMessage(createTaskErrorMessage);
        setIsValidationError(false);
        setIsSaving(false);
        return;
      }
    } catch {
      setErrorMessage(createTaskErrorMessage);
      setIsValidationError(false);
      setIsSaving(false);
      return;
    }

    form.reset();
    setIsOpen(false);
    setIsSaving(false);
    setSuccessMessage(
      "Task created. The live queue and summary counts have been refreshed.",
    );
    router.refresh();
  }

  return (
    <section
      aria-labelledby="create-task-action-title"
      className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm shadow-blue-100/50 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Manager action
          </p>
          <h2
            id="create-task-action-title"
            className="mt-1 text-base font-semibold text-slate-950"
          >
            Create and assign a task
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-900/80">
            Add an open task for an authorized sales executive, optionally tied
            to a customer.
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
          {isOpen ? "Close creator" : "Create task"}
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
        hasSalesExecutiveOptions ? (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <fieldset disabled={isSaving} className="contents">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Assigned sales executive
                <select
                  aria-describedby={
                    isValidationError ? "create-task-form-error" : undefined
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

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Related customer
                <select
                  aria-describedby={
                    isValidationError ? "create-task-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="relatedCustomerId"
                  required
                  defaultValue={internalTaskValue}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                >
                  <option value={internalTaskValue}>
                    Internal task — no customer
                  </option>
                  {options?.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName} - {customer.territory}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Task title
                <input
                  aria-describedby={
                    isValidationError ? "create-task-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="title"
                  type="text"
                  required
                  placeholder="What needs to be done?"
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Due date
                <input
                  aria-describedby={
                    isValidationError ? "create-task-form-error" : undefined
                  }
                  aria-invalid={isValidationError || undefined}
                  name="dueDate"
                  type="date"
                  min={defaultDate}
                  defaultValue={defaultDate}
                  required
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Priority
                <select
                  aria-describedby={
                    isValidationError ? "create-task-form-error" : undefined
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
                  placeholder="Add context, expectations, or next-step guidance"
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>

              {errorMessage ? (
                <p
                  id="create-task-form-error"
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
                  {isSaving ? "Creating task..." : "Create open task"}
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
              Creation options are not available yet
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-500">
              A manager needs at least one authorized sales executive before a
              task can be created. Customer selection is optional.
            </p>
          </div>
        )
      ) : null}
    </section>
  );
}
