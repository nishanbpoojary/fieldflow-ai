"use client";

import { useMemo, useState } from "react";
import { TaskForm } from "@/features/tasks/components/task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskSummary } from "@/features/tasks/components/task-summary";
import type {
  DemoTask,
  NewTaskInput,
  TaskCustomerOption,
  TaskPageContext,
  TaskStatus,
} from "@/features/tasks/types";

interface TaskWorkflowProps {
  context: TaskPageContext;
  initialTasks: DemoTask[];
  customers: TaskCustomerOption[];
  demoToday: string;
}

const statusOrder: Record<TaskStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  completed: 3,
};

function getStatusForDueDate(dueDate: string, demoToday: string): TaskStatus {
  if (dueDate < demoToday) {
    return "overdue";
  }

  return dueDate === demoToday ? "due_today" : "upcoming";
}

export function TaskWorkflow({
  context,
  initialTasks,
  customers,
  demoToday,
}: TaskWorkflowProps) {
  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const visibleTasks = useMemo(() => {
    const roleTasks =
      context.role === "sales_executive"
        ? tasks.filter((task) => task.assignedSalesExecutive === "Maya Chen")
        : tasks;

    return [...roleTasks].sort((first, second) => {
      const statusComparison =
        statusOrder[first.status] - statusOrder[second.status];

      return statusComparison || first.dueDate.localeCompare(second.dueDate);
    });
  }, [context.role, tasks]);

  const summaryCounts = useMemo<Record<TaskStatus, number>>(
    () => ({
      overdue: visibleTasks.filter((task) => task.status === "overdue").length,
      due_today: visibleTasks.filter((task) => task.status === "due_today").length,
      upcoming: visibleTasks.filter((task) => task.status === "upcoming").length,
      completed: visibleTasks.filter((task) => task.status === "completed").length,
    }),
    [visibleTasks],
  );

  function handleCreate(input: NewTaskInput) {
    if (context.role !== "sales_executive") {
      return;
    }

    const customer = customers.find(
      (option) =>
        option.id === input.customerId &&
        option.assignedSalesExecutive === "Maya Chen",
    );

    if (!customer) {
      return;
    }

    const task: DemoTask = {
      id: `session-task-${Date.now()}`,
      title: input.title,
      customerId: customer.id,
      customerName: customer.companyName,
      territory: customer.territory,
      assignedSalesExecutive: "Maya Chen",
      dueDate: input.dueDate,
      priority: input.priority,
      status: getStatusForDueDate(input.dueDate, demoToday),
      planningNote: input.planningNote,
    };

    setTasks((currentTasks) => [...currentTasks, task]);
    setCompletionId(null);
    setSuccessMessage(`Task created for ${customer.companyName}.`);
  }

  function handleComplete(taskId: string, completionNote: string) {
    const task = tasks.find((candidate) => candidate.id === taskId);

    if (
      context.role !== "sales_executive" ||
      !task ||
      task.assignedSalesExecutive !== "Maya Chen" ||
      task.status === "completed" ||
      !completionNote.trim()
    ) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              status: "completed",
              completionNote: completionNote.trim(),
              completedDate: demoToday,
            }
          : candidate,
      ),
    );
    setCompletionId(null);
    setSuccessMessage(`Task “${task.title}” marked complete.`);
  }

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      <TaskSummary counts={summaryCounts} />

      <div
        className={
          context.role === "sales_executive"
            ? "grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] xl:items-start"
            : "min-w-0"
        }
      >
        {context.role === "sales_executive" ? (
          <TaskForm
            customers={customers}
            defaultDate={demoToday}
            onCreate={handleCreate}
          />
        ) : null}
        <TaskList
          role={context.role}
          tasks={visibleTasks}
          completionId={completionId}
          onStartCompletion={(taskId) => {
            setCompletionId(taskId);
            setSuccessMessage("");
          }}
          onCancelCompletion={() => setCompletionId(null)}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
