import { useState, type FormEvent } from "react";
import { Mail, Copy, Check, Users, HeartHandshake, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Official contact & feedback email address
export const CONTACT_EMAIL = "getmorefromlife@gmail.com";

export function Contact() {
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [length, setLength] = useState<"1h" | "2h">("1h");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [contactMethod, setContactMethod] = useState<"email" | "copy">("email");

  const buildSummary = () => {
    const lines = [
      lang === "en"
        ? "Salam, I would like to launch / join a Qur'an Parho neighborhood circle."
        : "السلام علیکم، میں قرآن پڑھو محلہ حلقے میں شامل ہونا / شروع کرنا چاہتا ہوں۔",
      lang === "en" ? `Name: ${name || "N/A"}` : `نام: ${name || "N/A"}`,
      lang === "en" ? `City / Neighborhood: ${city || "N/A"}` : `شہر / محلہ: ${city || "N/A"}`,
      lang === "en"
        ? `Preferred session: ${length === "1h" ? "1 hour" : "2 hours"}`
        : `تجویز کردہ نشست: ${length === "1h" ? "۱ گھنٹہ" : "۲ گھنٹے"}`,
    ];
    if (note.trim()) {
      lines.push(lang === "en" ? `Note: ${note.trim()}` : `نوٹ: ${note.trim()}`);
    }
    return lines.join("\n");
  };

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      lang === "en" ? `Qur'an Parho Circle Request - ${name}` : `قرآن پڑھو حلقہ درخواست - ${name}`,
    );
    const body = encodeURIComponent(buildSummary());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleShareCircleNews = () => {
    const subject = encodeURIComponent(
      lang === "en" ? "Qur'an Circle Update & Feedback" : "قرآن پڑھو حلقہ اپ ڈیٹ اور فیڈ بیک",
    );
    const body = encodeURIComponent(
      lang === "en"
        ? "Salam! I have launched / am running a local Qur'an study circle in my area.\n\nCircle Location / City:\nSession Schedule:\nMember Count:\n\nOur Experience / Questions / Feedback:\n"
        : "السلام علیکم! میں نے اپنے علاقے میں قرآن پڑھو کا حلقہ شروع کیا ہے۔\n\nحلقے کا شہر/محلہ:\nنشست کا دورانیہ:\nشرکاء کی تعداد:\n\nہمارا تجربہ / فیڈ بیک / سوالات:\n",
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleCopy = () => {
    const text = buildSummary();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="contact" className="py-20 lg:py-28 border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40">
            <Users className="h-3 w-3" /> {lang === "en" ? "Start a Circle" : "حلقہ شروع کریں"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
            {lang === "en"
              ? "Bring Qurʼān Parho to Your Neighborhood"
              : "اپنے محلے میں قرآن پڑھو کا آغاز کریں"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {lang === "en"
              ? "Fill in your details below to send a registration request via Email, or copy your registration details."
              : "اپنی تفصیلات درج کریں اور ای میل یا نجی پیغام کے ذریعے اپنے محلے کے حلقے کی درخواست بھیجیں۔"}
          </p>
        </div>

        {/* Heartwarming Community News & Feedback Callout Card */}
        <div className="rounded-3xl border border-gold/40 bg-gold/5 p-6 sm:p-8 space-y-4 text-center sm:text-left relative overflow-hidden shadow-gold">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold border border-gold/40">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-sm font-bold text-gold flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="h-4 w-4" />
                {lang === "en"
                  ? "Started a Circle? Share Your Good News!"
                  : "حلقہ شروع کر دیا؟ خوشخبری شیئر کریں!"}
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {lang === "en"
                  ? "If you have launched a local Qur'an circle in your neighborhood or community, we would love to hear from you! Email us your progress, advice, feedback, or any challenges so we can connect, support you, and celebrate your success."
                  : "اگر آپ نے اپنے محلے میں قرآن پڑھو کا حلقہ کامیابی سے شروع کیا ہے، تو ہمیں لازمی مطلع کریں! اپنی پیشرفت، فیڈ بیک، سوالات یا تجربات ہمارے ساتھ ای میل پر شیئر کریں۔"}
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={handleShareCircleNews}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/50 bg-gold/15 text-gold text-xs font-semibold hover:bg-gold/25 transition-all shadow-sm"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>
                {lang === "en"
                  ? "Share Circle News & Feedback"
                  : "حلقے کی پیشرفت اور فیڈ بیک ای میل کریں"}
              </span>
            </button>
          </div>
        </div>

        {/* Contact & Registration Form Card */}
        <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8 space-y-6">
          {/* Method Tabs */}
          <div className="flex flex-wrap gap-2 justify-center border-b border-border pb-4">
            <button
              type="button"
              onClick={() => setContactMethod("email")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5",
                contactMethod === "email"
                  ? "bg-gold/10 text-gold border-gold/40 shadow-gold"
                  : "border-border text-muted-foreground hover:border-gold/30",
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              {lang === "en" ? "Send via Email" : "ای میل کے ذریعے"}
            </button>

            <button
              type="button"
              onClick={() => setContactMethod("copy")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5",
                contactMethod === "copy"
                  ? "bg-gold/10 text-gold border-gold/40 shadow-gold"
                  : "border-border text-muted-foreground hover:border-gold/30",
              )}
            >
              <Copy className="h-3.5 w-3.5" />
              {lang === "en" ? "Copy Request Card" : "درخواست کاپی کریں"}
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  {lang === "en" ? "Your Name" : "آپ کا نام"}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={lang === "en" ? "e.g. Ahmed Khan" : "مثلاً احمد خان"}
                  className="border-gold/40 h-10 text-base"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  {lang === "en" ? "City / Neighborhood" : "شہر / محلہ"}
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder={lang === "en" ? "e.g. Gulberg, Lahore" : "مثلاً گلبرگ، لاہور"}
                  className="border-gold/40 h-10 text-base"
                />
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                {lang === "en" ? "Preferred Session Length" : "تجویز کردہ نشست کا دورانیہ"}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {(
                  [
                    { key: "1h", label: lang === "en" ? "1 hour (15+15)" : "۱ گھنٹہ (۱۵+۱۵)" },
                    { key: "2h", label: lang === "en" ? "2 hours (40+40)" : "۲ گھنٹے (۴۰+۴۰)" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setLength(o.key)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-semibold border transition-all",
                      length === o.key
                        ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                        : "bg-background border-border text-muted-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
                {lang === "en" ? "Anything Else? (optional)" : "کچھ اور؟ (اختیاری)"}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                dir="auto"
                placeholder={lang === "en" ? "Your question or message…" : "آپ کا سوال یا پیغام…"}
                className="w-full p-3 rounded-xl bg-background border border-border text-sm leading-relaxed resize-none focus:border-gold/60 outline-none"
              />
            </div>

            {/* Dynamic Action Button based on chosen contact method */}
            {contactMethod === "email" && (
              <Button
                type="submit"
                className="mt-4 w-full bg-emerald-gradient text-gold border border-gold/40 h-12 text-base font-semibold"
              >
                <Mail className="h-4 w-4 mr-2" />
                {lang === "en"
                  ? `Send Request via Email (${CONTACT_EMAIL})`
                  : `ای میل پر درخواست بھیجیں (${CONTACT_EMAIL})`}
              </Button>
            )}

            {contactMethod === "copy" && (
              <Button
                type="button"
                onClick={handleCopy}
                className="mt-4 w-full bg-gold/10 text-gold border border-gold/40 hover:bg-gold/20 h-12 text-base font-semibold"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied
                  ? lang === "en"
                    ? "Copied to Clipboard!"
                    : "کلپ بورڈ پر کاپی ہو گیا!"
                  : lang === "en"
                    ? "Copy Registration Details"
                    : "درخواست کی تفصیلات کاپی کریں"}
              </Button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
