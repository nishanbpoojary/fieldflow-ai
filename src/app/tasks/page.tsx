import { TaskPageShell } from "@/features/tasks/components/task-page-shell";
import { getTaskWorkspace } from "@/features/tasks/data/tasks";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function TasksPage() {
  const currentUser = await requireCurrentUser();
  const result = await getTaskWorkspace(currentUser);
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "manager" ? "Manager" : "Sales Executive",
    isOrganizationAdmin: currentUser.isOrganizationAdmin,
  } as const;

  return (
    <TaskPageShell
      context={context}
      displayName={currentUser.displayName}
      result={result}
    />
  );
}
