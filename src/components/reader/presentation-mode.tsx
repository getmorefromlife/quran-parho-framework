import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  MessageSquareQuote,
  Timer,
  Users,
  Sun,
  Moon,
  Sparkles,
  Type,
  Layers,
  BookOpen,
  Columns,
  Monitor,
  BookOpenText,
  Languages,
  Clock,
  MessageSquare,
  Hourglass,
  RotateCcw,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QVerse } from "@/lib/quran-data";
import { getFontFamily, type ReaderPrefs } from "@/lib/reader-fonts";

export type PresentationModeProps = {
  surahN: number;
  verses: QVerse[];
  currentAyah: number;
  maxVerses: number;
  surahEn: string;
  surahAr: string;
  onNavigateAyah: (ayah: number) => void;
  onNavigateSurah: (n: number) => void;
  audioPlaying: boolean;
  onToggleAudio: (ayah: number) => void;
  onClose: () => void;
  turnNumber?: number;
  totalTurns?: number;
  turnStartAyah?: number;
  turnEndAyah?: number;
  prefs?: ReaderPrefs;
};

type ThemeStyle = "light" | "parchment" | "emerald" | "midnight" | "oled";

const THEMES: Record<
  ThemeStyle,
  { bg: string; text: string; gold: string; border: string; cardBg: string; isLight: boolean }
> = {
  light: {
    bg: "bg-slate-100",
    text: "text-slate-900",
    gold: "text-amber-800",
    border: "border-slate-300",
    cardBg: "bg-white/90",
    isLight: true,
  },
  parchment: {
    bg: "bg-[#f5efdf]",
    text: "text-[#2a2118]",
    gold: "text-amber-900",
    border: "border-[#dfd3b9]",
    cardBg: "bg-[#ebdcb9]/80",
    isLight: true,
  },
  emerald: {
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    gold: "text-amber-400",
    border: "border-emerald-800/60",
    cardBg: "bg-zinc-900/60",
    isLight: false,
  },
  midnight: {
    bg: "bg-slate-950",
    text: "text-slate-100",
    gold: "text-gold",
    border: "border-slate-800/60",
    cardBg: "bg-zinc-900/60",
    isLight: false,
  },
  oled: {
    bg: "bg-black",
    text: "text-white",
    gold: "text-yellow-400",
    border: "border-zinc-800",
    cardBg: "bg-zinc-900/80",
    isLight: false,
  },
};

