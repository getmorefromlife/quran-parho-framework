import { useRef, useState } from "react";
import { Check, ListPlus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export function MicroQATimer({ lang }: { lang: string }) {
  const [seconds, setSeconds] = useState(120);
  const [duration, setDuration] = useState(120);
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState("");
  const [deferred, setDeferred] = useState<{ id: number; text: string }[]>([]);
  const intervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);

  const beep = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  };

  const start = () => {
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          beep();
          return duration;
        }
        if (prev === 11) beep();
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const addDeferred = () => {
    if (!question.trim()) return;
    setDeferred((d) => [...d, { id: idRef.current++, text: question.trim() }]);
    setQuestion("");
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Duration selector & timer */}
        <div className="flex flex-col items-center">
          <div className="flex gap-2.5 sm:gap-2 mb-6">
            {[30, 60, 120, 180, 300].map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (!running) {
                    setDuration(s);
                    setSeconds(s);
                  }
                }}
                className={cn(
                  "px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-full text-sm sm:text-xs font-semibold border transition-all",
                  duration === s
                    ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                    : "bg-background border-border text-muted-foreground",
                )}
              >
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
          <div
            className={cn(
              "text-6xl sm:text-7xl font-bold font-mono tabular-nums",
              seconds <= 10 && running ? "text-destructive" : "text-gold",
            )}
          >
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <div className="mt-6 flex gap-3">
            {!running ? (
              <Button
                onClick={start}
                className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
              >
                <Play className="h-4 w-4" /> {lang === "en" ? "Start" : "شروع"}
              </Button>
            ) : (
              <Button
                onClick={stop}
                className="bg-gold-gradient text-emerald-deep border border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
              >
                <Pause className="h-4 w-4" /> {lang === "en" ? "Stop" : "روکیں"}
              </Button>
            )}
            <Button
              onClick={() => {
                stop();
                setSeconds(duration);
              }}
              variant="outline"
              className="border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
            >
              <RotateCcw className="h-4 w-4" /> {lang === "en" ? "Reset" : "دوبارہ"}
            </Button>
          </div>
        </div>

        {/* Deferred questions */}
        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-sm sm:text-xs uppercase tracking-widest text-gold font-semibold mb-4">
            <ListPlus className="h-5 sm:h-4 w-5 sm:w-4" />{" "}
            {lang === "en" ? "Deferred Questions" : "مؤخر سوالات"}
          </div>
          <div className="flex gap-2.5 sm:gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDeferred()}
              placeholder={lang === "en" ? "Type a deferred question..." : "مؤخر سوال درج کریں..."}
              className="border-gold/40 h-10 sm:h-9"
            />
            <Button
              onClick={addDeferred}
              className="bg-emerald-gradient text-gold border border-gold/40 shrink-0 h-10 sm:h-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-2.5 sm:space-y-2">
            {deferred.length === 0 && (
              <p className="text-base sm:text-sm text-muted-foreground text-center py-5 sm:py-4">
                {lang === "en" ? "No deferred questions yet." : "ابھی کوئی مؤخر سوال نہیں۔"}
              </p>
            )}
            {deferred.map((q) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-2 p-3.5 sm:p-3 rounded-xl bg-background border border-border"
              >
                <span className="text-sm sm:text-sm">{q.text}</span>
                <button
                  onClick={() => setDeferred((d) => d.filter((x) => x.id !== q.id))}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MicroQATimer;
