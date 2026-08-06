import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Smartphone, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { remoteUrlForRoom, type RemoteError, type RoomMember } from "@/lib/remote-control";

const ERROR_TEXT: Record<RemoteError["kind"], string> = {
  auth: "App key was rejected — check VITE_ABLY_KEY.",
  permission: "App key isn't allowed to open this room.",
  presence: "Couldn't join the room's connection list.",
  attach: "Couldn't open the room.",
  network: "Can't reach the pairing service — check internet.",
  unknown: "Something went wrong connecting.",
};

export function RemotePanel({
  lang,
  room,
  status,
  members,
  error,
  onClose,
}: {
  lang: string;
  room: string;
  status: string;
  members: RoomMember[];
  error?: RemoteError | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => remoteUrlForRoom(room), [room]);
  const remoteCount = members.filter((m) => m.role === "remote").length;
  const isEn = lang === "en";
  const isLocalhost =
    typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Smartphone className="h-4 w-4" />
            </span>
            <span className="text-base font-bold text-white">
              {isEn ? "Phone Remote" : "فون ریموٹ"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title={isEn ? "Close" : "بند کریں"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
            error?.fatal
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : error
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : status === "connected"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : status === "not-configured"
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-400",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              error?.fatal
                ? "bg-red-400"
                : error
                  ? "bg-amber-400 animate-pulse"
                  : status === "connected"
                    ? "bg-emerald-400"
                    : "bg-amber-400 animate-pulse",
            )}
          />
          {error?.fatal
            ? isEn
              ? ERROR_TEXT[error.kind]
              : "رابطہ ناکام"
            : error
              ? isEn
                ? "Link unstable — reconnecting…"
                : "لنک غیر مستحکم — دوبارہ منسلک ہو رہا ہے…"
              : status === "connected"
                ? isEn
                  ? "Connected — ready to pair"
                  : "منسلک — جوڑنے کے لیے تیار"
                : status === "not-configured"
                  ? isEn
                    ? "Remote not configured (missing key)"
                    : "ریموٹ ترتیب نہیں ہے (کلید غائب)"
                  : isEn
                    ? "Connecting…"
                    : "منسلک ہو رہا ہے…"}
        </div>

        {isLocalhost && (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
            {isEn
              ? "This page is running locally, so the QR code won't work on your phone. Open quran-parho.vercel.app/remote on your phone and type the room code below."
              : "یہ صفحہ مقامی طور پر چل رہا ہے، اس لیے کیو آر کوڈ فون پر کام نہیں کرے گا۔ فون پر quran-parho.vercel.app/remote کھولیں اور نیچے روم کوڈ درج کریں۔"}
          </div>
        )}

        <div className="mt-5 flex justify-center">
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-zinc-300">
            <QRCode value={url} size={200} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {isEn ? "Room Code" : "روم کوڈ"}
          </div>
          <div className="font-mono text-4xl font-bold tracking-[0.3em] text-amber-300">{room}</div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-zinc-400">
          {isEn
            ? "Scan the code with your phone camera (or type the room code) to control the timers from your phone."
            : "فون کیمرے سے کوڈ اسکین کریں (یا روم کوڈ ٹائپ کریں) تاکہ ٹائمرز کو فون سے کنٹرول کرسکیں۔"}
        </p>

        <button
          onClick={copyLink}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-all cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied
            ? isEn
              ? "Link copied!"
              : "لنک کاپی ہو گیا!"
            : isEn
              ? "Copy link"
              : "لنک کاپی کریں"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Users className="h-4 w-4" />
          {remoteCount === 0
            ? isEn
              ? "No phone connected yet"
              : "ابھی کوئی فون منسلک نہیں"
            : isEn
              ? `${remoteCount} phone${remoteCount > 1 ? "s" : ""} connected`
              : `${remoteCount} فون منسلک`}
        </div>
      </div>
    </div>
  );
}
