import type { Task, TaskStatus, TeamMember } from "../types";

const columns: TaskStatus[] = ["Todo", "In Progress", "Review", "Done"];

type TaskBoardProps = {
  tasks: Task[];
  teamMembers: TeamMember[];
};

export function TaskBoard({ tasks, teamMembers }: TaskBoardProps) {
  function getAssigneeName(assigneeId: number) {
    const assignee = teamMembers.find((member) => member.id === assigneeId);
    return assignee ? `${assignee.name} ${assignee.surname}` : "Unassigned";
  }

  return (
    <section className="board" aria-label="Task board">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column);

        return (
          <div className="board-column" key={column}>
            <div className="board-column__header">
              <h2>{column}</h2>
              <span>{columnTasks.length}</span>
            </div>

            {columnTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{getAssigneeName(task.assigneeId)}</p>
                </div>
                <footer>
                  <span>{task.priority}</span>
                  <span>
                    {task.spentHours}/{task.estimateHours}h
                  </span>
                </footer>
              </article>
            ))}
          </div>
        );
      })}
    </section>
  );
}
