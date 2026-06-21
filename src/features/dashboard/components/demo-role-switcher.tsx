import Link from "next/link";
import type { AppRole } from "@/features/dashboard/types";

interface DemoRoleSwitcherProps {
  activeRole: AppRole;
}

const roleLinks: Array<{ role: AppRole; label: string; href: string }> = [
  { role: "manager", label: "Manager", href: "/?role=manager" },
  {
    role: "sales_executive",
    label: "Sales executive",
    href: "/?role=sales_executive",
  },
];

export function DemoRoleSwitcher({ activeRole }: DemoRoleSwitcherProps) {
  return (
    <section
      aria-labelledby="demo-role-switcher-title"
      className="mx-3 mt-4 rounded-xl border border-white/10 bg-white/5 p-2.5 lg:mx-4 lg:mt-0"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 px-1">
        <h2
          id="demo-role-switcher-title"
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300"
        >
          Demo role switcher
        </h2>
        <span className="text-[10px] text-slate-500">Not authentication</span>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-900 p-1">
        {roleLinks.map((item) => {
          const isActive = item.role === activeRole;

          return (
            <Link
              key={item.role}
              href={item.href}
              aria-label={`View ${item.label} demo workspace`}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-9 items-center justify-center rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
