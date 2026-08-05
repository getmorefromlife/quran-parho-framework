import { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ListMusic,
  X,
  Sparkles,
  ChevronRight,
  Disc,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemeEntry, ThemePlaylistItem } from "@/lib/themes";

export type ThemePlaylistBarProps = {
  theme: ThemeEntry;
  playlist: ThemePlaylistItem[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onClosePlaylist: () => void;
  autoAdvanceAudio: boolean;
  onToggleAutoAdvance: () => void;
  isPlayingAudio: boolean;
  onTogglePlayAudio: () => void;
};

export function ThemePlaylistBar({
  theme,
  playlist,
  currentIndex,
  onSelectTrack,
  onClosePlaylist,
  autoAdvanceAudio,
  onToggleAutoAdvance,
  isPlayingAudio,
  onTogglePlayAudio,
}: ThemePlaylistBarProps) {
  const { lang } = useLang();
  const [showDrawer, setShowDrawer] = useState(false);

  const currentTrack = playlist[currentIndex] || playlist[0];
  const nextTrack = playlist[currentIndex + 1];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < playlist.length - 1;

  const title = lang === "ur" ? theme.ur : theme.en;

  return (
    <div className="relative z-[95]">
      {/* Floating Main Bar */}
      <div className="bg-card/95 border-b border-gold/30 backdrop-blur-xl px-4 py-2.5 shadow-gold">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Theme Info & Track Indicator */}
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/40 shadow-sm animate-pulse">
              <Disc className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gold uppercase tracking-wider truncate">
                  {title}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                  {lang === "en" ? "Playlist Mode" : "پلے لسٹ موڈ"}
                </span>
              </div>
              <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5 mt-0.5">
                <span>
                  {lang === "en"
                    ? `Track ${currentIndex + 1} of ${playlist.length}`
                    : `آیت ${currentIndex + 1} از ${playlist.length}`}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-gold font-mono font-bold">
                  {currentTrack?.surahNameEn} ({currentTrack?.surah}:{currentTrack?.ayah})
                </span>
                {currentTrack?.surahNameAr && (
                  <span className="font-arabic text-xs text-muted-foreground hidden sm:inline">
                    · {currentTrack.surahNameAr}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Audio & Track Navigation Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Prev Track */}
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrev}
              onClick={() => onSelectTrack(currentIndex - 1)}
              className="h-8 w-8 rounded-full border-border hover:border-gold/60 cursor-pointer disabled:opacity-40"
              title={lang === "en" ? "Previous Verse in Theme" : "پچھلی آیت"}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              size="icon"
              onClick={onTogglePlayAudio}
              className={cn(
                "h-9 w-9 rounded-full text-white shadow-gold cursor-pointer transition-all",
                isPlayingAudio
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-emerald-gradient hover:opacity-90",
              )}
              title={isPlayingAudio ? "Pause Recitation" : "Play Verse Audio"}
            >
              {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            {/* Next Track */}
            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext}
              onClick={() => onSelectTrack(currentIndex + 1)}
              className="h-8 w-8 rounded-full border-border hover:border-gold/60 cursor-pointer disabled:opacity-40"
              title={lang === "en" ? "Next Verse in Theme" : "اگلی آیت"}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Auto-advance Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleAutoAdvance}
              className={cn(
                "h-8 w-8 rounded-full border cursor-pointer transition-all hidden sm:inline-flex",
                autoAdvanceAudio
                  ? "border-gold/60 bg-gold/20 text-gold shadow-gold"
                  : "border-border text-muted-foreground hover:border-gold/40",
              )}
              title={
                autoAdvanceAudio
                  ? lang === "en"
                    ? "Auto-advance Audio: ON"
                    : "خودکار اگلی تلاوت: آن"
                  : lang === "en"
                    ? "Auto-advance Audio: OFF"
                    : "خودکار اگلی تلاوت: آف"
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>

            {/* Queue Drawer Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDrawer((v) => !v)}
              className={cn(
                "h-8 w-8 rounded-full border cursor-pointer transition-all",
                showDrawer
                  ? "border-gold/60 bg-gold/20 text-gold shadow-gold"
                  : "border-border text-muted-foreground hover:border-gold/40",
              )}
              title={lang === "en" ? "Theme Playlist Queue" : "پلے لسٹ لسٹ"}
            >
              <ListMusic className="h-4 w-4" />
            </Button>

            {/* Exit Playlist Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClosePlaylist}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title={lang === "en" ? "Exit Playlist Mode" : "پلے لسٹ سے نکلیں"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Up Next Banner (If has next) */}
        {nextTrack && (
          <div className="max-w-4xl mx-auto mt-1 flex items-center justify-between text-[11px] text-muted-foreground px-1 hidden sm:flex">
            <span>
              {lang === "en" ? "Up Next: " : "اگلی آیت: "}
              <strong className="text-foreground">
                {nextTrack.surahNameEn} ({nextTrack.surah}:{nextTrack.ayah})
              </strong>
            </span>
            <button
              onClick={() => onSelectTrack(currentIndex + 1)}
              className="text-gold hover:underline cursor-pointer font-medium"
            >
              {lang === "en" ? "Skip to Next →" : "اگلی پر جائیں ←"}
            </button>
          </div>
        )}
      </div>

      {/* Playlist Tracks Drawer Popover */}
      {showDrawer && (
        <div className="absolute top-full left-0 right-0 z-[96] bg-card/95 backdrop-blur-xl border-b border-border shadow-2xl p-4 max-h-80 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase text-gold tracking-wider flex items-center gap-2">
                <ListMusic className="h-4 w-4" />
                {lang === "en" ? "Theme Playlist Tracks" : "پلے لسٹ آیات"} ({playlist.length})
              </span>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {lang === "en" ? "Close Queue" : "بند کریں"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {playlist.map((track) => {
                const isActive = track.index === currentIndex;
                return (
                  <button
                    key={track.key}
                    onClick={() => {
                      onSelectTrack(track.index);
                      setShowDrawer(false);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer",
                      isActive
                        ? "border-gold bg-gold/15 text-gold shadow-gold font-bold"
                        : "border-border/60 bg-card/70 hover:border-gold/40 text-foreground",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span className="text-[10px] font-mono opacity-70">#{track.index + 1}</span>
                        <span>{track.surahNameEn}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        Surah {track.surah} · Ayah {track.ayah}
                      </div>
                    </div>
                    {track.surahNameAr && (
                      <span className="font-arabic text-sm text-gold shrink-0">
                        {track.surahNameAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
