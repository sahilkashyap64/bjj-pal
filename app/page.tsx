"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  BackIcon,
  BookIconFilled,
  ChevronDownIcon,
  ChevronDownSmallIcon,
  ChevronUpIcon,
  ClockIcon,
  FlowIcon,
  GearIcon,
  LightningIcon,
  MediaIcon,
  PencilIcon,
  SaveIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "./components/icons";
import { BottomNav } from "./components/navigation";
import { ChallengeStep, NameStep, RankStep, ReadyScreen } from "./components/onboarding";
import {
  NewSessionScreen,
  SelectTrainingSessionScreen,
  SessionDetailScreen,
  SessionsHomeScreen,
} from "./components/sessions";
import {
  AddTechniqueChoiceScreen,
  ImportTechniquesScreen,
  ReviewAndSaveScreen,
  TagPickerScreen,
  TechniqueDetailScreen,
  TechniqueEditScreen,
} from "./components/techniques";
import {
  IMPORT_EXAMPLE_TEXT,
  IMPORT_PROMPT_TEXT,
  belts,
  categoryDotClass,
  createDefaultTechnique,
  cryptoSafeId,
  dedupeStrings,
  formatDateTimeLabel,
  parseTechniqueImport,
  romanizeHindiTranscript,
  stripeOptionsForBelt,
  techniqueCategories,
  type Belt,
  type ImportCandidate,
  type Session,
  type SessionDraft,
  type SessionFilters,
  type SessionSubmissionEntry,
  type Technique,
  type TechniqueCategoryKey,
  type TechniqueDraft,
} from "./lib/domain";
import {
  createBackup,
  deleteVoiceNote,
  loadProfile,
  loadSessionDefaults,
  loadSessions,
  loadTechniques,
  loadThemePreference,
  loadTourDone,
  migrateLocalStorageToLocalForageIfNeeded,
  restoreBackup,
  saveSessionDefaults,
  saveSessions,
  saveTechniques,
  saveThemePreference,
  saveTourDone,
  upsertProfile,
} from "./lib/storage";

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [belt, setBelt] = useState<Belt>("White");
  const [stripes, setStripes] = useState(0);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [screen, setScreen] = useState<"onboarding" | "ready" | "main">("onboarding");
  const backHandlerRef = useRef<() => boolean>(() => false);

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

  backHandlerRef.current = () => {
    if (screen === "ready") {
      setScreen("onboarding");
      return true;
    }
    if (screen === "onboarding" && step > 0) {
      setStep((current) => Math.max(0, current - 1));
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (screen === "main") return;

    const GUARD_STATE = { bjjpal_back_guard: true } as const;
    const pushGuard = () => {
      window.history.pushState(GUARD_STATE, "", window.location.href);
    };

    if (!window.history.state?.bjjpal_back_guard) {
      window.history.replaceState(GUARD_STATE, "", window.location.href);
      pushGuard();
    }

    const onPopState = () => {
      const handled = backHandlerRef.current();
      if (handled) {
        pushGuard();
        return;
      }
      const exit = window.confirm("Exit BJJ Pal?");
      if (!exit) {
        pushGuard();
        return;
      }
      window.history.back();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [screen]);

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
  const [themePreference, setThemePreference] = useState<"system" | "dark" | "light">("system");
  const [youRange, setYouRange] = useState<"All Time" | "This Week" | "This Month" | "This Year">("This Month");
  const [youRangeOpen, setYouRangeOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
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
  const [sessionScreen, setSessionScreen] = useState<"home" | "new" | "detail" | "edit" | "day">("home");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [sessionDayIso, setSessionDayIso] = useState<string | null>(null);
  const [sessionDayReturnTab, setSessionDayReturnTab] = useState<"you" | "sessions">("sessions");
  const [techniqueReturnToSession, setTechniqueReturnToSession] = useState<null | { mode: "new" | "edit" }>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([createDefaultTechnique()]);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof loadProfile>>>(null);
  const [sessionDefaults, setSessionDefaults] = useState<Awaited<ReturnType<typeof loadSessionDefaults>>>({
    version: 1,
    recentLocations: [],
    partnerNames: [],
    recentDurations: [],
    lastDurationMinutes: 90,
    seededExampleSession: false,
    transcriptLanguage: undefined,
  });
  const backHandlerRef = useRef<() => boolean>(() => false);

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

        const techniqueIdsRaw = (session as { techniqueIds?: unknown }).techniqueIds;
        const techniqueIds = Array.isArray(techniqueIdsRaw)
          ? techniqueIdsRaw.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          : [];

        const voiceNoteIdRaw = (session as { voiceNoteId?: unknown }).voiceNoteId;
        const voiceNoteId =
          typeof voiceNoteIdRaw === "string" && voiceNoteIdRaw.trim().length > 0 ? voiceNoteIdRaw.trim() : null;

        const voiceNoteTranscriptRaw = (session as { voiceNoteTranscript?: unknown }).voiceNoteTranscript;
        const voiceNoteTranscript =
          typeof voiceNoteTranscriptRaw === "string" && voiceNoteTranscriptRaw.trim().length > 0
            ? voiceNoteTranscriptRaw
            : null;

        const voiceNoteTranscriptRomanizedRaw = (session as { voiceNoteTranscriptRomanized?: unknown }).voiceNoteTranscriptRomanized;
        const voiceNoteTranscriptRomanized =
          typeof voiceNoteTranscriptRomanizedRaw === "string" && voiceNoteTranscriptRomanizedRaw.trim().length > 0
            ? voiceNoteTranscriptRomanizedRaw
            : voiceNoteTranscript
              ? romanizeHindiTranscript(voiceNoteTranscript)
              : null;

        return {
          ...session,
          submissionEntries,
          techniqueIds,
          voiceNoteId,
          voiceNoteTranscript,
          voiceNoteTranscriptRomanized,
        } as Session;
      });
  };

  const normalizeTechniques = (input: Technique[]) => {
    return input
      .filter((technique): technique is Technique => Boolean(technique) && typeof technique === "object")
      .map((technique) => {
        const voiceNoteIdRaw = (technique as { voiceNoteId?: unknown }).voiceNoteId;
        const voiceNoteId =
          typeof voiceNoteIdRaw === "string" && voiceNoteIdRaw.trim().length > 0 ? voiceNoteIdRaw.trim() : null;

        const voiceNoteTranscriptRaw = (technique as { voiceNoteTranscript?: unknown }).voiceNoteTranscript;
        const voiceNoteTranscript =
          typeof voiceNoteTranscriptRaw === "string" && voiceNoteTranscriptRaw.trim().length > 0
            ? voiceNoteTranscriptRaw
            : null;

        const voiceNoteTranscriptRomanizedRaw = (technique as { voiceNoteTranscriptRomanized?: unknown })
          .voiceNoteTranscriptRomanized;
        const voiceNoteTranscriptRomanized =
          typeof voiceNoteTranscriptRomanizedRaw === "string" && voiceNoteTranscriptRomanizedRaw.trim().length > 0
            ? voiceNoteTranscriptRomanizedRaw
            : voiceNoteTranscript
              ? romanizeHindiTranscript(voiceNoteTranscript)
              : null;

        return {
          ...technique,
          voiceNoteId,
          voiceNoteTranscript,
          voiceNoteTranscriptRomanized,
          linkedTechniqueIds: Array.isArray((technique as { linkedTechniqueIds?: unknown }).linkedTechniqueIds)
            ? (technique as { linkedTechniqueIds: string[] }).linkedTechniqueIds
            : [],
        };
      });
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

  const sessionsInRange = useMemo(() => {
    if (youRange === "All Time") return sessions;
    const today = new Date();
    const start = new Date(today);
    if (youRange === "This Week") start.setDate(today.getDate() - 6);
    if (youRange === "This Month") start.setDate(today.getDate() - 29);
    if (youRange === "This Year") start.setFullYear(today.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    const startIso = start.toISOString().slice(0, 10);
    return sessions.filter((session) => typeof session.date === "string" && session.date >= startIso);
  }, [sessions, youRange]);

  const submissionsInRange = useMemo(() => {
    return sessionsInRange.reduce((sum, session) => {
      const entries = Array.isArray(session.submissionEntries) ? session.submissionEntries : [];
      return (
        sum +
        entries.reduce((inner, entry) => inner + (typeof entry.count === "number" && Number.isFinite(entry.count) ? entry.count : 0), 0)
      );
    }, 0);
  }, [sessionsInRange]);

  const totalHoursInRange = useMemo(() => {
    const minutes = sessionsInRange.reduce(
      (sum, session) => sum + (typeof session.durationMinutes === "number" && Number.isFinite(session.durationMinutes) ? session.durationMinutes : 0),
      0,
    );
    return minutes / 60;
  }, [sessionsInRange]);

  const favoriteSubmissions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessionsInRange) {
      const entries = Array.isArray(session.submissionEntries) ? session.submissionEntries : [];
      for (const entry of entries) {
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!name) continue;
        const add = typeof entry.count === "number" && Number.isFinite(entry.count) ? entry.count : 1;
        counts.set(name, (counts.get(name) ?? 0) + add);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({ name, count, rank: index + 1 }));
  }, [sessionsInRange]);

  const calendar = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const monthLabel = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });

    const startWeekday = monthStart.getDay(); // 0 Sun..6 Sat
    const totalDays = monthEnd.getDate();
    const weeks: Array<Array<{ iso: string | null; day: number | null }>> = [];

    let currentWeek: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < startWeekday; i += 1) currentWeek.push({ iso: null, day: null });

    for (let day = 1; day <= totalDays; day += 1) {
      const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const iso = d.toISOString().slice(0, 10);
      currentWeek.push({ iso, day });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push({ iso: null, day: null });
      weeks.push(currentWeek);
    }

    const sessionsByDate = new Map<string, { count: number; minutes: number }>();
    for (const session of sessions) {
      if (typeof session.date !== "string") continue;
      const minutes =
        typeof session.durationMinutes === "number" && Number.isFinite(session.durationMinutes) ? session.durationMinutes : 0;
      const current = sessionsByDate.get(session.date) ?? { count: 0, minutes: 0 };
      sessionsByDate.set(session.date, { count: current.count + 1, minutes: current.minutes + minutes });
    }

    const selected = sessionsByDate.get(calendarSelectedDate) ?? { count: 0, minutes: 0 };
    return { monthLabel, weeks, sessionsByDate, selected };
  }, [calendarMonth, calendarSelectedDate, sessions]);

  const hoursSeries = useMemo(() => {
    const now = new Date();
    const sessionsByDate = new Map<string, number>();
    for (const session of sessionsInRange) {
      if (typeof session.date !== "string") continue;
      const minutes = typeof session.durationMinutes === "number" && Number.isFinite(session.durationMinutes) ? session.durationMinutes : 0;
      sessionsByDate.set(session.date, (sessionsByDate.get(session.date) ?? 0) + minutes);
    }

    if (youRange === "This Week" || youRange === "This Month") {
      const days = youRange === "This Week" ? 7 : 30;
      const labels: string[] = [];
      const values: number[] = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const key = day.toISOString().slice(0, 10);
        const minutes = sessionsByDate.get(key) ?? 0;
        labels.push(key.slice(5));
        values.push(minutes / 60);
      }
      return { labels, values };
    }

    const months = 12;
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let minutes = 0;
      for (const [dateKey, value] of sessionsByDate.entries()) {
        if (dateKey.startsWith(key)) minutes += value;
      }
      labels.push(key.slice(5));
      values.push(minutes / 60);
    }
    return { labels, values };
  }, [sessionsInRange, youRange]);

  const gotoSessionsForDate = (isoDate: string) => {
    setBottomTab("sessions");
    setSessionsTab("my_sessions");
    setSessionDayIso(isoDate);
    setSessionDayReturnTab("you");
    setSessionScreen("day");
    setActiveSessionId(null);
    setIsSessionSortOpen(false);
    setIsSessionFilterOpen(false);
    setShowTour(false);
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
    setYouRangeOpen(false);
    setShowTour(false);
  };

  backHandlerRef.current = () => {
    if (editProfileOpen) {
      setEditProfileOpen(false);
      setProfileOpen(true);
      return true;
    }

    if (profileOpen) {
      setProfileOpen(false);
      return true;
    }

    if (settingsOpen) {
      setSettingsOpen(false);
      setSettingsMessage(null);
      return true;
    }

    if (showTour) {
      finishTour();
      return true;
    }

    if (isTagsOpen) {
      closeTags();
      return true;
    }

    if (isFilterOpen) {
      setIsFilterOpen(false);
      return true;
    }

    if (isSessionFilterOpen) {
      setIsSessionFilterOpen(false);
      return true;
    }

    if (isSessionSortOpen) {
      setIsSessionSortOpen(false);
      return true;
    }

    if (youRangeOpen) {
      setYouRangeOpen(false);
      return true;
    }

    if (bottomTab === "sessions") {
      if (sessionScreen === "day") {
        if (sessionDayReturnTab === "you") {
          setBottomTab("you");
          setSessionScreen("home");
          setSessionDayIso(null);
          return true;
        }
        setSessionScreen("home");
        setSessionDayIso(null);
        return true;
      }
      if (sessionScreen === "new" || sessionScreen === "edit") {
        setSessionDraft(null);
        setActiveSessionId(null);
        setSessionScreen("home");
        return true;
      }
      if (sessionScreen === "detail") {
        setActiveSessionId(null);
        setSessionScreen("home");
        return true;
      }
      switchBottomTab("techniques");
      return true;
    }

    if (screen !== "list") {
      if (screen === "detail") {
        setActiveTechniqueId(null);
        setScreen("list");
        return true;
      }
      if (screen === "edit") {
        setDraftTechnique(null);
        setScreen(activeTechniqueId ? "detail" : "list");
        return true;
      }

      setImportCandidates([]);
      setEditingImportId(null);
      setIsImportCategoryOpen(false);
      setImportText("");
      setScreen("list");
      return true;
    }

    if (bottomTab === "you") {
      switchBottomTab("techniques");
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const GUARD_STATE = { bjjpal_back_guard: true } as const;
    const pushGuard = () => {
      window.history.pushState(GUARD_STATE, "", window.location.href);
    };

    if (!window.history.state?.bjjpal_back_guard) {
      window.history.replaceState(GUARD_STATE, "", window.location.href);
      pushGuard();
    }

    const onPopState = () => {
      const handled = backHandlerRef.current();
      if (handled) {
        pushGuard();
        return;
      }
      const exit = window.confirm("Exit BJJ Pal?");
      if (!exit) {
        pushGuard();
        return;
      }
      window.history.back();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
        const [loadedSessions, loadedTechniques, tourDone, loadedProfile, loadedTheme, loadedDefaults] = await Promise.all([
          loadSessions<Session>(),
          loadTechniques<Technique>(),
          loadTourDone(),
          loadProfile(),
          loadThemePreference(),
          loadSessionDefaults(),
        ]);
        if (cancelled) return;
        const normalizedSessions = normalizeSessions(loadedSessions);
        const seedExampleSession =
          normalizedSessions.length === 0 && loadedDefaults && loadedDefaults.seededExampleSession !== true;
        if (seedExampleSession) {
          const now = new Date();
          const exampleNotes = `🟢 What worked:

* Frames helped me create space in side control

🔴 I lost because:

* Elbows too wide → gave underhook

🎯 Next session focus:

* Keep elbows tight ALWAYS

🎮 Mini-game:

* Survive side control 20 sec every roll

🧠 Pattern:

* I panic when stuck`;
          const exampleLocation = (loadedDefaults.lastLocation && loadedDefaults.lastLocation.trim()) || "Crosstrain";
          const exampleSession: Session = {
            id: "session-example-notes",
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 5),
            location: exampleLocation,
            type: "No-Gi",
            submissionEntries: [],
            techniqueIds: [],
            durationMinutes: 90,
            notes: exampleNotes,
            voiceNoteId: null,
            voiceNoteTranscript: null,
            voiceNoteTranscriptRomanized: null,
            satisfaction: 0,
            tagFriends: "",
            visibility: "Private",
            caption: "",
          };
          setSessions([exampleSession]);

          const seededDefaults = {
            ...loadedDefaults,
            seededExampleSession: true,
            lastLocation: exampleLocation,
            recentLocations: dedupeStrings([exampleLocation, ...(loadedDefaults.recentLocations ?? [])]).slice(0, 8),
            lastDurationMinutes: typeof loadedDefaults.lastDurationMinutes === "number" ? loadedDefaults.lastDurationMinutes : 90,
            recentDurations: Array.from(
              new Set([90, ...(Array.isArray(loadedDefaults.recentDurations) ? loadedDefaults.recentDurations : [])].filter((value) => value > 0)),
            ).slice(0, 8),
          };
          setSessionDefaults(seededDefaults);
          saveSessionDefaults(seededDefaults).catch(() => {});
        } else {
          setSessions(normalizedSessions);
          setSessionDefaults(loadedDefaults);
        }
        const normalizedTechniques = normalizeTechniques(loadedTechniques);
        setTechniques(normalizedTechniques.length > 0 ? normalizedTechniques : [createDefaultTechnique()]);
        setProfile(loadedProfile);
        setThemePreference(loadedTheme);
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
    const [loadedSessions, loadedTechniques, tourDone, loadedProfile, loadedTheme, loadedDefaults] = await Promise.all([
      loadSessions<Session>(),
      loadTechniques<Technique>(),
      loadTourDone(),
      loadProfile(),
      loadThemePreference(),
      loadSessionDefaults(),
    ]);
    const normalizedSessions = normalizeSessions(loadedSessions);
    const seedExampleSession =
      normalizedSessions.length === 0 && loadedDefaults && loadedDefaults.seededExampleSession !== true;
    if (seedExampleSession) {
      const now = new Date();
      const exampleNotes = `🟢 What worked:

* Frames helped me create space in side control

🔴 I lost because:

* Elbows too wide → gave underhook

🎯 Next session focus:

* Keep elbows tight ALWAYS

🎮 Mini-game:

* Survive side control 20 sec every roll

🧠 Pattern:

* I panic when stuck`;
      const exampleLocation = (loadedDefaults.lastLocation && loadedDefaults.lastLocation.trim()) || "Crosstrain";
      const exampleSession: Session = {
        id: "session-example-notes",
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        location: exampleLocation,
        type: "No-Gi",
        submissionEntries: [],
        techniqueIds: [],
        durationMinutes: 90,
        notes: exampleNotes,
        voiceNoteId: null,
        voiceNoteTranscript: null,
        voiceNoteTranscriptRomanized: null,
        satisfaction: 0,
        tagFriends: "",
        visibility: "Private",
        caption: "",
      };
      setSessions([exampleSession]);

      const seededDefaults = {
        ...loadedDefaults,
        seededExampleSession: true,
        lastLocation: exampleLocation,
        recentLocations: dedupeStrings([exampleLocation, ...(loadedDefaults.recentLocations ?? [])]).slice(0, 8),
        lastDurationMinutes: typeof loadedDefaults.lastDurationMinutes === "number" ? loadedDefaults.lastDurationMinutes : 90,
        recentDurations: Array.from(
          new Set([90, ...(Array.isArray(loadedDefaults.recentDurations) ? loadedDefaults.recentDurations : [])].filter((value) => value > 0)),
        ).slice(0, 8),
      };
      setSessionDefaults(seededDefaults);
      saveSessionDefaults(seededDefaults).catch(() => {});
    } else {
      setSessions(normalizedSessions);
      setSessionDefaults(loadedDefaults);
    }
    const normalizedTechniques = normalizeTechniques(loadedTechniques);
    setTechniques(normalizedTechniques.length > 0 ? normalizedTechniques : [createDefaultTechnique()]);
    setProfile(loadedProfile);
    setThemePreference(loadedTheme);
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

  const applyThemePreference = (next: "system" | "dark" | "light") => {
    setThemePreference(next);
    if (next === "system") {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
    } else {
      document.documentElement.dataset.theme = next;
    }
    saveThemePreference(next).catch(() => {});
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
      voiceNoteId: technique.voiceNoteId ?? null,
      voiceNoteTranscript: technique.voiceNoteTranscript ?? null,
      voiceNoteTranscriptRomanized: technique.voiceNoteTranscriptRomanized ?? null,
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
      voiceNoteId: null,
      voiceNoteTranscript: null,
      voiceNoteTranscriptRomanized: null,
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
      voiceNoteId:
        typeof draftTechnique.voiceNoteId === "string" && draftTechnique.voiceNoteId.trim()
          ? draftTechnique.voiceNoteId.trim()
          : null,
      voiceNoteTranscript:
        typeof draftTechnique.voiceNoteTranscript === "string" && draftTechnique.voiceNoteTranscript.trim()
          ? draftTechnique.voiceNoteTranscript.trim()
          : null,
      voiceNoteTranscriptRomanized:
        typeof draftTechnique.voiceNoteTranscriptRomanized === "string" && draftTechnique.voiceNoteTranscriptRomanized.trim()
          ? draftTechnique.voiceNoteTranscriptRomanized.trim()
          : null,
      links: draftTechnique.links,
      linkedTechniqueIds: draftTechnique.linkedTechniqueIds,
      favorite: draftTechnique.favorite,
    };

    setTechniques((current) => {
      const exists = current.some((technique) => technique.id === next.id);
      if (!exists) return [next, ...current];
      return current.map((technique) => (technique.id === next.id ? next : technique));
    });

    if (techniqueReturnToSession) {
      setSessionDraft((current) => {
        if (!current) return current;
        const existing = Array.isArray(current.techniqueIds) ? current.techniqueIds : [];
        return { ...current, techniqueIds: dedupeStrings([...existing, next.id]) };
      });
      setDraftTechnique(null);
      setActiveTechniqueId(null);
      setScreen("list");
      setBottomTab("sessions");
      setSessionScreen(techniqueReturnToSession.mode);
      setTechniqueReturnToSession(null);
      return;
    }

    setDraftTechnique(null);
    setActiveTechniqueId(next.id);
    setScreen("detail");
  };

  const deleteTechnique = (techniqueId: string) => {
    const existing = techniques.find((technique) => technique.id === techniqueId);
    const voiceNoteId = typeof existing?.voiceNoteId === "string" ? existing.voiceNoteId : "";
    if (voiceNoteId) {
      deleteVoiceNote(voiceNoteId).catch(() => {});
    }
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
    const defaultLocation = sessionDefaults.lastLocation?.trim() || "";
    const rawDefaultDuration = sessionDefaults.lastDurationMinutes;
    const defaultDuration =
      typeof rawDefaultDuration === "number" && Number.isFinite(rawDefaultDuration) ? Math.max(0, rawDefaultDuration) : 90;
    setSessionDraft({
      id: `session-${cryptoSafeId()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      location: defaultLocation,
      type: "",
      submissionEntries: [],
      techniqueIds: [],
      durationMinutes: defaultDuration,
      notes: "",
      voiceNoteId: null,
      voiceNoteTranscript: null,
      voiceNoteTranscriptRomanized: null,
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
      techniqueIds: Array.isArray(sessionDraft.techniqueIds) ? dedupeStrings(sessionDraft.techniqueIds) : [],
      durationMinutes: sessionDraft.durationMinutes,
      notes: sessionDraft.notes.trim(),
      voiceNoteId: typeof sessionDraft.voiceNoteId === "string" && sessionDraft.voiceNoteId.trim() ? sessionDraft.voiceNoteId.trim() : null,
      voiceNoteTranscript:
        typeof sessionDraft.voiceNoteTranscript === "string" && sessionDraft.voiceNoteTranscript.trim()
          ? sessionDraft.voiceNoteTranscript.trim()
          : null,
      voiceNoteTranscriptRomanized:
        typeof sessionDraft.voiceNoteTranscriptRomanized === "string" && sessionDraft.voiceNoteTranscriptRomanized.trim()
          ? sessionDraft.voiceNoteTranscriptRomanized.trim()
          : null,
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

    const updateDefaults = (current: Awaited<ReturnType<typeof loadSessionDefaults>>) => {
      const recentLocations = dedupeStrings([next.location, ...(current.recentLocations ?? [])]).slice(0, 8);
      const partnerNamesFromSession = next.tagFriends
        .split(/[,\n;]/)
        .map((item) => item.trim())
        .filter(Boolean);
      const partnerNames = dedupeStrings([...(current.partnerNames ?? []), ...partnerNamesFromSession]).slice(0, 50);
      const nextDuration = Number.isFinite(next.durationMinutes) ? Math.max(0, Math.round(next.durationMinutes)) : 0;
      const recentDurations = Array.from(
        new Set([nextDuration, ...(Array.isArray(current.recentDurations) ? current.recentDurations : [])].filter((value) => value > 0)),
      ).slice(0, 8);
      return {
        version: 1 as const,
        lastLocation: next.location || current.lastLocation,
        lastTime: next.time || current.lastTime,
        recentLocations,
        partnerNames,
        lastDurationMinutes: nextDuration || current.lastDurationMinutes || 90,
        recentDurations,
        seededExampleSession: current.seededExampleSession,
        transcriptLanguage: current.transcriptLanguage,
      };
    };

    setSessionDefaults((current) => {
      const updated = updateDefaults(current);
      saveSessionDefaults(updated).catch(() => {});
      return updated;
    });
  };

  const setTranscriptLanguagePreference = (language: string) => {
    setSessionDefaults((current) => {
      const trimmed = language.trim();
      const updated = {
        ...current,
        transcriptLanguage: trimmed || undefined,
      };
      saveSessionDefaults(updated).catch(() => {});
      return updated;
    });
  };

  const deleteSession = (sessionId: string) => {
    const existing = sessions.find((session) => session.id === sessionId);
    const voiceNoteId = typeof existing?.voiceNoteId === "string" ? existing.voiceNoteId : "";
    if (voiceNoteId) {
      deleteVoiceNote(voiceNoteId).catch(() => {});
    }
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
          techniques={techniques}
          locationSuggestions={sessionDefaults.recentLocations}
          partnerSuggestions={sessionDefaults.partnerNames}
          durationSuggestions={sessionDefaults.recentDurations ?? []}
          transcriptLanguage={sessionDefaults.transcriptLanguage}
          onTranscriptLanguageChange={setTranscriptLanguagePreference}
          onCreateTechnique={() => {
            setTechniqueReturnToSession({ mode: "new" });
            startNewTechniqueDraft();
          }}
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
          techniques={techniques}
          locationSuggestions={sessionDefaults.recentLocations}
          partnerSuggestions={sessionDefaults.partnerNames}
          durationSuggestions={sessionDefaults.recentDurations ?? []}
          transcriptLanguage={sessionDefaults.transcriptLanguage}
          onTranscriptLanguageChange={setTranscriptLanguagePreference}
          onCreateTechnique={() => {
            setTechniqueReturnToSession({ mode: "edit" });
            startNewTechniqueDraft();
          }}
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

    if (sessionScreen === "day" && sessionDayIso) {
      return (
        <SelectTrainingSessionScreen
          isoDate={sessionDayIso}
          sessions={sessions}
          onBack={() => {
            setSessionDayIso(null);
            if (sessionDayReturnTab === "you") {
              setBottomTab("you");
              setSessionScreen("home");
              return;
            }
            setSessionScreen("home");
          }}
          onSelect={(sessionId) => {
            setActiveSessionId(sessionId);
            setSessionDraft(null);
            setSessionScreen("detail");
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
            if (techniqueReturnToSession) {
              setTechniqueReturnToSession(null);
              setScreen("list");
              setBottomTab("sessions");
              setSessionScreen(techniqueReturnToSession.mode);
              return;
            }
            setScreen(activeTechniqueId ? "detail" : "list");
          }}
          onSave={saveDraftTechnique}
          onDelete={() => deleteTechnique(draftTechnique.id)}
          onImport={() => openImportFrom("edit")}
          allTechniques={techniques}
          transcriptLanguage={sessionDefaults.transcriptLanguage}
          onTranscriptLanguageChange={setTranscriptLanguagePreference}
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
            {bottomTab === "you" ? (
              <p className="text-lg font-semibold">You</p>
            ) : (
              <p className="text-lg font-semibold">
                {(profile?.displayName && profile.displayName.trim()) ||
                  (profile?.name && profile.name.trim()) ||
                  name ||
                  "You"}
              </p>
            )}
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

        {bottomTab !== "you" ? (
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
        ) : null}

        {bottomTab === "you" ? (
          <main className="mt-6 flex-1 space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">Training Calendar</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() =>
                      setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                    }
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() =>
                      setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                    }
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                  >
                    ›
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-zinc-500">{calendar.monthLabel}</p>

              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-zinc-500">
                {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendar.weeks.flat().map((cell, index) => {
                  if (!cell.iso || !cell.day) {
                    return <div key={`empty-${index}`} className="h-10 rounded-xl" />;
                  }
                  const stats = calendar.sessionsByDate.get(cell.iso);
                  const selected = cell.iso === calendarSelectedDate;
                  const hasTraining = Boolean(stats && stats.count > 0);

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => setCalendarSelectedDate(cell.iso!)}
                      className={`relative h-10 rounded-xl text-sm font-semibold transition ${
                        selected
                          ? "bg-blue-600 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
                          : "bg-black/20 text-zinc-200 hover:bg-white/10"
                      }`}
                    >
                      {cell.day}
                      {hasTraining ? (
                        <span
                          className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                            selected ? "bg-white/90" : "bg-blue-400"
                          }`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Selected</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-200">{calendarSelectedDate}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {calendar.selected.count} session{calendar.selected.count === 1 ? "" : "s"} •{" "}
                    {Math.round((calendar.selected.minutes / 60) * 10) / 10}h
                  </p>
                </div>
                <button
                  type="button"
                  disabled={calendar.selected.count === 0}
                  onClick={() => gotoSessionsForDate(calendarSelectedDate)}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  View Sessions
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-white">Analytics</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setYouRangeOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    {youRange}
                    <ChevronDownSmallIcon />
                  </button>
                  {youRangeOpen ? (
                    <button
                      type="button"
                      aria-label="Close range picker"
                      className="fixed inset-0 z-20"
                      onClick={() => setYouRangeOpen(false)}
                    />
                  ) : null}
                  {youRangeOpen ? (
                    <div className="absolute right-0 top-12 z-30 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
                      {(["All Time", "This Week", "This Month", "This Year"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setYouRange(option);
                            setYouRangeOpen(false);
                          }}
                          className={`w-full px-5 py-4 text-left text-sm font-semibold transition ${
                            option === youRange ? "bg-blue-600/25 text-blue-200" : "text-white hover:bg-white/5"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between">
                    <LightningIcon />
                    <span className="text-xs font-semibold text-zinc-500">Sessions</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{sessionsInRange.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between">
                    <FlowIcon />
                    <span className="text-xs font-semibold text-zinc-500">Submissions</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{submissionsInRange}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between">
                    <ClockIcon />
                    <span className="text-xs font-semibold text-zinc-500">Hours</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">
                    {Math.round(totalHoursInRange * 10) / 10}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between">
                    <BookIconFilled />
                    <span className="text-xs font-semibold text-zinc-500">Techniques</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{techniques.length}</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-lg font-semibold text-white">Favourite Submissions</p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {favoriteSubmissions.length === 0 ? (
                  <p className="px-5 py-5 text-sm text-zinc-500">No submissions logged yet.</p>
                ) : (
                  favoriteSubmissions.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-zinc-200">
                        <span className="mr-2 text-xs font-bold text-blue-400">#{item.rank}</span>
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold text-zinc-400">{item.count}x</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">Total Hours Trained</p>
                <p className="text-sm font-semibold text-zinc-300">{Math.round(totalHoursInRange)} hrs</p>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                <div className="flex h-28 items-end gap-1">
                  {(() => {
                    const max = Math.max(1, ...hoursSeries.values);
                    return hoursSeries.values.map((value, index) => (
                      <div
                        key={`${hoursSeries.labels[index]}-${index}`}
                        className="flex-1 rounded-full bg-blue-500/70"
                        style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
                        title={`${hoursSeries.labels[index]}: ${Math.round(value * 10) / 10}h`}
                      />
                    ));
                  })()}
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  {youRange === "This Week"
                    ? "Last 7 days"
                    : youRange === "This Month"
                      ? "Last 30 days"
                      : "Last 12 months"}
                </p>
              </div>
            </section>
          </main>
        ) : activeTab === "library" ? (
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

        {bottomTab !== "you" ? (
          <button
            ref={fabRef}
            type="button"
            aria-label="Add technique"
            onClick={startNewTechnique}
            className="fixed bottom-24 right-6 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.65)] transition hover:bg-blue-500"
          >
            <span className="text-3xl leading-none">+</span>
          </button>
        ) : null}

        <BottomNav
          active={bottomTab}
          onChange={(next) => {
            switchBottomTab(next);
          }}
        />

        {bottomTab !== "you" && isTagsOpen ? (
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

        {bottomTab !== "you" && isFilterOpen ? (
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

        {bottomTab !== "you" && showTour && popover ? (
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

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Theme</p>
                  <div className="mt-3 flex gap-2">
                    {(["system", "dark", "light"] as const).map((value) => {
                      const active = themePreference === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!storageLoaded}
                          onClick={() => applyThemePreference(value)}
                          className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            active
                              ? "bg-white text-black"
                              : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {value === "system" ? "System" : value === "dark" ? "Dark" : "Light"}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
