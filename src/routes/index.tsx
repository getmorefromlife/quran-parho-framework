import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  Compass,
  ScrollText,
  Share2,
  StickyNote,
  Play,
  BookOpen,
  Bot,
  Timer,
  Layers,
  Library,
} from "lucide-react";
import { LangProvider, useLang } from "@/lib/i18n";
import { SURAHS } from "@/lib/surahs";
import { loadSurah, type QVerse } from "@/lib/quran-data";
import { loadSelectedTranslations } from "@/lib/translations";

import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Philosophy } from "@/components/sections/philosophy";
import { Cycles } from "@/components/sections/cycles";
import { SessionGuide } from "@/components/sections/session-guide";
import { HowToGuide } from "@/components/sections/howto-guide";
import { FacilitatorKit } from "@/components/sections/facilitator-kit";
import { AILab } from "@/components/sections/ai-lab";
import { TafseerResources } from "@/components/sections/tafseer";
import { Posters } from "@/components/sections/posters";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { SurahExplorer } from "@/components/surah-explorer";
import { ShareSurah } from "@/components/share-surah";
import { FacilitatorTools } from "@/components/facilitator-tools";
import { ThematicLibrary } from "@/components/sections/thematic-library";
import type { ThemeEntry } from "@/lib/themes";

const SurahReader = lazy(() =>
  import("@/components/reader").then((m) => ({ default: m.SurahReader })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Qurʼān Parho Framework · Neighborhood Circle Blueprint" },
      {
        name: "description",
        content:
          "A practical, low-friction framework by Maulana Syed Imon Rizvi to launch daily Quran-Urdu translation circles in every neighborhood.",
      },
      { property: "og:title", content: "Qurʼān Parho Framework · Neighborhood Circle Blueprint" },
      {
        property: "og:description",
        content:
          "Launch a 1-hour or 2-hour Quran-Urdu translation circle with the 3-cycle roadmap, session simulator, and facilitator toolkit.",
      },
    ],
  }),
  component: () => (
    <LangProvider>
      <Page />
    </LangProvider>
  ),
});

function Page() {
  const { tr, lang } = useLang();
  const [toolTab, setToolTab] = useState(0);
  const [sessionSplit, setSessionSplit] = useState<{ reading: number; discussion: number } | null>(
    null,
  );
  const [showAr, setShowAr] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [showUr, setShowUr] = useState(true);
  const [readerOpen, setReaderOpen] = useState<{
    surahN: number;
    rangeStart: number;
    rangeEnd: number;
  } | null>(null);
  const [readerVerses, setReaderVerses] = useState<QVerse[] | null>(null);
  const [readerError, setReaderError] = useState(false);

  const toggleLang = (which: "ar" | "en" | "ur") => {
    const cur = which === "ar" ? showAr : which === "en" ? showEn : showUr;
    const othersOn =
      which === "ar" ? showEn || showUr : which === "en" ? showAr || showUr : showAr || showEn;
    if (!othersOn && cur) return;
    if (which === "ar") setShowAr((v) => !v);
    else if (which === "en") setShowEn((v) => !v);
    else setShowUr((v) => !v);
  };

  const openReader = (
    n: number,
    rangeStart = 1,
    rangeEnd = SURAHS.find((s) => s.n === n)?.verses ?? 114,
  ) => setReaderOpen({ surahN: n, rangeStart, rangeEnd });

  const [jumpToVerse, setJumpToVerse] = useState<number | undefined>(undefined);
  const readerNavigate = (n: number, jumpTo?: number) => {
    if (jumpTo != null) setJumpToVerse(jumpTo);
    setReaderOpen((r) => (r ? { ...r, surahN: n } : r));
  };

  const handleOpenTheme = (theme: ThemeEntry) => {
    if (theme.verses.length > 0) {
      const firstVerse = theme.verses[0];
      const [surahStr, verseStr] = firstVerse.split(":");
      const surahN = parseInt(surahStr, 10);
      const ayahN = verseStr ? parseInt(verseStr.split("-")[0], 10) : 1;
      openReader(surahN);
      setJumpToVerse(ayahN);
    }
  };

  useEffect(() => {
    if (!readerOpen) {
      setReaderVerses(null);
      setReaderError(false);
      return;
    }
    let cancelled = false;
    setReaderVerses(null);
    setReaderError(false);
    loadSurah(readerOpen.surahN)
      .then((d) => {
        if (!cancelled) setReaderVerses(d);
      })
      .catch(() => {
        if (!cancelled) {
          setReaderVerses(null);
          setReaderError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [readerOpen]);
  const navItems = [
    { key: "nav_about", anchor: "about", icon: Compass },
    { key: "nav_cycles", anchor: "cycles", icon: Layers },
    { key: "nav_explorer", anchor: "session", icon: ScrollText },
    { key: "nav_themes", anchor: "themes", icon: Library },
    { key: "nav_share", anchor: "share", icon: Share2 },
    { key: "nav_howto", anchor: "howto", icon: StickyNote },
    { key: "nav_guide", anchor: "guide", icon: Play },
    { key: "nav_kit", anchor: "kit", icon: BookOpen },
    { key: "nav_ai", anchor: "ai", icon: Bot },
    { key: "nav_tools", anchor: "tools", icon: Timer },
  ];
  const goToTool = (i: number) => {
    setToolTab(i);
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="min-h-screen bg-hero pb-16 lg:pb-0">
      <Header />
      <main>
        <Hero />
        <Philosophy />
        <Cycles />
        <SessionGuide
          lang={lang}
          split={sessionSplit}
          onSplitChange={setSessionSplit}
          onNavigate={goToTool}
        />
        <SurahExplorer onOpenSurah={openReader} />
        <ThematicLibrary onOpenTheme={handleOpenTheme} />
        <ShareSurah
          langs={{ ar: showAr, en: showEn, ur: showUr }}
          onToggleLang={toggleLang}
          onOpenReader={openReader}
        />
        <HowToGuide />
        <FacilitatorKit />
        <AILab />
        <TafseerResources />
        <Posters />
        <Contact />
        <FacilitatorTools
          lang={lang}
          tab={toolTab}
          onTabChange={setToolTab}
          initialSplit={sessionSplit}
        />
      </main>
      <Footer />
      {readerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[80] bg-background grid place-items-center text-sm text-muted-foreground">
              {lang === "en" ? "Opening reader…" : "قاری کھل رہا ہے…"}
            </div>
          }
        >
          <SurahReader
            surahN={readerOpen.surahN}
            verses={readerVerses}
            versesError={readerError}
            maxVerses={SURAHS.find((s) => s.n === readerOpen.surahN)?.verses ?? 114}
            langs={{ ar: showAr, en: showEn, ur: showUr }}
            selectedTranslations={loadSelectedTranslations()}
            rangeStart={readerOpen.rangeStart}
            rangeEnd={readerOpen.rangeEnd}
            onClose={() => setReaderOpen(null)}
            onNavigate={readerNavigate}
            jumpToVerse={jumpToVerse}
            onJumpComplete={() => setJumpToVerse(undefined)}
          />
        </Suspense>
      )}
      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors min-w-0"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium truncate max-w-full">{tr(item.key)}</span>
            </a>
          );
        })}
      </nav>
      {/* Anchor for accessibility */}
      <span className="sr-only">
        {tr("hero_title")} {lang}
      </span>
    </div>
  );
}
