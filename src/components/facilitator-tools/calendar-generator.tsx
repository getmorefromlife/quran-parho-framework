import { useMemo, useState } from "react";
import { CalendarDays, Copy } from "lucide-react";
import { SURAHS } from "@/lib/surahs";
import { NumInput } from "@/components/num-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function CalendarGenerator({ lang }: { lang: string }) {
  const all = SURAHS.slice();
  const cycles = useMemo(
    () => [
      {
        key: "cycle1",
        label: lang === "en" ? "Cycle 1 · Foundation" : "مرحلہ ۱ · بنیاد",
        surahs: [...all].sort((a, b) => b.n - a.n),
      },
      {
        key: "cycle2",
        label: lang === "en" ? "Cycle 2 · Seerah" : "مرحلہ ۲ · سیرت",
        surahs: [...all].sort((a, b) => a.nuzul - b.nuzul),
      },
      {
        key: "cycle3",
        label: lang === "en" ? "Cycle 3 · Mastery" : "مرحلہ ۳ · مہارت",
        surahs: [...all].sort((a, b) => a.n - b.n),
      },
    ],
    [lang],
  );

  const [cycleIdx, setCycleIdx] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    return d.toISOString().split("T")[0];
  });
  const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
  const [weekdays, setWeekdays] = useState([6]); // default Saturday
  const [versesPerSession, setVersesPerSession] = useState(20);
  const [schedule, setSchedule] = useState<
    | {
        date: string;
        items: { n: number; en: string; from: number; to: number; verses: number }[];
        total: number;
      }[]
    | null
  >(null);

  const dayNames =
    lang === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ", "اتوار"];

  const toggleDay = (d: number) => {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev].sort((a, b) => a - b),
    );
    setSchedule(null);
  };

  const generate = () => {
    const surahs = cycles[cycleIdx].surahs;
    const target = versesPerSession;
    const rawSessions: {
      items: { n: number; en: string; from: number; to: number; verses: number }[];
      verses: number;
    }[] = [];
    let cur: (typeof rawSessions)[0] = { items: [], verses: 0 };

    for (const surah of surahs) {
      let remain = surah.verses;
      let from = 1;
      while (remain > 0) {
        const space = target - cur.verses;
        const take = Math.min(space, remain);
        cur.items.push({ n: surah.n, en: surah.en, from, to: from + take - 1, verses: take });
        cur.verses += take;
        from += take;
        remain -= take;
        if (cur.verses === target) {
          rawSessions.push(cur);
          cur = { items: [], verses: 0 };
        }
      }
    }
    if (cur.verses > 0) rawSessions.push(cur);

    // assign dates
    const start = new Date(startDate);
    const sortedDays = [...weekdays].sort((a, b) => a - b);
    const sessions: typeof schedule = [];
    let ptr = 0;
    let weekOffset = 0;
    while (ptr < rawSessions.length) {
      for (const wd of sortedDays) {
        if (ptr >= rawSessions.length) break;
        const d = new Date(start);
        d.setDate(d.getDate() + weekOffset * 7 + wd - start.getDay());
        const s = rawSessions[ptr];
        sessions.push({ date: d.toISOString().split("T")[0], items: s.items, total: s.verses });
        ptr++;
      }
      weekOffset++;
    }
    setSchedule(sessions);
  };

  const totalVerses = schedule ? schedule.reduce((sum, s) => sum + s.total, 0) : 0;

  const exportIcs = () => {
    if (!schedule) return;
    const fmt = (d: string) => d.replace(/-/g, "");
    const esc = (s: string) => s.replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const nextDay = (d: string) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + 1);
      return dt.toISOString().split("T")[0];
    };
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Qur'an Parho//Neighborhood Circle//EN",
      "CALSCALE:GREGORIAN",
    ];
    schedule.forEach((s, i) => {
      const summary = `${lang === "en" ? "Qur'an Parho" : "قرآن پڑھو"} · ${cycles[cycleIdx].label} · ${lang === "en" ? "Session" : "نشست"} ${i + 1}`;
      const desc =
        s.items.map((it) => `${it.en} ${it.from}–${it.to} (${it.verses})`).join("; ") +
        ` — total ${s.total}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:quran-parho-${s.date}-${i + 1}@quran-parho`,
        `DTSTAMP:${new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "")}`,
        `DTSTART;VALUE=DATE:${fmt(s.date)}`,
        `DTEND;VALUE=DATE:${fmt(nextDay(s.date))}`,
        `SUMMARY:${esc(summary)}`,
        `DESCRIPTION:${esc(desc)}`,
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quran-parho-schedule.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Cycle selector */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 mb-6">
          {cycles.map((c, i) => (
            <button
              key={c.key}
              onClick={() => {
                setCycleIdx(i);
                setSchedule(null);
              }}
              className={cn(
                "px-5 sm:px-4 py-3 sm:py-2 rounded-full text-sm sm:text-sm font-semibold border transition-all",
                cycleIdx === i
                  ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                  : "bg-background border-border text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-4 mb-6">
          {/* Start date */}
          <div>
            <label className="text-xs sm:text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 block">
              {lang === "en" ? "Start Date" : "شروع کی تاریخ"}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSchedule(null);
              }}
              className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-border bg-background text-sm"
            />
          </div>

          {/* Verses per session */}
          <div>
            <label className="text-xs sm:text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 block">
              {lang === "en" ? "Verses per Session" : "فی نشست آیات"}
            </label>
            <NumInput
              value={versesPerSession}
              min={1}
              max={300}
              onChange={(v) => {
                setVersesPerSession(v);
                setSchedule(null);
              }}
              className="border-gold/40 h-10 sm:h-9"
            />
          </div>

          {/* Sessions per week */}
          <div>
            <label className="text-xs sm:text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 block">
              {lang === "en" ? "Sessions per Week" : "فی ہفتہ نشستیں"}
            </label>
            <div className="flex gap-1.5 sm:gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setSessionsPerWeek(n);
                    setSchedule(null);
                  }}
                  className={cn(
                    "flex-1 py-2.5 sm:py-2 rounded-xl text-sm sm:text-sm font-semibold border transition-all",
                    sessionsPerWeek === n
                      ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                      : "bg-background border-border text-muted-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="text-xs sm:text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-1 block">
              {lang === "en" ? "Session Days" : "نشست کے دن"}
            </label>
            <div className="flex gap-1.5 sm:gap-1 flex-wrap">
              {dayNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-semibold border transition-all",
                    weekdays.includes(i)
                      ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                      : "bg-background border-border text-muted-foreground",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            {weekdays.length === 0 && (
              <p className="text-xs text-destructive mt-1">
                {lang === "en" ? "Select at least one day" : "کم از کم ایک دن منتخب کریں"}
              </p>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="text-center mb-6">
          <Button
            onClick={generate}
            disabled={weekdays.length === 0}
            className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
          >
            <CalendarDays className="h-4 w-4" />{" "}
            {lang === "en" ? "Generate Schedule" : "شیڈول بنائیں"}
          </Button>
        </div>

        {/* Schedule table */}
        {schedule && (
          <div className="overflow-x-auto">
            <div className="text-center text-sm sm:text-sm text-muted-foreground mb-4">
              {lang === "en"
                ? `${schedule.length} sessions · ${totalVerses} verses total`
                : `${schedule.length} نشستیں · کل ${totalVerses} آیات`}
            </div>
            <table className="w-full text-sm sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-2 sm:px-3 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    #
                  </th>
                  <th className="py-2 px-2 sm:px-3 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    {lang === "en" ? "Date" : "تاریخ"}
                  </th>
                  <th className="py-2 px-2 sm:px-3 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    {lang === "en" ? "Surahs" : "سورتیں"}
                  </th>
                  <th className="py-2 px-2 sm:px-3 text-right text-xs uppercase tracking-widest text-muted-foreground">
                    {lang === "en" ? "Verses" : "آیات"}
                  </th>
                  <th className="py-2 px-2 sm:px-3 text-right text-xs uppercase tracking-widest text-muted-foreground">
                    {lang === "en" ? "Cum." : "کل"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s, i) => {
                  const cum = schedule.slice(0, i + 1).reduce((sum, x) => sum + x.total, 0);
                  return (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 px-2 sm:px-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="py-2 px-2 sm:px-3 font-mono text-xs">{s.date}</td>
                      <td className="py-2 px-2 sm:px-3">
                        {s.items.map((item, j) => (
                          <span
                            key={j}
                            className="inline-block mr-1.5 sm:mr-2 mb-1 text-xs bg-muted px-2 sm:px-2 py-1 rounded-full"
                          >
                            {item.en} {item.from}–{item.to}
                          </span>
                        ))}
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-right font-mono">{s.total}</td>
                      <td className="py-2 px-2 sm:px-3 text-right font-mono text-muted-foreground">
                        {cum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Copy as text / Export .ics */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <Button
                onClick={() => {
                  const lines = schedule.map((s, i) => {
                    const surahStr = s.items.map((it) => `${it.en} ${it.from}–${it.to}`).join(", ");
                    return `${i + 1}\t${s.date}\t${surahStr}\t${s.total}`;
                  });
                  const text = `${lang === "en" ? "Session Schedule" : "نشست کا شیڈول"}\n${lines.join("\n")}`;
                  navigator.clipboard.writeText(text);
                }}
                variant="outline"
                className="border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-4 sm:px-4"
              >
                <Copy className="h-4 w-4" /> {lang === "en" ? "Copy as Text" : "بطور متن کاپی کریں"}
              </Button>
              <Button
                onClick={exportIcs}
                variant="outline"
                className="border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-4 sm:px-4"
              >
                <CalendarDays className="h-4 w-4" />{" "}
                {lang === "en" ? "Export .ics" : ".ics برآمد کریں"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarGenerator;
