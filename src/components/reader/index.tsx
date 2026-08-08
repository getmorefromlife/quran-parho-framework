import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Folder,
  FolderPlus,
  BookmarkPlus,
  Library,
  MessageCircle,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Star,
  StickyNote,
  Trash2,
  Users,
  X,
  BookOpenCheck,
  MonitorPlay,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SURAHS } from "@/lib/surahs";
import { loadSurah, type QVerse } from "@/lib/quran-data";
import { loadReaderBookmark, saveReaderBookmark, type ReaderBookmark } from "@/lib/storage";
import {
  loadHighlights,
  saveHighlight,
  loadVerseNotes,
  saveVerseNote,
  loadSharePrefs,
  saveSharePrefs,
  composeShareText,
  composeSavedBlock,
  loadFavorites,
  toggleFavorite,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_CLASSES,
  type HighlightColor,
  type SharePrefs,
  type VerseText,
} from "@/lib/verse-annotations";
import {
  getActiveProject,
  loadProjects,
  loadActiveProjectId,
  saveSearchToProject,
  removeSearchFromProject,
  EVENT_PROJECTS_UPDATED,
  type ResearchProject,
} from "@/lib/verse-collections";
import { ProjectManagerDialog } from "@/components/reader/project-manager-dialog";
import { VerseProjectSelector } from "@/components/reader/verse-project-selector";
import {
  getFontFamily,
  loadReaderPrefs,
  saveReaderPrefs,
  ensureReaderFonts,
  type ReaderPrefs,
} from "@/lib/reader-fonts";
import { verseAudioUrl, loadReciter, saveReciter, type ReciterId } from "@/lib/audio-reciters";
import {
  saveSelectedTranslations,
  getTranslationText,
  getTranslation,
  getFieldForId,
} from "@/lib/translations";
import { normalizeQuery, searchVerse, SEARCH_RESULT_CAP, type SearchMode } from "@/lib/search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FloatingSettings, ReaderSettingsPanel } from "@/components/reader/settings-panel";
import { CircleTurnBar } from "@/components/reader/circle-turn-bar";
import { ThemePlaylistBar } from "@/components/reader/theme-playlist-bar";
import { Highlight } from "@/components/reader/highlight";
import { HifzControls } from "@/components/reader/hifz-controls";
import { PresentationMode } from "@/components/reader/presentation-mode";
import { loadHifzPrefs, saveHifzPrefs, type HifzPrefs } from "@/lib/hifz-settings";
import { createThemePlaylist, type ThemeEntry, type ThemePlaylistItem } from "@/lib/themes";
import { cn } from "@/lib/utils";

export type SurahReaderProps = {
  surahN: number;
  verses: QVerse[] | null;
  versesError: boolean;
  maxVerses: number;
  langs: { ar: boolean; en: boolean; ur: boolean };
  selectedTranslations: string[];
  rangeStart: number;
  rangeEnd: number;
  onClose: () => void;
  onNavigate: (n: number, jumpTo?: number) => void;
  jumpToVerse?: number;
  onJumpComplete?: () => void;
  initialShowSavedPanel?: boolean;
  initialSavedTab?: "notes" | "highlights" | "favorites" | "searches";
  initialPlaylistTheme?: ThemeEntry;
};

