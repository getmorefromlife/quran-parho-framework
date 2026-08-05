import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function pill(active: boolean, onClick: () => void, label: string, className?: string) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
        active
          ? "bg-emerald-gradient text-gold border-gold shadow-gold"
          : "bg-card border-border text-muted-foreground hover:border-gold/60",
        className,
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
