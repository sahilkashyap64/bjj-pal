"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createBackup,
  loadSessions,
  loadTechniques,
  loadProfile,
  loadTourDone,
  migrateLocalStorageToLocalForageIfNeeded,
  restoreBackup,
  saveSessions,
  saveTechniques,
  upsertProfile,
  saveTourDone,
} from "./lib/storage";

const belts = ["White", "Blue", "Purple", "Brown", "Black"] as const;
type Belt = (typeof belts)[number];

const stripeOptionsForBelt = (belt: Belt): number[] => {
  if (belt === "Black") return [0];
  return [0, 1, 2, 3, 4];
};

const challenges = [
  "Can't remember techniques",
  "Feel like I'm not progressing",
  "Training feels scattered",
  "Getting beat by the same people",
  "Not sure what my gameplan should be",
];

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [belt, setBelt] = useState<Belt>("White");
  const [stripes, setStripes] = useState(0);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [screen, setScreen] = useState<"onboarding" | "ready" | "main">("onboarding");

  useEffect(() => {
    let cancelled = false;

    const isBelt = (value: unknown): value is Belt => typeof value === "string" && belts.includes(value as Belt);

    (async () => {
      try {
        await migrateLocalStorageToLocalForageIfNeeded();
        const profile = await loadProfile();
        if (cancelled || !profile) return;

        setName(profile.name);
        if (isBelt(profile.belt)) {
          setBelt(profile.belt);
          const allowed = stripeOptionsForBelt(profile.belt);
          const nextStripes = typeof profile.stripes === "number" ? Math.max(0, Math.floor(profile.stripes)) : 0;
          setStripes(allowed.includes(nextStripes) ? nextStripes : allowed[0]);
        } else if (typeof profile.stripes === "number") {
          const allowed = stripeOptionsForBelt("White");
          const nextStripes = Math.max(0, Math.floor(profile.stripes));
          setStripes(allowed.includes(nextStripes) ? nextStripes : allowed[0]);
        }

        if (Array.isArray(profile.selectedChallenges)) {
          setSelectedChallenges(profile.selectedChallenges);
        }

        if (profile.onboardingDone) {
          setScreen("main");
        }
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const completedSteps = useMemo(() => {
    return [name.trim().length > 0, selectedChallenges.length > 0, stripeOptionsForBelt(belt).includes(stripes)];
  }, [belt, name, selectedChallenges.length, stripes]);

  const canContinue = completedSteps[step] ?? false;

  const toggleChallenge = (challenge: string) => {
    setSelectedChallenges((current) =>
      current.includes(challenge)
        ? current.filter((item) => item !== challenge)
        : [...current, challenge],
    );
  };

  const goNext = () => {
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }

    setScreen("ready");
  };

  const goBack = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const setBeltSafely = (nextBelt: Belt) => {
    setBelt(nextBelt);
    const allowedStripes = stripeOptionsForBelt(nextBelt);
    if (!allowedStripes.includes(stripes)) {
      setStripes(allowedStripes[0]);
    }
  };

  const persistProfile = (onboardingDone: boolean) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    upsertProfile({
      name: trimmedName,
      belt,
      stripes,
      selectedChallenges,
      onboardingDone,
    }).catch(() => {});
  };

  if (!booted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-5 py-7 sm:px-8">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (screen === "main") {
    return <MainScreen name={name} />;
  }

  if (screen === "ready") {
    return (
      <ReadyScreen
        name={name}
        belt={belt}
        stripes={stripes}
        onContinue={() => {
          persistProfile(true);
          setScreen("main");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-white/10 text-xl text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
            onClick={goBack}
            disabled={step === 0}
            aria-label="Back"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  dot === step ? "w-9 bg-blue-500" : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <div className="w-11" />
        </div>

        <main className="mt-12 flex flex-1 flex-col justify-between gap-10 pb-2">
          <section className="space-y-8">
            {step === 0 ? (
              <NameStep name={name} onChange={setName} />
            ) : null}
            {step === 1 ? (
              <ChallengeStep selected={selectedChallenges} onToggle={toggleChallenge} />
            ) : null}
            {step === 2 ? (
              <RankStep
                name={name}
                belt={belt}
                stripes={stripes}
                onBeltChange={setBeltSafely}
                onStripesChange={setStripes}
              />
            ) : null}
          </section>

          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="h-16 w-full rounded-full bg-blue-600 text-lg font-semibold tracking-tight shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300 disabled:shadow-none"
          >
            Continue
          </button>
        </main>
      </div>
    </div>
  );
}

function NameStep({
  name,
  onChange,
}: {
  name: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-12 pt-8">
      <h1 className="mx-auto max-w-2xl text-center text-4xl font-semibold leading-tight sm:text-5xl">
        What should we call you?
      </h1>

      <div className="mx-auto mt-20 max-w-xl border-b border-white/20 pb-4">
        <input
          value={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Your name"
          className="w-full bg-transparent text-center text-5xl font-semibold outline-none placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}

function RankStep({
  name,
  belt,
  stripes,
  onBeltChange,
  onStripesChange,
}: {
  name: string;
  belt: Belt;
  stripes: number;
  onBeltChange: (value: Belt) => void;
  onStripesChange: (value: number) => void;
}) {
  const stripeOptions = stripeOptionsForBelt(belt);

  return (
    <div className="space-y-12 pt-8">
      <h1 className="mx-auto max-w-3xl text-center text-4xl font-semibold leading-tight sm:text-5xl">
        Hi <span className="text-blue-500">{name || "there"}</span>, what&apos;s your current rank?
      </h1>

      <div className="mx-auto w-full max-w-2xl space-y-10">
        <BeltPreview belt={belt} stripes={stripes} />

        <div className="grid grid-cols-2 gap-10 px-2 sm:px-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Belt</p>
            <div className="space-y-2">
              {belts.map((option) => {
                const active = option === belt;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onBeltChange(option)}
                    className={`w-full rounded-xl px-4 py-3 text-left text-lg transition ${
                      active ? "bg-blue-500/15 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Stripes</p>
            <div className="space-y-2">
              {stripeOptions.map((count) => {
                const active = stripes === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onStripesChange(count)}
                    className={`w-full rounded-xl px-4 py-3 text-left text-lg transition ${
                      active ? "bg-blue-500/15 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-8 pt-8">
      <h1 className="mx-auto max-w-2xl text-center text-4xl font-semibold leading-tight sm:text-5xl">
        What are your biggest BJJ challenges?
      </h1>

      <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/30">
        {challenges.map((challenge) => {
          const active = selected.includes(challenge);

          return (
            <button
              key={challenge}
              type="button"
              onClick={() => onToggle(challenge)}
              className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-xl transition hover:bg-white/5"
            >
              <span className={active ? "text-white" : "text-zinc-300"}>{challenge}</span>
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base transition ${
                  active ? "bg-blue-500 text-black" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BeltPreview({ belt, stripes }: { belt: Belt; stripes: number }) {
  const palette: Record<
    Belt,
    { bg: string; edge: string; stripe: string; label: string; text: string }
  > = {
    White: {
      bg: "bg-zinc-100",
      edge: "bg-zinc-200",
      stripe: "bg-zinc-900",
      label: "WHITE BELT",
      text: "text-zinc-900",
    },
    Blue: {
      bg: "bg-blue-600",
      edge: "bg-blue-700",
      stripe: "bg-white",
      label: "BLUE BELT",
      text: "text-white",
    },
    Purple: {
      bg: "bg-purple-600",
      edge: "bg-purple-700",
      stripe: "bg-white",
      label: "PURPLE BELT",
      text: "text-white",
    },
    Brown: {
      bg: "bg-amber-900",
      edge: "bg-amber-950",
      stripe: "bg-white",
      label: "BROWN BELT",
      text: "text-white",
    },
    Black: {
      bg: "bg-zinc-950",
      edge: "bg-black",
      stripe: "bg-white",
      label: "BLACK BELT",
      text: "text-white",
    },
  };

  const style = palette[belt];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative mx-auto h-16 w-full max-w-2xl overflow-hidden rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.55)]">
        <div className={`absolute inset-0 ${style.bg}`} />
        <div className={`absolute right-0 top-0 h-full w-14 ${style.edge}`} />
        <div className="absolute right-14 top-0 h-full w-0.5 bg-black/15" />

        <div className="absolute inset-0 flex items-center justify-center px-6">
          <span className={`text-sm font-semibold tracking-[0.3em] ${style.text}`}>
            {style.label}
          </span>
        </div>

        {stripes > 0 ? (
          <div className="absolute right-20 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {Array.from({ length: stripes }).map((_, index) => (
              <span
                key={`${belt}-${index + 1}`}
                className={`h-10 w-1.5 rounded-full shadow-sm ${style.stripe}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReadyScreen({
  name,
  belt,
  stripes,
  onContinue,
}: {
  name: string;
  belt: Belt;
  stripes: number;
  onContinue: () => void;
}) {
  const beltDescriptor = stripes > 0 ? `${belt} belt (${stripes} stripe${stripes === 1 ? "" : "s"})` : `${belt} belt`;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_55%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
        <main className="flex flex-1 flex-col justify-center gap-10 pb-4">
          <div className="mx-auto grid place-items-center gap-6">
            <div className="grid h-24 w-24 place-items-center rounded-[26px] bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/15">
              <BJJPalMark />
            </div>
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                {name.trim() ? `${name.trim()}, ` : ""}BJJ Pal is ready!
              </h1>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                As a {beltDescriptor}, we&apos;ll help you build a strong foundation and master the fundamentals.
              </p>
            </div>
          </div>

          <section className="mx-auto w-full max-w-xl">
            <p className="text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
              Your path to mastery
            </p>
            <div className="mt-6 space-y-4">
              <PathItem
                title="Log sessions"
                subtitle="Track every roll and sub"
                icon={<BookIcon />}
              />
              <PathItem
                title="Review techniques"
                subtitle="Build your personal playbook"
                icon={<FlowIcon />}
              />
              <PathItem
                title="Improve 2x faster"
                subtitle="Data-driven progress"
                icon={<TrendIcon />}
              />
            </div>
          </section>
        </main>

        <button
          type="button"
          onClick={onContinue}
          className="h-16 w-full rounded-full bg-blue-600 text-lg font-semibold tracking-tight shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:bg-blue-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function PathItem({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-500/10 text-blue-200 ring-1 ring-blue-500/30">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function BJJPalMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
      <path
        d="M18 40c6-12 14-18 24-18 5 0 9 1 12 4-6 1-10 4-13 8-4 6-10 9-18 9-2 0-4-1-5-3z"
        fill="currentColor"
        className="text-white"
        opacity="0.95"
      />
      <path
        d="M16 44c3 3 7 5 13 5 9 0 16-4 21-12 2-4 5-6 9-7-1 10-9 18-20 20-9 2-18-1-23-6z"
        fill="currentColor"
        className="text-blue-400"
        opacity="0.95"
      />
      <circle cx="40" cy="18" r="6" fill="currentColor" className="text-blue-300" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M7 4.5h10a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V7.5a3 3 0 0 1 3-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 4.5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M7 14c2.5-4.5 5-6 8-6 3 0 5 2 5 5 0 4-3 7-7 7-3.5 0-6-2.5-6-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 12c.7-3.7 3.4-6.5 7.4-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M4 16l6-6 4 4 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MainScreen({ name }: { name: string }) {
  const [screen, setScreen] = useState<"list" | "detail" | "edit" | "add" | "import" | "review">("list");
  const [bottomTab, setBottomTab] = useState<"sessions" | "techniques" | "you">("techniques");
  const [activeTechniqueId, setActiveTechniqueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "systems" | "discover">("library");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<null | {
    username: string;
    displayName: string;
    name: string;
    belt: Belt;
    stripes: number;
    gym: string;
    bio: string;
    privacy: "Public" | "Private";
  }>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TechniqueCategoryKey>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [tagDraftSelected, setTagDraftSelected] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagPickerContext, setTagPickerContext] = useState<"filter" | "technique">("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTechniqueId, setExpandedTechniqueId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [lastCopiedPromptAt, setLastCopiedPromptAt] = useState<number | null>(null);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [editingImportId, setEditingImportId] = useState<string | null>(null);
  const [isImportCategoryOpen, setIsImportCategoryOpen] = useState(false);
  const [importReturnScreen, setImportReturnScreen] = useState<"list" | "add" | "edit">("list");

  const [draftTechnique, setDraftTechnique] = useState<TechniqueDraft | null>(null);

  const [sessionsTab, setSessionsTab] = useState<"my_sessions" | "social_feed" | "leaderboards">("my_sessions");
  const [isSessionFilterOpen, setIsSessionFilterOpen] = useState(false);
  const [sessionFilters, setSessionFilters] = useState<SessionFilters>({
    search: "",
    startDate: "",
    endDate: "",
    location: "",
    submission: "",
    sessionTypes: [],
    minSatisfaction: 0,
  });
  const [sessionFilterDraft, setSessionFilterDraft] = useState<SessionFilters>(sessionFilters);
  const [sessionSort, setSessionSort] = useState<"New" | "Old" | "A-Z">("New");
  const [isSessionSortOpen, setIsSessionSortOpen] = useState(false);
  const [sessionScreen, setSessionScreen] = useState<"home" | "new" | "detail" | "edit">("home");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([createDefaultTechnique()]);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof loadProfile>>>(null);

  const normalizeSessions = (input: Session[]) => {
    return input
      .filter((session): session is Session => Boolean(session) && typeof session === "object")
      .map((session) => {
        const legacySubmissions = (session as { submissions?: unknown }).submissions;
        const legacyText = typeof legacySubmissions === "string" ? legacySubmissions : "";
        const legacyEntries = legacyText
          .split(/[,\n;]/)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((name) => ({ name, count: 1 }));

        const entriesRaw = (session as { submissionEntries?: unknown }).submissionEntries;
        const submissionEntries = Array.isArray(entriesRaw)
          ? entriesRaw
              .map((entry) => {
                const name = (entry as { name?: unknown }).name;
                const count = (entry as { count?: unknown }).count;
                if (typeof name !== "string" || !name.trim()) return null;
                const safeCount =
                  typeof count === "number" && Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
                return { name: name.trim(), count: safeCount };
              })
              .filter((entry): entry is SessionSubmissionEntry => Boolean(entry))
          : legacyEntries;

        return { ...session, submissionEntries } as Session;
      });
  };

  const normalizeTechniques = (input: Technique[]) => {
    return input
      .filter((technique): technique is Technique => Boolean(technique) && typeof technique === "object")
      .map((technique) => ({
        ...technique,
        linkedTechniqueIds: Array.isArray((technique as { linkedTechniqueIds?: unknown }).linkedTechniqueIds)
          ? (technique as { linkedTechniqueIds: string[] }).linkedTechniqueIds
          : [],
      }));
  };

  const fabRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filterRef = useRef<HTMLButtonElement | null>(null);
  const tagRef = useRef<HTMLButtonElement | null>(null);
  const techniqueCardRef = useRef<HTMLDivElement | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const beltsList = belts;

  const formatBeltLabel = (beltValue: string | undefined, stripesValue: number | undefined) => {
    const safeBelt = typeof beltValue === "string" && beltsList.includes(beltValue as Belt) ? (beltValue as Belt) : null;
    const safeStripes = typeof stripesValue === "number" && Number.isFinite(stripesValue) ? Math.max(0, Math.floor(stripesValue)) : 0;
    if (!safeBelt) return "Unranked";
    if (safeStripes === 0) return `${safeBelt} belt`;
    return `${safeBelt} belt (${safeStripes} stripe${safeStripes === 1 ? "" : "s"})`;
  };

  const ensureUsername = (candidate: string | undefined) => {
    const normalized = (candidate ?? "").trim();
    if (normalized) return normalized;
    const id = cryptoSafeId().replace(/-/g, "").slice(0, 10);
    return `grappler_${id}`;
  };

  const openEditProfile = () => {
    const username = ensureUsername(profile?.username);
    const displayName = (profile?.displayName ?? "").trim();
    const personalName = (profile?.name ?? name ?? "").trim();
    const beltValue = typeof profile?.belt === "string" && beltsList.includes(profile.belt as Belt) ? (profile.belt as Belt) : "White";
    const stripesValue =
      typeof profile?.stripes === "number" && Number.isFinite(profile.stripes)
        ? Math.max(0, Math.floor(profile.stripes))
        : 0;
    const allowed = stripeOptionsForBelt(beltValue);
    const safeStripes = allowed.includes(stripesValue) ? stripesValue : allowed[0];

    setProfileDraft({
      username,
      displayName,
      name: personalName,
      belt: beltValue,
      stripes: safeStripes,
      gym: (profile?.gym ?? "").trim(),
      bio: (profile?.bio ?? "").trim(),
      privacy: profile?.privacy ?? "Public",
    });
    setEditProfileOpen(true);
  };

  const openProfile = () => {
    setProfileOpen(true);
    if (profile?.username && profile.username.trim()) return;
    upsertProfile({ username: ensureUsername(profile?.username) })
      .then((next) => setProfile(next))
      .catch(() => {});
  };

  const saveProfileDraftChanges = async () => {
    if (!profileDraft) return;
    const trimmedName = profileDraft.name.trim();
    if (!trimmedName) return;
    const next = await upsertProfile({
      username: profileDraft.username.trim(),
      displayName: profileDraft.displayName.trim(),
      name: trimmedName,
      belt: profileDraft.belt,
      stripes: profileDraft.stripes,
      gym: profileDraft.gym.trim(),
      bio: profileDraft.bio.trim(),
      privacy: profileDraft.privacy,
      onboardingDone: true,
    });
    setProfile(next);
    setEditProfileOpen(false);
    setProfileOpen(true);
  };

  const tourSteps = useMemo(
    () =>
      [
        {
          key: "add",
          title: "Add Techniques",
          description: "Tap here to add a new technique to your collection.",
        },
        {
          key: "search",
          title: "Search Your Techniques",
          description: "Use the search bar to quickly find techniques by name or tag.",
        },
        {
          key: "filter",
          title: "Filter by Category",
          description: "Filter techniques by category like Submission, Sweep, or Escape.",
        },
        {
          key: "tags",
          title: "Tag Filtering",
          description: "Great for finding techniques by position or custom tags you’ve created.",
        },
        {
          key: "technique",
          title: "Interact with Techniques",
          description: "Tap a technique to view details. Swipe left to edit or right to delete.",
        },
      ] as const,
    [],
  );

  useEffect(() => {
    if (!isFilterOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFilterOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFilterOpen]);

  const switchBottomTab = (next: "sessions" | "techniques" | "you") => {
    setBottomTab(next);
    setScreen("list");
    setIsFilterOpen(false);
    setIsTagsOpen(false);
    setIsSessionSortOpen(false);
    setShowTour(false);
  };

  useEffect(() => {
    if (!isSessionSortOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSessionSortOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSessionSortOpen]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrateLocalStorageToLocalForageIfNeeded();
        const [loadedSessions, loadedTechniques, tourDone, loadedProfile] = await Promise.all([
          loadSessions<Session>(),
          loadTechniques<Technique>(),
          loadTourDone(),
          loadProfile(),
        ]);
        if (cancelled) return;
        setSessions(normalizeSessions(loadedSessions));
        const normalizedTechniques = normalizeTechniques(loadedTechniques);
        setTechniques(normalizedTechniques.length > 0 ? normalizedTechniques : [createDefaultTechnique()]);
        setProfile(loadedProfile);
        setShowTour(!tourDone);
        setTourStep(0);
      } catch {
        if (cancelled) return;
        setShowTour(true);
        setTourStep(0);
      } finally {
        if (!cancelled) setStorageLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadAllFromStorage = async () => {
    await migrateLocalStorageToLocalForageIfNeeded();
    const [loadedSessions, loadedTechniques, tourDone, loadedProfile] = await Promise.all([
      loadSessions<Session>(),
      loadTechniques<Technique>(),
      loadTourDone(),
      loadProfile(),
    ]);
    setSessions(normalizeSessions(loadedSessions));
    const normalizedTechniques = normalizeTechniques(loadedTechniques);
    setTechniques(normalizedTechniques.length > 0 ? normalizedTechniques : [createDefaultTechnique()]);
    setProfile(loadedProfile);
    setShowTour(!tourDone);
    setTourStep(0);
  };

  const exportBackupFile = async () => {
    setSettingsMessage(null);
    const backup = await createBackup();
    const text = JSON.stringify(backup, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `bjj-pal-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSettingsMessage("Backup downloaded.");
  };

  const importBackupFile = async (file: File) => {
    setSettingsMessage(null);
    const text = await file.text();
    await restoreBackup(text);
    await reloadAllFromStorage();
    setSettingsMessage("Backup restored.");
  };

  useEffect(() => {
    if (!storageLoaded) return;
    saveTechniques(techniques).catch(() => {});
  }, [storageLoaded, techniques]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveSessions(sessions).catch(() => {});
  }, [sessions, storageLoaded]);

  useEffect(() => {
    if (!lastCopiedPromptAt) return;
    const timeout = window.setTimeout(() => setCopiedPrompt(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [lastCopiedPromptAt]);

  useEffect(() => {
    if (!showTour) return;

    const updateAnchor = () => {
      const step = tourSteps[tourStep];
      const element = (() => {
        if (!step) return null;
        if (step.key === "add") return fabRef.current;
        if (step.key === "search") return searchRef.current;
        if (step.key === "filter") return filterRef.current;
        if (step.key === "tags") return tagRef.current;
        if (step.key === "technique") return techniqueCardRef.current;
        return null;
      })();
      if (!element) {
        setAnchorRect(null);
        return;
      }
      setAnchorRect(element.getBoundingClientRect());
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [showTour, tourStep, tourSteps]);

  const finishTour = () => {
    saveTourDone(true).catch(() => {});
    setShowTour(false);
  };

  const goTourNext = () => {
    if (tourStep >= tourSteps.length - 1) {
      finishTour();
      return;
    }
    setTourStep((value) => value + 1);
  };

  const goTourBack = () => {
    setTourStep((value) => Math.max(0, value - 1));
  };

  const currentTourStep = tourSteps[tourStep];

  const visibleTechniques = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return techniques.filter((technique) => {
      if (selectedCategory !== "All" && technique.category !== selectedCategory) return false;
      if (selectedTags.length > 0 && !selectedTags.every((tag) => technique.tags.includes(tag))) return false;
      if (!normalizedQuery) return true;
      const haystack = `${technique.title} ${technique.tags.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedCategory, selectedTags, techniques]);

  const openTags = (context: "filter" | "technique", initial: string[]) => {
    setTagPickerContext(context);
    setTagDraftSelected(initial);
    setTagSearchQuery("");
    setIsTagsOpen(true);
  };

  const closeTags = () => {
    setIsTagsOpen(false);
    setTagSearchQuery("");
    setTagDraftSelected([]);
  };

  const applyTags = () => {
    if (tagPickerContext === "filter") {
      setSelectedTags(tagDraftSelected);
    } else if (draftTechnique) {
      setDraftTechnique({ ...draftTechnique, tags: tagDraftSelected });
    }
    closeTags();
  };

  const clearTagDraft = () => {
    setTagDraftSelected([]);
  };

  const toggleTagDraft = (tag: string) => {
    setTagDraftSelected((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag],
    );
  };

  const activeTechnique = useMemo(() => {
    if (!activeTechniqueId) return null;
    return techniques.find((technique) => technique.id === activeTechniqueId) ?? null;
  }, [activeTechniqueId, techniques]);

  const openTechnique = (techniqueId: string) => {
    setActiveTechniqueId(techniqueId);
    setScreen("detail");
  };

  const startEditTechnique = (technique: Technique) => {
    setDraftTechnique({
      id: technique.id,
      title: technique.title,
      category: technique.category,
      dateIso: technique.dateIso,
      tags: technique.tags,
      notes: technique.notes,
      links: technique.links,
      linkedTechniqueIds: technique.linkedTechniqueIds,
      favorite: technique.favorite,
    });
    setScreen("edit");
  };

  const startNewTechnique = () => {
    setScreen("add");
  };

  const startNewTechniqueDraft = () => {
    const nowIso = new Date().toISOString();
    setDraftTechnique({
      id: `tech-${cryptoSafeId()}`,
      title: "",
      category: "Submission",
      dateIso: nowIso,
      tags: [],
      notes: "",
      links: [],
      linkedTechniqueIds: [],
      favorite: false,
      isNew: true,
    });
    setScreen("edit");
  };

  const saveDraftTechnique = () => {
    if (!draftTechnique) return;
    const next: Technique = {
      id: draftTechnique.id,
      title: draftTechnique.title.trim() || "Untitled Technique",
      category: draftTechnique.category,
      dateIso: draftTechnique.dateIso,
      tags: dedupeStrings(draftTechnique.tags),
      notes: draftTechnique.notes.trim(),
      links: draftTechnique.links,
      linkedTechniqueIds: draftTechnique.linkedTechniqueIds,
      favorite: draftTechnique.favorite,
    };

    setTechniques((current) => {
      const exists = current.some((technique) => technique.id === next.id);
      if (!exists) return [next, ...current];
      return current.map((technique) => (technique.id === next.id ? next : technique));
    });

    setDraftTechnique(null);
    setActiveTechniqueId(next.id);
    setScreen("detail");
  };

  const deleteTechnique = (techniqueId: string) => {
    setTechniques((current) => current.filter((technique) => technique.id !== techniqueId));
    setDraftTechnique(null);
    setActiveTechniqueId(null);
    setScreen("list");
  };

  const toggleFavorite = (techniqueId: string) => {
    setTechniques((current) =>
      current.map((technique) =>
        technique.id === techniqueId ? { ...technique, favorite: !technique.favorite } : technique,
      ),
    );
  };

  const openImportFrom = (returnTo: "list" | "add" | "edit") => {
    setImportText("");
    setCopiedPrompt(false);
    setLastCopiedPromptAt(null);
    setImportReturnScreen(returnTo);
    setScreen("import");
  };

  const startReviewImportFromText = (text: string) => {
    const parsed = parseTechniqueImport(text);
    if (parsed.length === 0) return;

    setImportCandidates(
      parsed.map((technique) => ({
        ...technique,
        selected: true,
      })),
    );
    setEditingImportId(null);
    setIsImportCategoryOpen(false);
    setScreen("review");
  };

  const popover = useMemo(() => {
    if (!anchorRect) return null;

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

    const maxWidth = 460;
    const width = Math.min(maxWidth, Math.max(320, viewportWidth - 32));
    const estimatedHeight = 170;

    const centerX = anchorRect.left + anchorRect.width / 2;
    const centerY = anchorRect.top + anchorRect.height / 2;
    const placeBelow = centerY < viewportHeight * 0.55;

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const left = clamp(centerX - width / 2, 16, Math.max(16, viewportWidth - width - 16));
    const topRaw = placeBelow ? anchorRect.bottom + 14 : anchorRect.top - estimatedHeight - 14;
    const top = clamp(topRaw, 16, Math.max(16, viewportHeight - estimatedHeight - 16));

    const arrowLeft = clamp(centerX - left, 28, width - 28);

    return { left, top, width, arrowLeft, placeBelow };
  }, [anchorRect]);

  const startNewSession = () => {
    const now = new Date();
    setSessionDraft({
      id: `session-${cryptoSafeId()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      location: "",
      type: "",
      submissionEntries: [],
      durationMinutes: 90,
      notes: "",
      satisfaction: 0,
      tagFriends: "",
      visibility: "Everyone",
      caption: "",
    });
    setActiveSessionId(null);
    setSessionScreen("new");
  };

  const saveSessionDraft = () => {
    if (!sessionDraft) return;
    const next: Session = {
      id: sessionDraft.id,
      date: sessionDraft.date,
      time: sessionDraft.time,
      location: sessionDraft.location.trim(),
      type: sessionDraft.type,
      submissionEntries: sessionDraft.submissionEntries,
      durationMinutes: sessionDraft.durationMinutes,
      notes: sessionDraft.notes.trim(),
      satisfaction: sessionDraft.satisfaction,
      tagFriends: sessionDraft.tagFriends.trim(),
      visibility: sessionDraft.visibility,
      caption: sessionDraft.caption.trim(),
    };
    setSessions((current) => {
      const exists = current.some((session) => session.id === next.id);
      if (!exists) return [next, ...current];
      return current.map((session) => (session.id === next.id ? next : session));
    });
    setSessionDraft(null);
    setSessionScreen("home");
  };

  const deleteSession = (sessionId: string) => {
    setSessions((current) => current.filter((session) => session.id !== sessionId));
    setSessionDraft(null);
    setActiveSessionId(null);
    setSessionScreen("home");
  };

  const startSessionDetail = (sessionId: string) => {
    const existing = sessions.find((session) => session.id === sessionId);
    if (!existing) return;
    setActiveSessionId(sessionId);
    setSessionDraft(null);
    setSessionScreen("detail");
  };

  if (bottomTab === "sessions" && screen === "list") {
    if (sessionScreen === "new" && sessionDraft) {
      return (
        <NewSessionScreen
          draft={sessionDraft}
          onDraftChange={setSessionDraft}
          onCancel={() => {
            setSessionDraft(null);
            setSessionScreen("home");
          }}
          onSave={saveSessionDraft}
          onAddTechnique={() => {}}
          mode="new"
        />
      );
    }

    if (sessionScreen === "edit" && sessionDraft && activeSessionId) {
      return (
        <NewSessionScreen
          draft={sessionDraft}
          onDraftChange={setSessionDraft}
          onCancel={() => {
            setSessionDraft(null);
            setActiveSessionId(null);
            setSessionScreen("home");
          }}
          onSave={saveSessionDraft}
          onAddTechnique={() => {}}
          mode="edit"
          onDelete={() => deleteSession(activeSessionId)}
        />
      );
    }

    if (sessionScreen === "detail" && activeSessionId) {
      const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
      return (
        <SessionDetailScreen
          session={activeSession}
          onBack={() => {
            setActiveSessionId(null);
            setSessionScreen("home");
          }}
          onEdit={() => {
            if (!activeSession) return;
            setSessionDraft(activeSession);
            setSessionScreen("edit");
          }}
        />
      );
    }

    return (
      <SessionsHomeScreen
        name={(profile?.displayName && profile.displayName.trim()) || (profile?.name && profile.name.trim()) || name}
        tab={sessionsTab}
        onTabChange={setSessionsTab}
        filters={sessionFilters}
        onOpenFilters={() => {
          setSessionFilterDraft(sessionFilters);
          setIsSessionFilterOpen(true);
        }}
        filterOpen={isSessionFilterOpen}
        filterDraft={sessionFilterDraft}
        onFilterDraftChange={setSessionFilterDraft}
        onCloseFilters={() => setIsSessionFilterOpen(false)}
        onClearFilters={() =>
          setSessionFilterDraft({
            search: "",
            startDate: "",
            endDate: "",
            location: "",
            submission: "",
            sessionTypes: [],
            minSatisfaction: 0,
          })
        }
        onApplyFilters={() => {
          setSessionFilters(sessionFilterDraft);
          setIsSessionFilterOpen(false);
        }}
        sort={sessionSort}
        sortOpen={isSessionSortOpen}
        onToggleSort={() => setIsSessionSortOpen((value) => !value)}
        onPickSort={(next) => {
          setSessionSort(next);
          setIsSessionSortOpen(false);
        }}
        onCloseSort={() => setIsSessionSortOpen(false)}
        onAddSession={startNewSession}
        sessions={sessions}
        onOpenSession={startSessionDetail}
        bottomTab={bottomTab}
        onBottomTabChange={(next) => {
          switchBottomTab(next);
        }}
      />
    );
  }

  if (screen === "add") {
    return (
      <AddTechniqueChoiceScreen
        onStartFresh={() => startNewTechniqueDraft()}
        onImport={() => openImportFrom("add")}
        onClose={() => setScreen("list")}
      />
    );
  }

  if (screen === "import") {
    return (
      <ImportTechniquesScreen
        promptText={IMPORT_PROMPT_TEXT}
        importText={importText}
        onImportTextChange={setImportText}
        copiedPrompt={copiedPrompt}
        onCopyPrompt={async () => {
          try {
            await navigator.clipboard.writeText(IMPORT_PROMPT_TEXT);
            setCopiedPrompt(true);
            setLastCopiedPromptAt(Date.now());
          } catch {
            setCopiedPrompt(false);
          }
        }}
        onUseExample={() => setImportText(IMPORT_EXAMPLE_TEXT)}
        onCancel={() => setScreen(importReturnScreen)}
        onImport={() => startReviewImportFromText(importText)}
        onClose={() => setScreen(importReturnScreen)}
      />
    );
  }

  if (screen === "review") {
    const selectedCount = importCandidates.filter((candidate) => candidate.selected).length;

    return (
      <ReviewAndSaveScreen
        candidates={importCandidates}
        editingId={editingImportId}
        isCategoryOpen={isImportCategoryOpen}
        onClose={() => {
          setImportCandidates([]);
          setEditingImportId(null);
          setIsImportCategoryOpen(false);
          setScreen("list");
        }}
        onBack={() => setScreen("import")}
        onSelectAll={() =>
          setImportCandidates((current) => current.map((candidate) => ({ ...candidate, selected: true })))
        }
        onSelectNone={() =>
          setImportCandidates((current) => current.map((candidate) => ({ ...candidate, selected: false })))
        }
        onToggleSelected={(id) =>
          setImportCandidates((current) =>
            current.map((candidate) =>
              candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate,
            ),
          )
        }
        onStartEdit={(id) => {
          setEditingImportId(id);
          setIsImportCategoryOpen(false);
        }}
        onCancelEdit={() => {
          setEditingImportId(null);
          setIsImportCategoryOpen(false);
        }}
        onChange={(id, patch) =>
          setImportCandidates((current) =>
            current.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)),
          )
        }
        onOpenCategory={() => setIsImportCategoryOpen(true)}
        onCloseCategory={() => setIsImportCategoryOpen(false)}
        onPickCategory={(category) => {
          if (!editingImportId) return;
          setImportCandidates((current) =>
            current.map((candidate) =>
              candidate.id === editingImportId ? { ...candidate, category } : candidate,
            ),
          );
          setIsImportCategoryOpen(false);
        }}
        onSaveEdit={() => setEditingImportId(null)}
        onSaveAll={() => {
          if (selectedCount === 0) return;
          setTechniques((current) => {
            const existingTitles = new Set(current.map((technique) => technique.title.trim().toLowerCase()));
            const toAdd: Technique[] = importCandidates
              .filter((candidate) => candidate.selected)
              .filter((candidate) => !existingTitles.has(candidate.title.trim().toLowerCase()))
              .map((candidate) => {
                const technique = { ...candidate } as Record<string, unknown>;
                delete technique.selected;
                return technique as unknown as Technique;
              });
            return [...toAdd, ...current];
          });

          setImportCandidates([]);
          setEditingImportId(null);
          setIsImportCategoryOpen(false);
          setScreen("list");
        }}
      />
    );
  }

  if (screen === "detail" && activeTechnique) {
    return (
      <TechniqueDetailScreen
        technique={activeTechnique}
        allTechniques={techniques}
        onBack={() => setScreen("list")}
        onEdit={() => startEditTechnique(activeTechnique)}
        onToggleFavorite={() => toggleFavorite(activeTechnique.id)}
        onOpenTechnique={(techniqueId) => {
          setActiveTechniqueId(techniqueId);
          setScreen("detail");
        }}
      />
    );
  }

  if (screen === "edit" && draftTechnique) {
    return (
        <TechniqueEditScreen
          draft={draftTechnique}
          onDraftChange={setDraftTechnique}
          onCancel={() => {
            setDraftTechnique(null);
            setScreen(activeTechniqueId ? "detail" : "list");
          }}
          onSave={saveDraftTechnique}
          onDelete={() => deleteTechnique(draftTechnique.id)}
          onImport={() => openImportFrom("edit")}
          allTechniques={techniques}
        />
      );
    }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open profile"
              onClick={openProfile}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <UserIcon />
            </button>
            <p className="text-lg font-semibold">
              {(profile?.displayName && profile.displayName.trim()) ||
                (profile?.name && profile.name.trim()) ||
                name ||
                "You"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <GearIcon />
          </button>
        </header>

        <nav className="mt-5 flex items-end justify-between gap-6 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`relative text-sm font-semibold transition ${
              activeTab === "library" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            My Library
            {activeTab === "library" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-16 rounded-full bg-blue-500" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("systems")}
            className={`relative text-sm font-semibold transition ${
              activeTab === "systems" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Systems{" "}
            <span className="ml-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-300/30">
              New
            </span>
            {activeTab === "systems" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-14 rounded-full bg-blue-500" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discover")}
            className={`relative text-sm font-semibold transition ${
              activeTab === "discover" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Discover
            {activeTab === "discover" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-16 rounded-full bg-blue-500" />
            ) : null}
          </button>
        </nav>

        {activeTab === "library" ? (
          <main className="mt-5 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <SearchIcon />
                <input
                  ref={searchRef}
                  placeholder="Search techniques"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
              </div>
              <button
                ref={filterRef}
                type="button"
                aria-label="Filters"
                onClick={() => setIsFilterOpen((value) => !value)}
                className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                {isFilterOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTags((current) => current.filter((value) => value !== tag))
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                  aria-label={`Remove tag ${tag}`}
                >
                  <span>{tag}</span>
                  <span aria-hidden="true" className="text-white/90">
                    ×
                  </span>
                </button>
              ))}
              <button
                ref={tagRef}
                type="button"
                onClick={() => openTags("filter", selectedTags)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                Add Tags <span className="ml-1 text-zinc-400">+</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                Graph
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                New <ChevronDownSmallIcon />
              </button>
            </div>

            <p className="mt-5 text-xs text-zinc-500">
              {visibleTechniques.length} technique{visibleTechniques.length === 1 ? "" : "s"} found
            </p>

            {visibleTechniques.map((technique) => (
              <div
                key={technique.id}
                ref={techniqueCardRef}
                className="relative mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.5)]"
                role="button"
                tabIndex={0}
                onClick={() => openTechnique(technique.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openTechnique(technique.id);
                }}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-3 top-4 bottom-4 w-1 rounded-full ${categoryDotClass(
                    technique.category,
                  )}`}
                />
                <div className="pl-7 pr-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">{technique.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatDateTimeLabel(technique.dateIso)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={expandedTechniqueId === technique.id ? "Collapse technique" : "Expand technique"}
                      onClick={() =>
                        setExpandedTechniqueId((current) =>
                          current === technique.id ? null : technique.id,
                        )
                      }
                      onMouseDown={(event) => event.stopPropagation()}
                      onClickCapture={(event) => event.stopPropagation()}
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/30 text-zinc-200 transition hover:bg-white/10"
                    >
                      {expandedTechniqueId === technique.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {technique.category}
                    </span>
                  </div>

                  {expandedTechniqueId === technique.id ? (
                    <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                      {technique.notes || "No notes yet."}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </main>
        ) : (
          <main className="mt-10 flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-300">
            <p className="text-sm font-semibold text-white">
              {activeTab === "systems" ? "Systems" : "Discover"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Under construction.</p>
          </main>
        )}

        <button
          ref={fabRef}
          type="button"
          aria-label="Add technique"
          onClick={startNewTechnique}
          className="fixed bottom-24 right-6 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.65)] transition hover:bg-blue-500"
        >
          <span className="text-3xl leading-none">+</span>
        </button>

        <BottomNav
          active={bottomTab}
          onChange={(next) => {
            switchBottomTab(next);
          }}
        />

        {isTagsOpen ? (
          <TagPickerScreen
            query={tagSearchQuery}
            selected={tagDraftSelected}
            onQueryChange={setTagSearchQuery}
            onToggle={toggleTagDraft}
            onClose={closeTags}
            onClear={clearTagDraft}
            onApply={applyTags}
          />
        ) : null}

        {isFilterOpen ? (
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-black/65"
              onClick={() => setIsFilterOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Select Category"
              className="absolute left-1/2 top-[180px] w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
            >
              <div className="px-6 py-5">
                <p className="text-center text-base font-semibold text-white">Select Category</p>
              </div>
              <div className="border-t border-white/10">
                {techniqueCategories.map((category) => {
                  const active = category.key === selectedCategory;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.key);
                        setIsFilterOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition ${
                        active ? "bg-blue-600/25 text-blue-200" : "text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${category.dot}`} aria-hidden="true" />
                        <span className={`text-sm font-semibold ${active ? "text-blue-200" : "text-white"}`}>
                          {category.label}
                        </span>
                      </span>
                      {active ? (
                        <span className="text-blue-200" aria-hidden="true">
                          ✓
                        </span>
                      ) : (
                        <span className="text-transparent" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {showTour && popover ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close tutorial"
              className="absolute inset-0 bg-black/65"
              onClick={finishTour}
            />

            {anchorRect ? (
              <div
                className="pointer-events-none absolute rounded-2xl ring-2 ring-blue-500/70 ring-offset-2 ring-offset-black/80"
                style={{
                  left: Math.max(8, anchorRect.left - 6),
                  top: Math.max(8, anchorRect.top - 6),
                  width: Math.max(16, anchorRect.width + 12),
                  height: Math.max(16, anchorRect.height + 12),
                }}
              />
            ) : null}

            <div
              className="absolute rounded-2xl bg-white text-zinc-900 shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
              style={{
                left: popover.left,
                top: popover.top,
                width: popover.width,
              }}
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-5">
                <p className="text-xs font-semibold text-zinc-500">
                  Step {tourStep + 1} of {tourSteps.length}
                </p>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                  onClick={finishTour}
                >
                  <XIcon />
                </button>
              </div>

              <div className="px-6 pb-5">
                <p className="mt-1 text-lg font-semibold">{currentTourStep.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {currentTourStep.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-zinc-600">
                    {tourStep === 0 ? (
                      <button type="button" onClick={finishTour} className="hover:text-zinc-900">
                        Skip
                      </button>
                    ) : (
                      <button type="button" onClick={goTourBack} className="hover:text-zinc-900">
                        ‹ Back
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tourSteps.map((step, index) => (
                      <span
                        key={step.key}
                        className={`h-1.5 w-1.5 rounded-full ${
                          index === tourStep ? "bg-zinc-900" : "bg-zinc-300"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={goTourNext}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    {tourStep === tourSteps.length - 1 ? "Got it!" : (
                      <span className="inline-flex items-center gap-2">
                        Next <span aria-hidden="true">›</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div
                className="absolute h-0 w-0"
                style={{
                  left: popover.arrowLeft,
                  top: popover.placeBelow ? -10 : undefined,
                  bottom: popover.placeBelow ? undefined : -10,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: popover.placeBelow ? undefined : "10px solid white",
                  borderBottom: popover.placeBelow ? "10px solid white" : undefined,
                }}
              />
            </div>
          </div>
        ) : null}

        {settingsOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close settings"
              className="absolute inset-0 bg-black/65"
              onClick={() => {
                setSettingsOpen(false);
                setSettingsMessage(null);
              }}
            />
            <div className="absolute left-1/2 top-[140px] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
              <header className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-lg font-semibold text-white">Backup &amp; Restore</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Sessions: {sessions.length} • Techniques: {techniques.length}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setSettingsOpen(false);
                    setSettingsMessage(null);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                >
                  <XIcon />
                </button>
              </header>

              <div className="border-t border-white/10 px-6 py-6">
                <p className="text-sm leading-relaxed text-zinc-400">
                  Your data is stored offline on this device (IndexedDB). Export a backup to share or move to a new
                  phone.
                </p>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    disabled={!storageLoaded}
                    onClick={() => exportBackupFile().catch((error: unknown) => {
                      const message = error instanceof Error ? error.message : "Export failed.";
                      setSettingsMessage(message);
                    })}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40"
                  >
                    Export backup
                  </button>

                  <button
                    type="button"
                    disabled={!storageLoaded}
                    onClick={() => backupFileInputRef.current?.click()}
                    className="h-12 w-full rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:bg-white/5"
                  >
                    Import backup
                  </button>

                  <input
                    ref={backupFileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      if (!file) return;
                      importBackupFile(file).catch((error: unknown) => {
                        const message = error instanceof Error ? error.message : "Import failed.";
                        setSettingsMessage(message);
                      });
                    }}
                  />

                  <button
                    type="button"
                    disabled={!storageLoaded}
                    onClick={() => reloadAllFromStorage().then(() => setSettingsMessage("Reloaded.")).catch(() => {
                      setSettingsMessage("Reload failed.");
                    })}
                    className="h-12 w-full rounded-xl bg-white/5 text-sm font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-white/5"
                  >
                    Reload from storage
                  </button>
                </div>

                {settingsMessage ? (
                  <p className="mt-4 text-sm text-zinc-300">{settingsMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {profileOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close profile"
              className="absolute inset-0 bg-black/65"
              onClick={() => setProfileOpen(false)}
            />
            <div className="absolute left-1/2 top-[90px] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
              <header className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-xl font-semibold text-white ring-1 ring-white/10">
                    {(profile?.displayName?.trim()?.[0] || profile?.name?.trim()?.[0] || name?.trim()?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">
                      {(profile?.displayName && profile.displayName.trim()) ||
                        (profile?.name && profile.name.trim()) ||
                        name ||
                        "You"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      @{ensureUsername(profile?.username)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Edit profile"
                    onClick={() => {
                      setProfileOpen(false);
                      openEditProfile();
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setProfileOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                  >
                    <XIcon />
                  </button>
                </div>
              </header>

              <div className="border-t border-white/10 px-6 py-6">
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Belt Rank</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-100">
                      {formatBeltLabel(profile?.belt, profile?.stripes)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Gym / Academy</p>
                    <p className="mt-2 text-sm text-zinc-200">{profile?.gym?.trim() || "—"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Bio</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-200">{profile?.bio?.trim() || "—"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Account Privacy</p>
                    <p className="mt-2 text-sm text-zinc-200">{profile?.privacy ?? "Public"}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Public keeps your profile discoverable. Private hides you from search and following.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {editProfileOpen && profileDraft ? (
          <div className="fixed inset-0 z-50 bg-black text-white">
            <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-20 pt-6 sm:px-8">
              <header className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Back"
                  onClick={() => {
                    setEditProfileOpen(false);
                    setProfileOpen(true);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                >
                  <BackIcon />
                </button>
                <p className="text-lg font-semibold">Edit Profile</p>
                <button
                  type="button"
                  aria-label="Save profile"
                  onClick={() => saveProfileDraftChanges().catch(() => {})}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500"
                >
                  <SaveIcon />
                </button>
              </header>

              <main className="mt-6 flex-1 space-y-7">
                <section className="flex flex-col items-center gap-3">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-2xl font-semibold text-white ring-1 ring-white/10">
                    {(profileDraft.displayName.trim()?.[0] || profileDraft.name.trim()?.[0] || "U").toUpperCase()}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    <MediaIcon />
                    Change Photo
                  </button>
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Username</p>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-400">@</p>
                    <input
                      value={profileDraft.username}
                      onChange={(event) => setProfileDraft((current) => (current ? { ...current, username: event.target.value } : current))}
                      placeholder="username"
                      className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfileDraft((current) =>
                          current ? { ...current, username: ensureUsername("") } : current,
                        )
                      }
                      className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/15"
                    >
                      Random
                    </button>
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Display Name</p>
                  <input
                    value={profileDraft.displayName}
                    onChange={(event) => setProfileDraft((current) => (current ? { ...current, displayName: event.target.value } : current))}
                    placeholder="Enter display name"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Name</p>
                  <input
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                    placeholder="Your name"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                </section>

                <section className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Belt Rank</p>
                  <div className="flex flex-wrap gap-3">
                    {beltsList.map((beltValue) => {
                      const active = profileDraft.belt === beltValue;
                      return (
                        <button
                          key={beltValue}
                          type="button"
                          onClick={() => {
                            setProfileDraft((current) => {
                              if (!current) return current;
                              const allowed = stripeOptionsForBelt(beltValue);
                              const nextStripes = allowed.includes(current.stripes) ? current.stripes : allowed[0];
                              return { ...current, belt: beltValue, stripes: nextStripes };
                            });
                          }}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            active ? "bg-white text-black" : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                          }`}
                        >
                          {beltValue}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Stripes</p>
                  <div className="flex flex-wrap gap-3">
                    {stripeOptionsForBelt(profileDraft.belt).map((stripe) => {
                      const active = profileDraft.stripes === stripe;
                      return (
                        <button
                          key={stripe}
                          type="button"
                          onClick={() => setProfileDraft((current) => (current ? { ...current, stripes: stripe } : current))}
                          className={`min-w-[44px] rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            active ? "bg-white text-black" : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                          }`}
                        >
                          {stripe}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Gym / Academy</p>
                  <input
                    value={profileDraft.gym}
                    onChange={(event) => setProfileDraft((current) => (current ? { ...current, gym: event.target.value } : current))}
                    placeholder="Enter gym name"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Bio</p>
                  <textarea
                    value={profileDraft.bio}
                    onChange={(event) => setProfileDraft((current) => (current ? { ...current, bio: event.target.value.slice(0, 200) } : current))}
                    placeholder="Tell us about yourself..."
                    className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                  <p className="text-right text-xs text-zinc-500">{Math.min(profileDraft.bio.length, 200)}/200</p>
                </section>

                <section className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Account Privacy</p>
                  <div className="flex gap-3">
                    {(["Public", "Private"] as const).map((privacy) => {
                      const active = profileDraft.privacy === privacy;
                      return (
                        <button
                          key={privacy}
                          type="button"
                          onClick={() => setProfileDraft((current) => (current ? { ...current, privacy } : current))}
                          className={`flex-1 rounded-2xl border px-5 py-4 text-left transition ${
                            active ? "border-blue-500/60 bg-blue-600/20" : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{privacy}</p>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                            {privacy === "Public"
                              ? "Profile is discoverable in search."
                              : "Profile is hidden from search and following."}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </main>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BottomNav({
  active,
  onChange,
}: {
  active: "sessions" | "techniques" | "you";
  onChange: (next: "sessions" | "techniques" | "you") => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-3 text-xs text-zinc-500">
        <button
          type="button"
          onClick={() => onChange("sessions")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "sessions" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <SessionsIcon />
          Sessions
        </button>
        <button
          type="button"
          onClick={() => onChange("techniques")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "techniques" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BookIconFilled />
          Techniques
        </button>
        <button
          type="button"
          onClick={() => onChange("you")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "you" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ChartIcon />
          You
        </button>
      </div>
    </div>
  );
}

const tagGroups = [
  {
    title: "Positions",
    tags: ["Closed Guard", "Half Guard", "Side Control", "Mount", "Back Control"],
  },
  {
    title: "Common Tags",
    tags: ["Beginner", "Intermediate", "Advanced", "Gi", "No-Gi"],
  },
] as const;

const techniqueTagGroups = [
  {
    title: "Positions",
    tags: [
      "Mount",
      "Closed Guard",
      "Side Control",
      "Back",
      "Half Guard",
      "Standing",
      "Open Guard",
      "Butterfly Guard",
      "De La Riva Guard",
      "X-Guard",
      "Spider Guard",
      "Lasso Guard",
      "Reverse De La Riva Guard",
      "Deep Half Guard",
      "Single Leg X-Guard",
      "North South",
      "Knee on Belly",
      "Turtle",
      "50/50 Guard",
      "3/4 Guard",
      "S-Mount",
    ],
  },
  {
    title: "Common Tags",
    tags: ["Beginner", "Intermediate", "Advanced", "Gi", "No-Gi"],
  },
] as const;

function TagPickerScreen({
  query,
  selected,
  onQueryChange,
  onToggle,
  onClose,
  onClear,
  onApply,
}: {
  query: string;
  selected: string[];
  onQueryChange: (value: string) => void;
  onToggle: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <p className="text-lg font-semibold text-white">Add Tags</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tags..."
            className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <main className="mt-8 flex-1 space-y-10">
          {tagGroups.map((group) => {
            const visibleTags = group.tags.filter((tag) => {
              if (!normalizedQuery) return true;
              return tag.toLowerCase().includes(normalizedQuery);
            });

            if (visibleTags.length === 0) return null;

            return (
              <section key={group.title} className="space-y-3">
                <p className="text-sm font-semibold text-zinc-300">{group.title}</p>
                <div className="flex flex-wrap gap-3">
                  {visibleTags.map((tag) => {
                    const active = selected.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onToggle(tag)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClear}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onApply}
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SelectTagsModal({
  query,
  selected,
  limit,
  onClose,
  onQueryChange,
  onToggle,
  onDone,
}: {
  query: string;
  selected: string[];
  limit: number;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onToggle: (tag: string) => void;
  onDone: () => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close tags"
        className="absolute inset-0 bg-black/65"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-[90px] w-[min(94vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        <header className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-lg font-semibold text-white">Select Tags</p>
            <p className="mt-1 text-sm text-zinc-500">
              Selected {selected.length} of {limit}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search tags"
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </div>

          <div className="mt-6 max-h-[56vh] overflow-auto pr-1">
            <div className="space-y-8">
              {techniqueTagGroups.map((group) => {
                const visibleTags = group.tags.filter((tag) => {
                  if (!normalizedQuery) return true;
                  return tag.toLowerCase().includes(normalizedQuery);
                });
                if (visibleTags.length === 0) return null;

                return (
                  <section key={group.title} className="space-y-3">
                    <p className="text-sm font-semibold text-zinc-300">{group.title}</p>
                    <div className="flex flex-wrap gap-3">
                      {visibleTags.map((tag) => {
                        const active = selected.includes(tag);
                        const disabled = !active && selected.length >= limit;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onToggle(tag)}
                            disabled={disabled}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                              active
                                ? "bg-blue-600 text-white"
                                : "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 bg-black/50 px-6 py-5">
          <button
            type="button"
            onClick={onDone}
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function LinkedTechniquesModal({
  query,
  selectedIds,
  limit,
  techniques,
  onClose,
  onQueryChange,
  onToggle,
  onDone,
}: {
  query: string;
  selectedIds: string[];
  limit: number;
  techniques: Technique[];
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onToggle: (techniqueId: string) => void;
  onDone: () => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTechniques = useMemo(() => {
    if (!normalizedQuery) return techniques;
    return techniques.filter((technique) => technique.title.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, techniques]);

  const grouped = useMemo(() => {
    const map = new Map<Exclude<TechniqueCategoryKey, "All">, Technique[]>();
    for (const technique of visibleTechniques) {
      const list = map.get(technique.category) ?? [];
      list.push(technique);
      map.set(technique.category, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleTechniques]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close linked techniques"
        className="absolute inset-0 bg-black/65"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-[90px] w-[min(94vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        <header className="flex items-center justify-between px-6 py-5">
          <p className="text-lg font-semibold text-white">Linked Techniques</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search techniques"
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </div>

          <div className="mt-5 max-h-[56vh] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            {grouped.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-500">No techniques found.</p>
            ) : (
              grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center justify-between px-5 py-3 text-xs font-semibold text-zinc-400">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${categoryDotClass(category)}`} />
                      {category}
                    </span>
                    <span>({items.length})</span>
                  </div>
                  <div className="border-t border-white/10" />
                  {items.map((technique) => {
                    const active = selectedIds.includes(technique.id);
                    const disabled = !active && selectedIds.length >= limit;
                    return (
                      <button
                        key={technique.id}
                        type="button"
                        onClick={() => onToggle(technique.id)}
                        disabled={disabled}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{technique.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{technique.category}</p>
                        </div>
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-full border ${
                            active
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-white/15 bg-black/20 text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="border-t border-white/10 bg-black/50 px-6 py-5">
          <button
            type="button"
            onClick={onDone}
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function SessionsHomeScreen({
  name,
  tab,
  onTabChange,
  filters,
  onOpenFilters,
  filterOpen,
  filterDraft,
  onFilterDraftChange,
  onCloseFilters,
  onClearFilters,
  onApplyFilters,
  sort,
  sortOpen,
  onToggleSort,
  onPickSort,
  onCloseSort,
  onAddSession,
  sessions,
  onOpenSession,
  bottomTab,
  onBottomTabChange,
}: {
  name: string;
  tab: "my_sessions" | "social_feed" | "leaderboards";
  onTabChange: (value: "my_sessions" | "social_feed" | "leaderboards") => void;
  filters: SessionFilters;
  onOpenFilters: () => void;
  filterOpen: boolean;
  filterDraft: SessionFilters;
  onFilterDraftChange: (next: SessionFilters) => void;
  onCloseFilters: () => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  sort: "New" | "Old" | "A-Z";
  sortOpen: boolean;
  onToggleSort: () => void;
  onPickSort: (value: "New" | "Old" | "A-Z") => void;
  onCloseSort: () => void;
  onAddSession: () => void;
  sessions: Session[];
  onOpenSession: (sessionId: string) => void;
  bottomTab: "sessions" | "techniques" | "you";
  onBottomTabChange: (next: "sessions" | "techniques" | "you") => void;
}) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    const search = filters.search.trim().toLowerCase();
    if (search) {
      list = list.filter((session) => {
        const haystack = `${session.location} ${session.type} ${session.notes} ${session.caption}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    if (filters.sessionTypes.length > 0) {
      list = list.filter((session) => (session.type ? filters.sessionTypes.includes(session.type) : false));
    }

    if (filters.minSatisfaction > 0) {
      list = list.filter((session) => session.satisfaction >= filters.minSatisfaction);
    }

    if (filters.startDate) {
      list = list.filter((session) => session.date >= filters.startDate);
    }

    if (filters.endDate) {
      list = list.filter((session) => session.date <= filters.endDate);
    }

    if (filters.location.trim()) {
      const locationQuery = filters.location.trim().toLowerCase();
      list = list.filter((session) => session.location.toLowerCase().includes(locationQuery));
    }

    if (filters.submission.trim()) {
      const submissionQuery = filters.submission.trim().toLowerCase();
      list = list.filter((session) =>
        session.submissionEntries.some((entry) => entry.name.toLowerCase().includes(submissionQuery)),
      );
    }

    if (sort === "Old") {
      list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    } else if (sort === "A-Z") {
      list.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    } else {
      list.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
    }

    return list;
  }, [filters, sessions, sort]);

  const sessionsFound = filteredSessions.length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200">
              <UserIcon />
            </div>
            <p className="text-lg font-semibold">{name || "You"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Help"
              className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/20"
            >
              <HelpIcon />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <BellIcon />
            </button>
            <button
              type="button"
              aria-label="Search"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <MagnifierIcon />
            </button>
          </div>
        </header>

        <nav className="mt-5 flex items-end justify-between gap-6 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => onTabChange("my_sessions")}
            className={`relative text-sm font-semibold transition ${
              tab === "my_sessions" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            My Sessions
            {tab === "my_sessions" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-16 rounded-full bg-blue-500" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("social_feed")}
            className={`relative text-sm font-semibold transition ${
              tab === "social_feed" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Social Feed
            {tab === "social_feed" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-16 rounded-full bg-blue-500" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("leaderboards")}
            className={`relative text-sm font-semibold transition ${
              tab === "leaderboards" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Leaderboards
            {tab === "leaderboards" ? (
              <span className="absolute -bottom-3 left-0 h-0.5 w-16 rounded-full bg-blue-500" />
            ) : null}
          </button>
        </nav>

        {tab !== "my_sessions" ? (
          <main className="mt-10 flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-300">
            <p className="text-sm font-semibold text-white">
              {tab === "social_feed" ? "Social Feed" : "Leaderboards"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Under construction.</p>
          </main>
        ) : (
          <main className="mt-5 flex-1">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onOpenFilters}
                className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <SearchIcon />
                <span className={`text-sm ${filters.search ? "text-zinc-200" : "text-zinc-600"}`}>
                  {filters.search || "Search Sessions"}
                </span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  {sort}
                  <ChevronDownSmallIcon />
                </button>
                {sortOpen ? (
                  <div className="absolute right-0 top-12 w-36 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
                    {(["New", "Old", "A-Z"] as const).map((option) => {
                      const active = option === sort;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => onPickSort(option)}
                          className={`w-full px-4 py-3 text-left text-xs font-semibold transition ${
                            active ? "bg-blue-600/25 text-blue-200" : "text-zinc-200 hover:bg-white/5"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-500">{sessionsFound} sessions found</p>

            {sessionsFound === 0 ? (
              <div className="mt-14 text-center">
                <p className="text-2xl font-semibold text-white">No Training Sessions Yet</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                  Use the + button to create your first training session and start tracking your BJJ progress
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredSessions.map((session) => {
                  const expanded = session.id === expandedSessionId;
                  const submissionsCount = session.submissionEntries.reduce((sum, entry) => sum + entry.count, 0);
                  const durationLabel = formatCompactDuration(session.durationMinutes);

                  return (
                    <div
                      key={session.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setExpandedSessionId((current) => (current === session.id ? null : session.id))}
                          className="min-w-0 flex-1 text-left"
                          aria-label={expanded ? "Collapse session" : "Expand session"}
                        >
                          <p className="text-base font-semibold text-white">
                            {formatSessionCardDate(session.date)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon />
                              {formatShortTime(session.time)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <DurationIcon />
                              {durationLabel}
                            </span>
                            {session.location ? (
                              <span className="inline-flex items-center gap-1">
                                <LocationMiniIcon />
                                {session.location}
                              </span>
                            ) : null}
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Open session details"
                            onClick={() => onOpenSession(session.id)}
                            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                          >
                            <ChevronRightIcon />
                          </button>
                          <button
                            type="button"
                            aria-label={expanded ? "Collapse" : "Expand"}
                            onClick={() => setExpandedSessionId((current) => (current === session.id ? null : session.id))}
                            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                          >
                            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {session.type ? (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${sessionTypePillClass(session.type)}`}>
                            {session.type}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-zinc-300">
                          {submissionsCount} {submissionsCount === 1 ? "Submission" : "Submissions"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500">Satisfaction:</span>
                        <SessionStarRow value={session.satisfaction} />
                      </div>

                      {expanded ? (
                        <div className="mt-3">
                          <p className="text-sm text-zinc-300">{session.notes || "No notes added yet"}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        <button
          type="button"
          aria-label="Add session"
          onClick={onAddSession}
          className="fixed bottom-24 right-6 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.65)] transition hover:bg-blue-500"
        >
          <span className="text-3xl leading-none">+</span>
        </button>

        <BottomNav active={bottomTab} onChange={onBottomTabChange} />

        {sortOpen ? (
          <button
            type="button"
            aria-label="Close sort menu"
            className="fixed inset-0 z-30"
            onClick={onCloseSort}
          />
        ) : null}

        {filterOpen ? (
          <SessionFilterScreen
            draft={filterDraft}
            onDraftChange={onFilterDraftChange}
            onClose={onCloseFilters}
            onClear={onClearFilters}
            onApply={onApplyFilters}
          />
        ) : null}
      </div>
    </div>
  );
}

function SessionFilterScreen({
  draft,
  onDraftChange,
  onClose,
  onClear,
  onApply,
}: {
  draft: SessionFilters;
  onDraftChange: (next: SessionFilters) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const update = (patch: Partial<SessionFilters>) => onDraftChange({ ...draft, ...patch });

  const toggleType = (type: SessionType) => {
    const active = draft.sessionTypes.includes(type);
    update({
      sessionTypes: active
        ? draft.sessionTypes.filter((item) => item !== type)
        : [...draft.sessionTypes, type],
    });
  };

  const setSatisfaction = (value: number) => update({ minSatisfaction: value });

  const typeStyle = (type: SessionType) => {
    if (type === "Gi") return "bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/30";
    if (type === "No-Gi") return "bg-red-600/20 text-red-200 ring-1 ring-red-500/30";
    if (type === "Open Mat") return "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30";
    if (type === "Wrestling") return "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30";
    if (type === "Competition") return "bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30";
    return "bg-white/10 text-zinc-200 ring-1 ring-white/15";
  };

  const typeInactiveStyle = "bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200";

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <p className="text-lg font-semibold text-white">Filter Sessions</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <main className="mt-6 flex-1 space-y-7">
          <section className="space-y-2">
            <p className="text-sm font-semibold text-zinc-200">Search Sessions</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <SearchIcon />
              <input
                value={draft.search}
                onChange={(event) => update({ search: event.target.value })}
                placeholder="Search Sessions"
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold text-zinc-200">Date Range</p>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) => update({ startDate: event.target.value })}
                className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none"
              />
              <span className="text-sm text-zinc-500">to</span>
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) => update({ endDate: event.target.value })}
                className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none"
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold text-zinc-200">Location</p>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input
                value={draft.location}
                onChange={(event) => update({ location: event.target.value })}
                placeholder="Select location..."
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <ChevronDownSmallIcon />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold text-zinc-200">Submission</p>
            <input
              value={draft.submission}
              onChange={(event) => update({ submission: event.target.value })}
              placeholder="Search for specific submissions..."
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-zinc-200">Session Type</p>
            <div className="flex flex-wrap gap-3">
              {(["Gi", "No-Gi", "Open Mat", "Wrestling", "Competition", "Other"] as const).map((type) => {
                const active = draft.sessionTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      active ? typeStyle(type) : typeInactiveStyle
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-zinc-200">Minimum Satisfaction</p>
            <div className="flex items-center gap-3">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const active = value <= draft.minSatisfaction;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Set minimum satisfaction ${value}`}
                    onClick={() => setSatisfaction(active && value === draft.minSatisfaction ? 0 : value)}
                    className={`transition ${active ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <StarOutlineIcon filled={active} />
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClear}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onApply}
              className="h-12 flex-[1.6] rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SessionDetailScreen({
  session,
  onBack,
  onEdit,
}: {
  session: Session | null;
  onBack: () => void;
  onEdit: () => void;
}) {
  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
          <header className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <BackIcon />
            </button>
            <p className="text-lg font-semibold text-white">Session Details</p>
            <div className="w-10" />
          </header>
          <main className="mt-10 flex-1 text-center text-zinc-400">
            Session not found.
          </main>
        </div>
      </div>
    );
  }

  const submissions = session.submissionEntries.flatMap((entry) =>
    Array.from({ length: entry.count }).map(() => entry.name),
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <BackIcon />
          </button>
          <p className="text-lg font-semibold text-white">Session Details</p>
          <button
            type="button"
            aria-label="Edit session"
            onClick={onEdit}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <PencilIcon />
          </button>
        </header>

        <main className="mt-8 flex-1 space-y-7">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Date</p>
            <p className="text-sm text-zinc-200">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(`${session.date}T00:00:00`))}{" "}
              · {formatShortTime(session.time)}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Location</p>
            <p className="text-sm text-zinc-200">{session.location || "—"}</p>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Duration</p>
            <p className="text-sm text-zinc-200">{formatCompactDuration(session.durationMinutes)}</p>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Type</p>
            {session.type ? (
              <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${sessionTypePillClass(session.type)}`}>
                {session.type}
              </span>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
              Submissions ({submissions.length})
            </p>
            {submissions.length === 0 ? (
              <p className="text-sm text-zinc-500">No submissions</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {session.submissionEntries.map((entry) => (
                  <span
                    key={entry.name}
                    className="inline-flex rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    {entry.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
            <p className={`text-sm ${session.notes ? "text-zinc-200" : "text-zinc-500 italic"}`}>
              {session.notes || "No notes added yet"}
            </p>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Satisfaction Rating</p>
            <div className="flex items-center gap-3">
              <SessionStarRow value={session.satisfaction} />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Visibility</p>
            <p className="text-sm text-zinc-200">{session.visibility}</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              <ExternalLinkIcon />
              View Public Post
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

function NewSessionScreen({
  draft,
  onDraftChange,
  onCancel,
  onSave,
  onAddTechnique,
  mode,
  onDelete,
}: {
  draft: SessionDraft;
  onDraftChange: (next: SessionDraft | null) => void;
  onCancel: () => void;
  onSave: () => void;
  onAddTechnique: () => void;
  mode: "new" | "edit";
  onDelete?: () => void;
}) {
  const update = (patch: Partial<SessionDraft>) => onDraftChange({ ...draft, ...patch });
  const [notesOpen, setNotesOpen] = useState(false);
  const [tagPartnersOpen, setTagPartnersOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [submissionQuery, setSubmissionQuery] = useState("");

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (hours === 0) return `${remaining} min`;
    if (remaining === 0) return `${hours} hr`;
    return `${hours} hr ${remaining} min`;
  };

  const typeStyle = (type: SessionType) => {
    if (type === "Gi") return "bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/30";
    if (type === "No-Gi") return "bg-red-600/20 text-red-200 ring-1 ring-red-500/30";
    if (type === "Open Mat") return "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30";
    if (type === "Wrestling") return "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30";
    if (type === "Competition") return "bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30";
    return "bg-white/10 text-zinc-200 ring-1 ring-white/15";
  };

  const typeInactiveStyle = "bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200";

  const filteredSubmissions = useMemo(() => {
    const query = submissionQuery.trim().toLowerCase();
    if (!query) return [];
    const alreadySelected = new Set(draft.submissionEntries.map((entry) => entry.name.toLowerCase()));
    return submissionLibrary
      .filter((name) => name.toLowerCase().includes(query))
      .filter((name) => !alreadySelected.has(name.toLowerCase()))
      .slice(0, 8);
  }, [draft.submissionEntries, submissionQuery]);

  const addSubmission = (name: string) => {
    update({
      submissionEntries: [...draft.submissionEntries, { name, count: 1 }],
    });
    setSubmissionQuery("");
  };

  const updateSubmissionCount = (name: string, delta: number) => {
    update({
      submissionEntries: draft.submissionEntries
        .map((entry) => (entry.name === name ? { ...entry, count: entry.count + delta } : entry))
        .filter((entry) => entry.count > 0),
    });
  };

  const removeSubmission = (name: string) => {
    update({
      submissionEntries: draft.submissionEntries.filter((entry) => entry.name !== name),
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-28 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Back"
              onClick={onCancel}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <BackIcon />
            </button>
            <p className="text-lg font-semibold text-white">{mode === "edit" ? "Edit Session" : "New Session"}</p>
          </div>
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              aria-label="Delete session"
              onClick={onDelete}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <TrashIcon />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </header>

        <main className="mt-6 flex-1 space-y-7">
          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Date</p>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => update({ date: event.target.value })}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Time</p>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => update({ time: event.target.value })}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none"
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Location</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <LocationPinIcon />
              <input
                value={draft.location}
                onChange={(event) => update({ location: event.target.value })}
                placeholder="Gym name..."
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Type</p>
            <div className="flex flex-wrap gap-3">
              {(["Gi", "No-Gi", "Open Mat", "Wrestling", "Competition", "Other"] as const).map((type) => {
                const active = draft.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update({ type: active ? "" : type })}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      active ? typeStyle(type) : typeInactiveStyle
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Submissions</p>
            <div className="relative">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <SearchIcon />
                <input
                  value={submissionQuery}
                  onChange={(event) => setSubmissionQuery(event.target.value)}
                  placeholder="Search submissions..."
                  className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
                {submissionQuery.trim().length > 0 ? (
                  <button
                    type="button"
                    aria-label="Clear submission search"
                    onClick={() => setSubmissionQuery("")}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                  >
                    <XIcon />
                  </button>
                ) : null}
              </div>

              {filteredSubmissions.length > 0 ? (
                <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
                  {filteredSubmissions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addSubmission(name)}
                      className="w-full px-5 py-4 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {draft.submissionEntries.length > 0 ? (
              <div className="space-y-3 pt-2">
                {draft.submissionEntries.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="flex flex-1 items-center justify-between rounded-xl bg-red-500 px-3 py-2 text-white shadow-[0_10px_30px_rgba(239,68,68,0.25)]">
                      <button
                        type="button"
                        aria-label={`Decrease ${entry.name}`}
                        onClick={() => updateSubmissionCount(entry.name, -1)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-black/15 transition hover:bg-black/25"
                      >
                        <MinusIcon />
                      </button>

                      <p className="text-xs font-semibold">
                        {entry.count} {entry.name}
                      </p>

                      <button
                        type="button"
                        aria-label={`Increase ${entry.name}`}
                        onClick={() => updateSubmissionCount(entry.name, 1)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-black/15 transition hover:bg-black/25"
                      >
                        <PlusSmallIcon />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${entry.name}`}
                      onClick={() => removeSubmission(entry.name)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Duration</p>
            <button
              type="button"
              onClick={() => setDurationOpen(true)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none transition hover:bg-white/10"
            >
              <span>{formatDuration(draft.durationMinutes)}</span>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Photo</p>
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-zinc-300">
                <MediaIcon />
              </div>
              <div className="pt-2">
                <p className="text-sm text-zinc-500">Share a photo on BJJ Pal</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left transition hover:text-white"
            >
              <p className={`text-sm ${draft.notes.trim() ? "text-zinc-200" : "text-zinc-500"}`}>
                {draft.notes.trim() || "How did the session go? What did you work on?"}
              </p>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Satisfaction</p>
            <div className="flex items-center gap-3">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const active = value <= draft.satisfaction;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Set satisfaction ${value}`}
                    onClick={() => update({ satisfaction: active && value === draft.satisfaction ? 0 : value })}
                    className={`transition ${active ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    <StarOutlineIcon filled={active} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Tag Friends</p>
            <button
              type="button"
              onClick={() => setTagPartnersOpen(true)}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left transition hover:text-white"
            >
              <p className={`text-sm ${draft.tagFriends.trim() ? "text-zinc-200" : "text-zinc-500"}`}>
                {draft.tagFriends.trim() || "Tag training partners..."}
              </p>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Visibility</p>
            <button
              type="button"
              onClick={() => setVisibilityOpen(true)}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left transition hover:text-white"
            >
              <p className="text-sm text-zinc-200">{draft.visibility}</p>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Caption</p>
            <button
              type="button"
              onClick={() => setCaptionOpen(true)}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left transition hover:text-white"
            >
              <p className="text-sm text-zinc-500">Add a caption for your public post...</p>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <button
            type="button"
            onClick={onAddTechnique}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <LightningIcon />
            Add Technique
          </button>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </footer>
      </div>

      {notesOpen ? (
        <NotesModal
          value={draft.notes}
          placeholder="Add notes about the technique, key details, or what you learned..."
          onClose={() => setNotesOpen(false)}
          onChange={(value) => update({ notes: value })}
          title="Notes"
          max={2000}
        />
      ) : null}

      {tagPartnersOpen ? (
        <TagPartnersModal
          value={draft.tagFriends}
          limit={5}
          onChange={(value) => update({ tagFriends: value })}
          onClose={() => setTagPartnersOpen(false)}
        />
      ) : null}

      {visibilityOpen ? (
        <VisibilitySheet
          value={draft.visibility}
          onChange={(value) => update({ visibility: value })}
          onDone={() => setVisibilityOpen(false)}
        />
      ) : null}

      {durationOpen ? (
        <DurationSheet
          valueMinutes={draft.durationMinutes}
          onDone={() => setDurationOpen(false)}
          onChange={(value) => update({ durationMinutes: value })}
        />
      ) : null}

      {captionOpen ? (
        <NotesModal
          value={draft.caption}
          placeholder="Add a caption for your public post..."
          onClose={() => setCaptionOpen(false)}
          onChange={(value) => update({ caption: value.slice(0, 500) })}
          title="Caption"
          max={500}
        />
      ) : null}
    </div>
  );
}

function AddTechniqueChoiceScreen({
  onImport,
  onStartFresh,
  onClose,
}: {
  onImport: () => void;
  onStartFresh: () => void;
  onClose: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200">
              <UserIcon />
            </div>
            <p className="text-lg font-semibold">You</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <main className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/30">
            <ImportIcon />
          </div>
          <h1 className="mt-10 text-4xl font-semibold">Import Your Notes</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
            Already have techniques written down? Import them instantly and start tracking right away.
          </p>

          <button
            type="button"
            onClick={onImport}
            className="mt-12 inline-flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-full bg-blue-600 px-6 text-base font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:bg-blue-500"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <ImportIcon />
            </span>
            Import Techniques
          </button>
          <button
            type="button"
            onClick={onStartFresh}
            className="mt-3 h-12 w-full max-w-sm rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Start Fresh
          </button>
        </main>
      </div>
    </div>
  );
}

function ImportTechniquesScreen({
  promptText,
  importText,
  onImportTextChange,
  copiedPrompt,
  onCopyPrompt,
  onUseExample,
  onCancel,
  onImport,
  onClose,
}: {
  promptText: string;
  importText: string;
  onImportTextChange: (value: string) => void;
  copiedPrompt: boolean;
  onCopyPrompt: () => void | Promise<void>;
  onUseExample: () => void;
  onCancel: () => void;
  onImport: () => void;
  onClose: () => void;
}) {
  const parsedCount = useMemo(() => parseTechniqueImport(importText).length, [importText]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/15 text-blue-200 ring-1 ring-blue-500/30">
              <ImportIcon />
            </span>
            <p className="text-lg font-semibold">Import Techniques</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <p className="mt-4 text-sm text-zinc-500">
          Follow these 3 simple steps to import your notes:
        </p>
        <div className="mt-4 border-t border-white/10" />

        <main className="mt-6 flex-1 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StepBadge number={1} />
                <p className="text-sm font-semibold">Copy the ChatGPT Prompt</p>
              </div>
              <button
                type="button"
                onClick={onCopyPrompt}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                <CopyIcon />
                {copiedPrompt ? "Copied" : "Copy Prompt"}
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-zinc-300 whitespace-pre-wrap">
              {promptText}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
            <div className="flex items-center gap-3">
              <StepBadge number={2} />
              <p className="text-sm font-semibold">Go to ChatGPT</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Paste the copied prompt
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Add your technique notes below it
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Press Enter to get formatted results
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
            <div className="flex items-center gap-3">
              <StepBadge number={3} />
              <p className="text-sm font-semibold">Paste the Formatted Results</p>
            </div>

            <div className="mt-4">
              <textarea
                value={importText}
                onChange={(event) => onImportTextChange(event.target.value)}
                placeholder="Paste ChatGPT’s formatted results here..."
                className="min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">{importText.length} characters</p>
                <button
                  type="button"
                  onClick={onUseExample}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  <LightningIcon />
                  Use Example
                </button>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-zinc-200">Expected Format</p>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-zinc-400">
              <p>• Triangle Choke - Setup from closed guard</p>
              <p className="mt-1">• Armbar from Mount - Isolate arm, pivot hips</p>
              <p className="mt-1">• Kimura - Americana grip, control wrist</p>
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onImport}
              disabled={parsedCount === 0}
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Import{parsedCount > 0 ? ` (${parsedCount})` : ""}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-200 ring-1 ring-blue-500/30">
      {number}
    </span>
  );
}

function ReviewAndSaveScreen({
  candidates,
  editingId,
  isCategoryOpen,
  onClose,
  onBack,
  onSelectAll,
  onSelectNone,
  onToggleSelected,
  onStartEdit,
  onCancelEdit,
  onChange,
  onOpenCategory,
  onCloseCategory,
  onPickCategory,
  onSaveEdit,
  onSaveAll,
}: {
  candidates: ImportCandidate[];
  editingId: string | null;
  isCategoryOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onToggleSelected: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onChange: (id: string, patch: Partial<Pick<Technique, "title" | "notes">>) => void;
  onOpenCategory: () => void;
  onCloseCategory: () => void;
  onPickCategory: (category: Exclude<TechniqueCategoryKey, "All">) => void;
  onSaveEdit: () => void;
  onSaveAll: () => void;
}) {
  const selectedCount = candidates.filter((candidate) => candidate.selected).length;
  const editing = editingId ? candidates.find((candidate) => candidate.id === editingId) ?? null : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/15 text-blue-200 ring-1 ring-blue-500/30">
              <ImportIcon />
            </span>
            <p className="text-lg font-semibold">Review &amp; Save</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {candidates.length} technique{candidates.length === 1 ? "" : "s"} found
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedCount} selected for import
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              All
            </button>
            <button
              type="button"
              onClick={onSelectNone}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              None
            </button>
          </div>
        </div>

        <main className="mt-6 flex-1 space-y-4">
          {candidates.map((candidate) => {
            const isEditing = candidate.id === editingId;
            const categoryDot = categoryDotClass(candidate.category);

            return (
              <div
                key={candidate.id}
                className={`rounded-2xl border border-white/10 bg-white/5 ${
                  isEditing ? "ring-1 ring-white/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    aria-label={candidate.selected ? "Deselect technique" : "Select technique"}
                    onClick={() => onToggleSelected(candidate.id)}
                    className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full border transition ${
                      candidate.selected
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/20 bg-black/20 text-transparent hover:bg-white/5"
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{candidate.title}</p>
                    {!isEditing ? (
                      <>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${categoryPillClass(
                              candidate.category,
                            )}`}
                          >
                            {candidate.category}
                          </span>
                        </div>
                        <p className="mt-2 max-h-10 overflow-hidden text-sm text-zinc-400">
                          {candidate.notes || "No notes"}
                        </p>
                      </>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Name</p>
                          <input
                            value={candidate.title}
                            onChange={(event) => onChange(candidate.id, { title: event.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Category</p>
                          <button
                            type="button"
                            onClick={onOpenCategory}
                            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left"
                          >
                            <span className="flex items-center gap-3">
                              <span className={`h-3 w-3 rounded-full ${categoryDot}`} aria-hidden="true" />
                              <span className="text-sm font-semibold text-zinc-200">{candidate.category}</span>
                            </span>
                            <ChevronDownSmallIcon />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
                          <textarea
                            value={candidate.notes}
                            onChange={(event) => onChange(candidate.id, { notes: event.target.value })}
                            className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
                          />
                          <p className="text-right text-xs text-zinc-500">
                            {candidate.notes.length}/2000
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={onCancelEdit}
                            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/15"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={onSaveEdit}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      aria-label="Edit technique"
                      onClick={() => onStartEdit(candidate.id)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-zinc-200"
                    >
                      <PencilIcon />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onBack}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSaveAll}
              disabled={selectedCount === 0}
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Save
            </button>
          </div>
        </footer>

        {isCategoryOpen && editing ? (
          <CategoryPickerModal
            title="Select Category"
            selected={editing.category}
            onClose={onCloseCategory}
            onPick={onPickCategory}
          />
        ) : null}
      </div>
    </div>
  );
}

type TechniqueCategoryKey =
  | "All"
  | "Submission"
  | "Sweep"
  | "Takedown"
  | "Guard Pass"
  | "Guard"
  | "Control"
  | "Escape"
  | "Defense";

const techniqueCategories: Array<{ key: TechniqueCategoryKey; label: string; dot: string }> = [
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

type TechniqueLink = {
  id: string;
  title: string;
  url: string;
};

type Technique = {
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

type TechniqueDraft = Technique & { isNew?: boolean };

type ImportCandidate = Technique & { selected: boolean };

type SessionType = "Gi" | "No-Gi" | "Open Mat" | "Wrestling" | "Competition" | "Other";

type SessionFilters = {
  search: string;
  startDate: string;
  endDate: string;
  location: string;
  submission: string;
  sessionTypes: SessionType[];
  minSatisfaction: number;
};

type SessionVisibility = "Everyone" | "Friends" | "Private";

type SessionSubmissionEntry = {
  name: string;
  count: number;
};

type Session = {
  id: string;
  date: string;
  time: string;
  location: string;
  type: SessionType | "";
  submissionEntries: SessionSubmissionEntry[];
  durationMinutes: number;
  notes: string;
  satisfaction: number;
  tagFriends: string;
  visibility: SessionVisibility;
  caption: string;
};

type SessionDraft = Session;

const createDefaultTechnique = (): Technique => ({
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

const IMPORT_EXAMPLE_TEXT = `• Triangle Choke - Setup from closed guard, control arm and head, squeeze knees together
• Armbar from Mount - Isolate the arm, pivot hips over, step over head for finishing angle
• Kimura - Americana grip, control wrist and elbow, step over for leverage
• Hip Escape - Fundamental side control escape, create frames, shrimp movement
• Scissor Sweep - Timing is crucial, off-balance opponent, use leg as fulcrum
• Double Leg Takedown - Level change, penetration step, drive through opponent
• Knee Slice Pass - Pressure and angle, control far hip, slice through guard`;

const IMPORT_PROMPT_TEXT = `Using this exact format where every technique starts with a bullet point and is followed by a dash and notes:

• Triangle Choke - Setup from closed guard, control arm and head, squeeze knees together
• Armbar from Mount - Isolate the arm, pivot hips over, step over head for finishing angle
• Kimura - Americana grip, control wrist and elbow, step over for leverage
• Hip Escape - Fundamental side control escape, create frames, shrimp movement
• Scissor Sweep - Timing is crucial, off-balance opponent, use leg as fulcrum
• Double Leg Takedown - Level change, penetration step, drive through opponent
• Knee Slice Pass - Pressure and angle, control far hip, slice through guard

Convert the following BJJ notes to this format. Each line should be: • [Technique Name] - [Notes/Description]

Paste your notes here:`;

const submissionLibrary = [
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

const cryptoSafeId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

const dedupeStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

function parseTechniqueImport(text: string): Technique[] {
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

const formatDateTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

  const formatLongDateTimeLabel = (iso: string) => {
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

const formatShortTime = (time: string) => {
  const date = new Date(`1970-01-01T${time}:00`);
  if (Number.isNaN(date.getTime())) return time;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
};

const formatSessionCardDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatCompactDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours <= 0) return `${remaining}m`;
  if (remaining <= 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
};

const sessionTypePillClass = (type: SessionType) => {
  if (type === "Gi") return "bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/30";
  if (type === "No-Gi") return "bg-red-600/20 text-red-200 ring-1 ring-red-500/30";
  if (type === "Open Mat") return "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30";
  if (type === "Wrestling") return "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30";
  if (type === "Competition") return "bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30";
  return "bg-white/10 text-zinc-200 ring-1 ring-white/15";
};

function categoryDotClass(category: Exclude<TechniqueCategoryKey, "All">) {
  return (
    techniqueCategories.find((entry) => entry.key === category)?.dot ??
    "bg-zinc-400"
  );
}

function categoryPillClass(category: Exclude<TechniqueCategoryKey, "All">) {
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

function CategoryPickerModal({
  title,
  selected,
  onClose,
  onPick,
}: {
  title: string;
  selected: Exclude<TechniqueCategoryKey, "All">;
  onClose: () => void;
  onPick: (category: Exclude<TechniqueCategoryKey, "All">) => void;
}) {
  const categories = techniqueCategories
    .filter((entry) => entry.key !== "All")
    .map((entry) => entry as { key: Exclude<TechniqueCategoryKey, "All">; label: string; dot: string });

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close category picker"
        className="absolute inset-0 bg-black/65"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute left-1/2 top-[180px] w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
      >
        <div className="px-6 py-5">
          <p className="text-center text-base font-semibold text-white">{title}</p>
        </div>
        <div className="border-t border-white/10">
          {categories.map((category) => {
            const active = category.key === selected;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => onPick(category.key)}
                className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition ${
                  active ? "bg-blue-600/25 text-blue-200" : "text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${category.dot}`} aria-hidden="true" />
                  <span className={`text-sm font-semibold ${active ? "text-blue-200" : "text-white"}`}>
                    {category.label}
                  </span>
                </span>
                {active ? (
                  <span className="text-blue-200" aria-hidden="true">
                    ✓
                  </span>
                ) : (
                  <span className="text-transparent" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TechniqueDetailScreen({
  technique,
  allTechniques,
  onBack,
  onEdit,
  onToggleFavorite,
  onOpenTechnique,
}: {
  technique: Technique;
  allTechniques: Technique[];
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onOpenTechnique: (techniqueId: string) => void;
}) {
  const categoryAccent = categoryDotClass(technique.category);
  const linkedTechniques = useMemo(() => {
    const byId = new Map(allTechniques.map((item) => [item.id, item]));
    return technique.linkedTechniqueIds
      .map((id) => byId.get(id))
      .filter((item): item is Technique => Boolean(item));
  }, [allTechniques, technique.linkedTechniqueIds]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <BackIcon />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Favorite"
              onClick={onToggleFavorite}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <StarIcon filled={technique.favorite} />
            </button>
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <PencilIcon />
            </button>
          </div>
        </header>

        <main className="mt-8 flex-1 space-y-8">
          <div className="space-y-2">
            <div className="flex items-start gap-4">
              <div className={`mt-1 h-10 w-1 rounded-full ${categoryAccent}`} />
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold">{technique.title}</h1>
                <p className="mt-1 text-sm font-semibold text-red-400">{technique.category}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10" />
          </div>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Date</p>
            <p className="text-sm text-zinc-200">{formatLongDateTimeLabel(technique.dateIso)}</p>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Tags</p>
            <div className="flex flex-wrap gap-2">
              {technique.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
              <button
                type="button"
                aria-label="Edit notes"
                onClick={onEdit}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <PencilIcon />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {technique.notes || "No notes yet."}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Links &amp; References</p>
              <button
                type="button"
                aria-label="Add link"
                onClick={onEdit}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <PlusIcon />
              </button>
            </div>
            {technique.links.length === 0 ? (
              <p className="text-sm text-zinc-500">No links yet.</p>
            ) : (
              <div className="space-y-3">
                {technique.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{link.title}</p>
                      <p className="truncate text-xs text-zinc-500">{link.url}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-400">
                      <LinkIcon />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Linked Techniques</p>
              <button
                type="button"
                aria-label="Edit linked techniques"
                onClick={onEdit}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <PencilIcon />
              </button>
            </div>
            {linkedTechniques.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No linked techniques yet</p>
            ) : (
              <div className="space-y-3">
                {linkedTechniques.map((linked) => (
                  <button
                    key={linked.id}
                    type="button"
                    onClick={() => onOpenTechnique(linked.id)}
                    className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:bg-white/10"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-3 top-4 bottom-4 w-1 rounded-full ${categoryDotClass(
                        linked.category,
                      )}`}
                    />
                    <div className="pl-7">
                      <p className="text-sm font-semibold text-white">{linked.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{linked.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function TechniqueEditScreen({
  draft,
  onDraftChange,
  onCancel,
  onSave,
  onDelete,
  onImport,
  allTechniques,
}: {
  draft: TechniqueDraft;
  onDraftChange: (next: TechniqueDraft) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onImport: () => void;
  allTechniques: Technique[];
}) {
  const update = (patch: Partial<TechniqueDraft>) => onDraftChange({ ...draft, ...patch });
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [isLinkedModalOpen, setIsLinkedModalOpen] = useState(false);
  const [linkedQuery, setLinkedQuery] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  const linkLimit = 10;

  const removeLink = (id: string) => {
    update({ links: draft.links.filter((link) => link.id !== id) });
  };

  const addLinkFromDraft = () => {
    const value = linkDraft.trim();
    if (!value) return;
    if (draft.links.length >= linkLimit) return;

    update({
      links: [
        ...draft.links,
        { id: `link-${cryptoSafeId()}`, title: value, url: value },
      ],
    });
    setLinkDraft("");
  };

  const tagLimit = 10;
  const linkedLimit = 15;

  const openTagModal = () => {
    setTagQuery("");
    setIsTagModalOpen(true);
  };

  const openLinkedModal = () => {
    setLinkedQuery("");
    setIsLinkedModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-28 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Back"
              onClick={onCancel}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <BackIcon />
            </button>
            <p className="text-lg font-semibold text-white">
              {draft.isNew ? "Add Technique" : "Edit Technique"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {draft.isNew ? (
              <button
                type="button"
                aria-label="Import"
                onClick={onImport}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <ImportIcon />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Favorite"
              onClick={() => update({ favorite: !draft.favorite })}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <StarIcon filled={draft.favorite} />
            </button>
            {!draft.isNew ? (
              <button
                type="button"
                aria-label="Delete"
                onClick={onDelete}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        </header>

        <main className="mt-8 flex-1 space-y-8">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Name</p>
            <input
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Category</p>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-transparent px-1 py-2 text-left"
            >
              <span className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${categoryDotClass(draft.category)}`} />
                <span className="text-sm font-semibold text-zinc-200">{draft.category}</span>
              </span>
              <ChevronDownSmallIcon />
            </button>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Tags</p>
            <div className="flex flex-wrap items-center gap-2">
              {draft.tags.length > 0
                ? draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200"
                    >
                      {tag}
                    </span>
                  ))
                : null}
              <button
                type="button"
                aria-label="Add tags"
                onClick={openTagModal}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-black">
                  <PlusIcon />
                </span>
                {draft.tags.length === 0 ? null : <span className="text-zinc-400">Add</span>}
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
            <textarea
              value={draft.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Add notes about the technique, key details, or what you learned..."
              className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Media</p>
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-zinc-300">
                <MediaIcon />
              </div>
              <div className="pt-2">
                <p className="text-sm text-zinc-500">Add up to 3 photos or videos.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Links &amp; References</p>
              <p className="text-xs text-zinc-500">
                {draft.links.length}/{linkLimit} links
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                placeholder="Enter reference link..."
                className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  addLinkFromDraft();
                }}
              />
              <button
                type="button"
                aria-label="Add link"
                onClick={addLinkFromDraft}
                disabled={!linkDraft.trim() || draft.links.length >= linkLimit}
                className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon />
              </button>
            </div>

            {draft.links.length > 0 ? (
              <div className="space-y-3">
                {draft.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{link.title}</p>
                      <p className="truncate text-xs text-zinc-500">{link.url}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove link"
                      onClick={() => removeLink(link.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:bg-white/10"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Linked Techniques</p>
              <p className="text-xs text-zinc-500">
                {draft.linkedTechniqueIds.length}/{linkedLimit} linked
              </p>
            </div>
            <button
              type="button"
              onClick={openLinkedModal}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left transition hover:text-white"
            >
              <p className="text-sm text-zinc-500">Select related techniques...</p>
              <ChevronDownSmallIcon />
            </button>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/92 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-xl bg-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              disabled={!draft.title.trim()}
            >
              {draft.isNew ? "Add" : "Save"}
            </button>
          </div>
        </footer>
      </div>

      {isCategoryModalOpen ? (
        <CategoryPickerModal
          title="Select Category"
          selected={draft.category}
          onClose={() => setIsCategoryModalOpen(false)}
          onPick={(category) => {
            update({ category });
            setIsCategoryModalOpen(false);
          }}
        />
      ) : null}

      {isTagModalOpen ? (
        <SelectTagsModal
          query={tagQuery}
          selected={draft.tags}
          limit={tagLimit}
          onClose={() => setIsTagModalOpen(false)}
          onQueryChange={setTagQuery}
          onToggle={(tag) => {
            const active = draft.tags.includes(tag);
            if (!active && draft.tags.length >= tagLimit) return;
            update({
              tags: active ? draft.tags.filter((value) => value !== tag) : [...draft.tags, tag],
            });
          }}
          onDone={() => setIsTagModalOpen(false)}
        />
      ) : null}

      {isLinkedModalOpen ? (
        <LinkedTechniquesModal
          query={linkedQuery}
          selectedIds={draft.linkedTechniqueIds}
          limit={linkedLimit}
          techniques={allTechniques.filter((technique) => technique.id !== draft.id)}
          onClose={() => setIsLinkedModalOpen(false)}
          onQueryChange={setLinkedQuery}
          onToggle={(techniqueId) => {
            const active = draft.linkedTechniqueIds.includes(techniqueId);
            if (!active && draft.linkedTechniqueIds.length >= linkedLimit) return;
            update({
              linkedTechniqueIds: active
                ? draft.linkedTechniqueIds.filter((value) => value !== techniqueId)
                : [...draft.linkedTechniqueIds, techniqueId],
            });
          }}
          onDone={() => setIsLinkedModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a8.7 8.7 0 0 0 .1-1l2-1.2-2-3.4-2.3.5a7.2 7.2 0 0 0-1.7-1l-.4-2.3H10l-.4 2.3a7.2 7.2 0 0 0-1.7 1L5.6 9.4l-2 3.4 2 1.2a8.7 8.7 0 0 0 .1 1l-2 1.2 2 3.4 2.3-.5a7.2 7.2 0 0 0 1.7 1l.4 2.3h4l.4-2.3a7.2 7.2 0 0 0 1.7-1l2.3.5 2-3.4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" aria-hidden="true" fill="none">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 10.5 18z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="m6 15 6-6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M4 7a2 2 0 0 1 2-2h10l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 5v6h8V5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 21v-6h8v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 17.3 18.2 21l-1.7-7 5.5-4.8-7.2-.6L12 2 9.2 8.6 2 9.2l5.5 4.8L5.8 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarOutlineIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 17.3 18.2 21l-1.7-7 5.5-4.8-7.2-.6L12 2 9.2 8.6 2 9.2l5.5 4.8L5.8 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4h8v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 6l1 16h10l1-16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
      <path
        d="M12 3v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m8 9 4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M8 8h10v12H8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M13 2 4 14h7l-1 8 10-14h-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 11a2 2 0 1 0-2-2 2 2 0 0 0 2 2z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m21 15-5-5-5 6-2-2-4 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.1 9a3 3 0 1 1 4.8 2.4c-.9.6-1.4 1.1-1.4 2.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 21a2 2 0 0 1-4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MagnifierIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 10.5 18z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-500" aria-hidden="true" fill="none">
      <path
        d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function LocationMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DurationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M8 2h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7a9 9 0 1 0 9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7v6l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="m10 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M14 5h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14 19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionStarRow({ value }: { value: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return (
          <span key={starValue} className={active ? "text-amber-400" : "text-zinc-600"}>
            <StarOutlineIcon filled={active} />
          </span>
        );
      })}
    </>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M12 6v12M6 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotesModal({
  value,
  placeholder,
  onChange,
  onClose,
  title,
  max,
}: {
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
  onClose: () => void;
  title?: string;
  max?: number;
}) {
  const safeTitle = title ?? "Notes";
  const limit = max ?? 2000;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close notes"
        className="absolute inset-0 bg-black/65"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-[160px] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        <header className="flex items-center justify-between px-6 py-5">
          <p className="text-lg font-semibold text-white">{safeTitle}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <XIcon />
          </button>
        </header>
        <div className="px-6 pb-6">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value.slice(0, limit))}
            placeholder={placeholder}
            className="min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          <p className="mt-3 text-right text-xs text-zinc-500">
            {Math.min(value.length, limit)}/{limit}
          </p>
        </div>
      </div>
    </div>
  );
}

function TagPartnersModal({
  value,
  limit,
  onChange,
  onClose,
}: {
  value: string;
  limit: number;
  onChange: (next: string) => void;
  onClose: () => void;
}) {
  const normalize = (input: string) => {
    const parts = input
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const deduped: string[] = [];
    for (const part of parts) {
      const key = part.toLowerCase();
      if (deduped.some((existing) => existing.toLowerCase() === key)) continue;
      deduped.push(part);
    }
    return deduped.slice(0, Math.max(0, limit));
  };

  const [query, setQuery] = useState("");
  const [partners, setPartners] = useState<string[]>(() => normalize(value));

  const addPartner = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = normalize([...partners, trimmed].join(", "));
    setPartners(next);
    setQuery("");
  };

  const removePartner = (name: string) => {
    const next = partners.filter((partner) => partner !== name);
    setPartners(next);
  };

  const canAddMore = partners.length < limit;

  const save = () => {
    onChange(partners.join(", "));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close tag partners"
        className="absolute inset-0 bg-black/65"
        onClick={save}
      />
      <div className="absolute left-1/2 top-[220px] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        <header className="flex items-center justify-between px-6 py-5">
          <p className="text-lg font-semibold text-white">Tag training partners</p>
          <p className="text-sm text-zinc-500">
            {partners.length}/{limit}
          </p>
        </header>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!canAddMore) return;
                  addPartner(query);
                }
              }}
              placeholder={canAddMore ? "Type a name and press Enter" : "Partner limit reached"}
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              aria-label="Add partner"
              disabled={!canAddMore || query.trim().length === 0}
              onClick={() => addPartner(query)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusSmallIcon />
            </button>
          </div>

          {partners.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {partners.map((partner) => (
                <span
                  key={partner}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-200"
                >
                  {partner}
                  <button
                    type="button"
                    aria-label={`Remove ${partner}`}
                    onClick={() => removePartner(partner)}
                    className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-zinc-200 transition hover:bg-white/20"
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-zinc-500">
              Add partners manually for now.
            </p>
          )}
        </div>
        <footer className="border-t border-white/10 bg-black/50 px-6 py-5">
          <button
            type="button"
            onClick={save}
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function VisibilitySheet({
  value,
  onChange,
  onDone,
}: {
  value: SessionVisibility;
  onChange: (next: SessionVisibility) => void;
  onDone: () => void;
}) {
  const options: Array<{ key: SessionVisibility; title: string; description: string }> = [
    {
      key: "Everyone",
      title: "Everyone",
      description: "This session is publicly available to all users on BJJ Pal.",
    },
    {
      key: "Private",
      title: "Private",
      description: "Keep this session private and visible only to you.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close visibility"
        className="absolute inset-0 bg-black/55"
        onClick={onDone}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-zinc-950 shadow-[0_-30px_90px_rgba(0,0,0,0.9)]">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-white">Visibility</p>
            <button
              type="button"
              onClick={onDone}
              className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Done
            </button>
          </div>

          <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {options.map((option) => {
              const active = option.key === value;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onChange(option.key)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{option.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{option.description}</p>
                  </div>
                  <span className={`text-blue-400 ${active ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DurationSheet({
  valueMinutes,
  onChange,
  onDone,
}: {
  valueMinutes: number;
  onChange: (nextMinutes: number) => void;
  onDone: () => void;
}) {
  const formatDuration = (minutesTotal: number) => {
    const safe = Math.max(0, Math.round(minutesTotal));
    const hours = Math.floor(safe / 60);
    const minutes = safe % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const normalize = (hoursRaw: number, minutesRaw: number) => {
    const safeHours = Number.isFinite(hoursRaw) ? hoursRaw : 0;
    const safeMinutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;
    const total = Math.max(0, Math.round(safeHours * 60 + safeMinutes));
    return { hours: Math.floor(total / 60), minutes: total % 60, total };
  };

  const [hours, setHours] = useState(() => Math.floor(Math.max(0, valueMinutes) / 60));
  const [minutes, setMinutes] = useState(() => Math.max(0, valueMinutes) % 60);

  const apply = (nextHours: number, nextMinutes: number) => {
    const next = normalize(nextHours, nextMinutes);
    setHours(next.hours);
    setMinutes(next.minutes);
  };

  const addMinutes = (delta: number) => {
    apply(hours, minutes + delta);
  };

  const addHours = (delta: number) => {
    apply(hours + delta, minutes);
  };

  const save = () => {
    const next = normalize(hours, minutes);
    onChange(next.total);
    onDone();
  };

  const current = normalize(hours, minutes);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close duration"
        className="absolute inset-0 bg-black/55"
        onClick={save}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-zinc-950 shadow-[0_-30px_90px_rgba(0,0,0,0.9)]">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-white">Duration</p>
            <button
              type="button"
              onClick={save}
              className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Done
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">HR</p>
              <input
                inputMode="numeric"
                type="number"
                min={0}
                max={24}
                value={hours}
                onChange={(event) => apply(Number(event.target.value), minutes)}
                className="mt-3 h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-2xl font-semibold text-zinc-100 outline-none"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">MIN</p>
              <input
                inputMode="numeric"
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(event) => apply(hours, Number(event.target.value))}
                className="mt-3 h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-2xl font-semibold text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addMinutes(-5)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              -5 min
            </button>
            <button
              type="button"
              onClick={() => addMinutes(5)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              +5 min
            </button>
            <button
              type="button"
              onClick={() => addMinutes(15)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => addMinutes(30)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              +30 min
            </button>
            <button
              type="button"
              onClick={() => addHours(1)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              +1 hr
            </button>
          </div>

          <p className="mt-5 text-sm text-zinc-400">Total: {formatDuration(current.total)}</p>
        </div>
      </div>
    </div>
  );
}

function SessionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M7 21h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-6 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookIconFilled() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M7 4.5h10a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V7.5a3 3 0 0 1 3-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 4.5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
      <path
        d="M4 19V5M20 19H4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 15v-4M12 15V7M16 15v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
