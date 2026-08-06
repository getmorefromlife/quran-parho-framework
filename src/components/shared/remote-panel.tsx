import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Smartphone, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { remoteUrlForRoom, type RoomMember } from "@/lib/remote-control";

export function RemotePanel({
  lang,
  room,
  status,
  members,
  onClose,
}: {
  lang: string;
  room: string;
  status: string;
  members: RoomMember[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => remoteUrlForRoom(room), [room]);
  const remoteCount = members.filter((m) => m.role === "remote").length;
  const isEn = lang === "en";

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
            status === "connected"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/50 bg-amber-500/10 text-amber-400",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "connected" ? "bg-emerald-400" : "bg-amber-400 animate-pulse",
            )}
          />
          {status === "connected"
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

        <div className="mt-5 flex justify-center">
          <QRCode
            value={url}
            size={180}
            bgColor="transparent"
            fgColor="#fafafa"
            style={{ padding: 12, background: "#fff", borderRadius: 16 }}
          />
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
