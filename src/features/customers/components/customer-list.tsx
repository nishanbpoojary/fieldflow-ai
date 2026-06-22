"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CustomerPriorityBadge,
  CustomerStatusBadge,
} from "@/features/customers/components/customer-badges";
import type {
  CustomerRecord,
  CustomerStatus,
} from "@/features/customers/types";

const customerStatusOptions: CustomerStatus[] = [
  "Prospect",
  "Active",
  "At risk",
  "Converted",
  "Inactive",
];

interface CustomerListProps {
  customers: CustomerRecord[];
  roleLabel: string;
  showAssignedExecutive: boolean;
}

export function CustomerList({
  customers,
  roleLabel,
  showAssignedExecutive,
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return customers.filter((customer) => {
      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          customer.companyName,
          customer.contactPerson,
          customer.territory,
          customer.assignedSalesExecutive,
        ].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesSearch;
    });
  }, [customers, searchQuery, statusFilter]);

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
        <div>
          <label
            htmlFor="customer-search"
            className="text-xs font-semibold text-slate-700"
          >
            Search customers
          </label>
          <input
            id="customer-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Company, contact, territory, or executive"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          />
        </div>
        <div>
          <label
            htmlFor="customer-status-filter"
            className="text-xs font-semibold text-slate-700"
          >
            Customer status
          </label>
          <select
            id="customer-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | CustomerStatus)
            }
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          >
            <option value="all">All statuses</option>
            {customerStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500" aria-live="polite">
        Showing {filteredCustomers.length} of {customers.length} customers
      </p>

      {filteredCustomers.length > 0 ? (
        <ul className="mt-4 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredCustomers.map((customer) => (
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
                  {showAssignedExecutive ? (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                      <dt className="text-xs text-slate-500">
                        Assigned executive
                      </dt>
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
                  aria-label={`View ${customer.companyName} customer details as ${roleLabel}`}
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
            No customers match these filters
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Try a different search term or select another customer status.
          </p>
        </div>
      )}
    </>
  );
}
