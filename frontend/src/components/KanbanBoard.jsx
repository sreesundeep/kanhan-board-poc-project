import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import Column from "./Column";
import TaskCard from "./TaskCard";

const COLUMNS = [
  { id: "backlog",     title: "Backlog",     icon: "📋", gradient: "from-slate-400 to-slate-500",   bg: "bg-slate-50",   border: "border-slate-200",   badge: "bg-slate-100 text-slate-600" },
  { id: "todo",        title: "To Do",       icon: "📝", gradient: "from-blue-400 to-blue-500",     bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-600" },
  { id: "in_progress", title: "In Progress", icon: "⚡", gradient: "from-amber-400 to-orange-500",  bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-600" },
  { id: "review",      title: "Review",      icon: "🔍", gradient: "from-purple-400 to-purple-500", bg: "bg-purple-50",  border: "border-purple-200",  badge: "bg-purple-100 text-purple-600" },
  { id: "testing",     title: "Testing",     icon: "🧪", gradient: "from-cyan-400 to-teal-500",     bg: "bg-cyan-50",    border: "border-cyan-200",    badge: "bg-cyan-100 text-cyan-600" },
  { id: "done",        title: "Done",        icon: "✅", gradient: "from-emerald-400 to-green-500",  bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-600" },
];

export default function KanbanBoard({ tasks, onUpdateTask, onDeleteTask }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStatus = (status) => tasks.filter((task) => task.status === status);

  const handleDragStart = (event) => {
    setActiveTask(tasks.find((t) => t.id === event.active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    let targetStatus = over.id;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) targetStatus = overTask.status;

    if (task.status !== targetStatus) {
      onUpdateTask(task.id, { status: targetStatus });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {COLUMNS.map((col) => {
          const count = getTasksByStatus(col.id).length;
          return (
            <div key={col.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${col.badge}`}>
              <span>{col.icon}</span>
              <span className="hidden sm:inline">{col.title}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Board — horizontal scroll on mobile, grid on desktop */}
      <div className="kanban-scroll flex lg:grid lg:grid-cols-6 gap-3 sm:gap-4 pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={getTasksByStatus(col.id)}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="drag-overlay">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
