import Link from "next/link";

import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import {
  CustomerPriorityBadge,
  CustomerStatusBadge,
} from "@/features/customers/components/customer-badges";
import type {
  CustomerDetailResult,
  CustomerPageContext,
  CustomerRecord,
} from "@/features/customers/types";

interface CustomerDetailProps {
  context: CustomerPageContext;
  displayName: string;
  result: CustomerDetailResult;
}

export function CustomerDetail({
  context,
  displayName,
  result,
}: CustomerDetailProps) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar
        activeItem="customers"
        role={context.role}
        displayName={displayName}
        isOrganizationAdmin={context.isOrganizationAdmin}
      />

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <Link
              href="/customers"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span aria-hidden="true" className="mr-2">
                &larr;
              </span>
              Back to{" "}
              {context.role === "sales_executive"
                ? "My Customers"
                : "Team Customer Directory"}
            </Link>
          </div>
        </header>

        {result.status === "ready" ? (
          <CustomerDetailContent context={context} customer={result.customer} />
        ) : (
          <CustomerUnavailable status={result.status} />
        )}
      </main>
    </div>
  );
}

function CustomerDetailContent({
  context,
  customer,
}: {
  context: CustomerPageContext;
  customer: CustomerRecord;
}) {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-300/50 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-64 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-200">
                Synthetic database data
              </span>
              <span className="text-xs text-slate-400">
                {context.roleLabel} view
              </span>
            </div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {customer.companyName}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {customer.contactPerson} &middot; {customer.territory}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CustomerStatusBadge status={customer.status} />
            <CustomerPriorityBadge priority={customer.priority} />
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="space-y-6">
          <section
            aria-labelledby="customer-summary-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
          >
            <h2
              id="customer-summary-title"
              className="text-lg font-semibold text-slate-950"
            >
              Customer summary
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailFact label="Territory" value={customer.territory} />
              <DetailFact
                label="Assigned sales executive"
                value={customer.assignedSalesExecutive}
              />
              <DetailFact
                label="Last interaction"
                value={customer.lastInteractionDate}
              />
              <DetailFact
                label="Next follow-up"
                value={customer.nextFollowUpDate}
              />
            </dl>
          </section>

          <section
            aria-labelledby="notes-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
          >
            <h2
              id="notes-title"
              className="text-lg font-semibold text-slate-950"
            >
              Account notes
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {customer.notes}
            </p>
          </section>
        </div>

        <section
          aria-labelledby="contact-title"
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
        >
          <h2
            id="contact-title"
            className="text-lg font-semibold text-slate-950"
          >
            Contact information
          </h2>
          <dl className="mt-5 space-y-4">
            <DetailFact
              label="Contact person"
              value={customer.contactPerson}
            />
            <DetailFact label="Synthetic phone" value={customer.phone} />
            <DetailFact
              label="Synthetic email"
              value={customer.email}
              breakValue
            />
          </dl>
        </section>
      </div>

      <section
        aria-labelledby="read-only-title"
        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
      >
        <h2
          id="read-only-title"
          className="text-sm font-semibold text-slate-800"
        >
          Read-only customer profile
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Customer editing and operational workflow history are intentionally
          outside this integration step.
        </p>
      </section>

      <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>FieldFlow AI customer detail</p>
        <p>All displayed customer records are synthetic database data.</p>
      </footer>
    </div>
  );
}

function CustomerUnavailable({
  status,
}: {
  status: "not_found" | "unavailable";
}) {
  const isUnavailable = status === "unavailable";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60 sm:p-10">
        <span
          aria-hidden="true"
          className={`mx-auto grid size-12 place-items-center rounded-full text-lg font-semibold ${
            isUnavailable
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isUnavailable ? "!" : "?"}
        </span>
        <h1 className="mt-5 text-xl font-semibold text-slate-950">
          {isUnavailable
            ? "Customer data is temporarily unavailable"
            : "Customer unavailable"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          {isUnavailable
            ? "We could not load this customer profile. Please try again shortly."
            : "This customer record is unavailable or you do not have access to it."}
        </p>
        <Link
          href="/customers"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Return to customer directory
        </Link>
      </section>
    </div>
  );
}

function DetailFact({
  label,
  value,
  breakValue = false,
}: {
  label: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-sm font-semibold text-slate-800 ${breakValue ? "break-all" : "break-words"}`}
      >
        {value}
      </dd>
    </div>
  );
}
