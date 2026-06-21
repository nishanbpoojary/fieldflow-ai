import type { FormEvent } from "react";
import type {
  FollowUpCustomerOption,
  FollowUpPriority,
  NewFollowUpInput,
} from "@/features/follow-ups/types";

interface FollowUpFormProps {
  customers: FollowUpCustomerOption[];
  defaultDate: string;
  onCreate: (input: NewFollowUpInput) => void;
}

function getFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isFollowUpPriority(value: string): value is FollowUpPriority {
  return value === "high" || value === "medium" || value === "low";
}

export function FollowUpForm({
  customers,
  defaultDate,
  onCreate,
}: FollowUpFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerId = getFormValue(formData, "customerId");
    const title = getFormValue(formData, "title");
    const dueDate = getFormValue(formData, "dueDate");
    const priority = getFormValue(formData, "priority");

    if (!customerId || !title || !dueDate || !isFollowUpPriority(priority)) {
      return;
    }

    onCreate({
      customerId,
      title,
      dueDate,
      priority,
      planningNote: getFormValue(formData, "planningNote") || undefined,
    });
    form.reset();
  }

  return (
    <section
      aria-labelledby="create-follow-up-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Session planning
      </p>
      <h2
        id="create-follow-up-title"
        className="mt-1 text-lg font-semibold text-slate-950"
      >
        Create a follow-up
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Add a next action for one of Maya Chen&apos;s assigned customers.
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

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Next action
            <input
              name="title"
              type="text"
              required
              placeholder="For example, send revised proposal"
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Due date
            <input
              name="dueDate"
              type="date"
              min={defaultDate}
              defaultValue={defaultDate}
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
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
            Planning note{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              name="planningNote"
              rows={3}
              placeholder="Add useful context for the next action"
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-span-2"
          >
            Add follow-up
          </button>
        </form>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No assigned customers
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Maya Chen has no matching synthetic customers for this demo.
          </p>
        </div>
      )}
    </section>
  );
}
