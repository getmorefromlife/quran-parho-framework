import { ChevronLeft, ChevronRight, Users, Eye, Layers, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CircleTurnBarProps = {
  surahName: string;
  totalVerses: number;
  currentTurn: number;
  totalTurns: number;
  turnStartAyah: number;
  turnEndAyah: number;
  chunkSize: number;
  viewStyle: "focused" | "continuous";
  onTurnChange: (turn: number) => void;
  onChunkSizeChange: (size: number) => void;
  onViewStyleChange: (style: "focused" | "continuous") => void;
};

export function CircleTurnBar({
  surahName,
  totalVerses,
  currentTurn,
  totalTurns,
  turnStartAyah,
  turnEndAyah,
  chunkSize,
  viewStyle,
  onTurnChange,
  onChunkSizeChange,
  onViewStyleChange,
}: CircleTurnBarProps) {
  const { tr, lang } = useLang();
  const isUr = lang === "ur";

  const presetSizes = [3, 5, 7, 10, 15];

  return (
    <div className="w-full bg-card/95 backdrop-blur border-b border-gold/30 px-3 py-2 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 shadow-sm sticky top-0 z-20">
      {/* Left section: Circle Badge & Turn Info */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 text-gold font-semibold border border-gold/40 text-xs">
          <Users className="h-3.5 w-3.5" />
          {isUr ? "قرآن سرکل موڈ" : "Circle Turn Mode"}
        </span>

        <span className="font-semibold text-foreground">
          {isUr ? `ٹرن ${currentTurn} از ${totalTurns}` : `Turn ${currentTurn} of ${totalTurns}`}
        </span>

        <span className="text-muted-foreground hidden sm:inline">
          ({isUr ? `آیات ${turnStartAyah}–${turnEndAyah}` : `Ayahs ${turnStartAyah}–${turnEndAyah}`}
          )
        </span>
      </div>

      {/* Middle section: Navigation Buttons */}
      <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => onTurnChange(Math.max(1, currentTurn - 1))}
          disabled={currentTurn <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background hover:border-gold disabled:opacity-40 disabled:hover:border-border transition-all font-medium"
          title={isUr ? "پچھلا ٹرن" : "Previous Turn"}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline">{isUr ? "پچھلا" : "Prev"}</span>
        </button>

        <button
          type="button"
          onClick={() => onTurnChange(1)}
          disabled={currentTurn === 1}
          className="p-1.5 rounded-lg border border-border bg-background hover:border-gold disabled:opacity-40 transition-all text-muted-foreground"
          title={isUr ? "پہلا ٹرن" : "Reset to Turn 1"}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Turn Jump Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-lg border border-gold/40 bg-gold/10 font-bold text-gold hover:bg-gold/20 transition-all text-xs"
            >
              {turnStartAyah}–{turnEndAyah} ▾
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto">
            {Array.from({ length: totalTurns }, (_, i) => {
              const turnNum = i + 1;
              const start = (turnNum - 1) * chunkSize + 1;
              const end = Math.min(turnNum * chunkSize, totalVerses);
              return (
                <DropdownMenuItem
                  key={turnNum}
                  onClick={() => onTurnChange(turnNum)}
                  className={cn(
                    "text-xs flex justify-between gap-4 cursor-pointer",
                    turnNum === currentTurn && "font-bold text-gold bg-gold/10",
                  )}
                >
                  <span>{isUr ? `ٹرن ${turnNum}` : `Turn ${turnNum}`}</span>
                  <span className="text-muted-foreground font-mono">
                    ({start}–{end})
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => onTurnChange(Math.min(totalTurns, currentTurn + 1))}
          disabled={currentTurn >= totalTurns}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gold bg-emerald-gradient text-gold shadow-gold font-medium disabled:opacity-40 disabled:shadow-none transition-all"
          title={isUr ? "اگلا ٹرن" : "Next Turn"}
        >
          <span className="hidden xs:inline">{isUr ? "اگلا" : "Next"}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Right section: Settings (Chunk size & View style) */}
      <div className="flex items-center gap-2">
        {/* Chunk Size Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:border-gold text-xs text-muted-foreground transition-all"
              title="Change Verses per Turn"
            >
              <Layers className="h-3.5 w-3.5 text-gold" />
              <span>{chunkSize} v/turn</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
              {isUr ? "آیات فی ٹرن:" : "Verses Per Turn:"}
            </div>
            {presetSizes.map((sz) => (
              <DropdownMenuItem
                key={sz}
                onClick={() => onChunkSizeChange(sz)}
                className={cn(
                  "text-xs justify-between cursor-pointer",
                  sz === chunkSize && "font-bold text-gold bg-gold/10",
                )}
              >
                <span>
                  {sz} {isUr ? "آیات" : "Verses"}{" "}
                  {sz === 5 ? `(${isUr ? "اسٹینڈرڈ" : "Standard"})` : ""}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => onViewStyleChange("focused")}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1",
              viewStyle === "focused"
                ? "bg-gold/20 text-gold font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={isUr ? "صرف جاری ٹرن (فوکسڈ ویو)" : "Focused Page View"}
          >
            <Eye className="h-3 w-3" />
            <span className="hidden md:inline">{isUr ? "فوکسڈ" : "Focused"}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewStyleChange("continuous")}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1",
              viewStyle === "continuous"
                ? "bg-gold/20 text-gold font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={isUr ? "تمام آیات کارڈز کے ساتھ" : "Continuous Card View"}
          >
            <Layers className="h-3 w-3" />
            <span className="hidden md:inline">{isUr ? "مسلسل" : "Continuous"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
