import { SectionHeading } from "@/features/dashboard/components/section-heading";
import { assignedCustomers } from "@/features/dashboard/data/sales-executive-dashboard";
import type { CustomerStatus } from "@/features/dashboard/types";

const customerStatusStyles: Record<CustomerStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  "Follow-up needed": "bg-rose-50 text-rose-700",
  New: "bg-blue-50 text-blue-700",
};

export function AssignedCustomers() {
  return (
    <section
      aria-labelledby="assigned-customers-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="assigned-customers-title">
        <SectionHeading
          title="Assigned customers"
          description="Accounts with the nearest follow-up dates."
        />
      </div>

      <ul className="mt-5 divide-y divide-slate-100">
        {assignedCustomers.map((customer) => (
          <li key={customer.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {customer.companyName}
                </p>
                <p className="mt-1 text-xs text-slate-500">{customer.territory}</p>
              </div>
              <span
                className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${customerStatusStyles[customer.status]}`}
              >
                {customer.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Next follow-up
              </span>
              <time className="text-xs font-semibold text-slate-700">
                {customer.nextFollowUp}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
