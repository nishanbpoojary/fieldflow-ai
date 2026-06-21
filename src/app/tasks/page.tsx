import { TaskPageShell } from "@/features/tasks/components/task-page-shell";
import {
  TASK_DEMO_TODAY,
  demoTasks,
  resolveTaskDemoRole,
  taskCustomerOptions,
} from "@/features/tasks/data/demo-tasks";

interface TasksPageProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { role: requestedRole } = await searchParams;
  const context = resolveTaskDemoRole(requestedRole);
  const customers =
    context.role === "sales_executive"
      ? taskCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : [];

  return (
    <TaskPageShell
      context={context}
      initialTasks={demoTasks}
      customers={customers}
      demoToday={TASK_DEMO_TODAY}
    />
  );
}