export function PresentationMode({
  surahN,
  verses,
  currentAyah,
  maxVerses,
  surahEn,
  surahAr,
  onNavigateAyah,
  onNavigateSurah,
  audioPlaying,
  onToggleAudio,
  onClose,
  turnNumber,
  totalTurns,
  turnStartAyah,
  turnEndAyah,
  prefs,
}: PresentationModeProps) {
  const { lang } = useLang();

  const [fontSizeRem, setFontSizeRem] = useState(3.2);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("midnight");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

  // Content Display Mode: both (Arabic+Translation) | translation_only | arabic_only
  const [contentMode, setContentMode] = useState<"both" | "translation_only" | "arabic_only">(
    "both",
  );

  // Live Session & Q&A Timers
  const [sessionTimer, setSessionTimer] = useState(3600); // 60 minutes
  const [sessionActive, setSessionActive] = useState(false);

  const [qaTimer, setQaTimer] = useState(900); // 15 minutes
  const [qaActive, setQaActive] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(300); // 5-min turn timer
  const [timerActive, setTimerActive] = useState(false);

  const [viewMode, setViewMode] = useState<"turn_block" | "single_verse">("turn_block");
  const [layoutWidth, setLayoutWidth] = useState<"wide" | "centered">("wide");
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);

  // Turn block calculation (5 verses)
  const blockStart = turnStartAyah || Math.floor((currentAyah - 1) / 5) * 5 + 1;
  const blockEnd = turnEndAyah || Math.min(blockStart + 4, maxVerses);
  const turnBlockVerses = verses.filter((v) => v.ayah >= blockStart && v.ayah <= blockEnd);

  const activeVerse = verses.find((v) => v.ayah === currentAyah) || verses[0];
  const hasPrev = currentAyah > 1 || surahN > 1;
  const hasNext = currentAyah < maxVerses || surahN < 114;

  const currentTheme = THEMES[themeStyle];

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Navigate next verse
  const handleNext = useCallback(() => {
    if (currentAyah < maxVerses) {
      onNavigateAyah(currentAyah + 1);
    } else if (surahN < 114) {
      onNavigateSurah(surahN + 1);
    }
  }, [currentAyah, maxVerses, surahN, onNavigateAyah, onNavigateSurah]);

  // Navigate prev verse
  const handlePrev = useCallback(() => {
    if (currentAyah > 1) {
      onNavigateAyah(currentAyah - 1);
    } else if (surahN > 1) {
      onNavigateSurah(surahN - 1);
    }
  }, [currentAyah, surahN, onNavigateAyah, onNavigateSurah]);

  // Keyboard navigation & remote control listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Timers countdown intervals
  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setSessionTimer((sec) => (sec > 0 ? sec - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (!qaActive) return;
    const interval = setInterval(() => {
      setQaTimer((sec) => (sec > 0 ? sec - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [qaActive]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds((sec) => (sec > 0 ? sec - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none transition-colors duration-500",
        currentTheme.bg,
        currentTheme.text,
      )}
    >
      {/* ── Top Bar ── */}
      <div
        className={cn(
          "sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl",
          currentTheme.border,
        )}
      >
        {/* Left: Surah Title & Mushaf Info */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-serif-display text-white">{surahEn}</span>
              <span className={cn("text-xl font-arabic font-bold", currentTheme.gold)}>
                {surahAr}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Surah {surahN} · Ayah {currentAyah} of {maxVerses}
            </div>
          </div>

          {/* Circle Turn Indicator Badge */}
          {turnNumber && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold shadow-gold">
              <Users className="h-3.5 w-3.5" />
              <span>
                {lang === "ur"
                  ? `ٹرن ${turnNumber} (آیات ${turnStartAyah}–${turnEndAyah})`
                  : `Turn ${turnNumber} of ${totalTurns} (Ayahs ${turnStartAyah}–${turnEndAyah})`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Projector Controls & Prominent Timers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent Timers Bar */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 gap-1">
            {/* Session Timer (60m) */}
            <button
              onClick={() => {
                setSessionActive((v) => !v);
                if (!sessionActive && sessionTimer === 0) setSessionTimer(3600);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                sessionActive
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-300 hover:text-white",
              )}
              title="1-Hour Session Timer (Click to Play/Pause)"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(sessionTimer)}</span>
            </button>

            {/* Q&A Timer (15m) */}
            <button
              onClick={() => {
                setQaActive((v) => !v);
                if (!qaActive && qaTimer === 0) setQaTimer(900);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                qaActive ? "bg-blue-500 text-white shadow-sm" : "text-zinc-300 hover:text-white",
              )}
              title="Circle Q&A Timer (Click to Play/Pause)"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Q&A: {formatTimer(qaTimer)}</span>
            </button>

            {/* Turn Pace Timer (5m) */}
            <button
              onClick={() => {
                setTimerActive((v) => !v);
                if (!timerActive && timerSeconds === 0) setTimerSeconds(300);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                timerActive
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-300 hover:text-white",
              )}
              title="5-Minute Turn Pace Timer"
            >
              <Hourglass className="h-3.5 w-3.5" />
              <span>Turn: {formatTimer(timerSeconds)}</span>
            </button>
          </div>

          {/* Content Mode Switcher (Both vs Translation Only vs Arabic Only) */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setContentMode("both")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                contentMode === "both"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Show Arabic & Translation"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Both</span>
            </button>
            <button
              onClick={() => setContentMode("translation_only")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                contentMode === "translation_only"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Translation Only View (Focus on Understanding)"
            >
              <BookOpenText className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Translation Only</span>
            </button>
            <button
              onClick={() => setContentMode("arabic_only")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                contentMode === "arabic_only"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Arabic Only View"
            >
              <Type className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Arabic Only</span>
            </button>
          </div>

          {/* Theme Selector: Light | Parchment | Emerald | Midnight | OLED */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setThemeStyle("light")}
              className={cn(
                "w-6 h-6 rounded-lg bg-slate-100 border transition-all cursor-pointer",
                themeStyle === "light"
                  ? "border-amber-600 ring-1 ring-amber-600"
                  : "border-slate-300",
              )}
              title="Light Clean Theme"
            />
            <button
              onClick={() => setThemeStyle("parchment")}
              className={cn(
                "w-6 h-6 rounded-lg bg-[#f5efdf] border transition-all cursor-pointer",
                themeStyle === "parchment"
                  ? "border-amber-700 ring-1 ring-amber-700"
                  : "border-[#dfd3b9]",
              )}
              title="Parchment Reading Theme"
            />
            <button
              onClick={() => setThemeStyle("emerald")}
              className={cn(
                "w-6 h-6 rounded-lg bg-emerald-950 border transition-all cursor-pointer",
                themeStyle === "emerald"
                  ? "border-amber-400 ring-1 ring-amber-400"
                  : "border-emerald-800",
              )}
              title="Emerald Theme"
            />
            <button
              onClick={() => setThemeStyle("midnight")}
              className={cn(
                "w-6 h-6 rounded-lg bg-slate-900 border transition-all cursor-pointer",
                themeStyle === "midnight" ? "border-gold ring-1 ring-gold" : "border-slate-700",
              )}
              title="Midnight Dark Theme"
            />
            <button
              onClick={() => setThemeStyle("oled")}
              className={cn(
                "w-6 h-6 rounded-lg bg-black border transition-all cursor-pointer",
                themeStyle === "oled"
                  ? "border-yellow-400 ring-1 ring-yellow-400"
                  : "border-zinc-700",
              )}
              title="High-Contrast OLED Theme"
            />
          </div>

          {/* Font Size Scaler */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 gap-1">
            <Type className="h-3.5 w-3.5 text-zinc-400" />
            <button
              onClick={() => setFontSizeRem((s) => Math.max(2.0, s - 0.4))}
              className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="text-[10px] font-mono text-zinc-500">{fontSizeRem.toFixed(1)}</span>
            <button
              onClick={() => setFontSizeRem((s) => Math.min(5.5, s + 0.4))}
              className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* View Mode Switcher: 5-Verse Turn Block vs Single Verse */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("turn_block")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                viewMode === "turn_block"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="5-Verse Turn Block View"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Turn Block</span>
            </button>
            <button
              onClick={() => setViewMode("single_verse")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                viewMode === "single_verse"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Single Verse View"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Single Verse</span>
            </button>
          </div>

          {/* Screen Width Layout Switcher: Wide HD vs Centered */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setLayoutWidth("wide")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                layoutWidth === "wide"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Wide HD Layout (Uses Full Screen Space for 5 Verses)"
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Wide HD</span>
            </button>
            <button
              onClick={() => setLayoutWidth("centered")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                layoutWidth === "centered"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
              title="Centered Focus Layout"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Centered</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer"
            title={lang === "en" ? "Toggle Fullscreen (F)" : "فل اسکرین"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Close Projector Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            title={lang === "en" ? "Exit Presentation Mode (Esc)" : "بند کریں"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Initial Fullscreen Launch Request Modal ── */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30 mx-auto shadow-gold">
              <Maximize2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {lang === "ur"
                  ? "کیا آپ فل اسکرین پروجیکٹر موڈ چاہتے ہیں؟"
                  : "Launch Fullscreen HD Mode?"}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {lang === "ur"
                  ? "پروجیکٹر یا ٹی وی اسکرین پر تمام 5 آیات کو ایک ساتھ واضح انداز میں دکھانے کے لیے فل اسکرین فعال کریں۔"
                  : "Expand presentation across your entire TV or projector display to view all 5 verses on one HD screen."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                onClick={() => {
                  toggleFullscreen();
                  setShowFullscreenPrompt(false);
                }}
                className="w-full sm:flex-1 bg-emerald-gradient text-white text-sm font-bold py-3 rounded-xl shadow-gold cursor-pointer"
              >
                {lang === "ur"
                  ? "جی ہاں، فل اسکرین کریں (مستحسن)"
                  : "Yes, Launch Fullscreen (Recommended)"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFullscreenPrompt(false)}
                className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white py-3 rounded-xl cursor-pointer text-sm"
              >
                {lang === "ur" ? "ونڈوڈ میں جاری رکھیں" : "Windowed View"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Presentation Stage ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-16">
        <div
          className={cn(
            "mx-auto w-full text-center space-y-6 transition-all duration-300",
            layoutWidth === "wide" ? "max-w-[96vw]" : "max-w-5xl",
          )}
        >
          {viewMode === "turn_block" ? (
            /* ── 5-Verse Turn Block View ── */
            <div className="space-y-6">
              {/* Block Header Badge */}
              <div className="flex items-center justify-center gap-3">
                <span
                  className={cn(
                    "px-4 py-1.5 rounded-full border text-sm font-bold font-mono tracking-wider shadow-sm",
                    currentTheme.border,
                    currentTheme.gold,
                  )}
                >
                  Turn Block: Ayahs {blockStart}–{blockEnd} ({turnBlockVerses.length} Verses on
                  Screen)
                </span>
              </div>

              {/* List of Verses in this Turn Block */}
              <div
                className={cn(
                  "gap-4 text-left",
                  layoutWidth === "wide" ? "grid lg:grid-cols-1 space-y-4" : "space-y-8",
                )}
              >
                {turnBlockVerses.map((v) => (
                  <div
                    key={v.ayah}
                    className={cn(
                      "p-4 sm:p-5 rounded-2xl border transition-all",
                      currentTheme.border,
                      currentTheme.cardBg,
                      "backdrop-blur-sm shadow-md",
                    )}
                  >
                    {contentMode === "translation_only" ? (
                      /* Translation-Only Focus Mode */
                      <div className="space-y-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950 text-sm font-bold text-amber-400">
                            {v.ayah}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-amber-500/80 tracking-wider">
                            {lang === "ur" ? "ترجمہ فہم موڈ" : "Translation Focus"}
                          </span>
                        </div>
                        {v.english_qarai && (
                          <p className="text-lg sm:text-xl lg:text-2xl font-serif leading-relaxed text-zinc-100">
                            "{v.english_qarai}"
                          </p>
                        )}
                        {v.urdu_jawadi && (
                          <p
                            dir="rtl"
                            className="text-lg sm:text-xl lg:text-2xl font-arabic leading-relaxed text-amber-200/95 text-right pt-1"
                          >
                            "{v.urdu_jawadi}"
                          </p>
                        )}
                      </div>
                    ) : contentMode === "arabic_only" ? (
                      /* Arabic-Only Calligraphy Mode */
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex align-middle h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950 text-sm font-bold text-amber-400 shrink-0">
                          {v.ayah}
                        </span>
                        <p
                          dir="rtl"
                          className={cn(
                            "font-arabic font-semibold leading-relaxed tracking-wide text-right flex-1",
                            currentTheme.gold,
                          )}
                          style={{ fontSize: `${fontSizeRem * 0.9}rem` }}
                        >
                          {v.arabic}
                        </p>
                      </div>
                    ) : layoutWidth === "wide" ? (
                      /* Both (Wide 2-Column Layout): Left = Translations | Right = Arabic */
                      <div className="grid md:grid-cols-12 gap-6 items-center">
                        {/* Left Side (Cols 1 to 6): English & Urdu Translations */}
                        <div className="md:col-span-6 space-y-2 text-left order-2 md:order-1">
                          {v.english_qarai && (
                            <p className="text-base sm:text-lg lg:text-xl font-serif text-zinc-200 leading-relaxed">
                              "{v.english_qarai}"
                            </p>
                          )}
                          {v.urdu_jawadi && (
                            <p
                              dir="rtl"
                              className="text-base sm:text-lg lg:text-xl font-arabic text-amber-200/90 leading-relaxed text-right"
                            >
                              "{v.urdu_jawadi}"
                            </p>
                          )}
                        </div>

                        {/* Right Side (Cols 7 to 12): Arabic Calligraphy & Ayah Number */}
                        <div className="md:col-span-6 flex items-start justify-end gap-4 order-1 md:order-2">
                          <p
                            dir="rtl"
                            className={cn(
                              "font-arabic font-semibold leading-relaxed tracking-wide text-right flex-1",
                              currentTheme.gold,
                            )}
                            style={{ fontSize: `${fontSizeRem * 0.85}rem` }}
                          >
                            {v.arabic}
                          </p>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950 text-sm font-bold text-amber-400 shrink-0">
                            {v.ayah}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Both (Standard Stacked Layout) */
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <span className="inline-flex align-middle h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950 text-sm font-bold text-amber-400 shrink-0">
                            {v.ayah}
                          </span>
                          <p
                            dir="rtl"
                            className={cn(
                              "font-arabic font-semibold leading-relaxed tracking-wide text-right flex-1",
                              currentTheme.gold,
                            )}
                            style={{ fontSize: `${fontSizeRem * 0.85}rem` }}
                          >
                            {v.arabic}
                          </p>
                        </div>

                        {v.english_qarai && (
                          <p className="text-lg sm:text-xl font-serif text-zinc-200 leading-relaxed pl-12">
                            "{v.english_qarai}"
                          </p>
                        )}
                        {v.urdu_jawadi && (
                          <p
                            dir="rtl"
                            className="text-lg sm:text-xl font-arabic text-amber-200/90 leading-relaxed text-right pr-2"
                          >
                            "{v.urdu_jawadi}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Turn Completion Banner */}
              <div className="mt-6 p-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-300 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="text-left">
                  <div className="font-bold text-sm">
                    {lang === "ur"
                      ? "یہ 5 آیات کا ٹرن مکمل ہو گیا — اگلا فریق مائیک سنبھالیں"
                      : "Turn Block Complete — Pass Mic to Next Participant"}
                  </div>
                  <div className="text-xs text-amber-200/80">
                    {lang === "ur"
                      ? `اگلی آیات: ${Math.min(blockEnd + 1, maxVerses)}–${Math.min(blockEnd + 5, maxVerses)}`
                      : `Up Next: Verses ${Math.min(blockEnd + 1, maxVerses)}–${Math.min(blockEnd + 5, maxVerses)}`}
                  </div>
                </div>
                <Button
                  onClick={handleNext}
                  className="bg-emerald-gradient text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-gold cursor-pointer"
                >
                  {lang === "ur" ? "اگلا ٹرن (→)" : "Next Turn (→)"}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Single Verse View ── */
            <>
              {/* Ayah Badge & Audio Play */}
              <div className="flex items-center justify-center gap-3">
                <span
                  className={cn(
                    "px-4 py-1.5 rounded-full border text-sm font-bold font-mono tracking-wider shadow-sm",
                    currentTheme.border,
                    currentTheme.gold,
                  )}
                >
                  Ayah {currentAyah}
                </span>
                <Button
                  size="icon"
                  onClick={() => onToggleAudio(currentAyah)}
                  className={cn(
                    "h-10 w-10 rounded-full text-white shadow-gold cursor-pointer transition-all",
                    audioPlaying
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-emerald-gradient hover:opacity-90",
                  )}
                  title={audioPlaying ? "Pause Audio" : "Play Recitation"}
                >
                  {audioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
              </div>

              {/* Ultra-Large Arabic Text */}
              {activeVerse && (
                <div
                  dir="rtl"
                  className={cn(
                    "font-arabic font-semibold leading-relaxed tracking-wide transition-all duration-300",
                    currentTheme.gold,
                  )}
                  style={{ fontSize: `${fontSizeRem}rem` }}
                >
                  {activeVerse.arabic}
                </div>
              )}

              {/* English & Urdu Translations */}
              {activeVerse && (
                <div className="space-y-4 max-w-3xl mx-auto pt-4 border-t border-zinc-800/60">
                  {activeVerse.english_qarai && (
                    <p className="text-xl sm:text-2xl font-serif text-zinc-200 leading-relaxed">
                      "{activeVerse.english_qarai}"
                    </p>
                  )}
                  {activeVerse.urdu_jawadi && (
                    <p
                      dir="rtl"
                      className="text-xl sm:text-2xl font-arabic text-amber-200/90 leading-relaxed pt-2"
                    >
                      "{activeVerse.urdu_jawadi}"
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Discussion Prompts Drawer (Slide-up) ── */}
      {showPrompts && (
        <div className="bg-zinc-900/95 border-t border-amber-500/40 p-6 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                <MessageSquareQuote className="h-4.5 w-4.5" />
                <span>
                  {lang === "en"
                    ? "Circle Reflection & Discussion Prompts"
                    : "سرکل مباحثہ کے سوالات"}
                </span>
              </div>
              <button
                onClick={() => setShowPrompts(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Close Prompts
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-zinc-200">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <strong className="text-amber-400 block mb-1">1. Practical Reflection:</strong>
                How can we implement the guidance of Ayah {currentAyah} in our daily family and
                neighborhood life?
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <strong className="text-amber-400 block mb-1">2. Linguistic & Moral Focus:</strong>
                What core attributes or commands of Allah are highlighted in this verse?
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation & Remote Toolbar ── */}
      <div
        className={cn(
          "sticky bottom-0 z-10 px-8 py-4 flex items-center justify-between border-t backdrop-blur-xl",
          currentTheme.border,
        )}
      >
        {/* Previous Verse Button */}
        <Button
          variant="outline"
          disabled={!hasPrev}
          onClick={handlePrev}
          className="h-12 px-6 rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-base font-semibold gap-2 cursor-pointer disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5 text-amber-400" />
          <span>{lang === "en" ? "Previous Verse (←)" : "پچھلی آیت"}</span>
        </Button>

        {/* Center Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPrompts((v) => !v)}
            className={cn(
              "h-11 px-4 rounded-2xl border text-sm font-semibold gap-2 cursor-pointer transition-all",
              showPrompts
                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white",
            )}
          >
            <MessageSquareQuote className="h-4 w-4 text-amber-400" />
            <span>{lang === "en" ? "Discussion Prompts" : "مباحثہ سوالات"}</span>
          </Button>
        </div>

        {/* Next Verse Button */}
        <Button
          disabled={!hasNext}
          onClick={handleNext}
          className="h-12 px-6 rounded-2xl bg-emerald-gradient hover:opacity-95 text-white text-base font-bold gap-2 shadow-gold cursor-pointer disabled:opacity-40"
        >
          <span>{lang === "en" ? "Next Verse (→)" : "اگلی آیت"}</span>
          <ChevronRight className="h-5 w-5 text-amber-300" />
        </Button>
      </div>
    </div>
  );
}
