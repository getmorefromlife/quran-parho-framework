import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  MessageSquareQuote,
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
  Check,
  Settings2,
  Volume2,
  VolumeX,
  Presentation,
  BookOpenCheck,
  Smartphone,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QVerse } from "@/lib/quran-data";
import { getFontFamily, type ReaderPrefs } from "@/lib/reader-fonts";
import {
  TRANSLATIONS_BY_LANG,
  LANG_LABELS,
  getTranslation,
  getTranslationText,
  type TranslationDef,
  type TranslationLang,
} from "@/lib/translations";
import { playAlertBeep } from "@/lib/timer-beep";
import { NumInput } from "@/components/num-input";
import { BigTimerCard } from "@/components/shared/big-timer-card";
import { RemotePanel } from "@/components/shared/remote-panel";
import { useRemoteHost } from "@/hooks/use-remote-host";
import type { RemoteCommand } from "@/lib/remote-control";
import {
  loadTimerDurations,
  saveTimerDurations,
  SESSION_PRESETS,
  QA_PRESETS,
  TURN_PRESETS,
  toSeconds,
  type TimerDurations,
} from "@/lib/timer-durations";

export type PresentationModeProps = {
  surahN: number;
  verses: QVerse[];
  currentAyah: number;
  maxVerses: number;
  surahEn: string;
  surahAr: string;
  onNavigateAyah: (ayah: number) => void;
  onNavigateSurah: (n: number) => void;
  onNextTurn?: () => void;
  onPrevTurn?: () => void;
  audioPlaying: boolean;
  onToggleAudio: (ayah: number) => void;
  onClose: () => void;
  turnNumber?: number;
  totalTurns?: number;
  turnStartAyah?: number;
  turnEndAyah?: number;
  prefs?: ReaderPrefs;
  selectedTrans?: string[];
};

type ThemeStyle = "light" | "parchment" | "emerald" | "midnight" | "oled";

const THEMES: Record<
  ThemeStyle,
  {
    bg: string;
    text: string;
    gold: string;
    transText: string;
    urduText: string;
    border: string;
    cardBg: string;
    boxBg: string;
    badgeBg: string;
    badgeText: string;
    isLight: boolean;
  }
> = {
  light: {
    bg: "bg-[#f8fafc]",
    text: "text-slate-900",
    gold: "text-amber-900 font-bold",
    transText: "text-slate-900 font-medium",
    urduText: "text-[#78350f] font-bold",
    border: "border-slate-300",
    cardBg: "bg-white shadow-lg border-slate-300",
    boxBg: "bg-slate-100/90 border-slate-300",
    badgeBg: "bg-amber-100 border-amber-400",
    badgeText: "text-amber-900",
    isLight: true,
  },
  parchment: {
    bg: "bg-[#fbf7ee]",
    text: "text-[#1c130e]",
    gold: "text-[#78350f] font-bold",
    transText: "text-[#2c1d11] font-medium",
    urduText: "text-[#451a03] font-bold",
    border: "border-[#d6c4a5]",
    cardBg: "bg-[#f4ebd9] shadow-lg border-[#d6c4a5]",
    boxBg: "bg-[#f1e6cd] border-[#c4af89]",
    badgeBg: "bg-[#e8d7b8] border-[#c4af89]",
    badgeText: "text-[#451a03]",
    isLight: true,
  },
  emerald: {
    bg: "bg-[#041a12]",
    text: "text-emerald-50",
    gold: "text-amber-300 font-bold",
    transText: "text-zinc-100 font-normal",
    urduText: "text-amber-200 font-normal",
    border: "border-emerald-800/80",
    cardBg: "bg-[#0a291e]/90 shadow-lg border-emerald-800/80",
    boxBg: "bg-emerald-950/70 border-emerald-800/80",
    badgeBg: "bg-emerald-900/60 border-amber-400/40",
    badgeText: "text-amber-300",
    isLight: false,
  },
  midnight: {
    bg: "bg-[#0b1329]",
    text: "text-slate-100",
    gold: "text-amber-400 font-bold",
    transText: "text-zinc-100 font-normal",
    urduText: "text-amber-200 font-normal",
    border: "border-slate-800",
    cardBg: "bg-[#131f3d]/90 shadow-lg border-slate-700/80",
    boxBg: "bg-[#0d1830]/90 border-slate-700/80",
    badgeBg: "bg-slate-900/80 border-amber-400/40",
    badgeText: "text-amber-400",
    isLight: false,
  },
  oled: {
    bg: "bg-black",
    text: "text-white",
    gold: "text-yellow-400 font-bold",
    transText: "text-zinc-100 font-normal",
    urduText: "text-yellow-200 font-normal",
    border: "border-zinc-800",
    cardBg: "bg-zinc-900/90 shadow-lg border-zinc-800",
    boxBg: "bg-zinc-950 border-zinc-800",
    badgeBg: "bg-zinc-900 border-yellow-400/40",
    badgeText: "text-yellow-400",
    isLight: false,
  },
};

type ContentMode = "both" | "translation_only" | "arabic_only";
type ViewMode = "turn_block" | "single_verse";

// Standard on-screen font sizes (rem) applied on entering presentation mode and
// whenever the user switches content/view mode (unless a favorite is active).
const STANDARD_SIZES: Record<ViewMode, Record<ContentMode, { ar?: number; tr?: number }>> = {
  turn_block: {
    both: { ar: 4.8, tr: 2.0 },
    translation_only: { tr: 3.3 },
    arabic_only: { ar: 4.8 },
  },
  single_verse: {
    both: { ar: 4.8, tr: 4.8 },
    translation_only: { tr: 4.8 },
    arabic_only: { ar: 4.8 },
  },
};

