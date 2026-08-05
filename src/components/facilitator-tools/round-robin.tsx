import { useRef, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export function RoundRobinTracker({ lang }: { lang: string }) {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<
    { id: number; name: string; rounds: number; verses: number }[]
  >([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const idRef = useRef(0);

  const addParticipant = () => {
    if (!name.trim()) return;
    setParticipants((p) => [
      ...p,
      { id: idRef.current++, name: name.trim(), rounds: 0, verses: 0 },
    ]);
    setName("");
  };

  const markRead = (id: number) => {
    setParticipants((p) =>
      p.map((person) =>
        person.id === id
          ? { ...person, rounds: person.rounds + 1, verses: person.verses + 5 }
          : person,
      ),
    );
    setParticipants((p) => {
      const idx = p.findIndex((x) => x.id === id);
      setCurrentIdx((idx + 1) % p.length);
      return p;
    });
  };

  const removeParticipant = (id: number) => {
    setParticipants((p) => p.filter((x) => x.id !== id));
  };

  const totalVerses = participants.reduce((s, p) => s + p.verses, 0);
  const totalRounds = participants.reduce((s, p) => s + p.rounds, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Add participant */}
        <div className="flex gap-2.5 sm:gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            placeholder={lang === "en" ? "Enter participant name..." : "شریک کا نام درج کریں..."}
            className="border-gold/40 h-10 sm:h-9"
          />
          <Button
            onClick={addParticipant}
            className="bg-emerald-gradient text-gold border border-gold/40 shrink-0 h-10 sm:h-9 px-4 sm:px-3"
          >
            <Plus className="h-4 w-4" /> {lang === "en" ? "Add" : "شامل"}
          </Button>
        </div>

        {/* Stats bar */}
        {participants.length > 0 && (
          <div className="mt-5 sm:mt-6 flex justify-center gap-8 sm:gap-6 text-sm">
            <div className="text-center">
              <div className="text-3xl sm:text-2xl font-bold font-mono text-emerald-deep">
                {totalVerses}
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
                {lang === "en" ? "Verses Read" : "آیات پڑھیں"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-2xl font-bold font-mono text-gold">
                {totalRounds}
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
                {lang === "en" ? "Rounds" : "چکر"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-2xl font-bold font-mono text-primary">
                {participants.length}
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
                {lang === "en" ? "Participants" : "شرکا"}
              </div>
            </div>
          </div>
        )}

        {/* Participant list */}
        <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-2 max-h-80 overflow-y-auto">
          {participants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {lang === "en" ? "Add participants to start tracking." : "شرکا شامل کریں۔"}
            </p>
          )}
          {participants.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between p-3.5 sm:p-3 rounded-xl border transition-all",
                i === currentIdx
                  ? "border-gold bg-emerald-gradient/5 shadow-sm"
                  : "border-border bg-background/50",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "h-10 sm:h-9 w-10 sm:w-9 rounded-full grid place-items-center text-sm sm:text-xs font-bold shrink-0",
                    i === currentIdx
                      ? "bg-emerald-gradient text-gold"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-sm break-words">{p.name}</div>
                  <div className="text-sm sm:text-xs text-muted-foreground">
                    {p.rounds} {lang === "en" ? "rounds" : "چکر"} · {p.verses}{" "}
                    {lang === "en" ? "verses" : "آیات"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-2 shrink-0">
                {i === currentIdx && (
                  <Button
                    size="sm"
                    onClick={() => markRead(p.id)}
                    className="bg-emerald-gradient text-gold h-10 sm:h-9 text-sm sm:text-xs px-3.5 sm:px-3"
                  >
                    <Check className="h-4 sm:h-3.5 w-4 sm:w-3.5" />{" "}
                    {lang === "en" ? "Read" : "پڑھ لیا"}
                  </Button>
                )}
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="h-10 sm:h-9 w-10 sm:w-9 rounded-full grid place-items-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoundRobinTracker;
