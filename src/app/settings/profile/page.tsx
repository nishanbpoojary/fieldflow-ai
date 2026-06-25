import { ProfileSettingsWorkspace } from "@/features/settings/profile/components/profile-settings-workspace";
import { requireProfileSettingsUser } from "@/lib/auth/profile-settings";

export default async function ProfileSettingsPage() {
  const profile = await requireProfileSettingsUser();

  return <ProfileSettingsWorkspace profile={profile} />;
}