const FAV_AR_KEY = "qp_pres_ar";
const FAV_TR_KEY = "qp_pres_tr";

function loadFavoriteSizes(): { ar: number; tr: number } | null {
  if (typeof window === "undefined") return null;
  const ar = parseFloat(localStorage.getItem(FAV_AR_KEY) ?? "");
  const tr = parseFloat(localStorage.getItem(FAV_TR_KEY) ?? "");
  if (Number.isFinite(ar) && Number.isFinite(tr)) return { ar, tr };
  return null;
}

function saveFavoriteSizes(ar: number, tr: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAV_AR_KEY, String(ar));
  localStorage.setItem(FAV_TR_KEY, String(tr));
}

function clearFavoriteSizes() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FAV_AR_KEY);
  localStorage.removeItem(FAV_TR_KEY);
}

export function PresentationMode({
  surahN,
  verses,
  currentAyah,
  maxVerses,
  surahEn,
  surahAr,
  onNavigateAyah,
  onNavigateSurah,
  onNextTurn,
  onPrevTurn,
  audioPlaying,
  onToggleAudio,
  onClose,
  turnNumber,
  totalTurns,
  turnStartAyah,
  turnEndAyah,
  prefs,
  selectedTrans,
}: PresentationModeProps) {
  const { lang, tr } = useLang();

  const [arabicFontRem, setArabicFontRem] = useState(4.8);
  const [transFontRem, setTransFontRem] = useState(2.0);
  const [favSizes, setFavSizes] = useState<{ ar: number; tr: number } | null>(() =>
    loadFavoriteSizes(),
  );
  const [useFavorite, setUseFavorite] = useState(false);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("midnight");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Translation visibility filters from reader settings
  const [activeTrans, setActiveTrans] = useState<string[]>(() =>
    selectedTrans?.length ? [...selectedTrans] : ["qarai", "jawadi"],
  );
  const [showTransPicker, setShowTransPicker] = useState(false);
  const activeTransDefs = activeTrans
    .map(getTranslation)
    .filter((t): t is TranslationDef => Boolean(t));

  // Direction of the active translations: RTL (ur/fa) flows right→left, LTR (en/de) left→right
  const allRtl = activeTransDefs.length > 0 && activeTransDefs.every((d) => d.dir === "rtl");
  const stageDir: "rtl" | "ltr" = allRtl ? "rtl" : "ltr";

  const [showPrompts, setShowPrompts] = useState(false);

  // Content Display Mode: both (Arabic+Translation) | translation_only | arabic_only
  const [contentMode, setContentMode] = useState<ContentMode>("both");

  // Live Session & Q&A Timers
  const [sessionTimer, setSessionTimer] = useState(() => toSeconds(loadTimerDurations().session));
  const [sessionActive, setSessionActive] = useState(false);

  const [qaTimer, setQaTimer] = useState(() => toSeconds(loadTimerDurations().qa));
  const [qaActive, setQaActive] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(() => toSeconds(loadTimerDurations().turn));
  const [timerActive, setTimerActive] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  // User-configurable timer durations (persisted, shared with the timers-only screen)
  const [durations, setDurations] = useState<TimerDurations>(() => loadTimerDurations());
  const sessionTotal = toSeconds(durations.session);
  const qaTotal = toSeconds(durations.qa);
  const turnTotal = toSeconds(durations.turn);

  useEffect(() => {
    saveTimerDurations(durations);
  }, [durations]);

  // Phone remote control (Ably relay): host connection for the Remote panel
  const buildStateSnapshot = () => ({
    type: "state" as const,
    session: { secs: sessionTimer, active: sessionActive, total: sessionTotal },
    qa: { secs: qaTimer, active: qaActive, total: qaTotal },
    turn: { secs: timerSeconds, active: timerActive, total: turnTotal },
    soundEnabled,
    supportsTurn: true,
  });

  // Timers-only fullscreen projection (hide the Quran, show only the big timers)
  const [timersOnly, setTimersOnly] = useState(false);

  // Beep once when a timer hits 0 while running (ref-guarded against repeat fires)
  const sessionBeepRef = useRef(false);
  const qaBeepRef = useRef(false);
  const turnBeepRef = useRef(false);

  useEffect(() => {
    if (sessionTimer === 0 && sessionActive) {
      if (!sessionBeepRef.current && soundEnabled) playAlertBeep();
      sessionBeepRef.current = true;
    } else if (sessionTimer > 0) {
      sessionBeepRef.current = false;
    }
  }, [sessionTimer, sessionActive, soundEnabled]);

  useEffect(() => {
    if (qaTimer === 0 && qaActive) {
      if (!qaBeepRef.current && soundEnabled) playAlertBeep();
      qaBeepRef.current = true;
    } else if (qaTimer > 0) {
      qaBeepRef.current = false;
    }
  }, [qaTimer, qaActive, soundEnabled]);

  useEffect(() => {
    if (timerSeconds === 0 && timerActive) {
      if (!turnBeepRef.current && soundEnabled) playAlertBeep();
      turnBeepRef.current = true;
    } else if (timerSeconds > 0) {
      turnBeepRef.current = false;
    }
  }, [timerSeconds, timerActive, soundEnabled]);

  const [viewMode, setViewMode] = useState<ViewMode>("turn_block");
  const [layoutWidth, setLayoutWidth] = useState<"wide" | "centered">("wide");
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [showMore, setShowMore] = useState(false);

  // Apply the standard size for the current mode (skipped while a favorite is active)
  useEffect(() => {
    if (useFavorite) return;
    const std = STANDARD_SIZES[viewMode][contentMode];
    if (std.ar != null) setArabicFontRem(std.ar);
    if (std.tr != null) setTransFontRem(std.tr);
  }, [viewMode, contentMode, useFavorite]);

  // Turn block calculation (5 verses)
  const blockStart = turnStartAyah || Math.floor((currentAyah - 1) / 5) * 5 + 1;
  const blockEnd = turnEndAyah || Math.min(blockStart + 4, maxVerses);
  const turnBlockVerses = verses.filter((v) => v.ayah >= blockStart && v.ayah <= blockEnd);

  const activeVerse = verses.find((v) => v.ayah === currentAyah) || verses[0];
  const isCircle = turnNumber != null && totalTurns != null;
  const hasPrev = isCircle ? turnNumber > 1 || surahN > 1 : currentAyah > 1 || surahN > 1;
  const hasNext = isCircle
    ? turnNumber < totalTurns || surahN < 114
    : currentAyah < maxVerses || surahN < 114;

  // Bottom bar Prev/Next labels (destination info for the current mode)
  const prevLabel = isCircle
    ? turnNumber > 1
      ? `${lang === "ur" ? "ٹرن" : "Turn"} ${turnNumber - 1}`
      : lang === "ur"
        ? "شروع"
        : "Start"
    : viewMode === "turn_block"
      ? blockStart > 1
        ? `${lang === "ur" ? "آیات" : "Verses"} ${Math.max(blockStart - 5, 1)}–${blockStart - 1}`
        : lang === "ur"
          ? "شروع"
          : "Start"
      : `${lang === "ur" ? "آیت" : "Ayah"} ${Math.max(currentAyah - 1, 1)}`;

  const nextLabel = isCircle
    ? turnNumber < (totalTurns ?? 0)
      ? `${lang === "ur" ? "ٹرن" : "Turn"} ${turnNumber + 1}`
      : lang === "ur"
        ? "اگلی سورت"
        : "Next Surah"
    : viewMode === "turn_block"
      ? blockEnd < maxVerses
        ? `${lang === "ur" ? "آیات" : "Verses"} ${blockEnd + 1}–${Math.min(blockEnd + 5, maxVerses)}`
        : lang === "ur"
          ? "اگلی سورت"
          : "Next Surah"
      : `${lang === "ur" ? "آیت" : "Ayah"} ${Math.min(currentAyah + 1, maxVerses)}`;

  const currentTheme = THEMES[themeStyle];

  // Render the active selected translations for a verse, each with its own
  // inline ayah number at the language's reading-direction anchor
  const renderTrans = (
    v: QVerse,
    size: { ltr: number; rtl: number },
    boxed?: boolean,
  ): ReactNode[] => {
    return activeTransDefs.flatMap((tDef) => {
      const text = getTranslationText(v as unknown as Record<string, unknown>, tDef.id);
      if (!text) return [];
      const isRTL = tDef.dir === "rtl";
      const num = (
        <span
          key="num"
          className={cn(
            "inline-flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full border align-middle text-[0.55em] font-bold",
            currentTheme.badgeBg,
            currentTheme.badgeText,
          )}
        >
          {v.ayah}
        </span>
      );
      const content = (
        <>
          {isRTL ? (
            <>
              <span className="flex-1">"{text}"</span>
              {num}
            </>
          ) : (
            <>
              {num}
              <span className="flex-1">"{text}"</span>
            </>
          )}
        </>
      );
      if (boxed) {
        return [
          <div key={tDef.id} className={cn("rounded-2xl border px-4 py-3.5", currentTheme.boxBg)}>
            <p
              dir={tDef.dir}
              className={cn(
                "leading-relaxed transition-all flex items-baseline gap-2",
                isRTL
                  ? cn("font-arabic text-right justify-end", currentTheme.urduText)
                  : cn("font-serif text-left", currentTheme.transText),
              )}
              style={{ fontSize: `${isRTL ? size.rtl : size.ltr}rem` }}
            >
              {content}
            </p>
          </div>,
        ];
      }
      return [
        <p
          key={tDef.id}
          dir={tDef.dir}
          className={cn(
            "leading-relaxed transition-all flex items-baseline gap-2",
            isRTL
              ? cn("font-arabic text-right justify-end", currentTheme.urduText)
              : cn("font-serif text-left", currentTheme.transText),
          )}
          style={{ fontSize: `${isRTL ? size.rtl : size.ltr}rem` }}
        >
          {content}
        </p>,
      ];
    });
  };

  // Render Arabic calligraphy with the ayah number as an inline RTL end-marker
  const renderArabic = (v: QVerse, fontSize: number): ReactNode => (
    <p
      dir="rtl"
      className={cn(
        "font-arabic font-semibold leading-relaxed tracking-wide text-right flex items-baseline gap-3",
        currentTheme.gold,
      )}
      style={{ fontSize: `${fontSize}rem` }}
    >
      <span className="flex-1">{v.arabic}</span>
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold align-middle",
          currentTheme.badgeBg,
          currentTheme.badgeText,
        )}
      >
        {v.ayah}
      </span>
    </p>
  );

  const singleTrans = activeVerse
    ? renderTrans(activeVerse, { ltr: transFontRem, rtl: transFontRem * 1.1 })
    : [];

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

  // Navigate next verse / next block / next turn
  const handleNext = useCallback(() => {
    if (isCircle) {
      if (onNextTurn && turnNumber < (totalTurns ?? 0)) {
        onNextTurn();
      } else if (surahN < 114) {
        onNavigateSurah(surahN + 1);
      }
    } else if (viewMode === "turn_block") {
      if (blockEnd < maxVerses) {
        onNavigateAyah(Math.min(blockEnd + 1, maxVerses));
      } else if (surahN < 114) {
        onNavigateSurah(surahN + 1);
      }
    } else if (currentAyah < maxVerses) {
      onNavigateAyah(currentAyah + 1);
    } else if (surahN < 114) {
      onNavigateSurah(surahN + 1);
    }
  }, [
    isCircle,
    onNextTurn,
    turnNumber,
    totalTurns,
    surahN,
    viewMode,
    blockEnd,
    maxVerses,
    currentAyah,
    onNavigateAyah,
    onNavigateSurah,
  ]);

  // Navigate prev verse / previous block / previous turn
  const handlePrev = useCallback(() => {
    if (isCircle) {
      if (onPrevTurn && turnNumber > 1) {
        onPrevTurn();
      } else if (surahN > 1) {
        onNavigateSurah(surahN - 1);
      }
    } else if (viewMode === "turn_block") {
      if (blockStart > 1) {
        onNavigateAyah(Math.max(blockStart - 5, 1));
      } else if (surahN > 1) {
        onNavigateSurah(surahN - 1);
      }
    } else if (currentAyah > 1) {
      onNavigateAyah(currentAyah - 1);
    } else if (surahN > 1) {
      onNavigateSurah(surahN - 1);
    }
  }, [
    isCircle,
    onPrevTurn,
    turnNumber,
    surahN,
    viewMode,
    blockStart,
    currentAyah,
    onNavigateAyah,
    onNavigateSurah,
  ]);

  // Keyboard navigation & remote control listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timersOnly) {
        if (e.key === "Escape") {
          setTimersOnly(false);
        } else if (e.key === "s" || e.key === "S") {
          setSessionActive((v) => !v);
        } else if (e.key === "q" || e.key === "Q") {
          setQaActive((v) => !v);
        } else if (e.key === "f" || e.key === "F") {
          toggleFullscreen();
        }
        return;
      }
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
      } else if (e.key === "s" || e.key === "S") {
        setSessionActive((v) => !v);
      } else if (e.key === "q" || e.key === "Q") {
        setQaActive((v) => !v);
      } else if (e.key === "t" || e.key === "T") {
        setTimerActive((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose, timersOnly]);

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

  // Named timer controls (shared by the Timer Dock and the timers-only overlay)
  const toggleSession = () => {
    if (sessionTimer === 0) {
      setSessionTimer(sessionTotal);
      setSessionActive(true);
    } else {
      setSessionActive((v) => !v);
    }
  };
  const resetSession = () => {
    setSessionTimer(sessionTotal);
    setSessionActive(false);
  };
  const toggleQa = () => {
    if (qaTimer === 0) {
      setQaTimer(qaTotal);
      setQaActive(true);
    } else {
      setQaActive((v) => !v);
    }
  };
  const resetQa = () => {
    setQaTimer(qaTotal);
    setQaActive(false);
  };
  const toggleTurn = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(turnTotal);
      setTimerActive(true);
    } else {
      setTimerActive((v) => !v);
    }
  };
  const resetTurn = () => {
    setTimerSeconds(turnTotal);
    setTimerActive(false);
  };

  // Change a saved duration; apply immediately to idle timers, on next reset to running ones
  const setDurationSetting = (key: keyof TimerDurations, min: number) => {
    setDurations((d) => ({ ...d, [key]: min }));
    if (key === "session" && !sessionActive) setSessionTimer(toSeconds(min));
    if (key === "qa" && !qaActive) setQaTimer(toSeconds(min));
    if (key === "turn" && !timerActive) setTimerSeconds(toSeconds(min));
  };

  // Dispatch commands received from a phone remote to the live timer handlers
  const handleRemoteCommand = (cmd: RemoteCommand) => {
    switch (cmd.action) {
      case "toggleSession":
        toggleSession();
        break;
      case "resetSession":
        resetSession();
        break;
      case "toggleQa":
        toggleQa();
        break;
      case "resetQa":
        resetQa();
        break;
      case "toggleTurn":
        toggleTurn();
        break;
      case "resetTurn":
        resetTurn();
        break;
      case "toggleSound":
        setSoundEnabled((v) => !v);
        break;
      case "setDuration":
        setDurationSetting(cmd.key, cmd.minutes);
        break;
    }
  };

  // Shared phone-remote host relay (pairing panel + command dispatch)
  const remote = useRemoteHost({ getSnapshot: buildStateSnapshot, onCommand: handleRemoteCommand });

  const renderDurationRow = (
    label: string,
    value: number,
    presets: number[],
    onChange: (min: number) => void,
  ) => (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer",
              value === m
                ? "bg-amber-500 text-black border-amber-400"
                : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500",
            )}
          >
            {m} {lang === "en" ? "m" : "منٹ"}
          </button>
        ))}
        <NumInput
          value={value}
          onChange={onChange}
          min={1}
          max={480}
          className="w-16 h-8 text-center rounded-lg border border-zinc-700 bg-zinc-950 text-xs font-mono text-zinc-300"
          ariaLabel={`${label} ${lang === "en" ? "minutes" : "منٹ"}`}
        />
      </div>
    </div>
  );

  // Renders one prominent timer card for the Timer Dock
  const renderTimerCard = (
    label: string,
    icon: typeof Clock,
    seconds: number,
    total: number,
    active: boolean,
    onToggle: () => void,
    onReset: () => void,
    chipStyle: string,
    fillStyle: string,
    hint: string,
  ) => {
    const pct = Math.max(0, Math.min(1, seconds / total));
    const urgent = active && seconds > 0 && seconds <= 60;
    const expired = seconds === 0;
    const Icon = icon;
    return (
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition-all",
          currentTheme.cardBg,
          currentTheme.border,
          expired && "border-red-500/70",
        )}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-3 min-w-0 cursor-pointer group"
          title={hint}
        >
          <span
            className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", chipStyle)}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-left min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {label}
            </span>
            <span
              className={cn(
                "block font-mono tabular-nums font-bold text-lg sm:text-xl leading-tight transition-colors",
                expired
                  ? "text-red-500"
                  : urgent
                    ? "text-red-400 animate-pulse"
                    : active
                      ? currentTheme.gold
                      : currentTheme.text,
              )}
            >
              {formatTimer(seconds)}
            </span>
            <span className="block h-1.5 w-full min-w-[5.5rem] rounded-full bg-zinc-800/50 mt-1">
              <span
                className={cn(
                  "block h-full rounded-full transition-all duration-1000",
                  expired ? "bg-red-500" : fillStyle,
                )}
                style={{ width: `${pct * 100}%` }}
              />
            </span>
          </span>
        </button>
        <button
          onClick={onReset}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          title={lang === "en" ? "Reset Timer" : "ٹائمر دوبارہ ترتیب دیں"}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // Fullscreen projection showing ONLY the Session + Q&A timers (for physical-mushaf readers)
  const renderBigTimersOverlay = () => (
    <div className="absolute inset-0 z-20 flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-amber-400">
            <Presentation className="h-4 w-4" />
          </span>
          <span className="text-sm sm:text-base font-bold tracking-wide truncate">
            {lang === "en" ? "Circle Timers" : "سرکل ٹائمرز"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer",
              soundEnabled
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300",
            )}
            title={
              soundEnabled
                ? lang === "en"
                  ? "Expiry beep is ON — click to mute"
                  : "اختتامی آواز آن ہے — بند کرنے کے لیے کلک کریں"
                : lang === "en"
                  ? "Expiry beep is OFF — click to enable"
                  : "اختتامی آواز بند ہے — چالو کرنے کے لیے کلک کریں"
            }
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title={lang === "en" ? "Toggle Fullscreen" : "فل اسکرین آن/آف"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setTimersOnly(false)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            title={lang === "en" ? "Back to Quran" : "قرآن پر واپس جائیں"}
          >
            <BookOpenCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{lang === "en" ? "Quran" : "قرآن"}</span>
          </button>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title={lang === "en" ? "Exit Presentation Mode (Esc)" : "بند کریں"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid gap-6 lg:grid-cols-2 items-center max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <BigTimerCard
          label={lang === "en" ? "Session Reading" : "سیشن"}
          icon={Clock}
          seconds={sessionTimer}
          total={sessionTotal}
          active={sessionActive}
          onToggle={toggleSession}
          onReset={resetSession}
          durationMin={durations.session}
          presets={SESSION_PRESETS}
          onDurationChange={(m) => setDurationSetting("session", m)}
          accent="amber"
          lang={lang}
        />
        <BigTimerCard
          label={lang === "en" ? "Q&A" : "سوال و جواب"}
          icon={MessageSquare}
          seconds={qaTimer}
          total={qaTotal}
          active={qaActive}
          onToggle={toggleQa}
          onReset={resetQa}
          durationMin={durations.qa}
          presets={QA_PRESETS}
          onDurationChange={(m) => setDurationSetting("qa", m)}
          accent="blue"
          lang={lang}
        />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none transition-colors duration-500",
        currentTheme.bg,
        currentTheme.text,
      )}
    >
      {timersOnly && renderBigTimersOverlay()}
      {!timersOnly && (
        <>
          {/* ── Top Bar ── */}
          <div
            className={cn(
              "sticky top-0 z-10 flex flex-col border-b backdrop-blur-xl",
              currentTheme.border,
            )}
          >
            {/* Row 1: Single-line Projector Bar */}
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left: Surah Title & Mushaf Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold font-mono",
                    currentTheme.border,
                    currentTheme.badgeBg,
                    currentTheme.badgeText,
                  )}
                >
                  {surahN}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg sm:text-xl font-bold font-serif-display text-white truncate">
                    {surahEn}
                  </span>
                  <span
                    className={cn(
                      "text-lg sm:text-xl font-arabic font-bold shrink-0",
                      currentTheme.gold,
                    )}
                  >
                    {surahAr}
                  </span>
                </div>
              </div>

              {/* Right: Projector Controls & Prominent Timers */}
              <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
                {/* Scrollable core controls (no popovers here to avoid clipping) */}
                <div className="flex items-center gap-1.5 flex-nowrap flex-1 min-w-0 overflow-x-auto">
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
                </div>

                {/* Translation Picker: Choose from all 40+ translations */}
                <div className="relative shrink-0">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setShowTransPicker((v) => !v)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                        showTransPicker
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-zinc-400 hover:text-white",
                      )}
                      title={tr("present_translations")}
                    >
                      <Languages className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{tr("present_translations")}</span>
                    </button>
                  </div>

                  {showTransPicker && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-[min(90vw,22rem)] rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
                      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          {tr("present_translations")}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setActiveTrans(
                                selectedTrans?.length ? [...selectedTrans] : ["qarai", "jawadi"],
                              )
                            }
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title={tr("present_sync_reader")}
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">{tr("present_sync_short")}</span>
                          </button>
                          <button
                            onClick={() => setShowTransPicker(false)}
                            className="flex items-center justify-center h-6 w-6 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title={tr("close_reader")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
                        {(Object.keys(TRANSLATIONS_BY_LANG) as TranslationLang[]).map((lg) => (
                          <div key={lg} className="space-y-1.5">
                            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                              {LANG_LABELS[lg].en}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {TRANSLATIONS_BY_LANG[lg].map((t) => {
                                const active = activeTrans.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    title={t.translator}
                                    onClick={() =>
                                      setActiveTrans((prev) =>
                                        active ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                                      )
                                    }
                                    className={cn(
                                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
                                      active
                                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                                        : "border-zinc-700 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200",
                                    )}
                                  >
                                    {active && <Check className="h-3 w-3" />}
                                    {t.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Mode Switcher: 5-Verse Turn Block vs Single Verse */}
                <div className="flex items-center shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
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

                {/* More Controls Popover (Theme, Font Sizes, Layout, Fullscreen) */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowMore((v) => !v)}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer",
                      showMore
                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white",
                    )}
                    title={lang === "en" ? "More Controls" : "مزید کنٹرولز"}
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>

                  {showMore && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-[min(90vw,20rem)] rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
                      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          {lang === "en" ? "Presentation Controls" : "پریزنٹیشن کنٹرولز"}
                        </span>
                        <button
                          onClick={() => setShowMore(false)}
                          className="flex items-center justify-center h-6 w-6 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                          title={lang === "en" ? "Close" : "بند کریں"}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-4 space-y-5">
                        {/* Theme Selector */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            {lang === "en" ? "Theme" : "تھیم"}
                          </div>
                          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1 w-fit">
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
                                themeStyle === "midnight"
                                  ? "border-gold ring-1 ring-gold"
                                  : "border-slate-700",
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
                        </div>

                        {/* Arabic Font Size Scaler */}
                        {contentMode !== "translation_only" && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                              {lang === "en" ? "Arabic Font Size" : "عربی فونٹ سائز"}
                            </div>
                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 gap-1 w-fit">
                              <Type className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-[10px] font-bold text-amber-300 uppercase">
                                Ar
                              </span>
                              <button
                                onClick={() => setArabicFontRem((s) => Math.max(2.0, s - 0.4))}
                                className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
                                title="Decrease Arabic Font Size"
                              >
                                A-
                              </button>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {arabicFontRem.toFixed(1)}
                              </span>
                              <button
                                onClick={() => setArabicFontRem((s) => Math.min(6.0, s + 0.4))}
                                className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
                                title="Increase Arabic Font Size"
                              >
                                A+
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Translation Font Size Scaler */}
                        {contentMode !== "arabic_only" && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                              {lang === "en" ? "Translation Font Size" : "ترجمہ فونٹ سائز"}
                            </div>
                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 gap-1 w-fit">
                              <BookOpenText className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-[10px] font-bold text-emerald-300 uppercase">
                                Tr
                              </span>
                              <button
                                onClick={() => setTransFontRem((s) => Math.max(0.6, s - 0.2))}
                                className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
                                title="Decrease Translation Font Size"
                              >
                                A-
                              </button>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {transFontRem.toFixed(1)}
                              </span>
                              <button
                                onClick={() => setTransFontRem((s) => Math.min(8.0, s + 0.2))}
                                className="text-xs font-bold px-1.5 py-0.5 rounded text-zinc-300 hover:text-white cursor-pointer"
                                title="Increase Translation Font Size"
                              >
                                A+
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Favorite Size Preset */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            {lang === "en" ? "Size Preset" : "سائز پری سیٹ"}
                          </div>
                          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1 w-fit">
                            <button
                              onClick={() => setUseFavorite(false)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                !useFavorite
                                  ? "bg-amber-500 text-black shadow-sm"
                                  : "text-zinc-400 hover:text-white",
                              )}
                              title={
                                lang === "en" ? "Use Standard Sizes" : "معیاری سائز استعمال کریں"
                              }
                            >
                              {lang === "en" ? "Standard" : "معیاری"}
                            </button>
                            <button
                              onClick={() => {
                                if (!favSizes) return;
                                setArabicFontRem(favSizes.ar);
                                setTransFontRem(favSizes.tr);
                                setUseFavorite(true);
                              }}
                              disabled={!favSizes}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40",
                                useFavorite
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "text-zinc-400 hover:text-white",
                              )}
                              title={
                                favSizes
                                  ? `${lang === "en" ? "Apply AR" : "لگائیں AR"} ${favSizes.ar.toFixed(1)} · TR ${favSizes.tr.toFixed(1)}`
                                  : lang === "en"
                                    ? "No favorite saved yet"
                                    : "ابھی کوئی پسندیدہ محفوظ نہیں"
                              }
                            >
                              {lang === "en" ? "My Favorite" : "میرا پسندیدہ"}
                            </button>
                          </div>
                          {favSizes && (
                            <div className="text-[10px] font-mono text-zinc-500">
                              AR {favSizes.ar.toFixed(1)} · TR {favSizes.tr.toFixed(1)}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                saveFavoriteSizes(arabicFontRem, transFontRem);
                                setFavSizes({ ar: arabicFontRem, tr: transFontRem });
                                setUseFavorite(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 transition-all cursor-pointer"
                              title={
                                lang === "en"
                                  ? "Save current sizes as your favorite"
                                  : "موجودہ سائز کو پسندیدہ کے طور پر محفوظ کریں"
                              }
                            >
                              <Check className="h-3 w-3" />
                              {lang === "en" ? "Save Current Sizes" : "موجودہ سائز محفوظ کریں"}
                            </button>
                            {favSizes && (
                              <button
                                onClick={() => {
                                  clearFavoriteSizes();
                                  setFavSizes(null);
                                  setUseFavorite(false);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 transition-all cursor-pointer"
                                title={lang === "en" ? "Remove favorite" : "پسندیدہ ہٹائیں"}
                              >
                                <X className="h-3 w-3" />
                                {lang === "en" ? "Remove" : "ہٹائیں"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Layout Width Switcher */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            {lang === "en" ? "Layout Width" : "لی آؤٹ چوڑائی"}
                          </div>
                          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1 w-fit">
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
                              <span className="hidden sm:inline">Wide HD</span>
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
                              <span className="hidden sm:inline">Centered</span>
                            </button>
                          </div>
                        </div>

                        {/* Timer Durations */}
                        <div className="space-y-2.5 border-t border-zinc-800 pt-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {lang === "en" ? "Timer Durations" : "ٹائمر کی مدت"}
                          </div>
                          {renderDurationRow(
                            lang === "en" ? "Session" : "سیشن",
                            durations.session,
                            SESSION_PRESETS,
                            (m) => setDurationSetting("session", m),
                          )}
                          {renderDurationRow(
                            lang === "en" ? "Q&A" : "سوال و جواب",
                            durations.qa,
                            QA_PRESETS,
                            (m) => setDurationSetting("qa", m),
                          )}
                          {renderDurationRow(
                            lang === "en" ? "Turn" : "ٹرن",
                            durations.turn,
                            TURN_PRESETS,
                            (m) => setDurationSetting("turn", m),
                          )}
                          <p className="text-[10px] text-zinc-600">
                            {lang === "en"
                              ? "Saved automatically · running timers pick up the new length on reset"
                              : "خودکار محفوظ · چلنے والے ٹائمر پر نئی مدت ری سیٹ پر لاگو ہوگی"}
                          </p>
                        </div>

                        {/* Fullscreen Toggle */}
                        <div className="pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="w-full rounded-xl border-zinc-700 bg-zinc-950 text-zinc-300 hover:text-white cursor-pointer gap-2"
                          >
                            {isFullscreen ? (
                              <Minimize2 className="h-4 w-4" />
                            ) : (
                              <Maximize2 className="h-4 w-4" />
                            )}
                            <span>
                              {isFullscreen
                                ? lang === "en"
                                  ? "Exit Fullscreen"
                                  : "فل اسکرین بند کریں"
                                : lang === "en"
                                  ? "Enter Fullscreen"
                                  : "فل اسکرین کریں"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timers Only Toggle */}
                <button
                  onClick={() => setTimersOnly((v) => !v)}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center border transition-all cursor-pointer",
                    timersOnly
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white",
                  )}
                  title={
                    lang === "en"
                      ? "Timers Only (hide Quran, show just the timers)"
                      : "صرف ٹائمرز (قرآن چھپائیں، صرف ٹائمر دکھائیں)"
                  }
                >
                  <Presentation className="h-4 w-4" />
                </button>

                {/* Close Projector Mode */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 shrink-0 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  title={lang === "en" ? "Exit Presentation Mode (Esc)" : "بند کریں"}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Row 2: Prominent Timer Dock */}
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-6 py-2 border-t",
                currentTheme.border,
                currentTheme.cardBg,
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 overflow-x-auto">
                {renderTimerCard(
                  lang === "en" ? "Session" : "سیشن",
                  Clock,
                  sessionTimer,
                  sessionTotal,
                  sessionActive,
                  toggleSession,
                  resetSession,
                  "bg-amber-500/15 border-amber-500/40 text-amber-400",
                  "bg-amber-500",
                  lang === "en"
                    ? `${durations.session}-Minute Session Timer (Click to Play/Pause)`
                    : `سیشن ٹائمر (${durations.session} منٹ)`,
                )}
                {renderTimerCard(
                  lang === "en" ? "Q&A" : "سوال و جواب",
                  MessageSquare,
                  qaTimer,
                  qaTotal,
                  qaActive,
                  toggleQa,
                  resetQa,
                  "bg-blue-500/15 border-blue-500/40 text-blue-400",
                  "bg-blue-500",
                  lang === "en"
                    ? `${durations.qa}-Minute Q&A Timer (Click to Play/Pause)`
                    : `سوال و جواب ٹائمر (${durations.qa} منٹ)`,
                )}
                {renderTimerCard(
                  lang === "en" ? "Turn" : "ٹرن",
                  Hourglass,
                  timerSeconds,
                  turnTotal,
                  timerActive,
                  toggleTurn,
                  resetTurn,
                  "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
                  "bg-emerald-500",
                  lang === "en"
                    ? `${durations.turn}-Minute Turn Pace Timer (Click to Play/Pause)`
                    : `ٹرن ٹائمر (${durations.turn} منٹ)`,
                )}
              </div>

              {/* Sound Alert Mute Toggle */}
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                  currentTheme.border,
                  soundEnabled
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                title={
                  soundEnabled
                    ? lang === "en"
                      ? "Expiry beep is ON — click to mute"
                      : "اختتامی آواز آن ہے — بند کرنے کے لیے کلک کریں"
                    : lang === "en"
                      ? "Expiry beep is OFF — click to enable"
                      : "اختتامی آواز بند ہے — چالو کرنے کے لیے کلک کریں"
                }
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="hidden md:inline">{lang === "en" ? "Beep" : "آواز"}</span>
              </button>

              {/* Phone Remote Control */}
              <button
                onClick={() => remote.setPanelOpen((v) => !v)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                  currentTheme.border,
                  remote.panelOpen
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-zinc-400 hover:text-white",
                )}
                title={
                  lang === "en" ? "Control timers from your phone" : "فون سے ٹائمرز کو کنٹرول کریں"
                }
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden md:inline">{lang === "en" ? "Remote" : "ریموٹ"}</span>
              </button>
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
                    dir={stageDir}
                    className={cn("space-y-6", allRtl ? "text-right" : "text-left")}
                  >
                    {turnBlockVerses.map((v) => {
                      const trans = renderTrans(
                        v,
                        { ltr: transFontRem, rtl: transFontRem * 1.1 },
                        true,
                      );
                      return (
                        <div
                          key={v.ayah}
                          className={cn(
                            "p-5 sm:p-6 rounded-2xl border transition-all",
                            currentTheme.border,
                            currentTheme.cardBg,
                            v.ayah === currentAyah && "ring-2 ring-amber-400/70 shadow-gold",
                          )}
                        >
                          {contentMode === "translation_only" ? (
                            /* Translation-Only Focus Mode — Respects Reader Settings Selection */
                            <div dir={stageDir} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold shadow-sm",
                                    currentTheme.badgeBg,
                                    currentTheme.badgeText,
                                  )}
                                >
                                  {v.ayah}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs uppercase font-bold tracking-wider",
                                    currentTheme.gold,
                                  )}
                                >
                                  {lang === "ur" ? "ترجمہ فہم موڈ" : "Translation Focus Mode"}
                                </span>
                              </div>
                              {trans.length ? (
                                <div
                                  dir={stageDir}
                                  className={cn("space-y-3", allRtl ? "text-right" : "text-left")}
                                >
                                  {trans}
                                </div>
                              ) : (
                                <p
                                  className={cn(
                                    "text-sm italic opacity-60",
                                    currentTheme.transText,
                                  )}
                                >
                                  {tr("present_no_translation")}
                                </p>
                              )}
                            </div>
                          ) : contentMode === "arabic_only" ? (
                            /* Arabic-Only Calligraphy Mode */
                            renderArabic(v, arabicFontRem)
                          ) : (
                            /* Both (Stacked Layout): Arabic Above, Translation Boxes Below */
                            <div
                              dir={stageDir}
                              className={cn("space-y-4", allRtl ? "text-right" : "text-left")}
                            >
                              {renderArabic(v, arabicFontRem)}

                              {trans.length ? (
                                trans
                              ) : (
                                <p
                                  className={cn(
                                    "text-sm italic opacity-60",
                                    currentTheme.transText,
                                  )}
                                >
                                  {tr("present_no_translation")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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

                  {contentMode === "arabic_only" ? (
                    /* Ultra-Large Arabic Text with Ayah Number */
                    activeVerse && renderArabic(activeVerse, arabicFontRem)
                  ) : contentMode === "translation_only" ? (
                    /* Translation-Only Focus Mode */
                    activeVerse && (
                      <div
                        dir={stageDir}
                        className={cn(
                          "space-y-4",
                          layoutWidth === "wide" ? "max-w-[96vw]" : "max-w-4xl mx-auto",
                        )}
                      >
                        {singleTrans.length ? (
                          singleTrans
                        ) : (
                          <p
                            className={cn(
                              "text-lg italic opacity-60 text-center",
                              currentTheme.transText,
                            )}
                          >
                            {tr("present_no_translation")}
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <>
                      {/* Ultra-Large Arabic Text with Ayah Number */}
                      {activeVerse && renderArabic(activeVerse, arabicFontRem)}

                      {/* Translations */}
                      {activeVerse && (
                        <div
                          dir={stageDir}
                          className={cn(
                            "space-y-4 pt-4 border-t border-zinc-800/60",
                            layoutWidth === "wide" ? "max-w-[96vw]" : "max-w-4xl mx-auto",
                          )}
                        >
                          {singleTrans.length ? (
                            singleTrans
                          ) : (
                            <p
                              className={cn(
                                "text-lg italic opacity-60 text-center",
                                currentTheme.transText,
                              )}
                            >
                              {tr("present_no_translation")}
                            </p>
                          )}
                        </div>
                      )}
                    </>
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
                    <strong className="text-amber-400 block mb-1">
                      2. Linguistic & Moral Focus:
                    </strong>
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
              className="h-12 px-5 rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-sm font-semibold gap-2 cursor-pointer disabled:opacity-40"
              title={lang === "en" ? "Previous" : "پچھلا"}
            >
              <ChevronLeft className="h-5 w-5 text-amber-400" />
              <span className="whitespace-nowrap">{prevLabel}</span>
            </Button>

            {/* Center Action Controls */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold shadow-sm",
                  currentTheme.border,
                  currentTheme.badgeBg,
                  currentTheme.badgeText,
                )}
              >
                Surah {surahN} · Ayah {currentAyah}/{maxVerses}
                {isCircle && (
                  <>
                    {" "}
                    · Turn {turnNumber}/{totalTurns}
                  </>
                )}
              </span>
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
              className="h-12 px-5 rounded-2xl bg-emerald-gradient hover:opacity-95 text-white text-sm font-bold gap-2 shadow-gold cursor-pointer disabled:opacity-40"
              title={lang === "en" ? "Next" : "اگلا"}
            >
              <span className="whitespace-nowrap">{nextLabel}</span>
              <ChevronRight className="h-5 w-5 text-amber-300" />
            </Button>
          </div>
        </>
      )}

      {/* Phone Remote pairing panel */}
      {remote.panelOpen && remote.roomCode && (
        <RemotePanel
          lang={lang}
          room={remote.roomCode}
          status={remote.status}
          members={remote.members}
          error={remote.error}
          onClose={() => remote.setPanelOpen(false)}
        />
      )}
    </div>
  );
}
