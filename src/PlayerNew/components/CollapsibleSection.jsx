import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollapsibleSection({
  id,
  title,
  icon: Icon,
  expanded,
  onToggle,
  actions,
  children,
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="flex-1 flex items-center justify-between gap-3 text-left"
        >
          <h2 className="text-2xl font-bold text-[#1d4281] flex items-center gap-2">
            {Icon ? <Icon className="w-6 h-6" /> : null}
            {title}
          </h2>
          <span className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-6 h-6 text-[#1d4281]" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[#1d4281]" />
            )}
          </span>
        </button>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>

      {expanded ? children : null}
    </div>
  );
}

