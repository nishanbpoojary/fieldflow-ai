import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/40 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200"
          >
            FF
          </span>
          <div>
            <p className="font-semibold tracking-tight text-slate-950">
              FieldFlow AI
            </p>
            <p className="text-xs text-slate-500">Operations copilot</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            Secure workspace
          </p>
          <h1
            id="login-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use an existing FieldFlow AI demo account to open its assigned
            workspace.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
