import type { FormEvent } from "react";
import type { AppRole } from "@/features/dashboard/types";
import type {
  NewVisitInput,
  VisitCustomerOption,
  VisitPriority,
} from "@/features/visits/types";

interface VisitPlanningFormProps {
  role: AppRole;
  customers: VisitCustomerOption[];
  salesExecutives: readonly string[];
  defaultDate: string;
  onPlan: (input: NewVisitInput) => void;
}

function getFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isVisitPriority(value: string): value is VisitPriority {
  return value === "high" || value === "medium" || value === "low";
}

export function VisitPlanningForm({
  role,
  customers,
  salesExecutives,
  defaultDate,
  onPlan,
}: VisitPlanningFormProps) {
  const isManager = role === "manager";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerId = getFormValue(formData, "customerId");
    const scheduledDate = getFormValue(formData, "scheduledDate");
    const scheduledTime = getFormValue(formData, "scheduledTime");
    const priority = getFormValue(formData, "priority");
    const assignedSalesExecutive = isManager
      ? getFormValue(formData, "assignedSalesExecutive")
      : "Maya Chen";

    if (
      !customerId ||
      !scheduledDate ||
      !scheduledTime ||
      !assignedSalesExecutive ||
      !isVisitPriority(priority)
    ) {
      return;
    }

    onPlan({
      customerId,
      assignedSalesExecutive,
      scheduledDate,
      scheduledTime,
      priority,
      planningNote: getFormValue(formData, "planningNote") || undefined,
    });
    form.reset();
  }

  return (
    <section
      aria-labelledby="plan-visit-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Session planning
      </p>
      <h2 id="plan-visit-title" className="mt-1 text-lg font-semibold text-slate-950">
        {isManager ? "Plan a team visit" : "Plan my visit"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {isManager
          ? "Add a synthetic visit to the team schedule for this browser session."
          : "Choose from customers assigned to Maya Chen in this demo."}
      </p>

      {customers.length > 0 ? (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Customer
            <select
              name="customerId"
              required
              defaultValue=""
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName} - {customer.territory}
                </option>
              ))}
            </select>
          </label>

          {isManager ? (
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assigned sales executive
              <select
                name="assignedSalesExecutive"
                required
                defaultValue=""
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Select a sales executive
                </option>
                {salesExecutives.map((executive) => (
                  <option key={executive} value={executive}>
                    {executive}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="text-sm font-medium text-slate-700">
            Date
            <input
              name="scheduledDate"
              type="date"
              min={defaultDate}
              defaultValue={defaultDate}
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Time
            <input
              name="scheduledTime"
              type="time"
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Priority
            <select
              name="priority"
              required
              defaultValue="medium"
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Planning note <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              name="planningNote"
              rows={3}
              placeholder="Add context for the visit"
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-span-2"
          >
            Add planned visit
          </button>
        </form>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">No customer options available</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            This demo role has no matching synthetic customers for visit planning.
          </p>
        </div>
      )}
    </section>
  );
}
