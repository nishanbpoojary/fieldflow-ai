"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
      <h3 className="text-base font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
        {description}
      </p>
      <div className="mt-5 min-w-0">{children}</div>
    </article>
  );
}
