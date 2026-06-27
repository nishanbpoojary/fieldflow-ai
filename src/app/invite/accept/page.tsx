import { redirect } from "next/navigation";

import {
  InviteAcceptancePage,
  InviteUnavailablePage,
} from "@/features/invite/accept/components/invite-acceptance-page";
import { getInviteRecipientAccess } from "@/lib/auth/invite-recipient";

export default async function InviteAcceptPage() {
  const access = await getInviteRecipientAccess();

  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  if (access.status === "active") {
    redirect("/");
  }

  if (access.status !== "invited") {
    return <InviteUnavailablePage />;
  }

  return <InviteAcceptancePage initialDisplayName={access.displayName} />;
}
