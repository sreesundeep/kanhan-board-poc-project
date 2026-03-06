import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRIORITY_CONFIG = {
  low:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Low" },
  medium: { color: "bg-blue-100 text-blue-700 border-blue-200",         dot: "bg-blue-500",    label: "Medium" },
  high:   { color: "bg-orange-100 text-orange-700 border-orange-200",   dot: "bg-orange-500",  label: "High" },
  urgent: { color: "bg-red-100 text-red-700 border-red-200",            dot: "bg-red-500",     label: "Urgent" },
};

export default function TaskCard({ task, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-xl border border-slate-200 p-3 cursor-grab active:cursor-grabbing
        hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50
        ${isDragging ? "opacity-60 shadow-xl shadow-indigo-200/50 rotate-1 scale-105 border-indigo-300" : "shadow-sm"}
        fade-in`}
    >
      {/* Priority indicator bar */}
      <div className={`h-1 w-8 rounded-full mb-2.5 ${priority.dot}`} />

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-800 text-sm leading-snug">{task.title}</h3>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-base leading-none shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50"
            title="Delete task"
          >
            ✕
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 mt-2.5">
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priority.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
      </div>
    </div>
  );
}
