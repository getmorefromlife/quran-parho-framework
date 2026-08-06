import { lazy, Suspense, useState } from "react";
import {
  CalendarDays,
  Calculator,
  LayoutDashboard,
  Layers,
  MessageCircle,
  MonitorUp,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoundRobinTracker } from "./round-robin";
import { MicroQATimer } from "./qa-timer";
import { CycleProgressDashboard } from "./cycle-progress";
import { PaceCalculator } from "./pace-calculator";
import { SurahQuizzer } from "./quiz";

const SessionPhaseTimer = lazy(() =>
  import("./session-timer").then((m) => ({ default: m.SessionPhaseTimer })),
);
const CalendarGenerator = lazy(() =>
  import("./calendar-generator").then((m) => ({ default: m.CalendarGenerator })),
);
const FacilitatorDashboard = lazy(() =>
  import("./dashboard").then((m) => ({ default: m.FacilitatorDashboard })),
);
const TimersScreen = lazy(() => import("./timers-screen"));

export function FacilitatorTools({
  lang,
  tab,
  onTabChange,
  initialSplit,
}: {
  lang: string;
  tab: number;
  onTabChange: (n: number) => void;
  initialSplit?: { reading: number; discussion: number } | null;
}) {
  const { tr } = useLang();
  const [showTimersScreen, setShowTimersScreen] = useState(false);
  const tabs = [
    { label: lang === "en" ? "Session Timer" : "نشست کا ٹائمر", icon: Timer },
    { label: lang === "en" ? "Round-Robin" : "باری ٹریکر", icon: Users },
    { label: lang === "en" ? "Q&A Timer" : "سوال ٹائمر", icon: MessageCircle },
    { label: lang === "en" ? "Cycle Progress" : "مراحل کی پیش رفت", icon: Layers },
    { label: lang === "en" ? "Pace Calculator" : "رفتار کیلکولیٹر", icon: Calculator },
    { label: lang === "en" ? "Surah Quiz" : "سورہ کوئز", icon: Sparkles },
    { label: lang === "en" ? "Calendar" : "کیلنڈر", icon: CalendarDays },
    { label: lang === "en" ? "Dashboard" : "ڈیش بورڈ", icon: LayoutDashboard },
  ];

  return (
    <section id="tools" className="py-14 sm:py-20 lg:py-28 bg-card/40 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-4 sm:px-3 py-1.5 sm:py-1">
            <Timer className="h-3.5 sm:h-3 w-3.5 sm:w-3" />{" "}
            <span className="text-sm sm:text-xs">
              {lang === "en" ? "Facilitator Tools" : "میزبان ٹولز"}
            </span>
          </Badge>
          <h2 className="mt-5 sm:mt-4 text-3xl sm:text-4xl font-bold">
            {lang === "en" ? "Practical Tools for Your Circle" : "آپ کے حلقے کے لیے عملی ٹولز"}
          </h2>
          <p className="mt-4 sm:mt-3 text-base sm:text-base text-muted-foreground">
            {lang === "en"
              ? "Free, browser-based tools to run your Qurʼān Parho session smoothly."
              : "قرآن پڑھو نشست کو منظم کرنے کے لیے مفت، براؤزر پر چلنے والے ٹولز"}
          </p>
        </div>

        {/* Launch Fullscreen Timers */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-2.5">
          <button
            onClick={() => setShowTimersScreen(true)}
            className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-3 rounded-2xl bg-emerald-gradient text-gold border border-gold/50 shadow-gold text-sm sm:text-base font-bold transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <MonitorUp className="h-5 w-5 shrink-0" />
            <span>{lang === "en" ? "Launch Fullscreen Timers" : "فل اسکرین ٹائمرز شروع کریں"}</span>
          </button>
          <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md">
            {lang === "en"
              ? "Present just the Session & Q&A timers on a big fullscreen screen — ideal when reading from a physical Qurʼān."
              : "صرف سیشن اور سوال و جواب کے ٹائمر بڑی فل اسکرین پر دکھائیں — فزیکل قرآن پڑھتے وقت بہترین۔"}
          </p>
        </div>

        {/* Tab bar — Symmetric 4x2 grid (4 per row) */}
        <div className="mt-8 sm:mt-10 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-2">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={i}
                onClick={() => onTabChange(i)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all text-center",
                  tab === i
                    ? "bg-emerald-gradient text-gold border-gold shadow-gold scale-[1.02]"
                    : "bg-card border-border text-muted-foreground hover:border-gold/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 sm:mt-8">
          <Suspense
            fallback={
              <div className="py-16 text-center text-sm text-muted-foreground">
                {lang === "en" ? "Loading…" : "لوڈ ہو رہا ہے…"}
              </div>
            }
          >
            {tab === 0 && <SessionPhaseTimer lang={lang} initialSplit={initialSplit} />}
            {tab === 1 && <RoundRobinTracker lang={lang} />}
            {tab === 2 && <MicroQATimer lang={lang} />}
            {tab === 3 && <CycleProgressDashboard lang={lang} />}
            {tab === 4 && <PaceCalculator lang={lang} />}
            {tab === 5 && <SurahQuizzer lang={lang} />}
            {tab === 6 && <CalendarGenerator lang={lang} />}
            {tab === 7 && <FacilitatorDashboard lang={lang} onNavigate={onTabChange} />}
          </Suspense>
        </div>
      </div>

      {showTimersScreen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[120] grid place-items-center bg-zinc-950 text-sm text-zinc-400">
              {lang === "en" ? "Loading…" : "لوڈ ہو رہا ہے…"}
            </div>
          }
        >
          <TimersScreen lang={lang} onClose={() => setShowTimersScreen(false)} />
        </Suspense>
      )}
    </section>
  );
}

export default FacilitatorTools;
