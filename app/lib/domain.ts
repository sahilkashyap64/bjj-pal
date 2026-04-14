export const belts = ["White", "Blue", "Purple", "Brown", "Black"] as const;
export type Belt = (typeof belts)[number];

export const stripeOptionsForBelt = (belt: Belt): number[] => {
  if (belt === "Black") return [0];
  return [0, 1, 2, 3, 4];
};

export const challenges = [
  "Can't remember techniques",
  "Feel like I'm not progressing",
  "Training feels scattered",
  "Getting beat by the same people",
  "Not sure what my gameplan should be",
];

export type TechniqueCategoryKey =
  | "All"
  | "Submission"
  | "Sweep"
  | "Takedown"
  | "Guard Pass"
  | "Guard"
  | "Control"
  | "Escape"
  | "Defense";

export const techniqueCategories: Array<{ key: TechniqueCategoryKey; label: string; dot: string }> = [
  { key: "All", label: "All", dot: "bg-zinc-400" },
  { key: "Submission", label: "Submission", dot: "bg-red-500" },
  { key: "Sweep", label: "Sweep", dot: "bg-orange-500" },
  { key: "Takedown", label: "Takedown", dot: "bg-sky-500" },
  { key: "Guard Pass", label: "Guard Pass", dot: "bg-blue-500" },
  { key: "Guard", label: "Guard", dot: "bg-green-500" },
  { key: "Control", label: "Control", dot: "bg-pink-500" },
  { key: "Escape", label: "Escape", dot: "bg-emerald-500" },
  { key: "Defense", label: "Defense", dot: "bg-violet-500" },
];

export type TechniqueLink = {
  id: string;
  title: string;
  url: string;
};

export type Technique = {
  id: string;
  title: string;
  category: Exclude<TechniqueCategoryKey, "All">;
  dateIso: string;
  tags: string[];
  notes: string;
  links: TechniqueLink[];
  linkedTechniqueIds: string[];
  favorite: boolean;
};

export type TechniqueDraft = Technique & { isNew?: boolean };

export type ImportCandidate = Technique & { selected: boolean };

export type SessionType = "Gi" | "No-Gi" | "Open Mat" | "Wrestling" | "Competition" | "Other";

export type SessionFilters = {
  search: string;
  startDate: string;
  endDate: string;
  location: string;
  submission: string;
  sessionTypes: SessionType[];
  minSatisfaction: number;
};

export type SessionVisibility = "Everyone" | "Friends" | "Private";

export type SessionSubmissionEntry = {
  name: string;
  count: number;
};

export type Session = {
  id: string;
  date: string;
  time: string;
  location: string;
  type: SessionType | "";
  submissionEntries: SessionSubmissionEntry[];
  techniqueIds: string[];
  durationMinutes: number;
  notes: string;
  voiceNoteId?: string | null;
  voiceNoteTranscript?: string | null;
  voiceNoteTranscriptRomanized?: string | null;
  satisfaction: number;
  tagFriends: string;
  visibility: SessionVisibility;
  caption: string;
};

export type SessionDraft = Session;

export const createDefaultTechnique = (): Technique => ({
  id: "triangle-choke",
  title: "Triangle Choke",
  category: "Submission",
  dateIso: new Date().toISOString(),
  tags: ["Beginner", "Closed Guard"],
  notes:
    "A fundamental submission from closed guard. Control opponent's posture, isolate one arm, throw leg over shoulder, and squeeze with your legs while pulling down on the head.",
  links: [
    {
      id: "link-1",
      title: "How to do the Triangle in Jiu Jitsu | Everything You Need to Know!",
      url: "https://www.youtube.com/watch?v=20j7LcZ5xRY",
    },
  ],
  linkedTechniqueIds: [],
  favorite: false,
});

export const IMPORT_EXAMPLE_TEXT = `• Triangle Choke - Setup from closed guard, control arm and head, squeeze knees together
• Armbar from Mount - Isolate the arm, pivot hips over, step over head for finishing angle
• Kimura - Americana grip, control wrist and elbow, step over for leverage
• Hip Escape - Fundamental side control escape, create frames, shrimp movement
• Scissor Sweep - Timing is crucial, off-balance opponent, use leg as fulcrum
• Double Leg Takedown - Level change, penetration step, drive through opponent
• Knee Slice Pass - Pressure and angle, control far hip, slice through guard`;

export const IMPORT_PROMPT_TEXT = `Using this exact format where every technique starts with a bullet point and is followed by a dash and notes:

• Triangle Choke - Setup from closed guard, control arm and head, squeeze knees together
• Armbar from Mount - Isolate the arm, pivot hips over, step over head for finishing angle
• Kimura - Americana grip, control wrist and elbow, step over for leverage
• Hip Escape - Fundamental side control escape, create frames, shrimp movement
• Scissor Sweep - Timing is crucial, off-balance opponent, use leg as fulcrum
• Double Leg Takedown - Level change, penetration step, drive through opponent
• Knee Slice Pass - Pressure and angle, control far hip, slice through guard

Convert the following BJJ notes to this format. Each line should be: • [Technique Name] - [Notes/Description]

Paste your notes here:`;

