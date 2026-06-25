import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { ProfileSettingsForm } from "@/features/settings/profile/components/profile-settings-form";
import type { ProfileSettingsProfile } from "@/features/settings/profile/types";

interface ProfileSettingsWorkspaceProps {
  profile: ProfileSettingsProfile;
}

function formatRole(role: ProfileSettingsProfile["role"]) {
  return role === "manager" ? "Manager" : "Sales Executive";
}

export function ProfileSettingsWorkspace({
  profile,
}: ProfileSettingsWorkspaceProps) {
  const roleLabel = formatRole(profile.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={profile.role}
        displayName={profile.displayName}
        jobTitle={profile.jobTitle}
        activeItem="profile-settings"
        isOrganizationAdmin={profile.isOrganizationAdmin}
      />

      <main className="min-w-0 flex-1 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto max-w-5xl min-w-0">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                Account settings
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Active
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Profile Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Update personal display details used across your FieldFlow AI
              workspace. Access and assignment settings stay protected outside
              this page.
            </p>
          </header>

          <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ProfileSettingsForm
              initialDisplayName={profile.displayName}
              initialJobTitle={profile.jobTitle}
            />

            <aside
              aria-labelledby="profile-access-title"
              className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                Read-only access
              </p>
              <h2
                id="profile-access-title"
                className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
              >
                Account permissions
              </h2>
              <dl className="mt-5 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Current role
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {roleLabel}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Account status
                  </dt>
                  <dd className="mt-2">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Organization Admin access
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {profile.isOrganizationAdmin ? "Enabled" : "Not enabled"}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Team, organization, role, account status, and Organization Admin
                access are managed separately. This page cannot change those
                protected settings.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
