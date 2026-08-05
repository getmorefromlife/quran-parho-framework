/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ur";

type Dict = Record<string, { en: string; ur: string }>;

export const t: Dict = {
  nav_about: { en: "About", ur: "تعارف" },
  nav_cycles: { en: "The 3 Cycles", ur: "تین مراحل" },
  nav_explorer: { en: "Surah Explorer", ur: "سورہ ایکسپلورر" },
  nav_themes: { en: "Themes", ur: "موضوعات" },
  nav_guide: { en: "Session Guide", ur: "نشست کا طریقہ" },
  nav_kit: { en: "Facilitator Kit", ur: "میزبان کا ساز و سامان" },
  nav_ai: { en: "AI Lab", ur: "اے آئی لیب" },
  nav_tools: { en: "Tools", ur: "ٹولز" },
  themes_badge: { en: "Thematic Verse Library", ur: "موضوعاتی آیات کا ذخیرہ" },
  themes_title: { en: "Quranic Verses by Theme", ur: "موضوعات کے لحاظ سے آیاتِ قرآن" },
  themes_sub: {
    en: "Curated collections across Islamic traditions — Shared, Shia, and Sunni scholarly emphasis.",
    ur: "اسلامی روایات کے مطابق مرتب مجموعے — مشترک، شیعہ اور سنی علمی زور۔",
  },
  themes_all: { en: "All Traditions", ur: "تمام روایات" },
  themes_shared: { en: "Shared Consensus", ur: "مشترک روایات" },
  themes_shia: { en: "Shia Emphasis", ur: "شیعہ مکتبِ فکر" },
  themes_sunni: { en: "Sunni Emphasis", ur: "سنی مکتبِ فکر" },
  themes_open: { en: "Open in Reader", ur: "قاری میں کھولیں" },
  themes_start_playlist: { en: "Play Theme Playlist", ur: "موضوعاتی پلے لسٹ چلائیں" },
  playlist_mode: { en: "Theme Playlist Mode", ur: "موضوعاتی پلے لسٹ موڈ" },
  hifz_suite: { en: "Hifz Memorization Suite", ur: "حفظ و تحفیظ ٹول" },
  hifz_toggle: { en: "Hifz Tools", ur: "حفظ ٹولز" },
  themes_verses: { en: "verses", ur: "آیات" },
  themes_search: { en: "Search themes...", ur: "موضوع تلاش کریں..." },
  themes_all_categories: { en: "All Categories", ur: "تمام زمرے" },
  cta_explore: { en: "Explore the Framework", ur: "فریم ورک دیکھیں" },
  cta_launch: { en: "Launch a Circle in 4 Steps", ur: "سرکل کا آغاز کریں" },
  hero_badge: {
    en: "A Replicable Neighborhood Blueprint · Founder: Maulana Syed Imon Rizvi",
    ur: "محلّہ کے لیے قابلِ تکرار خاکہ · بانی: مولانا سیّد آئمن رضوی",
  },
  hero_title: {
    en: "Reviving Quranic Comprehension in Every Neighborhood",
    ur: "ہر محلے میں فہمِ قرآن کا روشن قیام",
  },
  hero_sub: {
    en: "A practical, low-friction framework designed by Maulana Syed Imon Rizvi to transform passive recitation into active, lifelong Quranic understanding through daily & weekly community circles.",
    ur: "مولانا سیّد آئمن رضوی کا وضع کردہ ایک عملی اور آسان فریم ورک جو محض تلاوت کو تاحیات فہمِ قرآن میں تبدیل کرتا ہے۔",
  },
  philosophy_title: { en: "The Core Philosophy", ur: "بنیادی فکر" },
  philosophy_sub: {
    en: "Four principles that keep the circle alive, humble and lifelong.",
    ur: "چار اصول جو حلقہ کو جاری، سادہ اور تاحیات بناتے ہیں۔",
  },
  attribution: {
    en: "Framework designed by Maulana Syed Imon Rizvi",
    ur: "فریم ورک کے بانی: مولانا سیّد آئمن رضوی",
  },
  p1_t: { en: "Low Friction, Open Doors", ur: "آسان شرکت، کھلے دروازے" },
  p1_d: {
    en: "No rigid attendance rules. Join for 15 minutes or stay the full 2 hours.",
    ur: "کوئی سخت حاضری کی شرط نہیں۔ پندرہ منٹ ہوں یا دو گھنٹے، شریک ہوں۔",
  },
  p2_t: { en: "5-Verse Round-Robin", ur: "پانچ آیات کی باری" },
  p2_d: {
    en: "Everyone reads 5 verses of Urdu translation in turn — active participation, not passive listening.",
    ur: "ہر شریک اردو ترجمے کی پانچ آیات باری باری پڑھتا ہے — عملی شرکت، محض سماعت نہیں۔",
  },
  p3_t: { en: "The Micro-Q&A Rule", ur: "مختصر سوال و جواب" },
  p3_d: {
    en: "Short questions (<2 mins) answered on the spot. Deep queries deferred to the discussion phase.",
    ur: "دو منٹ سے کم کے سوال فوراً، گہرے سوالات مباحثے کے مرحلے کے لیے۔",
  },
  p4_t: { en: "Lifelong Cycles", ur: "تاحیات مراحل" },
  p4_d: {
    en: "A continuous journey across multiple cycles — never a one-time course.",
    ur: "متعدد مراحل پر مشتمل مسلسل سفر، نہ کہ ایک بار کا کورس۔",
  },
  cycles_title: { en: "The 3 Lifelong Cycles", ur: "تین تاحیات مراحل" },
  cycles_sub: {
    en: "A structured path from momentum, to context, to mastery.",
    ur: "روانی سے سیاق و سباق اور پھر مہارت تک منظم راستہ۔",
  },
  cycle1_t: { en: "Cycle 1 · The Foundation", ur: "مرحلہ ۱ · بنیاد" },
  cycle1_sub: { en: "Reverse Order — An-Nas to Al-Fatiha", ur: "الٹی ترتیب — الناس سے الفاتحہ تک" },
  cycle1_d: {
    en: "Start with the short surahs of the 30th Para to build momentum quickly and immediately enrich daily Salah.",
    ur: "تیسواں پارے کی مختصر سورتوں سے آغاز، جو روانی پیدا کریں اور روزمرہ نماز کو فوراً بامعنی بنائیں۔",
  },
  cycle2_t: { en: "Cycle 2 · Seerah & History", ur: "مرحلہ ۲ · سیرت و تاریخ" },
  cycle2_sub: { en: "Chronological — Tartib-e-Nuzuli", ur: "ترتیبِ نزولی" },
  cycle2_d: {
    en: "Study the Quran in the order of revelation (starting Surah Al-Alaq) mapped against the Seerah of the Prophet ﷺ.",
    ur: "قرآن کو ترتیبِ نزولی (سورۃ العلق سے) پڑھیں اور سیرتِ رسول ﷺ کے ساتھ ملا کر دیکھیں۔",
  },
  cycle3_t: { en: "Cycle 3 · Systematic Mastery", ur: "مرحلہ ۳ · منظم مہارت" },
  cycle3_sub: {
    en: "Mushaf Order — Al-Fatiha to An-Nas",
    ur: "مصحف کی ترتیب — الفاتحہ سے الناس تک",
  },
  cycle3_d: {
    en: "Comprehensive, thematic analysis from Surah 1 through Surah 114 in standard compilation order.",
    ur: "سورۃ الفاتحہ سے سورۃ الناس تک، موضوعاتی اور جامع مطالعہ۔",
  },
  benefits: { en: "Key Benefits", ur: "اہم فوائد" },
  pace: { en: "Recommended Pace", ur: "تجویز کردہ رفتار" },
  guide_title: { en: "How a Session Works", ur: "نشست کیسے چلتی ہے" },
  guide_sub: {
    en: "A guided walkthrough to run your Qurʼān Parho circle perfectly with the built-in tools.",
    ur: "بلٹ ان ٹولز کے ساتھ اپنے قرآن پڑھو حلقے کو بہترین طریقے سے چلانے کا رہنما۔",
  },
  guide_split_label: { en: "Reading / Discussion split", ur: "ترجمہ / مباحثہ تقسیم" },
  guide_model: { en: "60-min model", ur: "۶۰ منٹ کا نمونہ" },
  guide_min_read: { en: "read", ur: "ترجمہ" },
  guide_min_discuss: { en: "discuss", ur: "مباحثہ" },
  guide_s1_t: { en: "Set the Stage", ur: "تیاری کریں" },
  guide_s1_d: {
    en: "Choose your session length, add your participants, and pick which cycle you're reading in.",
    ur: "نشست کا دورانیہ چنیں، شرکاء شامل کریں، اور طے کریں کہ کس مرحلے میں پڑھنا ہے۔",
  },
  guide_s1_tip: {
    en: "Start new circles at “15+15” — low friction keeps members coming back.",
    ur: "نئی نشست ۱۵+۱۵ سے شروع کریں — آسان شرکت ممبران کو واپس لاتی ہے۔",
  },
  guide_s1_cta: { en: "Open Session Timer", ur: "نشست کا ٹائمر کھولیں" },
  guide_s2_t: { en: "Read Round-Robin · Phase 1", ur: "باری سے پڑھیں · مرحلہ ۱" },
  guide_s2_d: {
    en: "Start the timer and read 5 Urdu-translation verses per person, taking turns around the circle.",
    ur: "ٹائمر شروع کریں اور ہر شریک حلقے میں باری سے ۵ آیاتِ ترجمہ پڑھے۔",
  },
  guide_s2_tip: {
    en: "The timer beeps 5 minutes before the discussion phase — wrap up the current reader then.",
    ur: "ٹائمر مباحثے سے ۵ منٹ پہلے بیپ کرتا ہے — تب موجودہ قاری کو مکمل کریں۔",
  },
  guide_s2_cta: { en: "Open Round-Robin Tracker", ur: "باری ٹریکر کھولیں" },
  guide_s3_t: { en: "Micro-Q&A On the Spot", ur: "فوری مختصر سوال" },
  guide_s3_d: {
    en: "Answer short questions — under 2 minutes — immediately with the Q&A stopwatch. Defer anything deeper.",
    ur: "۲ منٹ سے کم کے مختصر سوال فوراً سوال کی گھڑی سے حل کریں، باقی مؤخر کریں۔",
  },
  guide_s3_tip: {
    en: "If an answer needs more than 2 minutes, log it as deferred — that's exactly what the discussion phase is for.",
    ur: "اگر جواب ۲ منٹ سے زیادہ چاہیے تو اسے مؤخر کریں — مباحثے کا مرحلہ اسی کے لیے ہے۔",
  },
  guide_s3_cta: { en: "Open Q&A Timer", ur: "سوال ٹائمر کھولیں" },
  guide_s4_t: { en: "Discuss & Reflect · Phase 2", ur: "بحث و غور · مرحلہ ۲" },
  guide_s4_d: {
    en: "The timer auto-switches to discussion. Cover deferred questions, seerah context, and reflections — then mark completed surahs.",
    ur: "ٹائمر خود بخود مباحثے میں بدل جاتا ہے۔ مؤخر سوالات، سیرت کا سیاق اور غور و فکر کریں — پھر مکمل سورتوں کو نشان زد کریں۔",
  },
  guide_s4_tip: {
    en: "Watch the phase strip turn gold to switch from reading to discussion, then mark surahs in Cycle Progress.",
    ur: "مراحل کی پٹی سنہری ہوتے ہی ترجمے سے مباحثے کی طرف جائیں، پھر مراحل کی پیش رفت میں سورتیں نشان زد کریں۔",
  },
  guide_s4_cta: { en: "Open Cycle Progress", ur: "مراحل کی پیش رفت کھولیں" },
  guide_s5_t: { en: "Wrap Up & Share", ur: "اختتام و اشتراک" },
  guide_s5_d: {
    en: "End the session, confirm the verses read, and the tool writes your WhatsApp recap for the group.",
    ur: "نشست ختم کریں، پڑھی گئی آیات کی تصدیق کریں، اور ٹول گروپ کے لیے واٹس ایپ خلاصہ تیار کرے گا۔",
  },
  guide_s5_tip: {
    en: "The recap auto-fills date, duration, verses, participants, and where to continue — just copy & paste.",
    ur: "خلاصہ خود بخود تاریخ، دورانیہ، آیات، شرکاء اور اگلی منزل بھر دیتا ہے — بس کاپی اور پیسٹ کریں۔",
  },
  guide_s5_cta: { en: "Open Session Timer", ur: "نشست کا ٹائمر کھولیں" },
  surah_title: { en: "Surah Sequence Explorer", ur: "سورتوں کی ترتیب" },
  surah_sub: {
    en: "Toggle between the three reading orders. Search, filter, and plan.",
    ur: "تین ترتیبوں میں سے کوئی چنیں۔ تلاش، فلٹر اور منصوبہ بندی۔",
  },
  reverse: { en: "Reverse", ur: "الٹی" },
  nuzul: { en: "Nuzuli", ur: "نزولی" },
  mushaf: { en: "Mushaf", ur: "مصحف" },
  search_surah: { en: "Search surah…", ur: "سورہ تلاش کریں…" },
  all: { en: "All", ur: "تمام" },
  meccan: { en: "Meccan", ur: "مکی" },
  medinan: { en: "Medinan", ur: "مدنی" },
  verses: { en: "verses", ur: "آیات" },
  read_surah: { en: "Read", ur: "پڑھیں" },
  explorer_hint: {
    en: "Tap any surah to open the full-screen reader.",
    ur: "فل سکرین ریڈر کے لیے کسی بھی سورہ پر کلک کریں۔",
  },
  kit_title: { en: "Facilitator Toolkit", ur: "میزبان کا ساز و سامان" },
  kit_sub: {
    en: "Copy-paste-ready messages and invitations for your neighborhood group.",
    ur: "محلّہ گروپ کے لیے تیار پیغامات اور دعوت نامے۔",
  },
  wa_gen: { en: "WhatsApp Log Generator", ur: "واٹس ایپ لاگ جنریٹر" },
  surah_name: { en: "Surah Name", ur: "سورہ کا نام" },
  verses_covered: { en: "Verses Covered", ur: "پڑھی گئی آیات" },
  next_date: { en: "Next Session Date", ur: "اگلی نشست کی تاریخ" },
  session_time: { en: "Time", ur: "وقت" },
  generate: { en: "Generate Message", ur: "پیغام تیار کریں" },
  copy_en: { en: "Copy English", ur: "انگریزی کاپی کریں" },
  copy_ur: { en: "Copy Urdu", ur: "اردو کاپی کریں" },
  copied: { en: "Copied!", ur: "کاپی ہو گیا!" },
  first_session: { en: "First Session Invitation", ur: "پہلی نشست کی دعوت" },
  add_surah: { en: "+ Add Surah", ur: "+ سورہ شامل کریں" },
  from_verse: { en: "From", ur: "سے" },
  to_verse: { en: "To", ur: "تک" },
  remove_surah: { en: "Remove", ur: "ہٹائیں" },
  surahs_covered: { en: "Surahs Covered", ur: "پڑھی گئی سورتیں" },
  invite_title: { en: "Invitation Cards", ur: "دعوت کارڈ" },
  ai_title: { en: "AI Knowledge Lab", ur: "اے آئی نالج لیب" },
  ai_sub: {
    en: "Turn weekly readings into shareable knowledge with NotebookLM, ChatGPT and Canva.",
    ur: "ہفتہ وار مطالعے کو نوٹ بک ایل ایم، چیٹ جی پی ٹی اور کینوا سے شیئر ایبل علم بنائیں۔",
  },
  ai1_t: { en: "Visual Mind-Maps", ur: "بصری خاکے" },
  ai1_d: {
    en: "Convert a surah's themes into a single, scannable infographic.",
    ur: "سورہ کے موضوعات کو ایک نظر آنے والے انفوگرافک میں بدلیں۔",
  },
  ai2_t: { en: "Ethical Checklists", ur: "اخلاقی فہرست" },
  ai2_d: {
    en: "Distill verses into bulleted, actionable weekly reminders.",
    ur: "آیات کو عملی ہفتہ وار یاد دہانیوں میں تقسیم کریں۔",
  },
  ai3_t: { en: "Story Flashcards", ur: "اسٹوری فلیش کارڈ" },
  ai3_d: {
    en: "Design shareable WhatsApp stories that spread the tafseer forward.",
    ur: "قابلِ اشتراک واٹس ایپ اسٹوریز جو تفسیر کو آگے پھیلائیں۔",
  },
  ai1_p: {
    en: "Create a visual mind-map of Surah [name]. The full ayat text is in my source. List the surah's main themes, group the ayats under each theme with their verse numbers, and end with a one-line takeaway for a neighborhood Qur'an study circle. Output as a clean, scannable outline I can turn into an infographic.",
    ur: "سورہ [نام] کا ایک بصری خاکہ بنائیں۔ مکمل آیات میری سورس میں موجود ہیں۔ سورہ کے اہم موضوعات درج کریں، ہر موضوع کے تحت آیات کو ان کے نمبر کے ساتھ تقسیم کریں، اور آخر میں محلّے کے قرآن حلقے کے لیے ایک سطر کا خلاصہ دیں۔",
  },
  ai2_p: {
    en: "Here is the ayat [reference]. Based on this verse, write 5 practical, actionable weekly reminders for a neighborhood Qur'an study circle. Keep each bullet to one line, in simple language, focused on daily Islamic practice.",
    ur: "یہ ہے آیت [حوالہ]۔ اس آیت کی بنیاد پر محلّے کے قرآن حلقے کے لیے ۵ عملی ہفتہ وار یاد دہانیاں لکھیں۔ ہر نقطہ ایک سطر میں، سادہ زبان میں، روزمرہ کے اسلامی عمل پر مرکوز ہو۔",
  },
  ai3_p: {
    en: "Design 3 vertical 9:16 WhatsApp story flash-card frames with the title 'Ayat Ki Roshni' on an emerald and gold gradient with a quiet mosque silhouette. Frame 1 = the verse in Arabic, Frame 2 = the Urdu translation, Frame 3 = a one-line reflection question. Elegant, clean, not cluttered.",
    ur: "واٹس ایپ اسٹوری کے لیے ۳ عمودی ۹:۱۶ فلیش کارڈ فریم بنائیں، عنوان 'آیات کی روشنی'، سبز اور سنہری گریڈیئنٹ پر مسجد کا سادہ سلیویٹ۔ فریم ۱ = آیت عربی میں، فریم ۲ = اردو ترجمہ، فریم ۳ = ایک سطر کا غور و فکر کا سوال۔ خوبصورت، صاف اور کم بھرا ہوا۔",
  },
  ai_copy: { en: "Copy prompt", ur: "پرامپٹ کاپی کریں" },
  ai_copied: { en: "Copied", ur: "کاپی ہو گیا" },
  footer_share: {
    en: "Spread the Light — Share this Blueprint",
    ur: "روشنی پھیلائیں — یہ خاکہ شیئر کریں",
  },
  footer_pdf: { en: "Download PDF Blueprint", ur: "پی ڈی ایف خاکہ ڈاؤن لوڈ" },
  footer_attribution: {
    en: "Framework Designed by Maulana Syed Imon Rizvi",
    ur: "فریم ورک کے بانی: مولانا سیّد آئمن رضوی",
  },
  share_msg: {
    en: "Qurʼān Parho Framework — Neighborhood Qurʼān Circle Blueprint — check it out:",
    ur: "قرآن پڑھو فریم ورک — محلّہ قرآن حلقہ خاکہ — ملاحظہ کریں:",
  },
  copy_link: { en: "Copy link", ur: "لنک کاپی کریں" },
  link_copied: { en: "Link copied", ur: "لنک کاپی ہو گیا" },
  social_wa: { en: "Share on WhatsApp", ur: "واٹس ایپ پر شیئر کریں" },
  social_tg: { en: "Share on Telegram", ur: "ٹیلی گرام پر شیئر کریں" },
  social_x: { en: "Share on X", ur: "ایکس پر شیئر کریں" },
  history_title: { en: "Session History", ur: "نشستوں کی تاریخ" },
  history_empty: {
    en: "No sessions recorded yet. Run a session in the Session Timer tool and it will be saved here automatically.",
    ur: "ابھی کوئی نشست درج نہیں۔ نشست ٹائمر ٹول میں نشست چلائیں، یہ خود محفوظ ہو جائے گی۔",
  },
  history_sessions: { en: "Sessions", ur: "نشستیں" },
  history_verses: { en: "Verses read", ur: "پڑھی گئی آیات" },
  history_minutes: { en: "Minutes", ur: "منٹ" },
  history_saved: { en: "Saved to history", ur: "تاریخ میں محفوظ" },
  backup_title: { en: "Backup & Restore", ur: "بیک اپ اور بحالی" },
  backup_sub: {
    en: "Download your data as JSON, or restore it from another device.",
    ur: "اپنا ڈیٹا JSON کی شکل میں ڈاؤن لوڈ کریں یا کسی اور ڈیوائس سے بحال کریں۔",
  },
  export_data: { en: "Export JSON", ur: "برآمد کریں" },
  import_data: { en: "Import JSON", ur: "درآمد کریں" },
  clear_data: { en: "Clear all data", ur: "تمام ڈیٹا صاف کریں" },
  import_ok: { en: "Data restored successfully.", ur: "ڈیٹا بحال ہو گیا۔" },
  import_err: {
    en: "Invalid file. Please choose a valid Qurʼān Parho JSON export.",
    ur: "ناقص فائل۔ درست برآمد شدہ فائل منتخب کریں۔",
  },
  clear_confirm_title: { en: "Clear all data?", ur: "تمام ڈیٹا صاف کریں؟" },
  clear_confirm_body: {
    en: "This permanently deletes your roster, cycle progress, and session history from this browser.",
    ur: "یہ اس براؤزر سے فہرست، پیش رفت اور نشستوں کی تاریخ مستقل طور پر حذف کر دے گا۔",
  },
  cancel: { en: "Cancel", ur: "منسوخ" },
  confirm_delete: { en: "Delete", ur: "حذف کریں" },
  nav_share: { en: "Share a Surah", ur: "سورہ شیئر کریں" },
  share_badge: { en: "Quran Sharing", ur: "قرآنی شیئرنگ" },
  share_title: { en: "Share a Surah with Anyone", ur: "کسی کے ساتھ سورہ شیئر کریں" },
  share_sub: {
    en: "Pick a surah, choose your languages and verses, then share beautifully formatted text on WhatsApp or copy it anywhere.",
    ur: "سورہ منتخب کریں، زبانیں اور آیات چنیں، اور خوبصورت متن واٹس ایپ پر شیئر کریں یا کہیں بھی کاپی کریں۔",
  },
  open_reader: { en: "Open Fullscreen Reader", ur: "فل سکرین ریڈر کھولیں" },
  reader_settings: { en: "Reading Settings", ur: "مطالعہ کی ترتیبات" },
  font_size: { en: "Font Size", ur: "فونٹ سائز" },
  line_spacing: { en: "Line Spacing", ur: "سطر کی دوری" },
  arabic_font: { en: "Arabic Font", ur: "عربی فونٹ" },
  urdu_font: { en: "Urdu Font", ur: "اردو فونٹ" },
  english_font: { en: "English Font", ur: "انگریزی فونٹ" },
  previous_surah: { en: "Previous Surah", ur: "پچھلا سورہ" },
  next_surah: { en: "Next Surah", ur: "اگلا سورہ" },
  close_reader: { en: "Close", ur: "بند کریں" },
  continue_reading: { en: "Continue reading", ur: "مزید پڑھیں" },
  play: { en: "Play", ur: "چلائیں" },
  pause: { en: "Pause", ur: "روکیں" },
  play_surah: { en: "Play Surah", ur: "سورہ چلائیں" },
  pause_surah: { en: "Pause Surah", ur: "سورہ روکیں" },
  reciter_label: { en: "Reciter", ur: "قاری" },
  audio_error: { en: "Could not load audio", ur: "آڈیو لوڈ نہیں ہو سکا" },
  nav_howto: { en: "How to Use", ur: "استعمال کا طریقہ" },
  howto_title: { en: "How to Use the Reader", ur: "ریڈر کا استعمال کیسے کریں" },
  howto_sub: {
    en: "A quick visual guide to reading, searching, highlighting, and sharing the Qurʼān.",
    ur: "قرآن پڑھنے، تلاش کرنے، نشان لگانے اور شیئر کرنے کا مختصر بصری رہنما۔",
  },
  howto_s1_t: { en: "Open the Reader", ur: "ریڈر کھولیں" },
  howto_s1_d: {
    en: "Tap any surah in the Surah Explorer grid. The full-screen reader opens with Arabic text and your selected translations.",
    ur: "سورہ ایکسپلورر میں کسی بھی سورہ پر ٹیپ کریں۔ فل سکرین ریڈر عربی متن اور آپ کے منتخب ترجموں کے ساتھ کھلے گا۔",
  },
  howto_s2_t: { en: "Read & Listen", ur: "پڑھیں اور سنیں" },
  howto_s2_d: {
    en: "Each verse shows Arabic, then your chosen translations. Tap the play button on any verse to hear the recitation — verses auto-advance one after another.",
    ur: "ہر آیت میں پہلے عربی، پھر آپ کے منتخب ترجمے ہیں۔ کسی بھی آیت پر پلے بٹن دبائیں — آیات خود بخود ایک کے بعد دوسری چلتی ہیں۔",
  },
  howto_s3_t: { en: "Search Verses", ur: "آیات تلاش کریں" },
  howto_s3_d: {
    en: 'Tap the search icon in the top bar. Search within the current surah or switch to "All surahs" to search the entire Qurʼān across all your enabled translations.',
    ur: 'اوپر والی بار میں تلاش کے آئکن پر ٹیپ کریں۔ موجودہ سورہ میں تلاش کریں یا "تمام سورتیں" پر سوئچ کریں۔',
  },
  howto_s4_t: { en: "Highlight & Take Notes", ur: "نشان لگائیں اور نوٹ لکھیں" },
  howto_s4_d: {
    en: "Tap any verse to select it — a toolbar slides up with 5 highlight colors, a note button, and a share button. Your highlights and notes save automatically.",
    ur: "کسی بھی آیت پر ٹیپ کریں — ۵ رنگ، نوٹ بٹن اور شیئر بٹن کا ٹول بار نمودار ہوتا ہے۔ آپ کے نشان اور نوٹ خود بخود محفوظ ہوتے ہیں۔",
  },
  howto_s5_t: { en: "Share Anywhere", ur: "کہیں بھی شیئر کریں" },
  howto_s5_d: {
    en: "From the toolbar or search results, tap copy or WhatsApp. Choose exactly what to include — Arabic, translations, reference, or your note — then send it to your circle group.",
    ur: "ٹول بار یا تلاش کے نتائج سے، کاپی یا واٹس ایپ پر ٹیپ کریں۔ شیئر کریں — عربی، ترجمے، حوالہ یا آپ کا نوٹ — پھر اپنے گروپ کو بھیجیں।",
  },
  howto_settings: { en: "Customize your reading experience", ur: "اپنی مطالعہ تجربے کو تخصیص دیں" },
  howto_settings_d: {
    en: "Tap ⋮ in the top bar → Settings to choose from 40+ translations in 4 languages (English, Urdu, Persian, German), adjust fonts, font sizes, line spacing, and pick your reciter.",
    ur: "اوپر بار میں ⋮ → ترتیبات پر ٹیپ کریں — ۴ زبانوں میں ۴۰+ ترجمے چنیں، فونٹ، سائز، سطر کی دوری اور قاری منتخب کریں۔",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (k: keyof typeof t) => string };
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("qp_lang");
      if (stored === "en" || stored === "ur") setLang(stored);
    } catch {
      // localStorage may be unavailable (SSR/privacy mode)
    }
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang === "ur" ? "ur" : "en";
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    try {
      localStorage.setItem("qp_lang", lang);
    } catch {
      // localStorage may be unavailable (SSR/privacy mode)
    }
  }, [lang]);
  const tr = (k: keyof typeof t) => t[k]?.[lang] ?? String(k);
  return <LangContext.Provider value={{ lang, setLang, tr }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}
