import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  ARABIC_FONTS,
  URDU_FONTS,
  ENGLISH_FONTS,
  getFontFamily,
  loadSettingsPos,
  saveSettingsPos,
  type ReaderPrefs,
} from "@/lib/reader-fonts";
import { RECITERS, type ReciterId } from "@/lib/audio-reciters";
import { TRANSLATIONS_BY_LANG, LANG_LABELS, type TranslationLang } from "@/lib/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LangState = { ar: boolean; en: boolean; ur: boolean };

export type ReaderSettingsPanelProps = {
  prefs: ReaderPrefs;
  onPrefsChange: (updater: (p: ReaderPrefs) => ReaderPrefs) => void;
  langs: LangState;
  onToggleLang: (which: "ar" | "en" | "ur") => void;
  selectedTrans: string[];
  onSelectedTransChange: (updater: (prev: string[]) => string[]) => void;
  reciter: ReciterId;
  onReciterChange: (id: ReciterId) => void;
};

export function ReaderSettingsPanel({
  prefs,
  onPrefsChange,
  langs,
  onToggleLang,
  selectedTrans,
  onSelectedTransChange,
  reciter,
  onReciterChange,
}: ReaderSettingsPanelProps) {
  const { tr, lang } = useLang();

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold mr-auto">{tr("reader_settings")}</span>
        {pill(langs.ar, () => onToggleLang("ar"), lang === "en" ? "Arabic" : "عربی")}
        {pill(langs.en, () => onToggleLang("en"), "English")}
        {pill(langs.ur, () => onToggleLang("ur"), lang === "en" ? "Urdu" : "اردو")}
      </div>

      {/* Translation picker grouped by language */}
      <div className="space-y-4">
        <span className="text-sm font-semibold text-muted-foreground">
          {lang === "en" ? "Translations" : "ترجمے"}
        </span>
        {(["en", "ur", "fa", "de"] as TranslationLang[]).map((lg) => {
          const defs = TRANSLATIONS_BY_LANG[lg];
          const label = LANG_LABELS[lg];
          return (
            <div key={lg} className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">
                {lang === "en" ? label.en : label.native}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {defs.map((t) => {
                  const active = selectedTrans.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      title={t.translator}
                      onClick={() => {
                        onSelectedTransChange((prev) =>
                          active ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                        );
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        active
                          ? "bg-gold/15 border-gold/50 text-gold"
                          : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground",
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
        <label className="grid gap-2 text-sm">
          <span className="flex items-center justify-between text-muted-foreground">
            <span>{tr("font_size")}</span>
            <span className="font-semibold text-foreground">{prefs.fontSize}%</span>
          </span>
          <input
            type="range"
            min={75}
            max={250}
            step={5}
            value={prefs.fontSize}
            onChange={(e) => onPrefsChange((p) => ({ ...p, fontSize: Number(e.target.value) }))}
            className="w-full accent-gold"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="flex items-center justify-between text-muted-foreground">
            <span>{tr("line_spacing")}</span>
            <span className="font-semibold text-foreground">{prefs.lineSpacing.toFixed(1)}×</span>
          </span>
          <input
            type="range"
            min={1.2}
            max={2.5}
            step={0.1}
            value={prefs.lineSpacing}
            onChange={(e) => onPrefsChange((p) => ({ ...p, lineSpacing: Number(e.target.value) }))}
            className="w-full accent-gold"
          />
        </label>

        <div className="grid gap-2 text-sm">
          <span className="text-muted-foreground">{tr("arabic_font")}</span>
          <Select
            value={prefs.fontAr}
            onValueChange={(v) => onPrefsChange((p) => ({ ...p, fontAr: v }))}
          >
            <SelectTrigger className="border-gold/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[98] max-h-80">
              {ARABIC_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id} style={{ fontFamily: getFontFamily(f.id) }}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 text-sm">
          <span className="text-muted-foreground">{tr("urdu_font")}</span>
          <Select
            value={prefs.fontUr}
            onValueChange={(v) => onPrefsChange((p) => ({ ...p, fontUr: v }))}
          >
            <SelectTrigger className="border-gold/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[98] max-h-80">
              {URDU_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id} style={{ fontFamily: getFontFamily(f.id) }}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 text-sm sm:col-span-2">
          <span className="text-muted-foreground">{tr("english_font")}</span>
          <Select
            value={prefs.fontEn}
            onValueChange={(v) => onPrefsChange((p) => ({ ...p, fontEn: v }))}
          >
            <SelectTrigger className="border-gold/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[98] max-h-80">
              {ENGLISH_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id} style={{ fontFamily: getFontFamily(f.id) }}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 text-sm sm:col-span-2">
          <span className="text-muted-foreground">{tr("reciter_label")}</span>
          <Select value={reciter} onValueChange={(v) => onReciterChange(v as ReciterId)}>
            <SelectTrigger className="border-gold/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[98] max-h-80">
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {lang === "en" ? r.name_en : r.name_ur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Quran Circle Turn Mode Settings ── */}
        <div className="sm:col-span-2 pt-3 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold block text-foreground">
                {lang === "en" ? "Quran Circle Turn Mode" : "قرآن سرکل موڈ"}
              </span>
              <span className="text-xs text-muted-foreground block">
                {lang === "en"
                  ? "Group verses for circle participants (Default: 5 verses/turn)"
                  : "قرآن سرکل پڑھنے والوں کے لیے آیات کا گروپ (اسٹینڈرڈ: 5 آیات)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onPrefsChange((p) => ({ ...p, circleModeEnabled: !p.circleModeEnabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                prefs.circleModeEnabled ? "bg-emerald-500" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  prefs.circleModeEnabled ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>

          {prefs.circleModeEnabled && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="grid gap-1.5 text-sm">
                <span className="text-xs text-muted-foreground">
                  {lang === "en" ? "Verses Per Turn" : "آیات فی ٹرن"}
                </span>
                <Select
                  value={String(prefs.circleChunkSize)}
                  onValueChange={(v) =>
                    onPrefsChange((p) => ({
                      ...p,
                      circleChunkSize: Math.max(1, parseInt(v, 10) || 5),
                    }))
                  }
                >
                  <SelectTrigger className="border-gold/40 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[98]">
                    <SelectItem value="3">3 {lang === "en" ? "verses" : "آیات"}</SelectItem>
                    <SelectItem value="5">
                      5 {lang === "en" ? "verses (Standard)" : "آیات (اسٹینڈرڈ)"}
                    </SelectItem>
                    <SelectItem value="7">7 {lang === "en" ? "verses" : "آیات"}</SelectItem>
                    <SelectItem value="10">10 {lang === "en" ? "verses" : "آیات"}</SelectItem>
                    <SelectItem value="15">15 {lang === "en" ? "verses" : "آیات"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 text-sm">
                <span className="text-xs text-muted-foreground">
                  {lang === "en" ? "View Layout Style" : "لیے آؤٹ ویو"}
                </span>
                <Select
                  value={prefs.circleViewStyle}
                  onValueChange={(v) =>
                    onPrefsChange((p) => ({
                      ...p,
                      circleViewStyle: v as "focused" | "continuous",
                    }))
                  }
                >
                  <SelectTrigger className="border-gold/40 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[98]">
                    <SelectItem value="focused">
                      {lang === "en" ? "Focused Page View" : "فوکسڈ پیج ویو"}
                    </SelectItem>
                    <SelectItem value="continuous">
                      {lang === "en" ? "Continuous Cards View" : "مسلسل کارڈز ویو"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const HANDLE_W = 96;
const HANDLE_H = 40;

export type FloatingSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function FloatingSettings({ open, onOpenChange, children }: FloatingSettingsProps) {
  const { lang } = useLang();
  const settingsLabel = lang === "en" ? "Settings" : "ترتیبات";
  const [pos, setPos] = useState(() => loadSettingsPos());
  const posRef = useRef(pos);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const persist = useCallback((p: { x: number; y: number }) => {
    posRef.current = p;
    saveSettingsPos(p);
  }, []);

  const clamp = useCallback((p: { x: number; y: number }) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: Math.max(8, Math.min(p.x, vw - HANDLE_W - 8)),
      y: Math.max(8, Math.min(p.y, vh - HANDLE_H - 8)),
    };
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  useEffect(() => {
    if (!open) return;
    // Keep the expanded panel inside the viewport.
    const panel = wrapperRef.current?.lastElementChild as HTMLElement | null;
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 8) {
        setPos((p) => {
          const next = { ...p, y: Math.max(8, p.y - (r.bottom - window.innerHeight) - 8) };
          persist(next);
          return next;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX - posRef.current.x,
      startY: e.clientY - posRef.current.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const nx = e.clientX - d.startX;
    const ny = e.clientY - d.startY;
    if (Math.abs(nx - posRef.current.x) > 3 || Math.abs(ny - posRef.current.y) > 3) {
      d.moved = true;
    }
    setPos(clamp({ x: nx, y: ny }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const wasDrag = d.moved;
    if (wasDrag) {
      persist(clamp({ x: e.clientX - d.startX, y: e.clientY - d.startY }));
    } else {
      onOpenChange(!open);
    }
    dragRef.current = null;
  };

  return (
    <>
      {/* Tap-outside overlay (only while open) */}
      {open && (
        <div className="fixed inset-0 z-[96]" onClick={() => onOpenChange(false)} aria-hidden />
      )}
      <div ref={wrapperRef} className="fixed z-[97]" style={{ left: pos.x, top: pos.y }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-gold/40 bg-card/95 backdrop-blur px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-lg cursor-grab active:cursor-grabbing select-none touch-none",
            open && "border-gold/60 text-gold",
          )}
          title="Reading settings (drag to move)"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">{settingsLabel}</span>
        </div>
        {open && (
          <div className="absolute left-0 mt-2 w-[min(92vw,22rem)] max-h-[min(70vh,540px)] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{settingsLabel}</span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-border/60 transition-colors"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
