import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Download,
  ListPlus,
  Map as MapIcon,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ScrollText,
  Share2,
  StopCircle,
  Trash2,
  Users,
} from "lucide-react";
import { SURAHS } from "@/lib/surahs";
import { addSessionRecord, saveCycleProgress } from "@/lib/storage";
import { NumInput } from "@/components/num-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export function SessionPhaseTimer({
  lang,
  initialSplit,
}: {
  lang: string;
  initialSplit?: { reading: number; discussion: number } | null;
}) {
  const presets = [
    { key: "short", label: lang === "en" ? "15+15" : "۱۵+۱۵", reading: 15, discussion: 15 },
    { key: "medium", label: lang === "en" ? "30+30" : "۳۰+۳۰", reading: 30, discussion: 30 },
    { key: "standard", label: lang === "en" ? "45+45" : "۴۵+۴۵", reading: 45, discussion: 45 },
    { key: "long", label: lang === "en" ? "60+60" : "۶۰+۶۰", reading: 60, discussion: 60 },
    { key: "extended", label: lang === "en" ? "45+75" : "۴۵+۷۵", reading: 45, discussion: 75 },
    {
      key: "custom",
      label: lang === "en" ? "Custom" : "اپنی مرضی",
      reading: null,
      discussion: null,
    },
  ];

  const [selectedPreset, setSelectedPreset] = useState(initialSplit ? "custom" : "long");
  const [readingMins, setReadingMins] = useState(initialSplit?.reading ?? 60);
  const [discussionMins, setDiscussionMins] = useState(initialSplit?.discussion ?? 60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"reading" | "discussion" | "done">("reading");
  const intervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const warned_5m = useRef(false);
  const warned_transition = useRef(false);
  const sessionStartRef = useRef<Date | null>(null);

  // Q&A sub-timer state
  const [showQA, setShowQA] = useState(false);
  const [qaSeconds, setQaSeconds] = useState(120);
  const [qaDuration, setQaDuration] = useState(120);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaDeferred, setQaDeferred] = useState<{ id: number; text: string }[]>([]);
  const qaIntervalRef = useRef<number | null>(null);
  const qaIdRef = useRef(0);

  // Participant roster
  const [pName, setPName] = useState("");
  const [participants, setParticipants] = useState<{ id: number; name: string; read: boolean }[]>(
    [],
  );
  const pIdRef = useRef(0);
  const [savedRoster, setSavedRoster] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("qp_roster") || "[]");
    } catch {
      return [];
    }
  });

  // Reading log
  const [logSurah, setLogSurah] = useState(1);
  const [logFrom, setLogFrom] = useState(1);
  const [logTo, setLogTo] = useState(7);
  const [readToEnd, setReadToEnd] = useState(true);
  const [readingLog, setReadingLog] = useState<
    { id: number; surahN: number; from: number; to: number; checked: boolean }[]
  >([]);
  const logIdRef = useRef(0);

  // End session dialog
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endDialogEntries, setEndDialogEntries] = useState<
    { id: number; surahN: number; from: number; to: number }[]
  >([]);
  const endDialogIdRef = useRef(0);
  const sessionSavedRef = useRef(false);
  const [historySaved, setHistorySaved] = useState(false);

  const updateEndEntry = (
    id: number,
    patch: Partial<{ surahN: number; from: number; to: number }>,
  ) => setEndDialogEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEndEntry = (id: number) =>
    setEndDialogEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));

  const addEndEntry = () => {
    const defSurah = nextSurah?.n || 1;
    const maxV = SURAHS.find((s) => s.n === defSurah)?.verses || 1;
    setEndDialogEntries((prev) => [
      ...prev,
      { id: endDialogIdRef.current++, surahN: defSurah, from: 1, to: maxV },
    ]);
  };

  const openEndDialog = () => {
    pause();
    if (readingLog.length > 0) {
      setEndDialogEntries(
        readingLog.map((e) => ({
          id: endDialogIdRef.current++,
          surahN: e.surahN,
          from: e.from,
          to: e.to,
        })),
      );
    } else {
      const defSurah = nextSurah?.n || 1;
      const maxV = SURAHS.find((s) => s.n === defSurah)?.verses || 1;
      setEndDialogEntries([{ id: endDialogIdRef.current++, surahN: defSurah, from: 1, to: maxV }]);
    }
    setShowEndDialog(true);
  };

  const closeEndDialog = () => setShowEndDialog(false);

  const confirmEndSession = () => {
    const newLog = endDialogEntries.map((e) => ({
      id: logIdRef.current++,
      surahN: e.surahN,
      from: e.from,
      to: e.to,
      checked: true,
    }));
    setReadingLog(newLog);
    setShowEndDialog(false);
    setRunning(false);
    setPhase("done");
  };

  // Commit the session to history + auto-advance cycle progress once when phase reaches "done"
  useEffect(() => {
    if (phase !== "done" || sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    const checked = readingLog.filter((x) => x.checked);
    if (checked.length === 0) return;
    const endedAt = Date.now();
    const startedAt = sessionStartRef.current?.getTime() ?? endedAt;
    addSessionRecord({
      id: `s${endedAt}`,
      date: new Date(endedAt).toISOString().split("T")[0],
      startedAt,
      endedAt,
      plannedMin: readingMins + discussionMins,
      actualMin: Math.max(1, Math.round(elapsed / 60)),
      cycleIdx,
      participants: participants.filter((p) => p.read).map((p) => p.name),
      entries: checked.map((x) => ({
        surahN: x.surahN,
        from: x.from,
        to: x.to,
        verses: x.to - x.from + 1,
      })),
      totalVerses: checked.reduce((s, x) => s + (x.to - x.from + 1), 0),
    });
    setHistorySaved(true);
    const full = checked.filter(
      (x) =>
        (SURAHS.find((s) => s.n === x.surahN)?.verses ?? 0) > 0 &&
        x.from === 1 &&
        x.to === (SURAHS.find((s) => s.n === x.surahN)?.verses ?? 0),
    );
    if (full.length > 0) {
      setCycleProgress((prev) => {
        const list = prev[cycleKey] || [];
        const merged = [...new Set([...list, ...full.map((f) => f.surahN)])];
        const next = { ...prev, [cycleKey]: merged };
        saveCycleProgress(next);
        return next;
      });
    }
  }, [phase]);

  // Cycle integration
  const [cycleIdx, setCycleIdx] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("qp_cycle_idx") || "0");
      return typeof p === "number" ? p : 0;
    } catch {
      return 0;
    }
  });
  const [cycleProgress, setCycleProgress] = useState<Record<string, number[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("qp_cycle_progress") || "{}");
    } catch {
      return {};
    }
  });
  const allSurahs = SURAHS.slice();
  const cycleSurahs = useMemo(() => {
    if (cycleIdx === 0) return [...allSurahs].sort((a, b) => b.n - a.n);
    if (cycleIdx === 1) return [...allSurahs].sort((a, b) => a.nuzul - b.nuzul);
    return [...allSurahs].sort((a, b) => a.n - b.n);
  }, [cycleIdx]);
  const cycleKey = `cycle${cycleIdx + 1}`;
  const completedInCycle = cycleProgress[cycleKey] || [];
  const nextSurah = useMemo(
    () => cycleSurahs.find((s) => !completedInCycle.includes(s.n)),
    [cycleSurahs, completedInCycle],
  );

  const readingSeconds = readingMins * 60;
  const totalSeconds = (readingMins + discussionMins) * 60;

  // Auto-select next surah when cycle changes or if current is done
  useEffect(() => {
    if (nextSurah) {
      setLogSurah(nextSurah.n);
      const s = SURAHS.find((x) => x.n === nextSurah.n);
      if (s) {
        setLogFrom(1);
        setLogTo(s.verses);
        setReadToEnd(true);
      }
    }
  }, [cycleIdx]);

  const qaBeep = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  };

  const qaStart = () => {
    setQaRunning(true);
    qaIntervalRef.current = window.setInterval(() => {
      setQaSeconds((prev) => {
        if (prev <= 1) {
          setQaRunning(false);
          qaBeep();
          return qaDuration;
        }
        if (prev === 11) qaBeep();
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const qaStop = () => {
    setQaRunning(false);
    if (qaIntervalRef.current) clearInterval(qaIntervalRef.current);
  };

  const qaReset = () => {
    qaStop();
    setQaSeconds(qaDuration);
  };

  const addQaDeferred = () => {
    if (!qaQuestion.trim()) return;
    setQaDeferred((d) => [...d, { id: qaIdRef.current++, text: qaQuestion.trim() }]);
    setQaQuestion("");
  };

  const beep = (freq: number, dur: number) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  };

  const pickPreset = (key: string) => {
    if (running) return;
    setSelectedPreset(key);
    const p = presets.find((x) => x.key === key);
    if (p && p.reading !== null) {
      setReadingMins(p.reading);
      setDiscussionMins(p.discussion);
    }
  };

  const [newSessionAfterDone, setNewSessionAfterDone] = useState(false);

  const start = () => {
    warned_5m.current = false;
    warned_transition.current = false;
    sessionStartRef.current = new Date();
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next === readingSeconds - 300 && readingSeconds - 300 > 0) {
          beep(440, 0.3);
        }
        if (prev < readingSeconds && next >= readingSeconds) {
          setPhase("discussion");
          beep(660, 0.5);
        }
        if (next === totalSeconds - 300 && totalSeconds - 300 > 0) {
          beep(440, 0.3);
        }
        if (next >= totalSeconds) {
          setRunning(false);
          setPhase("done");
          beep(880, 0.8);
          return totalSeconds;
        }
        return next;
      });
    }, 1000) as unknown as number;
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = (clearAll = false) => {
    pause();
    qaStop();
    setElapsed(0);
    setPhase("reading");
    setShowQA(false);
    setNewSessionAfterDone(false);
    setReadingLog([]);
    setHistorySaved(false);
    sessionSavedRef.current = false;
    if (clearAll) {
      setParticipants([]);
    } else {
      setParticipants(savedRoster.map((name) => ({ id: pIdRef.current++, name, read: true })));
    }
    warned_5m.current = false;
    warned_transition.current = false;
  };

  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
  const readingPct = totalSeconds > 0 ? (readingSeconds / totalSeconds) * 100 : 50;

  // Participant helpers
  const addParticipant = () => {
    if (!pName.trim()) return;
    setParticipants((p) => [...p, { id: pIdRef.current++, name: pName.trim(), read: true }]);
    setPName("");
  };
  const toggleRead = (id: number) =>
    setParticipants((p) => p.map((x) => (x.id === id ? { ...x, read: !x.read } : x)));
  const removeParticipant = (id: number) => setParticipants((p) => p.filter((x) => x.id !== id));
  const saveRoster = () => {
    const names = participants.map((p) => p.name);
    localStorage.setItem("qp_roster", JSON.stringify(names));
    setSavedRoster(names);
  };
  const loadRoster = () => {
    setParticipants(savedRoster.map((name) => ({ id: pIdRef.current++, name, read: true })));
  };

  // Reading log helpers
  const addLogItem = () => {
    const targetTo = readToEnd ? SURAHS.find((s) => s.n === logSurah)?.verses || logTo : logTo;
    if (logFrom < 1 || targetTo < logFrom) return;
    const n = logSurah;
    const entry = { id: logIdRef.current++, surahN: n, from: logFrom, to: targetTo, checked: true };
    setReadingLog((l) => [...l, entry]);
    // If read to end, mark surah as completed in cycle progress
    if (readToEnd) {
      setCycleProgress((prev) => {
        const list = prev[cycleKey] || [];
        if (list.includes(n)) return prev;
        const next = { ...prev, [cycleKey]: [...list, n] };
        localStorage.setItem("qp_cycle_progress", JSON.stringify(next));
        return next;
      });
    }
    // Advance to next surah in cycle
    const nextUp = cycleSurahs.find(
      (s) => s.n !== n && !(completedInCycle.includes(s.n) || (readToEnd && s.n === n)),
    );
    if (nextUp) {
      setLogSurah(nextUp.n);
      setLogFrom(1);
      setLogTo(nextUp.verses);
      setReadToEnd(true);
    }
  };
  const toggleLogItem = (id: number) =>
    setReadingLog((l) => l.map((x) => (x.id === id ? { ...x, checked: !x.checked } : x)));
  const removeLogItem = (id: number) => setReadingLog((l) => l.filter((x) => x.id !== id));

  const surahLog = SURAHS;

  // WhatsApp message
  const cycLabel = ["Foundation (Reverse)", "Seerah (Nuzuli)", "Mastery (Mushaf)"][cycleIdx];
  const checkedLog = readingLog.filter((x) => x.checked);
  const totalVersesRead = checkedLog.reduce((s, x) => s + (x.to - x.from + 1), 0);
  // Find partial entries (not read to end) for continuation note
  const partialEntry = checkedLog.find(
    (x) => x.to < (SURAHS.find((s) => s.n === x.surahN)?.verses || 0),
  );
  const continueNote = partialEntry
    ? `Continue from ${SURAHS.find((s) => s.n === partialEntry.surahN)?.en} ${partialEntry.to + 1}`
    : nextSurah
      ? `Continue from ${nextSurah.en}`
      : "TBD";
  const genSessionDate = () =>
    new Date().toLocaleDateString(lang === "en" ? "en-US" : "ur-PK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const genSessionTime = (d: Date) =>
    d.toLocaleTimeString(lang === "en" ? "en-US" : "ur-PK", { hour: "2-digit", minute: "2-digit" });
  const actualMinutes = Math.round(elapsed / 60);
  const startTimeStr = sessionStartRef.current ? genSessionTime(sessionStartRef.current) : "—";
  const endTimeStr = genSessionTime(new Date());
  const defaultMessage = [
    `📖 *Qurʼān Parho Session*`,
    `📅 ${genSessionDate()}`,
    `⏰ ${startTimeStr} → ${endTimeStr} · ${actualMinutes}m (planned ${readingMins + discussionMins}m)`,
    `📖 ${totalVersesRead} ${lang === "en" ? "verses read" : "آیات پڑھی گئیں"}`,
    `🔄 ${["C1", "C2", "C3"][cycleIdx]} · ${cycLabel}`,
    checkedLog.length > 0 ? `` : null,
    checkedLog.length > 0 ? `📚 *Covered:*` : null,
    ...checkedLog.map((x) => {
      const s = SURAHS.find((s) => s.n === x.surahN);
      const isFull = x.from === 1 && x.to === (s?.verses || 0);
      return `   ${isFull ? "✅" : "📄"} ${s?.en || "?"} (${x.from}–${x.to})${isFull ? " ✓" : ""}`;
    }),
    checkedLog.length > 0 ? `` : null,
    `👥 *Participants:* ${participants
      .filter((p) => p.read)
      .map((p) => p.name)
      .join(", ")}`,
    `📌 *Next:* ${continueNote}`,
  ]
    .filter(Boolean)
    .join("\n");
  const [editableMsg, setEditableMsg] = useState("");
  useEffect(() => {
    if (phase === "done" && !editableMsg) setEditableMsg(defaultMessage);
  }, [phase]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* ========== SETUP STATE (before running) ========== */}
        {!running && phase !== "done" && (
          <div className="space-y-6">
            {/* Preset cards */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => pickPreset(p.key)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-3 sm:px-4 sm:py-2.5 rounded-xl border transition-all text-center",
                    selectedPreset === p.key
                      ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                      : "bg-background border-border text-muted-foreground hover:border-gold/60",
                  )}
                >
                  <span className="text-base sm:text-sm font-bold">{p.label}</span>
                  {p.key !== "custom" && (
                    <div className="text-xs opacity-70">{lang === "en" ? "min" : "منٹ"}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom inputs */}
            {selectedPreset === "custom" && (
              <div className="flex gap-5 sm:gap-4 justify-center">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 text-center">
                    {lang === "en" ? "Reading" : "ترجمہ"}
                  </label>
                  <NumInput
                    value={readingMins}
                    onChange={setReadingMins}
                    min={1}
                    max={480}
                    className="w-28 sm:w-24 text-center border-gold/40 h-10 sm:h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 text-center">
                    {lang === "en" ? "Discussion" : "مباحثہ"}
                  </label>
                  <NumInput
                    value={discussionMins}
                    onChange={setDiscussionMins}
                    min={1}
                    max={480}
                    className="w-28 sm:w-24 text-center border-gold/40 h-10 sm:h-9"
                  />
                </div>
              </div>
            )}

            <div className="text-center text-base sm:text-sm text-muted-foreground">
              {lang === "en" ? "Total" : "کل"}:{" "}
              <span className="font-bold font-mono text-foreground">
                {readingMins + discussionMins}
              </span>{" "}
              {lang === "en" ? "min" : "منٹ"}
            </div>

            {/* ── Participants ── */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-3">
                <Users className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                {lang === "en" ? "Participants" : "شرکاء"}
              </div>
              <div className="flex gap-2.5 sm:gap-2">
                <Input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                  placeholder={lang === "en" ? "Name..." : "نام..."}
                  className="border-gold/40 h-10 sm:h-9 text-base sm:text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={addParticipant}
                  className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9 px-3.5 sm:px-3"
                >
                  <Plus className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                </Button>
              </div>
              {savedRoster.length > 0 && (
                <div className="flex gap-2.5 sm:gap-2 mt-2.5 sm:mt-2">
                  <Button
                    size="sm"
                    onClick={loadRoster}
                    variant="outline"
                    className="border-gold/40 h-10 sm:h-9 text-xs"
                  >
                    <Download className="h-3.5 sm:h-3 w-3.5 sm:w-3" />{" "}
                    {lang === "en" ? "Load Saved" : "محفوظ لوڈ"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveRoster}
                    variant="outline"
                    className="border-gold/40 h-10 sm:h-9 text-xs"
                  >
                    <Save className="h-3.5 sm:h-3 w-3.5 sm:w-3" />{" "}
                    {lang === "en" ? "Save Roster" : "فہرست محفوظ"}
                  </Button>
                </div>
              )}
              {participants.length > 0 && (
                <div className="mt-3 space-y-2 sm:space-y-1.5">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 sm:gap-2 p-2.5 sm:p-2 rounded-xl bg-background border border-border"
                    >
                      <button
                        onClick={() => toggleRead(p.id)}
                        className={cn(
                          "h-6 sm:h-5 w-6 sm:w-5 rounded border-2 grid place-items-center transition-all shrink-0",
                          p.read
                            ? "bg-emerald-deep border-emerald-deep text-white"
                            : "border-muted-foreground",
                        )}
                      >
                        {p.read && <Check className="h-3.5 sm:h-3 w-3.5 sm:w-3 stroke-[3]" />}
                      </button>
                      <span className="text-sm sm:text-sm flex-1 break-words min-w-0">
                        {p.name}
                      </span>
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cycle Direction ── */}
            <div className="pt-3 sm:pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-3">
                <MapIcon className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                {lang === "en" ? "Cycle Direction" : "مرحلہ سمت"}
              </div>
              <div className="flex gap-2 sm:gap-1.5">
                {[
                  { key: 0, label: lang === "en" ? "Foundation" : "بنیاد", sub: "← Reverse" },
                  { key: 1, label: lang === "en" ? "Seerah" : "سیرت", sub: "Nuzuli →" },
                  { key: 2, label: lang === "en" ? "Mastery" : "مہارت", sub: "Mushaf →" },
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => {
                      setCycleIdx(c.key);
                      localStorage.setItem("qp_cycle_idx", String(c.key));
                    }}
                    className={cn(
                      "flex-1 px-2.5 sm:px-2 py-2.5 sm:py-2 rounded-xl text-center border transition-all",
                      cycleIdx === c.key
                        ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                        : "bg-background border-border text-muted-foreground hover:border-gold/60",
                    )}
                  >
                    <div className="text-xs font-bold">C{c.key + 1}</div>
                    <div className="text-xs opacity-70">{c.label}</div>
                  </button>
                ))}
              </div>
              {/* Next surah indicator */}
              {nextSurah && cycleSurahs.length > 0 && (
                <div className="mt-2.5 sm:mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowRight className="h-3.5 sm:h-3 w-3.5 sm:w-3 text-gold" />
                  <span>
                    {lang === "en" ? "Next" : "اگلا"}:{" "}
                    <span className="font-medium text-foreground">{nextSurah.en}</span>
                    {" · "}
                    {nextSurah.verses} {lang === "en" ? "verses" : "آیات"}
                    <span className="text-emerald-deep font-semibold ml-1">
                      · {completedInCycle.length}/{cycleSurahs.length} ✓
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* ── Reading Log (setup) ── */}
            <div className="pt-3 sm:pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-3">
                <BookOpen className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                {lang === "en" ? "Reading Log" : "تلاوت کا ریکارڈ"}
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-muted-foreground mb-1.5 sm:mb-1">
                    {lang === "en" ? "Surah" : "سورہ"}
                  </label>
                  <select
                    value={logSurah}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLogSurah(v);
                      const s = SURAHS.find((x) => x.n === v);
                      if (s) {
                        const newTo = readToEnd ? s.verses : Math.min(logTo, s.verses);
                        setLogTo(newTo);
                      }
                    }}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-gold/40 bg-background text-sm"
                  >
                    {cycleSurahs.map((s) => {
                      const done = completedInCycle.includes(s.n);
                      return (
                        <option
                          key={s.n}
                          value={s.n}
                          className={done ? "text-muted-foreground" : ""}
                        >
                          {done ? "✓ " : ""}
                          {s.n}. {s.en} ({s.verses} {lang === "en" ? "v" : "آ"})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-16">
                  <label className="block text-xs text-muted-foreground mb-1.5 sm:mb-1">
                    {lang === "en" ? "From" : "سے"}
                  </label>
                  <NumInput
                    value={logFrom}
                    onChange={setLogFrom}
                    min={1}
                    max={SURAHS.find((s) => s.n === logSurah)?.verses || 300}
                    className="h-10 sm:h-9 text-center border-gold/40 text-sm"
                  />
                </div>
                <div className="w-16">
                  <label className="block text-xs text-muted-foreground mb-1.5 sm:mb-1">
                    {lang === "en" ? "To" : "تک"}
                  </label>
                  <NumInput
                    value={
                      readToEnd ? SURAHS.find((s) => s.n === logSurah)?.verses || logTo : logTo
                    }
                    min={logFrom}
                    max={SURAHS.find((s) => s.n === logSurah)?.verses || 300}
                    disabled={readToEnd}
                    onChange={setLogTo}
                    className={cn(
                      "h-10 sm:h-9 text-center border-gold/40 text-sm",
                      readToEnd && "opacity-50",
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-1">
                  <button
                    onClick={() => setReadToEnd(!readToEnd)}
                    className={cn(
                      "h-10 sm:h-9 text-xs px-3 sm:px-2.5 rounded font-semibold border transition-all",
                      readToEnd
                        ? "bg-emerald-gradient text-gold border-gold"
                        : "bg-background text-muted-foreground border-border",
                    )}
                  >
                    {readToEnd ? (lang === "en" ? "End" : "آخر") : lang === "en" ? "Custom" : "صرف"}
                  </button>
                  <Button
                    size="sm"
                    onClick={addLogItem}
                    className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9"
                  >
                    <Plus className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                  </Button>
                </div>
              </div>
              {readingLog.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {readingLog.map((x) => {
                    const s = SURAHS.find((s) => s.n === x.surahN);
                    const maxV = s?.verses || 0;
                    const isFull = x.from === 1 && x.to === maxV;
                    return (
                      <div
                        key={x.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border"
                      >
                        <button
                          onClick={() => toggleLogItem(x.id)}
                          className={cn(
                            "h-4 w-4 rounded border-2 grid place-items-center transition-all shrink-0",
                            x.checked
                              ? "bg-emerald-deep border-emerald-deep text-white"
                              : "border-muted-foreground",
                          )}
                        >
                          {x.checked && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <span
                          className={cn(
                            "text-sm flex-1 truncate",
                            !x.checked && "line-through text-muted-foreground",
                          )}
                        >
                          {s?.en} ({x.from}–{x.to})
                          {isFull ? (lang === "en" ? " ✓ complete" : " ✓ مکمل") : ""}
                        </span>
                        <button
                          onClick={() => removeLogItem(x.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Start button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={start}
                className="bg-emerald-gradient text-gold border border-gold/40"
              >
                <Play className="h-4 w-4" /> {lang === "en" ? "Start Session" : "نشست شروع کریں"}
              </Button>
            </div>
          </div>
        )}

        {/* ========== RUNNING / ACTIVE SESSION STATE ========== */}
        {(running || (elapsed > 0 && phase !== "done")) && (
          <>
            {/* ── Persistent Floating Mobile Timer Bar (Always visible on screen on mobile) ── */}
            <div className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-50 rounded-2xl border border-gold/50 bg-card/95 backdrop-blur-xl p-2.5 shadow-elegant md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      phase === "reading"
                        ? "bg-emerald-gradient text-gold border border-gold/40"
                        : "bg-gold-gradient text-emerald-deep font-extrabold",
                    )}
                  >
                    {phase === "reading"
                      ? lang === "en"
                        ? "Reading"
                        : "ترجمہ"
                      : lang === "en"
                        ? "Discussion"
                        : "مباحثہ"}
                  </span>
                  <div
                    className={cn(
                      "text-xl font-bold font-mono tabular-nums leading-none",
                      phase === "reading" ? "text-emerald-deep" : "text-gold",
                    )}
                  >
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {running ? (
                    <Button
                      size="sm"
                      onClick={pause}
                      className="bg-gold-gradient text-emerald-deep border border-gold/40 h-8 px-2.5 text-xs font-bold"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={start}
                      className="bg-emerald-gradient text-gold border border-gold/40 h-8 px-2.5 text-xs font-bold"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setShowQA((s) => !s)}
                    className={cn(
                      "h-8 px-2.5 text-xs border border-gold/40 font-bold",
                      showQA
                        ? "bg-emerald-gradient text-gold"
                        : "bg-background text-muted-foreground",
                    )}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openEndDialog}
                    variant="outline"
                    className="border-destructive/60 text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
                <div className="absolute inset-0 flex">
                  <div className="bg-emerald-gradient" style={{ width: `${readingPct}%` }} />
                  <div className="bg-gold-gradient" style={{ width: `${100 - readingPct}%` }} />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-background shadow-lg transition-all duration-300 z-10"
                  style={{ left: `${pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Twin timers — phase + Q&A on one screen */}
              <div className={cn("grid gap-4", showQA && "lg:grid-cols-2")}>
                {/* Phase timer */}
                <div className="rounded-2xl border border-border bg-background p-5 sm:p-8 text-center">
                  <div
                    className={cn(
                      "text-sm sm:text-base uppercase tracking-widest font-semibold",
                      phase === "reading" ? "text-emerald-deep" : "text-gold",
                    )}
                  >
                    {phase === "reading"
                      ? lang === "en"
                        ? "Reading Phase"
                        : "ترجمہ"
                      : lang === "en"
                        ? "Discussion Phase"
                        : "مباحثہ"}
                  </div>
                  <div
                    className={cn(
                      "mt-3 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight pb-1",
                      phase === "reading" ? "text-emerald-deep" : "text-gold",
                    )}
                  >
                    {phase === "reading"
                      ? lang === "ur"
                        ? "القراءة"
                        : "READING"
                      : lang === "ur"
                        ? "المناقشة"
                        : "DISCUSSION"}
                  </div>
                  <div
                    className={cn(
                      "mt-4 sm:mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tabular-nums",
                      phase === "reading" ? "text-emerald-deep/70" : "text-gold/70",
                    )}
                  >
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </div>
                  <div className="mt-3 text-base sm:text-lg text-muted-foreground">
                    {phase === "reading"
                      ? lang === "en"
                        ? `Discussion in ${Math.ceil((readingSeconds - elapsed) / 60)} min`
                        : `مباحثہ ${Math.ceil((readingSeconds - elapsed) / 60)} منٹ میں`
                      : lang === "en"
                        ? `${Math.ceil((totalSeconds - elapsed) / 60)} min remaining`
                        : `${Math.ceil((totalSeconds - elapsed) / 60)} منٹ باقی`}
                  </div>
                </div>

                {/* Q&A timer */}
                {showQA && (
                  <div className="rounded-2xl border border-gold/40 bg-background p-5 sm:p-8 text-center">
                    <div className="text-sm sm:text-base uppercase tracking-widest text-gold font-semibold">
                      ⚡ {lang === "en" ? "Question Timer" : "سوال کا ٹائمر"}
                    </div>
                    <div
                      className={cn(
                        "mt-4 text-6xl sm:text-6xl font-bold font-mono tabular-nums",
                        qaSeconds <= 10 && qaRunning ? "text-destructive" : "text-gold",
                      )}
                    >
                      {String(Math.floor(qaSeconds / 60)).padStart(2, "0")}:
                      {String(qaSeconds % 60).padStart(2, "0")}
                    </div>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[30, 60, 120, 180, 300].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            if (!qaRunning) {
                              setQaDuration(s);
                              setQaSeconds(s);
                            }
                          }}
                          className={cn(
                            "px-4 py-2.5 rounded-full text-sm font-semibold border transition-all",
                            qaDuration === s
                              ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                              : "bg-background border-border text-muted-foreground hover:border-gold/60",
                          )}
                        >
                          {s < 60 ? `${s}s` : `${s / 60}m`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                      {!qaRunning ? (
                        <Button
                          onClick={qaStart}
                          className="bg-emerald-gradient text-gold border border-gold/40 h-11 sm:h-10 text-sm px-5 sm:px-4"
                        >
                          <Play className="h-4 w-4" /> {lang === "en" ? "Start" : "شروع"}
                        </Button>
                      ) : (
                        <Button
                          onClick={qaStop}
                          className="bg-gold-gradient text-emerald-deep border border-gold/40 h-11 sm:h-10 text-sm px-5 sm:px-4"
                        >
                          <Pause className="h-4 w-4" /> {lang === "en" ? "Stop" : "روکیں"}
                        </Button>
                      )}
                      <Button
                        onClick={qaReset}
                        variant="outline"
                        className="border-gold/40 h-11 sm:h-10 text-sm px-5 sm:px-4"
                      >
                        <RotateCcw className="h-4 w-4" /> {lang === "en" ? "Reset" : "دوبارہ"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="bg-emerald-gradient" style={{ width: `${readingPct}%` }} />
                  <div className="bg-gold-gradient" style={{ width: `${100 - readingPct}%` }} />
                </div>
                <div className="absolute inset-0 rounded-full border border-border" />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-background shadow-lg transition-all duration-300 z-10"
                  style={{ left: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider -mt-4">
                <span>
                  {lang === "en" ? "Reading" : "ترجمہ"} ({readingMins}m)
                </span>
                <span>
                  {lang === "en" ? "Discussion" : "مباحثہ"} ({discussionMins}m)
                </span>
              </div>

              {/* ── Participants compact ── */}
              {participants.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold font-semibold mb-2">
                    <Users className="h-3.5 sm:h-3 w-3.5 sm:w-3" />{" "}
                    {lang === "en" ? "Participants" : "شرکاء"}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-1.5">
                    {participants.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => toggleRead(p.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 sm:gap-1 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-full text-sm sm:text-xs font-medium border transition-all",
                          p.read
                            ? "bg-emerald-gradient text-gold border-gold"
                            : "bg-background border-border text-muted-foreground line-through",
                        )}
                      >
                        {p.read ? (
                          <Check className="h-3 sm:h-2.5 w-3 sm:w-2.5 stroke-[3]" />
                        ) : (
                          <span className="h-3 sm:h-2.5 w-3 sm:w-2.5 rounded border border-current" />
                        )}
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Reading Log compact ── */}
              <div className="pt-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold font-semibold mb-2">
                  <BookOpen className="h-3.5 sm:h-3 w-3.5 sm:w-3" />{" "}
                  {lang === "en" ? "Reading Log" : "تلاوت کا ریکارڈ"}
                  {nextSurah && (
                    <span className="text-muted-foreground font-normal normal-case text-xs">
                      · {lang === "en" ? "Next" : "اگلا"}: {nextSurah.en}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 items-end">
                  <select
                    value={logSurah}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLogSurah(v);
                      const s = SURAHS.find((x) => x.n === v);
                      if (s) {
                        const newTo = readToEnd ? s.verses : Math.min(logTo, s.verses);
                        setLogTo(newTo);
                      }
                    }}
                    className="flex-1 min-w-[120px] px-2 py-2 sm:py-1.5 rounded-lg border border-gold/40 bg-background text-sm sm:text-xs"
                  >
                    {cycleSurahs.map((s) => {
                      const done = completedInCycle.includes(s.n);
                      return (
                        <option
                          key={s.n}
                          value={s.n}
                          className={done ? "text-muted-foreground" : ""}
                        >
                          {done ? "✓ " : ""}
                          {s.n}. {s.en}
                        </option>
                      );
                    })}
                  </select>
                  <NumInput
                    value={logFrom}
                    onChange={setLogFrom}
                    min={1}
                    max={SURAHS.find((s) => s.n === logSurah)?.verses || 300}
                    className="w-16 sm:w-14 px-1.5 sm:px-1 py-2 sm:py-1.5 rounded-lg border border-gold/40 bg-background text-sm sm:text-xs text-center h-auto shadow-none"
                  />
                  <span className="text-sm sm:text-xs text-muted-foreground">–</span>
                  <NumInput
                    value={
                      readToEnd ? SURAHS.find((s) => s.n === logSurah)?.verses || logTo : logTo
                    }
                    min={logFrom}
                    max={SURAHS.find((s) => s.n === logSurah)?.verses || 300}
                    disabled={readToEnd}
                    onChange={setLogTo}
                    className={cn(
                      "w-16 sm:w-14 px-1.5 sm:px-1 py-2 sm:py-1.5 rounded-lg border border-gold/40 bg-background text-sm sm:text-xs text-center h-auto shadow-none",
                      readToEnd && "opacity-50",
                    )}
                  />
                  <button
                    onClick={() => setReadToEnd(!readToEnd)}
                    className={cn(
                      "h-10 sm:h-9 text-xs px-3 sm:px-2.5 rounded font-semibold border transition-all",
                      readToEnd
                        ? "bg-emerald-gradient text-gold border-gold"
                        : "bg-background text-muted-foreground border-border",
                    )}
                  >
                    {readToEnd ? "End" : "Cstm"}
                  </button>
                  <button
                    onClick={addLogItem}
                    className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-emerald-gradient text-gold grid place-items-center border border-gold/40 shrink-0"
                  >
                    <Plus className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                  </button>
                </div>
                {/* Next surah hint if current surah is completed in progress */}
                {nextSurah && logSurah !== nextSurah.n && (
                  <div className="mt-1.5 sm:mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 sm:h-2.5 w-3 sm:w-2.5 text-gold" />
                    {lang === "en"
                      ? "Done with this surah? Log it and we'll auto-advance to"
                      : "یہ سورہ مکمل؟ لاگ کریں، اگلی سورہ"}{" "}
                    <span className="font-medium text-foreground">{nextSurah.en}</span>
                  </div>
                )}
                {readingLog.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                    {readingLog.map((x) => {
                      const s = SURAHS.find((s) => s.n === x.surahN);
                      const maxV = s?.verses || 0;
                      const isFull = x.from === 1 && x.to === maxV;
                      return (
                        <div
                          key={x.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs"
                        >
                          <button
                            onClick={() => toggleLogItem(x.id)}
                            className={cn(
                              "h-3.5 w-3.5 rounded border-2 grid place-items-center shrink-0",
                              x.checked
                                ? "bg-emerald-deep border-emerald-deep text-white"
                                : "border-muted-foreground",
                            )}
                          >
                            {x.checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </button>
                          <span
                            className={cn(
                              "flex-1 truncate",
                              !x.checked && "line-through text-muted-foreground",
                            )}
                          >
                            {s?.en} ({x.from}–{x.to}){isFull ? " ✓" : ""}
                          </span>
                          <button
                            onClick={() => removeLogItem(x.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2.5 pt-2">
                <Button
                  onClick={pause}
                  className="bg-gold-gradient text-emerald-deep border border-gold/40 h-10 sm:h-9 text-sm sm:text-xs px-4 sm:px-3"
                >
                  <Pause className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                  {lang === "en" ? "Pause" : "روکیں"}
                </Button>
                <Button
                  onClick={() => setShowQA((s) => !s)}
                  className={cn(
                    "h-10 sm:h-9 text-sm sm:text-xs border border-gold/40 px-4 sm:px-3",
                    showQA
                      ? "bg-emerald-gradient text-gold"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  <MessageCircle className="h-4 sm:h-3.5 w-4 sm:w-3.5" /> QA
                </Button>
                <Button
                  onClick={() => reset()}
                  variant="outline"
                  className="border-gold/40 h-10 sm:h-9 text-sm sm:text-xs px-4 sm:px-3"
                >
                  <RotateCcw className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                  {lang === "en" ? "Reset" : "دوبارہ"}
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  onClick={openEndDialog}
                  variant="outline"
                  className="border-destructive/60 text-destructive hover:bg-destructive/10 h-10 sm:h-9 text-xs px-4 sm:px-3"
                >
                  <StopCircle className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                  {lang === "en" ? "End Session" : "نشست ختم کریں"}
                </Button>
              </div>

              {/* Deferred questions */}
              {showQA && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    <ListPlus className="h-3.5 w-3.5" />{" "}
                    {lang === "en" ? "Defer Question" : "سوال مؤخر کریں"}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addQaDeferred()}
                      placeholder={lang === "en" ? "Type a question..." : "سوال درج کریں..."}
                      className="border-gold/40 h-10 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={addQaDeferred}
                      className="bg-emerald-gradient text-gold border border-gold/40 shrink-0 h-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {qaDeferred.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        {lang === "en" ? "No deferred questions." : "کوئی مؤخر سوال نہیں۔"}
                      </p>
                    )}
                    {qaDeferred.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-background border border-border"
                      >
                        <span className="text-sm">{q.text}</span>
                        <button
                          onClick={() => setQaDeferred((d) => d.filter((x) => x.id !== q.id))}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== DONE STATE ========== */}
        {phase === "done" && !newSessionAfterDone && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">
                {lang === "en" ? "Session Complete" : "نشست مکمل"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "en" ? "Great work! 🎉" : "بہت خوب! 🎉"}
              </p>
              {historySaved && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-deep/40 bg-emerald-deep/10 px-3 py-1 text-xs font-semibold text-emerald-deep">
                  <Check className="h-3.5 w-3.5" />{" "}
                  {lang === "en" ? "Saved to history" : "تاریخ میں محفوظ"}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-background border border-border p-4 sm:p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-1">
                <ScrollText className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                {lang === "en" ? "Summary" : "خلاصہ"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:text-sm">
                <div>
                  <span className="text-muted-foreground">{lang === "en" ? "Date" : "تاریخ"}:</span>{" "}
                  <span className="font-medium">{genSessionDate()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {lang === "en" ? "Duration" : "دورانیہ"}:
                  </span>{" "}
                  <span className="font-medium">
                    {actualMinutes}m {lang === "en" ? "actual" : "حقیقی"} ·{" "}
                    {readingMins + discussionMins}m {lang === "en" ? "planned" : "منصوبہ"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{lang === "en" ? "Time" : "وقت"}:</span>{" "}
                  <span className="font-medium">
                    {startTimeStr} → {endTimeStr}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {lang === "en" ? "Verses" : "آیات"}:
                  </span>{" "}
                  <span className="font-medium">{totalVersesRead}</span>
                </div>
              </div>
              {participants.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-xs">
                    {lang === "en" ? "Participants" : "شرکاء"}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-1 mt-1">
                    {participants
                      .filter((p) => p.read)
                      .map((p) => (
                        <span
                          key={p.id}
                          className="inline-block px-2.5 sm:px-2 py-1 sm:py-0.5 rounded-full bg-emerald-deep/10 text-emerald-deep text-xs font-medium"
                        >
                          {p.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {checkedLog.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-xs">
                    {lang === "en" ? "What we read" : "ہم نے پڑھا"}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-1 mt-1">
                    {checkedLog.map((x) => {
                      const s = SURAHS.find((s) => s.n === x.surahN);
                      return (
                        <span
                          key={x.id}
                          className="inline-block px-2.5 sm:px-2 py-1 sm:py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium"
                        >
                          {s?.en} ({x.from}–{x.to})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp message */}
            <div className="rounded-2xl bg-background border border-gold/40 p-4 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-xs uppercase tracking-widest text-gold font-semibold mb-2">
                <Share2 className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                {lang === "en" ? "WhatsApp Message" : "واٹس ایپ پیغام"}
              </div>
              <div className="relative">
                <textarea
                  value={editableMsg}
                  onChange={(e) => setEditableMsg(e.target.value)}
                  rows={checkedLog.length > 0 ? 10 : 7}
                  className="w-full p-4 rounded-xl bg-card border border-border text-base sm:text-base resize-none leading-relaxed"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(editableMsg)}
                  className="absolute top-3 right-3 h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-emerald-gradient text-gold grid place-items-center border border-gold/40 hover:shadow-gold transition-all"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs sm:text-xs text-muted-foreground mt-2">
                {lang === "en"
                  ? "Edit the message above if needed, then tap 📋 to copy and paste into your WhatsApp group."
                  : "اگر ضرورت ہو تو پیغام میں ترمیم کریں، پھر کاپی کر کے واٹس ایپ گروپ میں پیسٹ کریں۔"}
              </p>
            </div>

            {/* New session */}
            <div className="flex flex-col items-center gap-2.5 sm:gap-2">
              <Button
                onClick={() => reset()}
                className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
              >
                <RotateCcw className="h-4 w-4" /> {lang === "en" ? "New Session" : "نئی نشست"}
              </Button>
              <button
                onClick={() => reset(true)}
                className="text-xs sm:text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
              >
                {lang === "en" ? "or start fresh (clear all)" : "شروع سے کریں (سب صاف کریں)"}
              </button>
            </div>
          </div>
        )}

        {/* End Session Dialog */}
        {showEndDialog && (
          <div
            className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
            onClick={closeEndDialog}
          >
            <div
              className="bg-card border border-border rounded-3xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold">
                {lang === "en" ? "Confirm Verses Read" : "پڑھی گئی آیات کی تصدیق کریں"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {lang === "en"
                  ? "Adjust the surahs and verse ranges actually covered this session."
                  : "اس نشست میں پڑھی گئی سورتوں اور آیات کی حد درست کریں۔"}
              </p>

              {endDialogEntries.map((e) => {
                const s = SURAHS.find((x) => x.n === e.surahN);
                const maxV = s?.verses || 1;
                return (
                  <div
                    key={e.id}
                    className="flex flex-wrap items-end gap-2 pb-3 border-b border-border/50"
                  >
                    <select
                      value={e.surahN}
                      onChange={(v) => {
                        const newN = Number(v.target.value);
                        const newMax = SURAHS.find((x) => x.n === newN)?.verses || 1;
                        updateEndEntry(e.id, { surahN: newN, from: 1, to: newMax });
                      }}
                      className="h-10 rounded-xl border border-gold/40 bg-background px-3 text-sm w-56"
                    >
                      {[...SURAHS]
                        .sort((a, b) => a.n - b.n)
                        .map((s) => (
                          <option key={s.n} value={s.n}>
                            #{s.n} {s.en}
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">{lang === "en" ? "From" : "سے"}</span>
                      <NumInput
                        value={e.from}
                        min={1}
                        max={maxV}
                        className="h-10 w-16 rounded-xl border border-gold/40 bg-background px-2 text-center text-sm"
                        onChange={(val) =>
                          updateEndEntry(e.id, { from: val, to: Math.max(val, e.to) })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">{lang === "en" ? "To" : "تک"}</span>
                      <NumInput
                        value={e.to}
                        min={1}
                        max={maxV}
                        className="h-10 w-16 rounded-xl border border-gold/40 bg-background px-2 text-center text-sm"
                        onChange={(val) => updateEndEntry(e.id, { to: Math.max(e.from, val) })}
                      />
                    </div>
                    <button
                      onClick={() => removeEndEntry(e.id)}
                      disabled={endDialogEntries.length <= 1}
                      className="h-10 w-10 rounded-xl border border-border grid place-items-center text-muted-foreground hover:text-destructive hover:border-destructive/60 disabled:opacity-30 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={addEndEntry}
                className="w-full h-10 rounded-xl border border-dashed border-gold/40 text-sm text-muted-foreground hover:text-gold hover:border-gold transition-all"
              >
                <Plus className="h-4 w-4 inline mr-1" />{" "}
                {lang === "en" ? "+ Add Surah" : "+ سورہ شامل کریں"}
              </button>

              <div className="flex gap-2 pt-2">
                <Button onClick={confirmEndSession} className="bg-emerald-gradient text-gold">
                  <Check className="h-4 w-4" />{" "}
                  {lang === "en" ? "Confirm & End Session" : "تصدیق کریں اور نشست ختم کریں"}
                </Button>
                <Button onClick={closeEndDialog} variant="outline" className="border-gold/40">
                  {lang === "en" ? "Cancel" : "منسوخ"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionPhaseTimer;