export function SurahReader({
  surahN,
  verses,
  versesError,
  maxVerses,
  langs: initialLangs,
  selectedTranslations: initialSelected,
  rangeStart,
  rangeEnd,
  onClose,
  onNavigate,
  jumpToVerse,
  onJumpComplete,
  initialShowSavedPanel,
  initialSavedTab,
  initialPlaylistTheme,
}: SurahReaderProps) {
  const { tr, lang } = useLang();
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadReaderPrefs());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langs, setLangs] = useState(() => ({
    ar: initialLangs.ar,
    en: initialLangs.en,
    ur: initialLangs.ur,
  }));
  const [selectedTrans, setSelectedTrans] = useState<string[]>(() => initialSelected);
  const [flash, setFlash] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const verseRefs = useRef(new Map<number, HTMLDivElement>());
  const rafId = useRef<number | null>(null);
  const lastTracked = useRef<ReaderBookmark | null>(null);
  const pendingResume = useRef<ReaderBookmark | null>(null);
  const resumeBookmark = useMemo(() => loadReaderBookmark(), []);
  const [reciter, setReciter] = useState<ReciterId>(() => loadReciter());
  const [audioVerse, setAudioVerse] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Annotations & Projects state ──
  const [highlights, setHighlights] = useState<Record<string, HighlightColor>>(() =>
    loadHighlights(),
  );
  const [verseNotes, setVerseNotes] = useState<Record<string, string>>(() => loadVerseNotes());
  const [favorites, setFavorites] = useState<Record<string, true>>(() => loadFavorites());
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(() =>
    getActiveProject(),
  );
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAllSurahs, setSearchAllSurahs] = useState(false);
  const [searchScope, setSearchScope] = useState<"all" | "selected">("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("contains");
  const [showAllResults, setShowAllResults] = useState(false);
  const [searchResults, setSearchResults] = useState<QVerse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSavedToast, setSearchSavedToast] = useState(false);
  const allSurahCache = useRef<Map<number, QVerse[]>>(new Map());
  const [showSavedPanel, setShowSavedPanel] = useState(() => initialShowSavedPanel ?? false);
  const [savedTab, setSavedTab] = useState<"notes" | "highlights" | "favorites" | "searches">(
    () => initialSavedTab ?? "notes",
  );
  const [notesListTab, setNotesListTab] = useState<"surah" | "all">(() =>
    initialShowSavedPanel && initialSavedTab === "favorites" ? "all" : "surah",
  );
  const [savedText, setSavedText] = useState<Record<number, QVerse[]>>({});
  const [savedLoading, setSavedLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (initialShowSavedPanel) {
      setShowSavedPanel(true);
      if (initialSavedTab) setSavedTab(initialSavedTab);
      if (initialSavedTab === "favorites") setNotesListTab("all");
    }
  }, [initialShowSavedPanel, initialSavedTab]);

  // ── Multi-Surah Theme Playlist State ──
  const [playlistTheme, setPlaylistTheme] = useState<ThemeEntry | null>(
    () => initialPlaylistTheme || null,
  );
  const playlist = useMemo(
    () => (playlistTheme ? createThemePlaylist(playlistTheme) : []),
    [playlistTheme],
  );
  const [playlistTrackIndex, setPlaylistTrackIndex] = useState(0);
  const [autoAdvanceAudio, setAutoAdvanceAudio] = useState(true);

  useEffect(() => {
    if (initialPlaylistTheme) {
      setPlaylistTheme(initialPlaylistTheme);
      setPlaylistTrackIndex(0);
    }
  }, [initialPlaylistTheme]);

  // ── Hifz Memorization Suite State ──
  const [hifzPrefs, setHifzPrefs] = useState<HifzPrefs>(() => loadHifzPrefs());
  const [hifzRepeatIndex, setHifzRepeatIndex] = useState(0);

  // ── Presentation / Projector Mode State ──
  const [showPresentationMode, setShowPresentationMode] = useState(false);

  const updateHifzPrefs = (next: HifzPrefs) => {
    setHifzPrefs(next);
    saveHifzPrefs(next);
    setHifzRepeatIndex(0);
    if (audioRef.current) {
      audioRef.current.playbackRate = next.playbackSpeed;
    }
  };

  // ── Quran Circle Turn Mode State ──
  const [circleTurn, setCircleTurn] = useState(1);
  const chunkSize = prefs.circleChunkSize || 5;
  const totalTurns = Math.max(1, Math.ceil(maxVerses / chunkSize));
  const currentTurn = Math.min(circleTurn, totalTurns);
  const turnStartAyah = (currentTurn - 1) * chunkSize + 1;
  const turnEndAyah = Math.min(currentTurn * chunkSize, maxVerses);

  useEffect(() => {
    setCircleTurn(1);
  }, [surahN, prefs.circleChunkSize]);

  useEffect(() => {
    setSelectedVerse(null);
  }, [surahN]);

  const refreshProjectData = useCallback(() => {
    setActiveProject(getActiveProject());
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    window.addEventListener(EVENT_PROJECTS_UPDATED, refreshProjectData);
    return () => window.removeEventListener(EVENT_PROJECTS_UPDATED, refreshProjectData);
  }, [refreshProjectData]);
  const [savedSelectMode, setSavedSelectMode] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePrefs, setSharePrefs] = useState<SharePrefs>(() => loadSharePrefs());
  const [shareTarget, setShareTarget] = useState<{ v: VerseText; note?: string } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioVerse(null);
    setAudioPlaying(false);
  }, []);

  const playVerse = useCallback(
    (ayah: number) => {
      const el = audioRef.current;
      if (!el) return;
      setAudioVerse(ayah);
      setAudioError(false);
      el.src = verseAudioUrl(reciter, surahN, ayah);
      el.playbackRate = hifzPrefs.playbackSpeed;
      el.load();
      el.play().catch(() => setAudioError(true));
    },
    [reciter, surahN, hifzPrefs.playbackSpeed],
  );

  const togglePlay = useCallback(
    (ayah: number) => {
      if (audioVerse === ayah && audioPlaying && audioRef.current) {
        audioRef.current.pause();
        return;
      }
      playVerse(ayah);
    },
    [audioVerse, audioPlaying, playVerse],
  );

  const goToVerse = useCallback(
    (sN: number, aN: number) => {
      setShowSavedPanel(false);
      setSavedSelectMode(false);
      setSavedSelection(new Set());
      if (sN === surahN) {
        const node = verseRefs.current.get(aN);
        if (node && scrollRef.current) {
          const top = node.getBoundingClientRect().top + scrollRef.current.scrollTop - 90;
          scrollRef.current.scrollTo({ top, behavior: "smooth" });
          setFlash(aN);
          setSelectedVerse(aN);
          setTimeout(() => setFlash(null), 3000);
        }
      } else {
        onNavigate(sN, aN);
      }
    },
    [surahN, onNavigate],
  );

  const handleSelectTrack = useCallback(
    (index: number, autoPlay = true) => {
      if (index < 0 || index >= playlist.length) return;
      setPlaylistTrackIndex(index);
      const target = playlist[index];
      if (!target) return;

      goToVerse(target.surah, target.ayah);

      if (autoPlay) {
        playVerse(target.ayah);
      }
    },
    [playlist, goToVerse, playVerse],
  );

  const handleAudioEnded = useCallback(() => {
    if (audioVerse == null) return;

    // Check Hifz Repeat Loop
    if (hifzPrefs.enabled && hifzRepeatIndex + 1 < hifzPrefs.verseRepeatCount) {
      setHifzRepeatIndex((prev) => prev + 1);
      const delay = hifzPrefs.silenceGapSeconds * 1000;
      if (delay > 0) {
        setTimeout(() => {
          playVerse(audioVerse);
        }, delay);
      } else {
        playVerse(audioVerse);
      }
      return;
    }

    // Reset repeat index for next verse
    setHifzRepeatIndex(0);

    const advanceNext = () => {
      if (playlistTheme && playlist.length > 0 && autoAdvanceAudio) {
        if (playlistTrackIndex < playlist.length - 1) {
          handleSelectTrack(playlistTrackIndex + 1, true);
          return;
        }
        stopAudio();
        return;
      }

      if (!verses) return;
      const idx = verses.findIndex((v) => v.ayah === audioVerse);
      if (idx === -1) return;
      const next = verses[idx + 1];
      if (next && next.ayah >= rangeStart && next.ayah <= rangeEnd) {
        playVerse(next.ayah);
      } else {
        stopAudio();
      }
    };

    if (hifzPrefs.enabled && hifzPrefs.silenceGapSeconds > 0) {
      setTimeout(advanceNext, hifzPrefs.silenceGapSeconds * 1000);
    } else {
      advanceNext();
    }
  }, [
    audioVerse,
    hifzPrefs,
    hifzRepeatIndex,
    playVerse,
    playlistTheme,
    playlist,
    autoAdvanceAudio,
    playlistTrackIndex,
    handleSelectTrack,
    stopAudio,
    verses,
    rangeStart,
    rangeEnd,
  ]);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
  }, []);

  useEffect(() => {
    stopAudio();
  }, [surahN, stopAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (audioVerse == null || !scrollRef.current) return;
    const node = verseRefs.current.get(audioVerse);
    if (!node || !scrollRef.current) return;
    const el = scrollRef.current;
    const rect = node.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (rect.top < elRect.top + 100 || rect.bottom > elRect.bottom - 100) {
      const top = node.getBoundingClientRect().top + el.scrollTop - 100;
      el.scrollTo({ top, behavior: "smooth" });
    }
  }, [audioVerse]);

  const surah = SURAHS.find((s) => s.n === surahN) ?? SURAHS[0];
  const { ar: showAr, en: showEn, ur: showUr } = langs;

  useEffect(() => {
    ensureReaderFonts();
  }, []);
  useEffect(() => {
    saveReaderPrefs(prefs);
  }, [prefs]);
  useEffect(() => {
    saveSelectedTranslations(selectedTrans);
  }, [selectedTrans]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (showSavedPanel) {
          setShowSavedPanel(false);
          return;
        }
        onClose();
        return;
      }
      if (
        prefs.circleModeEnabled &&
        !settingsOpen &&
        !showSavedPanel &&
        !showSearch &&
        !showNotePanel
      ) {
        if (e.key === "ArrowRight" || e.key === "PageDown") {
          setCircleTurn((t) => Math.min(totalTurns, t + 1));
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          setCircleTurn((t) => Math.max(1, t - 1));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    onClose,
    settingsOpen,
    showSavedPanel,
    showSearch,
    showNotePanel,
    prefs.circleModeEnabled,
    totalTurns,
  ]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggleLang = (which: "ar" | "en" | "ur") => {
    setLangs((prev) => {
      const othersOn =
        which === "ar"
          ? prev.en || prev.ur
          : which === "en"
            ? prev.ar || prev.ur
            : prev.ar || prev.en;
      const cur = which === "ar" ? prev.ar : which === "en" ? prev.en : prev.ur;
      if (!othersOn && cur) return prev;
      return { ...prev, [which]: !cur };
    });
  };

  const trackScroll = () => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const el = scrollRef.current;
      if (!el || !verses) return;
      const threshold = el.getBoundingClientRect().top + 120;
      let found: number | null = null;
      for (const v of verses) {
        const node = verseRefs.current.get(v.ayah);
        if (node && node.getBoundingClientRect().top <= threshold) found = v.ayah;
      }
      if (found == null) return;
      if (
        lastTracked.current &&
        lastTracked.current.surahN === surahN &&
        lastTracked.current.verse === found
      )
        return;
      const bm: ReaderBookmark = { surahN, verse: found, updatedAt: Date.now() };
      lastTracked.current = bm;
      saveReaderBookmark(bm);
      window.dispatchEvent(new Event("qp-bookmark"));
    });
  };

  useEffect(() => {
    if (!verses || !scrollRef.current) return;
    const target =
      jumpToVerse != null
        ? jumpToVerse
        : pendingResume.current?.surahN === surahN
          ? pendingResume.current.verse
          : resumeBookmark?.surahN === surahN
            ? resumeBookmark.verse
            : null;
    if (target == null) return;
    const node = verseRefs.current.get(target);
    const el = scrollRef.current;
    if (!node || !el) return;
    const top = node.getBoundingClientRect().top + el.scrollTop - 90;
    el.scrollTo({ top, behavior: "smooth" });
    setFlash(target);
    setSelectedVerse(target);
    if (jumpToVerse != null && onJumpComplete) onJumpComplete();
    if (pendingResume.current?.surahN === surahN) pendingResume.current = null;
    const t = window.setTimeout(() => setFlash(null), 3000);
    return () => window.clearTimeout(t);
  }, [verses, surahN, resumeBookmark, jumpToVerse, onJumpComplete]);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (lastTracked.current) {
        saveReaderBookmark(lastTracked.current);
        window.dispatchEvent(new Event("qp-bookmark"));
      }
    };
  }, []);

  const pill = (active: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
        active
          ? "bg-emerald-gradient text-gold border-gold shadow-gold"
          : "bg-card border-border text-muted-foreground hover:border-gold/60",
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );

  const arFam = getFontFamily(prefs.fontAr);
  const urFam = getFontFamily(prefs.fontUr);
  const enFam = getFontFamily(prefs.fontEn);
  const arSize = `${(prefs.fontSize * 1.5) / 100}rem`;
  const urSize = `${(prefs.fontSize * 1.15) / 100}rem`;
  const enSize = `${(prefs.fontSize * 1.05) / 100}rem`;
  const resumeSurah = resumeBookmark
    ? SURAHS.find((s) => s.n === resumeBookmark.surahN)
    : undefined;

  const savedCount =
    Object.keys(highlights).length + Object.keys(favorites).length + Object.keys(verseNotes).length;

  const handleReciterChange = (id: ReciterId) => {
    setReciter(id);
    saveReciter(id);
    if (audioVerse != null) playVerse(audioVerse);
  };

  const openSavedPanel = (tab: "notes" | "highlights" | "favorites" | "searches") => {
    setSavedTab(tab);
    setShowSavedPanel(true);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedVerse(null);
    setShowNotePanel(false);
    setSavedSelectMode(false);
    setSavedSelection(new Set());
  };

  const tabSource = (tab: "notes" | "highlights" | "favorites" | "searches") =>
    tab === "notes"
      ? verseNotes
      : tab === "highlights"
        ? highlights
        : tab === "favorites"
          ? favorites
          : {};

  const sortedTabKeys = (tab: "notes" | "highlights" | "favorites" | "searches") =>
    Object.keys(tabSource(tab)).sort((a, b) => {
      const [aS, aA] = a.split(":").map(Number);
      const [bS, bA] = b.split(":").map(Number);
      return aS !== bS ? aS - bS : aA - bA;
    });

  const buildSavedBlock = (key: string, includeNote: boolean) => {
    const [sN, aN] = key.split(":").map(Number);
    const s = SURAHS.find((x) => x.n === sN);
    const arr = savedText[sN];
    const v = arr?.find((vv) => vv.ayah === aN);
    const note = includeNote ? verseNotes[key] : undefined;
    return composeSavedBlock(sN, aN, s?.en ?? `Surah ${sN}`, s?.ar ?? "", v, note, {
      ar: showAr,
      en: showEn,
      ur: showUr,
    });
  };

  const copySavedKeys = (keys: string[]) => {
    if (keys.length === 0) return;
    const text = keys.map((k) => buildSavedBlock(k, savedTab === "notes")).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 1500);
    });
  };

  const shareSavedKeys = (keys: string[]) => {
    if (keys.length === 0) return;
    const text = keys.map((k) => buildSavedBlock(k, savedTab === "notes")).join("\n\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const clearSavedSelection = () => {
    setSavedSelectMode(false);
    setSavedSelection(new Set());
  };

  const toggleSavedSelection = (key: string) => {
    setSavedSelection((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Lazy-load verse text for the Saved panel (cached client-side + by the SW).
  useEffect(() => {
    if (!showSavedPanel) return;
    const surahs = new Set<number>();
    for (const key of [
      ...Object.keys(highlights),
      ...Object.keys(favorites),
      ...Object.keys(verseNotes),
    ]) {
      const [sN] = key.split(":").map(Number);
      if (Number.isFinite(sN)) surahs.add(sN);
    }
    surahs.forEach((sN) => {
      if (savedText[sN] || savedLoading[sN]) return;
      setSavedLoading((l) => ({ ...l, [sN]: true }));
      loadSurah(sN)
        .then((d) => setSavedText((t) => ({ ...t, [sN]: d })))
        .catch(() => {})
        .finally(() => setSavedLoading((l) => ({ ...l, [sN]: false })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSavedPanel, savedTab, highlights, favorites, verseNotes]);

  // ── Search logic ──
  const searchFields = useMemo(
    () =>
      searchScope === "selected"
        ? selectedTrans.map((tid) => getFieldForId(tid)).filter((f): f is string => Boolean(f))
        : undefined,
    [searchScope, selectedTrans],
  );
  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const qn = normalizeQuery(searchQuery);
    if (!qn) {
      setSearchResults([]);
      return;
    }
    setShowAllResults(false);
    let cancelled = false;

    const match = (arr: QVerse[]) =>
      arr.filter((v) => searchVerse(v, qn, searchMode, searchFields));

    if (!searchAllSurahs) {
      setSearchResults(verses ? match(verses) : []);
      return;
    }

    // Full Qur'an search — debounce, then lazy-load all surahs
    setSearchLoading(true);
    setSearchResults([]);
    const timer = setTimeout(() => {
      const loadAll = async () => {
        for (let n = 1; n <= 114; n++) {
          if (cancelled) return;
          if (!allSurahCache.current.has(n)) {
            try {
              const res = await fetch(`/quran/surah-${n}.json`);
              if (res.ok) {
                const data = (await res.json()) as QVerse[];
                allSurahCache.current.set(n, data);
              }
            } catch {
              /* skip */
            }
          }
          // Search after each batch of 10 surahs for incremental results
          if (n % 10 === 0 || n === 114) {
            if (cancelled) return;
            const all = Array.from(allSurahCache.current.values()).flat();
            setSearchResults(match(all));
          }
        }
        if (!cancelled) setSearchLoading(false);
      };
      loadAll();
    }, 300);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [showSearch, searchQuery, searchAllSurahs, searchMode, searchFields, verses, surahN]);

  return (
    <div
      ref={scrollRef}
      onScroll={trackScroll}
      className="fixed inset-0 z-[80] bg-background overflow-y-auto"
      dir="auto"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          {/* Main Website Branding Link (Top Left) */}
          <button
            type="button"
            onClick={onClose}
            title={lang === "en" ? "Back to Main Website" : "مرکزی ویب سائٹ پر واپس جائیں"}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gold/30 bg-card/80 hover:bg-gold/10 hover:border-gold/60 text-foreground transition-all shrink-0 cursor-pointer"
          >
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-card ring-1 ring-gold/20 shadow-sm overflow-hidden shrink-0">
              <img src="/logo.png" alt="Qurʼān Parho" className="h-5 w-5 object-contain" />
            </div>
            <span className="hidden sm:inline font-semibold text-xs tracking-tight text-foreground group-hover:text-gold transition-colors">
              {lang === "en" ? "Qurʼān Parho" : "قرآن پڑھو"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(surahN - 1)}
            disabled={surahN <= 1}
            aria-label={tr("previous_surah")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(surahN + 1)}
            disabled={surahN >= 114}
            aria-label={tr("next_surah")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-sm font-semibold truncate">{surah.en}</div>
            <div className="text-xs text-muted-foreground truncate">
              {lang === "en"
                ? `Surah ${surahN} · ${maxVerses} ${tr("verses")}`
                : `سورۃ ${surahN} · ${maxVerses} ${tr("verses")}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (audioPlaying && audioVerse != null) {
                stopAudio();
                return;
              }
              playVerse(rangeStart);
            }}
            aria-label={audioPlaying ? tr("pause_surah") : tr("play_surah")}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
              audioPlaying
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60",
            )}
          >
            {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSearch((v) => !v);
              setSelectedVerse(null);
              setShowNotePanel(false);
            }}
            aria-label="Search"
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
              showSearch
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60",
            )}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => updateHifzPrefs({ ...hifzPrefs, enabled: !hifzPrefs.enabled })}
            aria-label={tr("hifz_suite")}
            title={tr("hifz_suite")}
            className={cn(
              "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors cursor-pointer",
              hifzPrefs.enabled
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60",
            )}
          >
            <BookOpenCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowPresentationMode(true)}
            aria-label={tr("projector_mode")}
            title={tr("projector_mode")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors cursor-pointer"
          >
            <MonitorPlay className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openSavedPanel(savedTab)}
            aria-label="Saved verses"
            className={cn(
              "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
              showSavedPanel
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60",
            )}
          >
            <Library className="h-4 w-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-background">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[90]">
              <DropdownMenuItem
                onClick={() => {
                  setSettingsOpen(true);
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                  setSelectedVerse(null);
                }}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {tr("reader_settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  openSavedPanel("notes");
                  setShowNotePanel(false);
                }}
              >
                <StickyNote className="h-4 w-4 mr-2" />
                {lang === "en" ? "Your Notes" : "آپ کے نوٹس"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                {tr("close_reader")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr("close_reader")}
            title={tr("close_reader")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Theme Playlist Mode Bar */}
      {playlistTheme && playlist.length > 0 && (
        <ThemePlaylistBar
          theme={playlistTheme}
          playlist={playlist}
          currentIndex={playlistTrackIndex}
          onSelectTrack={(idx) => handleSelectTrack(idx, true)}
          onClosePlaylist={() => setPlaylistTheme(null)}
          autoAdvanceAudio={autoAdvanceAudio}
          onToggleAutoAdvance={() => setAutoAdvanceAudio((v) => !v)}
          isPlayingAudio={audioPlaying}
          onTogglePlayAudio={() => {
            const currentTrack = playlist[playlistTrackIndex];
            if (!currentTrack) return;
            if (audioPlaying) {
              stopAudio();
            } else {
              playVerse(currentTrack.ayah);
            }
          }}
        />
      )}

      {/* Hifz Memorization Suite Bar */}
      {hifzPrefs.enabled && (
        <HifzControls
          prefs={hifzPrefs}
          onChange={updateHifzPrefs}
          repeatIndex={hifzRepeatIndex}
          onClose={() => updateHifzPrefs({ ...hifzPrefs, enabled: false })}
        />
      )}

      {/* Live Projector / Presentation Mode */}
      {showPresentationMode && (
        <PresentationMode
          surahN={surahN}
          verses={verses || []}
          currentAyah={selectedVerse || rangeStart}
          maxVerses={maxVerses}
          surahEn={surah.en}
          surahAr={surah.ar}
          onNavigateAyah={(aN) => {
            setSelectedVerse(aN);
            const node = verseRefs.current.get(aN);
            if (node && scrollRef.current) {
              const top = node.getBoundingClientRect().top + scrollRef.current.scrollTop - 90;
              scrollRef.current.scrollTo({ top, behavior: "smooth" });
            }
          }}
          onNavigateSurah={(sN) => onNavigate(sN)}
          onNextTurn={() => {
            const next = Math.min(circleTurn + 1, totalTurns);
            setCircleTurn(next);
            setSelectedVerse((next - 1) * chunkSize + 1);
          }}
          onPrevTurn={() => {
            const prev = Math.max(circleTurn - 1, 1);
            setCircleTurn(prev);
            setSelectedVerse((prev - 1) * chunkSize + 1);
          }}
          audioPlaying={audioPlaying}
          onToggleAudio={(aN) => togglePlay(aN)}
          onClose={() => setShowPresentationMode(false)}
          turnNumber={prefs.circleModeEnabled ? currentTurn : undefined}
          totalTurns={prefs.circleModeEnabled ? totalTurns : undefined}
          turnStartAyah={prefs.circleModeEnabled ? turnStartAyah : undefined}
          turnEndAyah={prefs.circleModeEnabled ? turnEndAyah : undefined}
          prefs={prefs}
          selectedTrans={selectedTrans}
        />
      )}

      {prefs.circleModeEnabled && (
        <CircleTurnBar
          surahName={surah.en}
          totalVerses={maxVerses}
          currentTurn={currentTurn}
          totalTurns={totalTurns}
          turnStartAyah={turnStartAyah}
          turnEndAyah={turnEndAyah}
          chunkSize={chunkSize}
          viewStyle={prefs.circleViewStyle}
          onTurnChange={(turn) => setCircleTurn(turn)}
          onChunkSizeChange={(sz) => setPrefs((p) => ({ ...p, circleChunkSize: sz }))}
          onViewStyleChange={(st) => setPrefs((p) => ({ ...p, circleViewStyle: st }))}
        />
      )}

      {/* Always-on floating settings widget */}
      <FloatingSettings open={settingsOpen} onOpenChange={setSettingsOpen}>
        <ReaderSettingsPanel
          prefs={prefs}
          onPrefsChange={(updater) => setPrefs(updater)}
          langs={langs}
          onToggleLang={toggleLang}
          selectedTrans={selectedTrans}
          onSelectedTransChange={(updater) => setSelectedTrans(updater)}
          reciter={reciter}
          onReciterChange={handleReciterChange}
        />
      </FloatingSettings>

      {/* Reading surface */}
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedVerse(null);
            setShowNotePanel(false);
          }
        }}
      >
        {resumeBookmark && resumeBookmark.surahN !== surahN && (
          <button
            type="button"
            onClick={() => {
              pendingResume.current = resumeBookmark;
              onNavigate(resumeBookmark.surahN);
            }}
            className="mx-auto mb-8 flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tr("continue_reading")}: {resumeSurah?.en ?? resumeBookmark.surahN} ·{" "}
            {lang === "en" ? "verse" : "آیت"} {resumeBookmark.verse}
          </button>
        )}
        <div className="text-center space-y-1 mb-10">
          <div className="text-3xl sm:text-4xl font-bold font-serif-display">{surah.en}</div>
          <div dir="rtl" className="text-2xl sm:text-3xl text-gold" style={{ fontFamily: arFam }}>
            {surah.ar}
          </div>
          <div className="text-sm text-muted-foreground">
            {lang === "en"
              ? `${surah.type} · ${maxVerses} verses`
              : `${surah.type} · ${maxVerses} آیات`}
          </div>
        </div>

        {showAr && surahN !== 9 && (
          <p
            dir="rtl"
            className="text-center mb-10"
            style={{
              fontFamily: arFam,
              fontSize: `${(prefs.fontSize * 1.6) / 100}rem`,
              lineHeight: prefs.lineSpacing,
            }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        )}

        {!verses ? (
          versesError ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                {lang === "en"
                  ? "This surah isn't available offline yet. Please connect to the internet once so it can be saved for offline reading."
                  : "یہ سورہ ابھی آف لائن دستیاب نہیں ہے۔ براہِ کرم ایک بار انٹرنیٹ سے جڑیں تاکہ یہ آف لائن پڑھنے کے لیے محفوظ ہو سکے۔"}
              </p>
              <button
                onClick={() => onNavigate(surahN)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors"
              >
                {lang === "en" ? "Try again" : "دوبارہ کوشش کریں"}
              </button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">
              {lang === "en" ? "Loading verses…" : "آیات لوڈ ہو رہی ہیں…"}
            </p>
          )
        ) : (
          <div className="space-y-6">
            {verses
              .filter((v) => {
                if (!prefs.circleModeEnabled || prefs.circleViewStyle !== "focused") return true;
                return v.ayah >= turnStartAyah && v.ayah <= turnEndAyah;
              })
              .map((v) => {
                const inRange = v.ayah >= rangeStart && v.ayah <= rangeEnd;
                const hlColor = highlights[`${surahN}:${v.ayah}`];
                const hl = hlColor ? HIGHLIGHT_CLASSES[hlColor] : null;
                const hasNote = !!verseNotes[`${surahN}:${v.ayah}`];
                const isFav = !!favorites[`${surahN}:${v.ayah}`];
                const isSelected = selectedVerse === v.ayah;

                const isTurnStart =
                  prefs.circleModeEnabled &&
                  prefs.circleViewStyle === "continuous" &&
                  (v.ayah === 1 || (v.ayah - 1) % chunkSize === 0);
                const turnNumForVerse = Math.floor((v.ayah - 1) / chunkSize) + 1;
                const isCurrentTurnVerse =
                  prefs.circleModeEnabled && v.ayah >= turnStartAyah && v.ayah <= turnEndAyah;

                return (
                  <div key={v.ayah} className="space-y-3">
                    {isTurnStart && (
                      <div
                        className={cn(
                          "flex items-center gap-2 pt-4 pb-2 border-b text-xs font-semibold tracking-wide",
                          turnNumForVerse === currentTurn
                            ? "text-gold border-gold/40"
                            : "text-muted-foreground border-border/60",
                        )}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {lang === "ur"
                            ? `ٹرن ${turnNumForVerse} (آیات ${v.ayah}–${Math.min(v.ayah + chunkSize - 1, maxVerses)})`
                            : `Turn ${turnNumForVerse} (Ayahs ${v.ayah}–${Math.min(v.ayah + chunkSize - 1, maxVerses)})`}
                        </span>
                        {turnNumForVerse === currentTurn && (
                          <span className="ml-auto px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[11px] font-bold border border-gold/30">
                            {lang === "ur" ? "جاری ٹرن" : "Active Turn"}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      ref={(node) => {
                        if (node) verseRefs.current.set(v.ayah, node);
                        else verseRefs.current.delete(v.ayah);
                      }}
                      onClick={() => {
                        setSelectedVerse(isSelected ? null : v.ayah);
                        setShowNotePanel(false);
                      }}
                      className={cn(
                        "rounded-2xl px-3 sm:px-6 py-4 sm:py-5 transition-all cursor-pointer border-l-4",
                        inRange && !hl && "bg-gold/5 border border-gold/15",
                        hl && cn(hl.border, hl.bg),
                        !inRange && !hl && "border-l-transparent",
                        flash === v.ayah && "ring-2 ring-gold shadow-gold",
                        audioVerse === v.ayah && audioPlaying && "ring-2 ring-gold/60 shadow-gold",
                        isSelected && "ring-2 ring-gold/80",
                        prefs.circleModeEnabled &&
                          prefs.circleViewStyle === "continuous" &&
                          !isCurrentTurnVerse &&
                          "opacity-60 hover:opacity-100 transition-opacity",
                        prefs.circleModeEnabled &&
                          prefs.circleViewStyle === "continuous" &&
                          isCurrentTurnVerse &&
                          "ring-1 ring-gold/40 bg-gold/5 shadow-gold",
                      )}
                    >
                      {showAr && (
                        <p
                          dir="rtl"
                          className={cn(
                            "text-right",
                            hifzPrefs.selfTestBlur &&
                              "blur-md hover:blur-none transition-all duration-300 select-none",
                          )}
                          style={{
                            fontFamily: arFam,
                            fontSize: arSize,
                            lineHeight: prefs.lineSpacing,
                          }}
                        >
                          {v.arabic}
                          <button
                            type="button"
                            onClick={() => togglePlay(v.ayah)}
                            className={cn(
                              "inline-flex align-middle mx-1.5 h-7 w-7 items-center justify-center rounded-full border transition-all",
                              audioVerse === v.ayah && audioPlaying
                                ? "border-gold/60 bg-gold/20 text-gold"
                                : "border-border bg-card text-muted-foreground hover:text-gold hover:border-gold/40",
                            )}
                            aria-label={
                              audioVerse === v.ayah && audioPlaying ? tr("pause") : tr("play")
                            }
                          >
                            {audioVerse === v.ayah && audioPlaying ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </button>
                          <span className="inline-flex align-middle mx-1.5 h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-card text-sm font-semibold text-gold">
                            {v.ayah}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites(toggleFavorite(surahN, v.ayah));
                            }}
                            aria-label={
                              isFav
                                ? lang === "en"
                                  ? "Remove from favorites"
                                  : "پسندیدہ سے ہٹائیں"
                                : lang === "en"
                                  ? "Add to favorites"
                                  : "پسندیدہ میں شامل کریں"
                            }
                            title={
                              isFav
                                ? lang === "en"
                                  ? "Remove from favorites"
                                  : "پسندیدہ سے ہٹائیں"
                                : lang === "en"
                                  ? "Add to favorites"
                                  : "پسندیدہ میں شامل کریں"
                            }
                            className={cn(
                              "inline-flex align-middle mx-0.5 h-6 w-6 items-center justify-center rounded-full border transition-all",
                              isFav
                                ? "border-gold/60 bg-gold/20 text-gold"
                                : "border-border bg-card text-muted-foreground hover:text-gold hover:border-gold/40",
                            )}
                          >
                            <Star className={cn("h-3 w-3", isFav && "fill-gold")} />
                          </button>
                          {hasNote && (
                            <span
                              className="inline-flex align-middle mx-0.5 h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold"
                              title={lang === "en" ? "Has note" : "نوٹ موجود ہے"}
                            >
                              <StickyNote className="h-3 w-3" />
                            </span>
                          )}
                        </p>
                      )}
                      {selectedTrans.map((tid) => {
                        const tDef = getTranslation(tid);
                        if (!tDef) return null;
                        const text = getTranslationText(v as Record<string, unknown>, tid);
                        if (!text) return null;
                        const isRTL = tDef.dir === "rtl";
                        const fam = isRTL ? urFam : enFam;
                        const sz = isRTL ? urSize : enSize;
                        return (
                          <p
                            key={tid}
                            dir={tDef.dir}
                            className={cn(
                              "mt-2 leading-relaxed text-muted-foreground",
                              isRTL && "text-right",
                            )}
                            style={{ fontFamily: fam, fontSize: sz, lineHeight: prefs.lineSpacing }}
                          >
                            {text}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />
      {audioError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] rounded-full bg-destructive/90 text-destructive-foreground px-4 py-2 text-xs font-semibold shadow-lg">
          {tr("audio_error")}
        </div>
      )}

      {/* ── Search bar ── */}
      {showSearch && (
        <div className="sticky top-[60px] z-20 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "en" ? "Search the Qur'an..." : "قرآن میں تلاش کریں..."}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-gold/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchAllSurahs(false);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  !searchAllSurahs
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {lang === "en" ? "This surah" : "اس سورت میں"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchAllSurahs(true);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  searchAllSurahs
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {lang === "en" ? "All surahs" : "تمام سورتیں"}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  searchScope === "all"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {tr("search_all_translations")}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope("selected")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  searchScope === "selected"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {tr("search_selected_only")}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("contains")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  searchMode === "contains"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {tr("search_contains")}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("word")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  searchMode === "word"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {tr("search_exact_word")}
              </button>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeProject) {
                      saveSearchToProject(
                        activeProject.id,
                        searchQuery,
                        searchAllSurahs ? undefined : surahN,
                      );
                      refreshProjectData();
                      setSearchSavedToast(true);
                      setTimeout(() => setSearchSavedToast(false), 2000);
                    }
                  }}
                  className="px-3 py-1 rounded-full text-xs font-semibold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 flex items-center gap-1 transition-all"
                >
                  <FolderPlus className="h-3 w-3" />
                  <span>Save Search to Project</span>
                </button>
              )}
              {searchResults.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {searchResults.length > SEARCH_RESULT_CAP && !showAllResults
                    ? tr("search_showing_of")
                        .replace("{shown}", String(SEARCH_RESULT_CAP))
                        .replace("{total}", String(searchResults.length))
                    : `${searchResults.length} ${lang === "en" ? "results" : "نتائج"}`}
                </span>
              )}
              {searchResults.length > SEARCH_RESULT_CAP && !showAllResults && (
                <button
                  type="button"
                  onClick={() => setShowAllResults(true)}
                  className="px-3 py-1 rounded-full text-xs font-semibold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 transition-all"
                >
                  {tr("search_show_all")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Search results ── */}
      {showSearch && searchQuery.trim() && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
          {searchLoading ? (
            <p className="text-center text-muted-foreground py-8">
              {lang === "en" ? "Loading all surahs..." : "تمام سورتیں لوڈ ہو رہی ہیں..."}
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {lang === "en" ? "No results found" : "کوئی نتائج نہیں ملے"}
            </p>
          ) : (
            searchResults
              .slice(0, showAllResults ? searchResults.length : SEARCH_RESULT_CAP)
              .map((r) => {
                const s = SURAHS.find((x) => x.n === r.surah);
                return (
                  <div
                    key={`${r.surah}:${r.ayah}`}
                    onClick={() => {
                      if (r.surah === surahN) {
                        const node = verseRefs.current.get(r.ayah);
                        if (node && scrollRef.current) {
                          const top =
                            node.getBoundingClientRect().top + scrollRef.current.scrollTop - 90;
                          scrollRef.current.scrollTo({ top, behavior: "smooth" });
                          setFlash(r.ayah);
                          setSelectedVerse(r.ayah);
                          setTimeout(() => setFlash(null), 3000);
                        }
                      } else {
                        onNavigate(r.surah, r.ayah);
                      }
                      setShowSearch(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="rounded-xl border border-border bg-card p-4 hover:border-gold/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gold">
                        {s?.en ?? `Surah ${r.surah}`} · {r.surah}:{r.ayah}
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const text = composeShareText(
                              r,
                              s?.en ?? "",
                              s?.ar ?? "",
                              verseNotes[`${r.surah}:${r.ayah}`],
                              sharePrefs,
                              selectedTrans,
                            );
                            navigator.clipboard.writeText(text).then(() => {
                              setCopiedToast(true);
                              setTimeout(() => setCopiedToast(false), 1500);
                            });
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
                          title="Copy"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const text = composeShareText(
                              r,
                              s?.en ?? "",
                              s?.ar ?? "",
                              verseNotes[`${r.surah}:${r.ayah}`],
                              sharePrefs,
                              selectedTrans,
                            );
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p
                      dir="rtl"
                      className="text-right text-lg text-foreground leading-relaxed"
                      style={{ fontFamily: arFam }}
                    >
                      <Highlight text={r.arabic} query={searchQuery} mode={searchMode} />
                    </p>
                    {selectedTrans.slice(0, 2).map((tid) => {
                      const text = getTranslationText(r as Record<string, unknown>, tid);
                      const tDef = getTranslation(tid);
                      if (!text || !tDef) return null;
                      return (
                        <p
                          key={tid}
                          dir={tDef.dir}
                          className={cn(
                            "text-sm text-muted-foreground mt-1 leading-relaxed",
                            tDef.dir === "rtl" && "text-right",
                          )}
                        >
                          <Highlight text={text} query={searchQuery} mode={searchMode} />
                        </p>
                      );
                    })}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ── Floating annotation toolbar ── */}
      {selectedVerse && !showNotePanel && !showSearch && (
        <div className="fixed bottom-0 inset-x-0 z-[85] bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground mr-auto">
              {surahN}:{selectedVerse}
            </span>
            {HIGHLIGHT_COLORS.map((c) => {
              const cls = HIGHLIGHT_CLASSES[c];
              const active = highlights[`${surahN}:${selectedVerse}`] === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const key = `${surahN}:${selectedVerse}`;
                    const next = active
                      ? saveHighlight(surahN, selectedVerse, null)
                      : saveHighlight(surahN, selectedVerse, c);
                    setHighlights(next);
                  }}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    cls.dot,
                    active ? "border-foreground scale-110" : "border-transparent hover:scale-110",
                  )}
                  title={c}
                />
              );
            })}
            {highlights[`${surahN}:${selectedVerse}`] && (
              <button
                type="button"
                onClick={() => {
                  const next = saveHighlight(surahN, selectedVerse, null);
                  setHighlights(next);
                }}
                className="h-7 px-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                {lang === "en" ? "Clear" : "صاف"}
              </button>
            )}
            <div className="w-px h-5 bg-border" />
            <VerseProjectSelector
              surah={surahN}
              ayah={selectedVerse}
              onChanged={refreshProjectData}
            />
            <button
              type="button"
              onClick={() => {
                setNoteDraft(verseNotes[`${surahN}:${selectedVerse}`] ?? "");
                setShowNotePanel(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              title={lang === "en" ? "Add note" : "نوٹ شامل کریں"}
            >
              <StickyNote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const v = verses?.find((x) => x.ayah === selectedVerse);
                if (!v) return;
                setShareTarget({ v, note: verseNotes[`${surahN}:${selectedVerse}`] });
                setShowShareModal(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              title="Copy / Share"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Note textarea panel ── */}
      {showNotePanel && selectedVerse && (
        <div className="fixed bottom-0 inset-x-0 z-[85] bg-background border-t border-border shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {lang === "en"
                  ? `Note on ${surahN}:${selectedVerse}`
                  : `نوٹ ${surahN}:${selectedVerse} پر`}
              </span>
              <button
                type="button"
                onClick={() => setShowNotePanel(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={lang === "en" ? "Add a note..." : "نوٹ شامل کریں..."}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-gold/60 resize-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNotePanel(false)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                {lang === "en" ? "Cancel" : "منسوخ"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = saveVerseNote(surahN, selectedVerse, noteDraft);
                  setVerseNotes(next);
                  setShowNotePanel(false);
                }}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              >
                {lang === "en" ? "Save" : "محفوظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Manager Modal ── */}
      <ProjectManagerDialog
        open={showProjectManager}
        onOpenChange={setShowProjectManager}
        onProjectChange={refreshProjectData}
      />

      {/* ── Saved verses panel (notes / highlights / favorites / searches) ── */}
      {showSavedPanel && (
        <div className="fixed inset-0 z-[90] bg-background overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  title={lang === "en" ? "Back to Main Website" : "مرکزی ویب سائٹ پر واپس جائیں"}
                  className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gold/30 bg-card/80 hover:bg-gold/10 hover:border-gold/60 text-foreground transition-all shrink-0 cursor-pointer"
                >
                  <div className="grid h-6 w-6 place-items-center rounded-lg bg-card ring-1 ring-gold/20 shadow-sm overflow-hidden shrink-0">
                    <img src="/logo.png" alt="Qurʼān Parho" className="h-5 w-5 object-contain" />
                  </div>
                  <span className="hidden sm:inline font-semibold text-xs tracking-tight text-foreground group-hover:text-gold transition-colors">
                    {lang === "en" ? "Qurʼān Parho" : "قرآن پڑھو"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavedPanel(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60 transition-colors"
                  title={lang === "en" ? "Back to Reader" : "قاری کی طرف واپس"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 text-center text-sm font-semibold truncate">
                {lang === "en" ? "Saved Research & Library" : "محفوظ تحقیقی لائبریری"}
              </div>
              <button
                type="button"
                onClick={() => setShowProjectManager(true)}
                className="px-3 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 flex items-center gap-1.5 transition-colors"
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Projects</span>
              </button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
            {/* Active Project Banner */}
            <div className="p-3.5 rounded-2xl border border-gold/40 bg-gold/5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-gold font-bold flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  Active Project Collection
                </div>
                <div className="text-base font-bold text-foreground truncate mt-0.5">
                  {activeProject?.name || "General Research"}
                </div>
                {activeProject?.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {activeProject.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProjectManager(true)}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:border-gold/60 shrink-0 transition-colors"
              >
                Switch Project
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(
                [
                  {
                    id: "notes",
                    label: lang === "en" ? "Notes" : "نوٹس",
                    count: Object.keys(verseNotes).length,
                  },
                  {
                    id: "highlights",
                    label: lang === "en" ? "Highlights" : "نشان زدہ",
                    count: Object.keys(highlights).length,
                  },
                  {
                    id: "favorites",
                    label: lang === "en" ? "Project Favorites" : "پروجیکٹ پسندیدہ",
                    count: Object.keys(favorites).length,
                  },
                  {
                    id: "searches",
                    label: lang === "en" ? "Saved Searches" : "محفوظ تلاش",
                    count: (activeProject?.savedSearches || []).length,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSavedTab(t.id);
                    clearSavedSelection();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    savedTab === t.id
                      ? "bg-gold/10 border-gold/40 text-gold shadow-gold"
                      : "border-border text-muted-foreground hover:border-gold/40",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px]",
                      savedTab === t.id
                        ? "bg-gold text-background"
                        : "bg-border text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setNotesListTab("surah")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  notesListTab === "surah"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {lang === "en" ? `Surah ${surahN}` : `سورۃ ${surahN}`}
              </button>
              <button
                type="button"
                onClick={() => setNotesListTab("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  notesListTab === "all"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                {lang === "en" ? "All" : "تمام"}
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={sortedTabKeys(savedTab).length === 0}
                  onClick={() => copySavedKeys(sortedTabKeys(savedTab))}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all inline-flex items-center gap-1",
                    sortedTabKeys(savedTab).length === 0
                      ? "border-border text-muted-foreground/50 cursor-not-allowed"
                      : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20",
                  )}
                  title={lang === "en" ? "Copy all saved verses" : "تمام محفوظ آیات کاپی کریں"}
                >
                  <Copy className="h-3 w-3" />
                  {lang === "en" ? "Copy all" : "سب کاپی"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (savedSelectMode) clearSavedSelection();
                    else setSavedSelectMode(true);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                    savedSelectMode
                      ? "bg-gold/10 border-gold/40 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/40",
                  )}
                >
                  {savedSelectMode
                    ? lang === "en"
                      ? "Done"
                      : "مکمل"
                    : lang === "en"
                      ? "Select"
                      : "منتخب کریں"}
                </button>
                {savedTab !== "notes" && (
                  <>
                    {pill(showAr, () => toggleLang("ar"), lang === "en" ? "Arabic" : "عربی")}
                    {pill(showEn, () => toggleLang("en"), "English")}
                    {pill(showUr, () => toggleLang("ur"), lang === "en" ? "Urdu" : "اردو")}
                  </>
                )}
              </div>
            </div>

            {(() => {
              if (savedTab === "searches") {
                const searches = activeProject?.savedSearches || [];
                if (searches.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-2">
                      <p className="text-muted-foreground text-sm">
                        {lang === "en"
                          ? "No saved searches in this project yet."
                          : "اس پروجیکٹ میں ابھی تک کوئی محفوظ شدہ تلاش نہیں۔"}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {lang === "en"
                          ? "Use the search bar and click 'Save Search' to save topic queries."
                          : "تلاش کے بٹن پر کلک کرکے سرچ کوریز کو اس پروجیکٹ میں محفوظ کریں۔"}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {searches.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-border bg-card hover:border-gold/40 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-foreground truncate">
                            &quot;{s.query}&quot;
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.surahFilter ? `Filter: Surah ${s.surahFilter}` : "All Surahs"} ·
                            Saved {new Date(s.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSavedPanel(false);
                              setSearchQuery(s.query);
                              setSearchAllSurahs(!s.surahFilter);
                              setShowSearch(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-gold/40 bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 flex items-center gap-1 transition-colors"
                          >
                            <Search className="h-3 w-3" />
                            Run Search
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeProject) {
                                removeSearchFromProject(activeProject.id, s.id);
                                refreshProjectData();
                              }
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove search"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              const source =
                savedTab === "notes"
                  ? verseNotes
                  : savedTab === "highlights"
                    ? highlights
                    : favorites;
              const inScope = (k: string) =>
                notesListTab === "surah" ? k.startsWith(`${surahN}:`) : true;
              const keys = Object.keys(source)
                .filter(inScope)
                .sort((a, b) => {
                  const [aS, aA] = a.split(":").map(Number);
                  const [bS, bA] = b.split(":").map(Number);
                  return aS !== bS ? aS - bS : aA - bA;
                });

              if (keys.length === 0) {
                const empty =
                  savedTab === "notes"
                    ? {
                        en: "No notes yet — tap a verse, then the note icon.",
                        ur: "ابھی تک کوئی نوٹ نہیں — کسی آیت پر ٹیپ کریں، پھر نوٹ کا آئیکن۔",
                      }
                    : savedTab === "highlights"
                      ? {
                          en: "No highlighted verses yet — tap a verse, then pick a color.",
                          ur: "ابھی تک کوئی آیت نشان زد نہیں — کسی آیت پر ٹیپ کریں، پھر رنگ منتخب کریں۔",
                        }
                      : {
                          en: "No favorites yet — tap the ★ on any verse.",
                          ur: "ابھی تک کوئی پسندیدہ نہیں — کسی بھی آیت پر ★ دبائیں۔",
                        };
                return (
                  <p className="text-center text-muted-foreground py-16 text-sm">
                    {lang === "en" ? empty.en : empty.ur}
                  </p>
                );
              }

              const groups: { sN: number; items: { aN: number; key: string }[] }[] = [];
              for (const key of keys) {
                const [sN, aN] = key.split(":").map(Number);
                const last = groups[groups.length - 1];
                if (!last || last.sN !== sN) {
                  groups.push({ sN, items: [{ aN, key }] });
                } else {
                  last.items.push({ aN, key });
                }
              }

              const removeEntry = (sN: number, aN: number) => {
                if (savedTab === "notes") setVerseNotes(saveVerseNote(sN, aN, ""));
                else if (savedTab === "highlights") setHighlights(saveHighlight(sN, aN, null));
                else setFavorites(toggleFavorite(sN, aN));
              };

              return (
                <div className="space-y-6">
                  {groups.map((g) => {
                    const s = SURAHS.find((x) => x.n === g.sN);
                    const arr = savedText[g.sN];
                    return (
                      <div key={g.sN}>
                        <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-2">
                          {s?.en ?? `Surah ${g.sN}`} · {s?.ar ?? ""}
                        </h3>
                        <div className="space-y-2">
                          {g.items.map(({ aN, key }) => {
                            const v = arr?.find((vv) => vv.ayah === aN);
                            const hlColor = highlights[key];
                            const noteText = verseNotes[key];
                            const isFavorite = !!favorites[key];
                            const isSelected = savedSelection.has(key);
                            return (
                              <div
                                key={key}
                                onClick={() =>
                                  savedSelectMode ? toggleSavedSelection(key) : goToVerse(g.sN, aN)
                                }
                                className={cn(
                                  "rounded-xl border p-3.5 cursor-pointer transition-colors",
                                  savedSelectMode
                                    ? isSelected
                                      ? "border-gold bg-gold/10"
                                      : "border-border bg-card hover:border-gold/40"
                                    : "border-border bg-card hover:border-gold/40",
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  {savedSelectMode && (
                                    <span
                                      className={cn(
                                        "grid h-5 w-5 shrink-0 place-items-center rounded border transition-all",
                                        isSelected
                                          ? "bg-gold border-gold"
                                          : "border-border bg-background",
                                      )}
                                    >
                                      {isSelected && <Check className="h-3 w-3 text-background" />}
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-gold">
                                    {g.sN}:{aN}
                                  </span>
                                  {savedTab === "highlights" && hlColor && (
                                    <span
                                      className={cn(
                                        "h-3 w-3 rounded-full",
                                        HIGHLIGHT_CLASSES[hlColor].dot,
                                      )}
                                    />
                                  )}
                                  {isFavorite && <Star className="h-3 w-3 fill-gold text-gold" />}
                                  <div
                                    className="ml-auto flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {!savedSelectMode && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => copySavedKeys([key])}
                                          className="h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                          aria-label="Copy"
                                          title={lang === "en" ? "Copy" : "کاپی"}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => shareSavedKeys([key])}
                                          className="h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
                                          aria-label="WhatsApp"
                                          title="WhatsApp"
                                        >
                                          <MessageCircle className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeEntry(g.sN, aN)}
                                          className="h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                                          aria-label="Remove"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {savedTab === "notes" && noteText && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {noteText}
                                  </p>
                                )}
                                {savedTab !== "notes" && (
                                  <div className="space-y-1.5">
                                    {v ? (
                                      <>
                                        {showAr && v.arabic && (
                                          <p
                                            dir="rtl"
                                            className="text-right leading-relaxed"
                                            style={{
                                              fontFamily: arFam,
                                              fontSize: "1.05rem",
                                              lineHeight: prefs.lineSpacing,
                                            }}
                                          >
                                            {v.arabic}
                                          </p>
                                        )}
                                        {showEn && v.english_qarai && (
                                          <p
                                            className="text-sm text-muted-foreground leading-relaxed"
                                            style={{ fontFamily: enFam }}
                                          >
                                            {v.english_qarai}
                                          </p>
                                        )}
                                        {showUr && v.urdu_jawadi && (
                                          <p
                                            dir="rtl"
                                            className="text-sm text-muted-foreground leading-relaxed"
                                            style={{ fontFamily: urFam }}
                                          >
                                            {v.urdu_jawadi}
                                          </p>
                                        )}
                                      </>
                                    ) : savedLoading[g.sN] ? (
                                      <p className="text-xs text-muted-foreground/70">
                                        {lang === "en" ? "Loading…" : "لوڈ ہو رہا ہے…"}
                                      </p>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Saved selection action bar ── */}
      {showSavedPanel && savedSelectMode && (
        <div className="fixed bottom-0 inset-x-0 z-[91] border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gold mr-1">
              {lang === "en" ? `${savedSelection.size} selected` : `${savedSelection.size} منتخب`}
            </span>
            <button
              type="button"
              onClick={() => {
                const all = sortedTabKeys(savedTab);
                setSavedSelection(all.length === savedSelection.size ? new Set() : new Set(all));
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:border-gold/40 transition-colors"
            >
              {lang === "en" ? "Select all" : "سب منتخب کریں"}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={savedSelection.size === 0}
                onClick={() =>
                  copySavedKeys(sortedTabKeys(savedTab).filter((k) => savedSelection.has(k)))
                }
                className={cn(
                  "inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  savedSelection.size === 0
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20",
                )}
              >
                <Copy className="h-3 w-3" />
                {lang === "en" ? "Copy" : "کاپی"} ({savedSelection.size})
              </button>
              <button
                type="button"
                disabled={savedSelection.size === 0}
                onClick={() =>
                  shareSavedKeys(sortedTabKeys(savedTab).filter((k) => savedSelection.has(k)))
                }
                className={cn(
                  "inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  savedSelection.size === 0
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20",
                )}
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp ({savedSelection.size})
              </button>
              <button
                type="button"
                onClick={clearSavedSelection}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                {lang === "en" ? "Done" : "مکمل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share / Copy modal ── */}
      {showShareModal && shareTarget && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowShareModal(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {lang === "en" ? "Share verse" : "آیت شیئر کریں"}
              </span>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gold font-semibold">
              {shareTarget.v.surah}:{shareTarget.v.ayah} · {surah.en} ({surah.ar})
            </p>
            {[
              { key: "ar" as const, label: "Arabic", checked: sharePrefs.ar },
              { key: "en" as const, label: "English", checked: sharePrefs.en },
              { key: "ur" as const, label: "Urdu", checked: sharePrefs.ur },
              {
                key: "ref" as const,
                label: lang === "en" ? "Reference" : "حوالہ",
                checked: sharePrefs.ref,
              },
              {
                key: "note" as const,
                label: lang === "en" ? "Your note" : "آپ کا نوٹ",
                checked: sharePrefs.note,
              },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={() => {
                    const next = { ...sharePrefs, [opt.key]: !sharePrefs[opt.key] };
                    setSharePrefs(next);
                    saveSharePrefs(next);
                  }}
                  className="h-4 w-4 rounded border-border accent-gold"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = composeShareText(
                    shareTarget.v,
                    surah.en,
                    surah.ar,
                    shareTarget.note,
                    sharePrefs,
                    selectedTrans,
                  );
                  navigator.clipboard.writeText(text).then(() => {
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 1500);
                    setShowShareModal(false);
                  });
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold border border-border bg-card text-foreground hover:border-gold/40 transition-colors"
              >
                {lang === "en" ? "Copy" : "کاپی"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = composeShareText(
                    shareTarget.v,
                    surah.en,
                    surah.ar,
                    shareTarget.note,
                    sharePrefs,
                    selectedTrans,
                  );
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  setShowShareModal(false);
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Copied toast ── */}
      {copiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[95] rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold shadow-lg">
          {lang === "en" ? "Copied!" : "کاپی ہو گیا!"}
        </div>
      )}

      {/* ── Search saved toast ── */}
      {searchSavedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[95] rounded-full bg-gold text-background px-4 py-2 text-xs font-semibold shadow-lg flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5" />
          <span>
            {lang === "en"
              ? `Search saved to "${activeProject?.name || "Project"}"`
              : "تلاش پروجیکٹ میں محفوظ کر لی گئی!"}
          </span>
        </div>
      )}
    </div>
  );
}
