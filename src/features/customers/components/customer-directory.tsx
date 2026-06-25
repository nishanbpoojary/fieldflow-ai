import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { CustomerList } from "@/features/customers/components/customer-list";
import type {
  CustomerDirectoryResult,
  CustomerPageContext,
} from "@/features/customers/types";

interface CustomerDirectoryProps {
  context: CustomerPageContext;
  displayName: string;
  jobTitle?: string | null;
  result: CustomerDirectoryResult;
}

export function CustomerDirectory({
  context,
  displayName,
  jobTitle,
  result,
}: CustomerDirectoryProps) {
  const isSalesExecutive = context.role === "sales_executive";
  const title = isSalesExecutive ? "My Customers" : "Team Customer Directory";
  const description = isSalesExecutive
    ? "Authorized customer accounts assigned to your sales profile."
    : "Authorized customer coverage across your current sales team.";
  const customers = result.status === "ready" ? result.customers : [];

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar
        activeItem="customers"
        role={context.role}
        displayName={displayName}
        jobTitle={jobTitle}
        isOrganizationAdmin={context.isOrganizationAdmin}
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
                  Synthetic database data
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Authorized view
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
                  Search the current authorized records and open a customer profile.
                </p>
              </div>
              {result.status === "ready" ? (
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {customers.length} {customers.length === 1 ? "customer" : "customers"}
                </span>
              ) : null}
            </div>

            {result.status === "unavailable" ? (
              <DirectoryState
                title="Customer data is temporarily unavailable"
                description="We could not load the authorized customer directory. Please refresh the page or try again shortly."
                tone="warning"
              />
            ) : customers.length === 0 ? (
              <DirectoryState
                title="No customers available"
                description={
                  isSalesExecutive
                    ? "No customer records are currently assigned to your sales profile."
                    : "This team does not currently have customer records to display."
                }
                tone="empty"
              />
            ) : (
              <CustomerList
                customers={customers}
                roleLabel={context.roleLabel}
                showAssignedExecutive={!isSalesExecutive}
              />
            )}
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>FieldFlow AI customer directory</p>
            <p>Access is limited by the authenticated profile and database policies.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function DirectoryState({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "empty" | "warning";
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <span
        aria-hidden="true"
        className={`mx-auto grid size-11 place-items-center rounded-full text-sm font-bold ${
          tone === "warning"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {tone === "warning" ? "!" : "0"}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
