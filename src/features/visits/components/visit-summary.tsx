interface VisitSummaryItem {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "rose" | "slate";
}

interface VisitSummaryProps {
  items: VisitSummaryItem[];
}

const toneStyles: Record<VisitSummaryItem["tone"], string> = {
  blue: "border-t-blue-500 text-blue-950",
  emerald: "border-t-emerald-500 text-emerald-950",
  rose: "border-t-rose-500 text-rose-950",
  slate: "border-t-slate-400 text-slate-900",
};

export function VisitSummary({ items }: VisitSummaryProps) {
  return (
    <section aria-label="Visit summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className={`rounded-2xl border border-t-4 border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${toneStyles[item.tone]}`}
        >
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
