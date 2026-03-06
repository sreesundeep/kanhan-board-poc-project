import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks, onDeleteTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] sm:min-w-[240px] lg:min-w-0 flex flex-col rounded-2xl border ${column.border} ${column.bg} ${
        isOver ? "ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/50 scale-[1.01]" : ""
      }`}
      style={{ minHeight: "calc(100vh - 220px)" }}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-2xl bg-gradient-to-r ${column.gradient}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{column.icon}</span>
          <h2 className="font-semibold text-white text-sm tracking-wide">{column.title}</h2>
        </div>
        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mb-2 shadow-sm">
                <span className="text-lg opacity-40">{column.icon}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
