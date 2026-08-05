import { useRef, useState } from "react";
import { BookOpen, Check, Copy, MessageCircle, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SURAHS } from "@/lib/surahs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumInput } from "@/components/num-input";
import { cn } from "@/lib/utils";

export function FacilitatorKit() {
  const { tr, lang } = useLang();
  type Entry = { id: number; n: number; from: number; to: number };
  const [entries, setEntries] = useState<Entry[]>([{ id: 1, n: 67, from: 1, to: 30 }]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [copied, setCopied] = useState<"en" | "ur" | null>(null);
  const nextId = useRef(2);

  const getMax = (n: number) => SURAHS.find((s) => s.n === n)?.verses || 1;

  const updateEntry = (id: number, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEntry = (id: number) =>
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));

  const addEntry = () => {
    const id = nextId.current++;
    setEntries((prev) => [...prev, { id, n: 1, from: 1, to: getMax(1) }]);
  };

  const onSurahChange = (id: number, newN: number) => {
    const maxV = getMax(newN);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, n: newN, from: 1, to: maxV } : e)));
  };

  const dateTimeStr = () => (date ? `${date} · ${time}` : lang === "en" ? "TBD" : "جلد اعلان");

  const surahLines = entries
    .map((e) => {
      const s = SURAHS.find((x) => x.n === e.n);
      return `✓ ${s?.en || `#${e.n}`} (${e.from}–${e.to})`;
    })
    .join("\n");

  const msgEn = isFirstSession
    ? `🌙 *Qurʼān Parho Circle · First Session Invitation*

We're launching a neighborhood Qurʼān understanding circle!

📖 This session:
${surahLines}

📅 Next session: ${dateTimeStr()}

Doors are open — come for 15 minutes or the full session. No prior knowledge needed. 🌿

Framework by Maulana Syed Imon Rizvi`
    : `🌙 *Qurʼān Parho Circle · Post-Class Log*

📖 Surahs covered:
${surahLines}

📅 Next session: ${dateTimeStr()}

Jazakumullah khayran to everyone who joined today. Deferred questions will be addressed in the Hikmah discussion next time. Doors remain open — come for 15 minutes or the full session. 🌿

Framework by Maulana Syed Imon Rizvi`;

  const msgUr = isFirstSession
    ? `🌙 *قرآن پڑھو حلقہ · پہلی نشست کی دعوت*

ہم اپنے محلے میں قرآن فہمی کا حلقہ شروع کر رہے ہیں!

📖 اس نشست میں:
${surahLines}

📅 اگلی نشست: ${dateTimeStr()}

دروازے کھلے ہیں — پندرہ منٹ ہوں یا پوری نشست، تشریف لائیں۔ کسی پیشگی معلومات کی ضرورت نہیں۔ 🌿

فریم ورک: مولانا سیّد آئمن رضوی`
    : `🌙 *قرآن پڑھو حلقہ · نشست کی رپورٹ*

📖 پڑھی گئی سورتیں:
${surahLines}

📅 اگلی نشست: ${dateTimeStr()}

آج کی شرکت کا شکریہ۔ مؤخر سوالات اگلی نشست کے مباحثے میں لیے جائیں گے۔ دروازے کھلے ہیں — پندرہ منٹ ہوں یا پوری نشست، تشریف لائیں۔ 🌿

فریم ورک: مولانا سیّد آئمن رضوی`;

  const [activeInvite, setActiveInvite] = useState<number | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteCards = [
    {
      key: "weekly",
      g: "bg-emerald-gradient text-gold",
      t: lang === "en" ? "Weekly Circle" : "ہفتہ وار حلقہ",
      s: lang === "en" ? "Every Sunday · After Maghrib" : "ہر اتوار · بعد از مغرب",
      msgEn: `🌙 *Qurʼān Parho Circle · Weekly Session*

Join us this Sunday after Maghrib for our neighborhood Qurʼān understanding circle.

📖 We read Urdu translation verse-by-verse in a round-robin format.
⏱ Drop in for 15 minutes or stay the full session.
📅 ${dateTimeStr()}

No prior knowledge needed. Doors are open to all. 🌿

Framework by Maulana Syed Imon Rizvi`,
      msgUr: `🌙 *قرآن پڑھو حلقہ · ہفتہ وار نشست*

آپ کو ہمارے محلّے کے قرآن فہمی حلقے میں دعوت ہے۔

📖 ہم باری باری اردو ترجمہ پڑھتے ہیں۔
⏱ پندرہ منٹ ہوں یا پوری نشست، تشریف لائیں۔
📅 ${dateTimeStr()}

کسی پیشگی معلومات کی ضرورت نہیں۔ دروازے سب کے لیے کھلے ہیں۔ 🌿

فریم ورک: مولانا سیّد آئمن رضوی`,
    },
    {
      key: "youth",
      g: "bg-gold-gradient text-emerald-deep",
      t: lang === "en" ? "Youth Night" : "نوجوانوں کی نشست",
      s: lang === "en" ? "Reading Qurʼān for 1 hour" : "۱ گھنٹہ قرآن پڑھیں",
      msgEn: `🌙 *Qurʼān Parho Circle · Youth Night*

An hour of Qurʼān understanding — just for youth.

📖 We read 1 hour of Urdu translation in a relaxed group setting.
📅 ${dateTimeStr()} · 1 hour session

Open to all. No Arabic required. Just bring a Qurʼān with Urdu translation. 🌿

Framework by Maulana Syed Imon Rizvi`,
      msgUr: `🌙 *قرآن پڑھو حلقہ · نوجوانوں کی نشست*

نوجوانوں کے لیے قرآن فہمی کا ایک گھنٹہ۔

📖 ہم پرسکون ماحول میں ایک گھنٹہ اردو ترجمہ پڑھتے ہیں۔
📅 ${dateTimeStr()} · ۱ گھنٹہ

کسی عربی کی ضرورت نہیں۔ صرف اردو ترجمے والا قرآن لے آئیں۔ 🌿

فریم ورک: مولانا سیّد آئمن رضوی`,
    },
    {
      key: "neighbor",
      g: "bg-card border border-gold/40",
      t: lang === "en" ? "Neighbor Invite" : "پڑوسی کو دعوت",
      s: lang === "en" ? "Open doors · 15-min drop-in" : "کھلے دروازے · ۱۵ منٹ",
      msgEn: `🌙 *Qurʼān Parho Circle · Open Invitation*

Assalamu alaikum neighbor! ☕️

You're invited to join our neighborhood Qurʼān reading circle. Drop in for 15 minutes or stay longer — whatever fits your schedule.

📖 No prior knowledge needed. We read Urdu translation together.
📅 ${dateTimeStr()} · Open door policy

Come and experience it. Doors are always open. 🌿

Framework by Maulana Syed Imon Rizvi`,
      msgUr: `🌙 *قرآن پڑھو حلقہ · کھلی دعوت*

السلام علیکم پڑوسی! ☕️

آپ کو ہمارے محلّے کے قرآن فہمی حلقے میں دعوت ہے۔ پندرہ منٹ آئیں یا زیادہ — جو آپ کے شیڈول میں آئے۔

📖 کسی پیشگی معلومات کی ضرورت نہیں۔ ہم ساتھ مل کر اردو ترجمہ پڑھیں گے۔
📅 ${dateTimeStr()}

آئیں اور دیکھیں۔ دروازے ہمیشہ کھلے ہیں۔ 🌿

فریم ورک: مولانا سیّد آئمن رضوی`,
    },
  ];

  const copy = async (which: "en" | "ur") => {
    await navigator.clipboard.writeText(which === "en" ? msgEn : msgUr);
    setCopied(which);
    setTimeout(() => setCopied(null), 1600);
  };

  const copyInvite = async (idx: number) => {
    const card = inviteCards[idx];
    await navigator.clipboard.writeText(lang === "en" ? card.msgEn : card.msgUr);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 1600);
  };

  return (
    <section id="kit" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/30 px-3">
            {lang === "en" ? "Toolkit" : "کٹ"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("kit_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("kit_sub")}</p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.1fr] gap-6">
          <div className="rounded-3xl bg-card border border-border shadow-elegant p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-gradient grid place-items-center shadow-gold">
                <MessageCircle className="h-5 w-5 text-gold" />
              </div>
              <h3 className="text-xl font-bold">{tr("wa_gen")}</h3>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-3">
                <span className="text-sm text-muted-foreground">{tr("surahs_covered")}</span>
                {entries.map((e) => {
                  const maxV = getMax(e.n);
                  return (
                    <div key={e.id} className="flex flex-wrap items-end gap-2">
                      <Select
                        value={String(e.n)}
                        onValueChange={(v) => onSurahChange(e.id, Number(v))}
                      >
                        <SelectTrigger className="border-gold/40 w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {[...SURAHS]
                            .sort((a, b) => a.n - b.n)
                            .map((s) => (
                              <SelectItem key={s.n} value={String(s.n)}>
                                <span className="font-mono text-muted-foreground">#{s.n}</span>{" "}
                                {s.en} <span className="text-xs text-muted-foreground">{s.ar}</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">{tr("from_verse")}</span>
                        <NumInput
                          value={e.from}
                          min={1}
                          max={maxV}
                          className="border-gold/40 w-16 text-center"
                          onChange={(val) =>
                            updateEntry(e.id, { from: val, to: Math.max(val, e.to) })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">{tr("to_verse")}</span>
                        <NumInput
                          value={e.to}
                          min={1}
                          max={maxV}
                          className="border-gold/40 w-16 text-center"
                          onChange={(val) => updateEntry(e.id, { to: Math.max(e.from, val) })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive shrink-0"
                        onClick={() => removeEntry(e.id)}
                        disabled={entries.length <= 1}
                        title={tr("remove_surah")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gold/40 w-fit"
                  onClick={addEntry}
                >
                  <Plus className="h-4 w-4 mr-1" /> {tr("add_surah")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">{tr("next_date")}</span>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-gold/40"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">{tr("session_time")}</span>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="border-gold/40"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFirstSession}
                  onChange={(e) => setIsFirstSession(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>{tr("first_session")}</span>
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => copy("en")} className="bg-emerald-gradient text-gold">
                  {copied === "en" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "en" ? tr("copied") : tr("copy_en")}
                </Button>
                <Button onClick={() => copy("ur")} variant="outline" className="border-gold">
                  {copied === "ur" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "ur" ? tr("copied") : tr("copy_ur")}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-gradient text-gold border border-gold/40 shadow-elegant p-6 sm:p-8">
            <div className="text-xs uppercase tracking-widest opacity-80">
              Preview · {lang === "en" ? "English" : "اردو"}
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed opacity-95">
              {lang === "en" ? msgEn : msgUr}
            </pre>
          </div>
        </div>

        {/* Invitation cards */}
        <div className="mt-14">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{tr("invite_title")}</h3>
            <span className="text-xs text-muted-foreground">
              {lang === "en"
                ? "Click a card → copy invite message"
                : "کارڈ پر کلک کریں → دعوتی پیغام"}
            </span>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {inviteCards.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveInvite(activeInvite === i ? null : i)}
                className={cn(
                  "rounded-2xl p-6 shadow-elegant relative overflow-hidden aspect-[4/3] flex flex-col justify-between text-left transition-all",
                  c.g,
                  activeInvite === i &&
                    "ring-2 ring-gold ring-offset-2 ring-offset-card scale-[1.02]",
                )}
              >
                <div className="absolute inset-0 shimmer-gold opacity-20" />
                <BookOpen className="h-6 w-6 relative" />
                <div className="relative">
                  <div className="font-serif-display text-2xl">{c.t}</div>
                  <div className="text-xs uppercase tracking-widest mt-1 opacity-80">{c.s}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Invitation preview */}
          {activeInvite !== null && (
            <div className="mt-6 rounded-3xl bg-emerald-gradient text-gold border border-gold/40 shadow-elegant p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-widest opacity-80">
                  {lang === "en" ? "Invitation Preview" : "دعوت کا پیش منظر"} ·{" "}
                  {inviteCards[activeInvite].t}
                </div>
                <button
                  onClick={() => copyInvite(activeInvite)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-gold text-xs font-semibold hover:bg-white/30 transition-all"
                >
                  {inviteCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {inviteCopied
                    ? lang === "en"
                      ? "Copied!"
                      : "کاپی ہو گیا!"
                    : lang === "en"
                      ? "Copy Message"
                      : "پیغام کاپی کریں"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed opacity-95">
                {lang === "en" ? inviteCards[activeInvite].msgEn : inviteCards[activeInvite].msgUr}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
