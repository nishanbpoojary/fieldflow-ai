import Link from "next/link";
import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import {
  CustomerPriorityBadge,
  CustomerStatusBadge,
} from "@/features/customers/components/customer-badges";
import type {
  CustomerPageContext,
  DemoCustomer,
} from "@/features/customers/types";

interface CustomerDirectoryProps {
  context: CustomerPageContext;
  customers: DemoCustomer[];
  displayName: string;
}

export function CustomerDirectory({
  context,
  customers,
  displayName,
}: CustomerDirectoryProps) {
  const isSalesExecutive = context.role === "sales_executive";
  const title = isSalesExecutive ? "My Customers" : "Team Customer Directory";
  const description = isSalesExecutive
    ? "A representative demo subset of customers assigned to Maya Chen."
    : "A representative team demo subset, not all 148 customers shown in dashboard totals.";

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar
        activeItem="customers"
        role={context.role}
        displayName={displayName}
      />

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {title}
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Demo data
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Demo view
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {context.roleLabel}
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
          <section
            aria-labelledby="customer-list-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  Customer coverage
                </p>
                <h2
                  id="customer-list-title"
                  className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
                >
                  {isSalesExecutive ? "Assigned accounts" : "Team accounts"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a customer to review their static activity details.
                </p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {customers.length} demo {customers.length === 1 ? "customer" : "customers"}
              </span>
            </div>

            {customers.length > 0 ? (
              <ul className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {customers.map((customer) => (
                  <li key={customer.id} className="min-w-0">
                    <article className="h-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words text-base font-semibold text-slate-900">
                            {customer.companyName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer.territory}
                          </p>
                        </div>
                        <CustomerStatusBadge status={customer.status} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <CustomerPriorityBadge priority={customer.priority} />
                      </div>

                      <dl className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
                        {!isSalesExecutive ? (
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                            <dt className="text-xs text-slate-500">Assigned executive</dt>
                            <dd className="text-xs font-semibold text-slate-700">
                              {customer.assignedSalesExecutive}
                            </dd>
                          </div>
                        ) : null}
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                          <dt className="text-xs text-slate-500">Next follow-up</dt>
                          <dd className="text-xs font-semibold text-slate-700">
                            {customer.nextFollowUpDate}
                          </dd>
                        </div>
                      </dl>

                      <Link
                        href={`/customers/${customer.id}`}
                        aria-label={`View ${customer.companyName} customer details as ${context.roleLabel}`}
                        className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        View customer details
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-sm font-semibold text-slate-800">
                  No demo customers available
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This role does not currently have matching records in the synthetic dataset.
                </p>
              </div>
            )}
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>FieldFlow AI customer directory</p>
            <p>Demo filtering is not authentication or authorization.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
