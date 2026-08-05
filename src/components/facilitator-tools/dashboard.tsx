import { useMemo, useRef, useState } from "react";
import type * as React from "react";
import {
  Calculator,
  CalendarDays,
  Download,
  History as HistoryIcon,
  Layers,
  MessageCircle,
  Save,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { SURAHS } from "@/lib/surahs";
import {
  clearAllData,
  collectBackup,
  importBackup,
  loadCycleProgress,
  loadSessionHistory,
  type SessionRecord,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function FacilitatorDashboard({
  lang,
  onNavigate,
}: {
  lang: string;
  onNavigate: (idx: number) => void;
}) {
  const [cycleData, setCycleData] = useState<Record<string, number[]>>(() => loadCycleProgress());
  const [history, setHistory] = useState<SessionRecord[]>(() => loadSessionHistory());
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const total = SURAHS.length;

  const exportData = () => {
    const data = collectBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quran-parho-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg({
      ok: true,
      text:
        lang === "en"
          ? "Exported as quran-parho-data.json"
          : "quran-parho-data.json کے طور پر برآمد ہوا",
    });
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          !data ||
          typeof data !== "object" ||
          !(
            Array.isArray(data.roster) ||
            typeof data.cycleIdx === "number" ||
            data.cycleProgress ||
            Array.isArray(data.sessionHistory)
          )
        ) {
          throw new Error("bad shape");
        }
        importBackup(data);
        setCycleData(loadCycleProgress());
        setHistory(loadSessionHistory());
        setBackupMsg({
          ok: true,
          text: lang === "en" ? "Data restored successfully." : "ڈیٹا بحال ہو گیا۔",
        });
      } catch {
        setBackupMsg({
          ok: false,
          text:
            lang === "en"
              ? "Invalid file. Please choose a valid Qurʼān Parho JSON export."
              : "ناقص فائل۔ درست برآمد شدہ فائل منتخب کریں۔",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmClear = () => {
    clearAllData();
    setCycleData({});
    setHistory([]);
    setShowClearDialog(false);
    setBackupMsg(null);
  };

  const cycles = useMemo(
    () => [
      {
        key: "cycle1",
        label: lang === "en" ? "Cycle 1 · Foundation" : "مرحلہ ۱ · بنیاد",
        color: "bg-emerald-deep",
      },
      {
        key: "cycle2",
        label: lang === "en" ? "Cycle 2 · Seerah" : "مرحلہ ۲ · سیرت",
        color: "bg-gold",
      },
      {
        key: "cycle3",
        label: lang === "en" ? "Cycle 3 · Mastery" : "مرحلہ ۳ · مہارت",
        color: "bg-emerald-deep",
      },
    ],
    [lang],
  );

  const overallDone = Object.values(cycleData).flat().length;
  const overallPct = total > 0 ? Math.round((overallDone / (total * 3)) * 100) : 0;

  const tools = [
    {
      icon: Timer,
      label: lang === "en" ? "Session Timer" : "نشست کا ٹائمر",
      desc:
        lang === "en" ? "Phase-aware countdown with audio alerts" : "مراحل کے ساتھ ٹائمر اور آواز",
      tabIdx: 0,
    },
    {
      icon: Users,
      label: lang === "en" ? "Round-Robin" : "باری ٹریکر",
      desc: lang === "en" ? "Track participant turns & verses read" : "شرکاء کی باری اور تلاوت",
      tabIdx: 1,
    },
    {
      icon: MessageCircle,
      label: lang === "en" ? "Q&A Timer" : "سوال ٹائمر",
      desc: lang === "en" ? "Micro stopwatch with deferred questions" : "ٹائمر اور مؤخر سوالات",
      tabIdx: 2,
    },
    {
      icon: Layers,
      label: lang === "en" ? "Cycle Progress" : "مراحل کی پیش رفت",
      desc: lang === "en" ? "Track completion across all 3 cycles" : "تینوں مراحل میں پیش رفت",
      tabIdx: 3,
    },
    {
      icon: Calculator,
      label: lang === "en" ? "Pace Calculator" : "رفتار کیلکولیٹر",
      desc: lang === "en" ? "Plan timeline & session cadence" : "منصوبہ بندی اور رفتار",
      tabIdx: 4,
    },
    {
      icon: Sparkles,
      label: lang === "en" ? "Surah Quiz" : "سورہ کوئز",
      desc: lang === "en" ? "4 quiz modes to test surah knowledge" : "۴ طریقوں سے سورہ کا امتحان",
      tabIdx: 5,
    },
    {
      icon: CalendarDays,
      label: lang === "en" ? "Calendar" : "کیلنڈر",
      desc: lang === "en" ? "Generate session schedules" : "نشستوں کا شیڈول",
      tabIdx: 6,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Hero stat */}
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8 text-center">
        <div className="text-5xl sm:text-5xl font-bold font-mono text-emerald-deep">
          {overallPct}%
        </div>
        <div className="text-sm sm:text-sm text-muted-foreground mt-1.5 sm:mt-1">
          {lang === "en" ? "Overall curriculum progress" : "مجموعی پیش رفت"}
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 sm:mt-1">
          {overallDone} / {total * 3} {lang === "en" ? "surahs completed" : "سورتیں مکمل"}
        </div>
        <div className="w-full bg-muted rounded-full h-3 sm:h-2 mt-4 max-w-md mx-auto">
          <div
            className="bg-emerald-gradient h-3 sm:h-2 rounded-full transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-cycle progress */}
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        <div className="text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-4">
          {lang === "en" ? "Cycle Progress" : "مراحل کی پیش رفت"}
        </div>
        <div className="space-y-4 sm:space-y-4">
          {cycles.map((c) => {
            const done = (cycleData[c.key] || []).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={c.key}>
                <div className="flex justify-between text-sm sm:text-sm mb-1.5 sm:mb-1">
                  <span className="font-medium">{c.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {done}/{total} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 sm:h-2">
                  <div
                    className={`${c.color} h-3 sm:h-2 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-4">
          {lang === "en" ? "Quick Actions" : "فوری اقدامات"}
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3">
          {tools.map((t, i) => (
            <button
              key={i}
              onClick={() => {
                onNavigate(t.tabIdx);
              }}
              className="flex items-start gap-3 p-4 sm:p-4 rounded-2xl bg-card border border-border hover:border-gold/40 hover:shadow-elegant transition-all text-left"
            >
              <div className="shrink-0 w-10 sm:w-9 h-10 sm:h-9 rounded-xl bg-emerald-gradient/20 flex items-center justify-center">
                <t.icon className="h-5 sm:h-4 w-5 sm:w-4 text-gold" />
              </div>
              <div>
                <div className="text-sm sm:text-sm font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session History */}
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-4">
          <HistoryIcon className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
          {lang === "en" ? "Session History" : "نشستوں کی تاریخ"}
        </div>

        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5 sm:mb-6">
            <div className="rounded-2xl bg-background border border-border p-3 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-deep">{history.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lang === "en" ? "Sessions" : "نشستیں"}
              </div>
            </div>
            <div className="rounded-2xl bg-background border border-border p-3 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-deep">
                {history.reduce((s, r) => s + r.totalVerses, 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lang === "en" ? "Verses read" : "پڑھی گئی آیات"}
              </div>
            </div>
            <div className="rounded-2xl bg-background border border-border p-3 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-deep">
                {history.reduce((s, r) => s + r.actualMin, 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lang === "en" ? "Minutes" : "منٹ"}
              </div>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === "en"
              ? "No sessions recorded yet. Run a session in the Session Timer tool and it will be saved here automatically."
              : "ابھی کوئی نشست درج نہیں۔ نشست ٹائمر ٹول میں نشست چلائیں، یہ خود محفوظ ہو جائے گی۔"}
          </p>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 12).map((rec) => (
              <div key={rec.id} className="rounded-2xl bg-background border border-border p-3.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="text-sm font-semibold">
                    {new Date(rec.endedAt).toLocaleDateString(lang === "en" ? "en-US" : "ur-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-deep/10 text-emerald-deep text-[10px] font-bold">
                    C{rec.cycleIdx + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rec.actualMin}m {lang === "en" ? "·" : "·"} {rec.totalVerses}{" "}
                    {lang === "en" ? "verses" : "آیات"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {rec.participants.length > 0
                      ? `${rec.participants.length} ${lang === "en" ? "readers" : "قارئین"}`
                      : ""}
                  </span>
                </div>
                {rec.entries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.entries.map((en, i) => {
                      const s = SURAHS.find((x) => x.n === en.surahN);
                      return (
                        <span
                          key={i}
                          className="inline-block px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[11px] font-medium"
                        >
                          {s?.en} {en.from}–{en.to}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup & Restore */}
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-1.5 sm:mb-1">
          <Save className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
          {lang === "en" ? "Backup & Restore" : "بیک اپ اور بحالی"}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {lang === "en"
            ? "Download your data as JSON, or restore it from another device."
            : "اپنا ڈیٹا JSON کی شکل میں ڈاؤن لوڈ کریں یا کسی اور ڈیوائس سے بحال کریں۔"}
        </p>
        <div className="flex flex-wrap gap-2.5 sm:gap-2">
          <Button
            onClick={exportData}
            variant="outline"
            className="border-gold/40 text-sm sm:text-sm h-10 sm:h-9"
          >
            <Download className="h-4 w-4" /> {lang === "en" ? "Export JSON" : "برآمد کریں"}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-gold/40 text-sm sm:text-sm h-10 sm:h-9"
          >
            <Upload className="h-4 w-4" /> {lang === "en" ? "Import JSON" : "درآمد کریں"}
          </Button>
          <Button
            onClick={() => setShowClearDialog(true)}
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 text-sm sm:text-sm h-10 sm:h-9"
          >
            <Trash2 className="h-4 w-4" /> {lang === "en" ? "Clear all data" : "تمام ڈیٹا صاف کریں"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
        {backupMsg && (
          <div
            className={cn(
              "mt-3 text-xs sm:text-xs font-medium",
              backupMsg.ok ? "text-emerald-deep" : "text-destructive",
            )}
          >
            {backupMsg.text}
          </div>
        )}
      </div>

      {/* Clear confirmation dialog */}
      {showClearDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
          onClick={() => setShowClearDialog(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">
              {lang === "en" ? "Clear all data?" : "تمام ڈیٹا صاف کریں؟"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === "en"
                ? "This permanently deletes your roster, cycle progress, and session history from this browser."
                : "یہ اس براؤزر سے فہرست، پیش رفت اور نشستوں کی تاریخ مستقل طور پر حذف کر دے گا۔"}
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={confirmClear} className="bg-destructive text-white hover:opacity-90">
                <Trash2 className="h-4 w-4" /> {lang === "en" ? "Delete" : "حذف کریں"}
              </Button>
              <Button
                onClick={() => setShowClearDialog(false)}
                variant="outline"
                className="border-gold/40"
              >
                {lang === "en" ? "Cancel" : "منسوخ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session checklist */}
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        <div className="text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-4">
          {lang === "en" ? "Session Checklist" : "نشست کی فہرست"}
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm sm:text-sm">
          <div className="space-y-3 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-emerald-deep/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-deep">1</span>
              </div>
              <span>
                {lang === "en"
                  ? "Open Session Timer & set duration"
                  : "نشست کا ٹائمر کھولیں اور دورانیہ مقرر کریں"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-emerald-deep/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-deep">2</span>
              </div>
              <span>
                {lang === "en"
                  ? "Add participants to Round-Robin"
                  : "باری ٹریکر میں شرکاء شامل کریں"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-emerald-deep/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-deep">3</span>
              </div>
              <span>
                {lang === "en"
                  ? "Use Q&A Timer during discussion"
                  : "بحث کے دوران سوال ٹائمر استعمال کریں"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-emerald-deep/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-deep">4</span>
              </div>
              <span>
                {lang === "en"
                  ? "Mark completed surahs in Cycle Progress"
                  : "مکمل سورتوں کو نشان زد کریں"}
              </span>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold">5</span>
              </div>
              <span>
                {lang === "en"
                  ? "Check Pace Calculator for timeline"
                  : "ٹائم لائن کے لیے رفتار کیلکولیٹر دیکھیں"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold">6</span>
              </div>
              <span>
                {lang === "en" ? "Play Surah Quiz for review" : "مراجعہ کے لیے سورہ کوئز کھیلیں"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-2">
              <div className="w-8 sm:w-7 h-8 sm:h-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold">7</span>
              </div>
              <span>
                {lang === "en"
                  ? "Generate next session in Calendar"
                  : "اگلی نشست کے لیے کیلنڈر بنائیں"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilitatorDashboard;
