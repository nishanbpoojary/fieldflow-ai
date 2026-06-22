import { TaskPageShell } from "@/features/tasks/components/task-page-shell";
import {
  TASK_DEMO_TODAY,
  demoTasks,
  resolveTaskDemoRole,
  taskCustomerOptions,
} from "@/features/tasks/data/demo-tasks";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function TasksPage() {
  const currentUser = await requireCurrentUser();
  const context = resolveTaskDemoRole(currentUser.role);
  const customers =
    context.role === "sales_executive"
      ? taskCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : [];

  return (
    <TaskPageShell
      context={context}
      displayName={currentUser.displayName}
      initialTasks={demoTasks}
      customers={customers}
      demoToday={TASK_DEMO_TODAY}
    />
  );
}