export const submissionLibrary = [
  "Anaconda Choke",
  "Arm Triangle",
  "Bow and Arrow Choke",
  "Armbar",
  "Americana",
  "Baseball Choke",
  "Buggy Choke",
  "Choi Bar",
  "Darce Choke",
  "Ezekiel Choke",
  "Guillotine",
  "Heel Hook",
  "Kimura",
  "Kneebar",
  "Omoplata",
  "Rear Naked Choke",
  "Straight Ankle Lock",
  "Triangle Choke",
  "Wrist Lock",
] as const;

export const cryptoSafeId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export const dedupeStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export const devanagariIndependentVowels: Record<string, string> = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ee",
  "उ": "u",
  "ऊ": "oo",
  "ऋ": "ri",
  "ॠ": "ree",
  "ऌ": "li",
  "ॡ": "lee",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
  "ऑ": "o",
  "ऍ": "e",
};

export const devanagariMatras: Record<string, string> = {
  "ा": "aa",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "ृ": "ri",
  "ॄ": "ree",
  "ॢ": "li",
  "ॣ": "lee",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "ॅ": "e",
  "ॉ": "o",
};

export const devanagariConsonants: Record<string, string> = {
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "ng",
  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "ny",
  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",
  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",
  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",
  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "v",
  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",
  "क़": "q",
  "ख़": "kh",
  "ग़": "gh",
  "ज़": "z",
  "ड़": "r",
  "ढ़": "rh",
  "फ़": "f",
  "ळ": "l",
};

export const devanagariSigns: Record<string, string> = {
  "ं": "n",
  "ँ": "n",
  "ः": "h",
  "ऽ": "'",
  "ॐ": "om",
};

export const devanagariDigits: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

export const DEVANAGARI_VIRAMA = "्";

export const containsDevanagari = (text: string) => /[\u0900-\u097F]/.test(text);

export const romanizeHindiTranscript = (text: string) => {
  if (!text.trim() || !containsDevanagari(text)) return null;

  let result = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] ?? "";

    if (devanagariIndependentVowels[char]) {
      result += devanagariIndependentVowels[char];
      continue;
    }

    if (devanagariConsonants[char]) {
      const base = devanagariConsonants[char];
      if (devanagariMatras[next]) {
        result += `${base}${devanagariMatras[next]}`;
        index += 1;
        continue;
      }
      if (next === DEVANAGARI_VIRAMA) {
        result += base;
        index += 1;
        continue;
      }
      result += `${base}a`;
      continue;
    }

    if (devanagariSigns[char]) {
      result += devanagariSigns[char];
      continue;
    }

    if (devanagariDigits[char]) {
      result += devanagariDigits[char];
      continue;
    }

    if (char === DEVANAGARI_VIRAMA) {
      continue;
    }

    result += char;
  }

  const normalized = result
    .replace(/\s+/g, " ")
    .replace(/\bae/g, "e")
    .replace(/a([.,!?;:)\]])/g, "$1")
    .trim();

  return normalized && normalized !== text.trim() ? normalized : null;
};

export function parseTechniqueImport(text: string): Technique[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const techniques: Technique[] = [];
  const seenTitles = new Set<string>();
  const nowIso = new Date().toISOString();

  for (const line of lines) {
    const normalized = line
      .replace(/^[•*-]\s*/, "")
      .replace(/^\u2022\s*/, "")
      .trim();
    if (!normalized) continue;

    const dashIndex = normalized.indexOf(" - ");
    const title = (dashIndex >= 0 ? normalized.slice(0, dashIndex) : normalized).trim();
    const notes = (dashIndex >= 0 ? normalized.slice(dashIndex + 3) : "").trim();
    if (!title) continue;

    const titleKey = title.toLowerCase();
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);

    techniques.push({
      id: `tech-${cryptoSafeId()}`,
      title,
      category: "Submission",
      dateIso: nowIso,
      tags: [],
      notes,
      links: [],
      linkedTechniqueIds: [],
      favorite: false,
    });
  }

  return techniques;
}

export const formatDateTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatLongDateTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatShortTime = (time: string) => {
  const date = new Date(`1970-01-01T${time}:00`);
  if (Number.isNaN(date.getTime())) return time;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
};

export const formatSessionCardDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatCompactDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours <= 0) return `${remaining}m`;
  if (remaining <= 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
};

export const toExternalUrl = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+._-]*:/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

export const sessionTypePillClass = (type: SessionType) => {
  if (type === "Gi") return "bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/30";
  if (type === "No-Gi") return "bg-red-600/20 text-red-200 ring-1 ring-red-500/30";
  if (type === "Open Mat") return "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30";
  if (type === "Wrestling") return "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30";
  if (type === "Competition") return "bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30";
  return "bg-white/10 text-zinc-200 ring-1 ring-white/15";
};

export function categoryDotClass(category: Exclude<TechniqueCategoryKey, "All">) {
  return (
    techniqueCategories.find((entry) => entry.key === category)?.dot ??
    "bg-zinc-400"
  );
}

export function categoryPillClass(category: Exclude<TechniqueCategoryKey, "All">) {
  if (category === "Submission") return "bg-red-500 text-white";
  if (category === "Sweep") return "bg-orange-500 text-white";
  if (category === "Takedown") return "bg-violet-500 text-white";
  if (category === "Guard Pass") return "bg-blue-500 text-white";
  if (category === "Guard") return "bg-green-600 text-white";
  if (category === "Control") return "bg-pink-500 text-white";
  if (category === "Escape") return "bg-emerald-500 text-white";
  if (category === "Defense") return "bg-indigo-500 text-white";
  return "bg-zinc-600 text-white";
}
