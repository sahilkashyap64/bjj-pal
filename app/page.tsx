"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [belt, setBelt] = useState<Belt>("White");
  const [stripes, setStripes] = useState(0);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [screen, setScreen] = useState<"onboarding" | "ready" | "main">("onboarding");

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

  if (screen === "main") {
    return <MainScreen name={name} />;
  }

  if (screen === "ready") {
    return (
      <ReadyScreen
        name={name}
        belt={belt}
        stripes={stripes}
        onContinue={() => setScreen("main")}
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
              <FlowRollMark />
            </div>
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                {name.trim() ? `${name.trim()}, ` : ""}FlowRoll is ready!
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

function FlowRollMark() {
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
  const [screen, setScreen] = useState<"list" | "detail" | "edit" | "add" | "import">("list");
  const [activeTechniqueId, setActiveTechniqueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "systems" | "discover">("library");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
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

  const [draftTechnique, setDraftTechnique] = useState<TechniqueDraft | null>(null);

  const [techniques, setTechniques] = useState<Technique[]>(() => {
    try {
      if (typeof window === "undefined") return [createDefaultTechnique()];
      const raw = window.localStorage.getItem("flowroll_techniques_v1");
      if (!raw) return [createDefaultTechnique()];
      const parsed = JSON.parse(raw) as Technique[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [createDefaultTechnique()];
      return parsed;
    } catch {
      return [createDefaultTechnique()];
    }
  });

  const fabRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filterRef = useRef<HTMLButtonElement | null>(null);
  const tagRef = useRef<HTMLButtonElement | null>(null);
  const techniqueCardRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    try {
      window.localStorage.setItem("flowroll_techniques_v1", JSON.stringify(techniques));
    } catch {
      // ignore
    }
  }, [techniques]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      try {
        const done = window.localStorage.getItem("flowroll_tour_done") === "1";
        setShowTour(!done);
        setTourStep(0);
      } catch {
        setShowTour(true);
        setTourStep(0);
      }
    });
  }, []);

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
    try {
      window.localStorage.setItem("flowroll_tour_done", "1");
    } catch {
      // ignore
    }
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

  const openImport = () => {
    setImportText("");
    setCopiedPrompt(false);
    setLastCopiedPromptAt(null);
    setScreen("import");
  };

  const importTechniquesFromText = (text: string) => {
    const parsed = parseTechniqueImport(text);
    if (parsed.length === 0) return;

    setTechniques((current) => [...parsed, ...current]);
    setScreen("list");
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

  if (screen === "add") {
    return (
      <AddTechniqueChoiceScreen
        onStartFresh={() => startNewTechniqueDraft()}
        onImport={openImport}
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
        onCancel={() => setScreen("list")}
        onImport={() => importTechniquesFromText(importText)}
        onClose={() => setScreen("list")}
      />
    );
  }

  if (screen === "detail" && activeTechnique) {
    return (
      <TechniqueDetailScreen
        technique={activeTechnique}
        onBack={() => setScreen("list")}
        onEdit={() => startEditTechnique(activeTechnique)}
        onToggleFavorite={() => toggleFavorite(activeTechnique.id)}
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
        onOpenTags={() => openTags("technique", draftTechnique.tags)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200">
              <UserIcon />
            </div>
            <p className="text-lg font-semibold">{name || "Sahil"}</p>
          </div>
          <button
            type="button"
            aria-label="Settings"
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
                className="mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.5)]"
                role="button"
                tabIndex={0}
                onClick={() => openTechnique(technique.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openTechnique(technique.id);
                }}
              >
                <div className="px-5 py-4">
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
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                      {technique.category}
                    </span>
                    {technique.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {technique.tags.length > 2 ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                        +{technique.tags.length - 2}
                      </span>
                    ) : null}
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

        <BottomNav />

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
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-3 text-xs text-zinc-500">
        <button type="button" className="flex flex-col items-center gap-1">
          <SessionsIcon />
          Sessions
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-blue-400">
          <BookIconFilled />
          Techniques
        </button>
        <button type="button" className="flex flex-col items-center gap-1">
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

type TechniqueCategoryKey =
  | "All"
  | "Submission"
  | "Sweep"
  | "Takedown"
  | "Guard Pass"
  | "Guard"
  | "Control"
  | "Escape";

const techniqueCategories: Array<{ key: TechniqueCategoryKey; label: string; dot: string }> = [
  { key: "All", label: "All", dot: "bg-zinc-400" },
  { key: "Submission", label: "Submission", dot: "bg-red-500" },
  { key: "Sweep", label: "Sweep", dot: "bg-orange-500" },
  { key: "Takedown", label: "Takedown", dot: "bg-sky-500" },
  { key: "Guard Pass", label: "Guard Pass", dot: "bg-emerald-500" },
  { key: "Guard", label: "Guard", dot: "bg-green-500" },
  { key: "Control", label: "Control", dot: "bg-pink-500" },
  { key: "Escape", label: "Escape", dot: "bg-yellow-400" },
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
  favorite: boolean;
};

type TechniqueDraft = Technique & { isNew?: boolean };

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
      url: "https://www.youtube.com/watch?v=2Oj7l",
    },
  ],
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

function categoryDotClass(category: Exclude<TechniqueCategoryKey, "All">) {
  return (
    techniqueCategories.find((entry) => entry.key === category)?.dot ??
    "bg-zinc-400"
  );
}

function TechniqueDetailScreen({
  technique,
  onBack,
  onEdit,
  onToggleFavorite,
}: {
  technique: Technique;
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
}) {
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
              <div className="mt-1 h-10 w-1 rounded-full bg-red-500" />
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
            <p className="text-sm text-zinc-500 italic">No linked techniques yet</p>
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
  onOpenTags,
}: {
  draft: TechniqueDraft;
  onDraftChange: (next: TechniqueDraft) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onOpenTags: () => void;
}) {
  const update = (patch: Partial<TechniqueDraft>) => onDraftChange({ ...draft, ...patch });

  const addLink = () => {
    update({
      links: [
        ...draft.links,
        { id: `link-${cryptoSafeId()}`, title: "New link", url: "" },
      ],
    });
  };

  const updateLink = (id: string, patch: Partial<TechniqueLink>) => {
    update({
      links: draft.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    });
  };

  const removeLink = (id: string) => {
    update({ links: draft.links.filter((link) => link.id !== id) });
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
            <p className="text-lg font-semibold text-white">Edit Technique</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Favorite"
              onClick={() => update({ favorite: !draft.favorite })}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <StarIcon filled={draft.favorite} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={onDelete}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
            >
              <TrashIcon />
            </button>
          </div>
        </header>

        <main className="mt-8 flex-1 space-y-8">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Name</p>
            <input
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Technique name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Category</p>
            <button
              type="button"
              onClick={() => {}}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${categoryDotClass(draft.category)}`} />
                <span className="text-sm font-semibold text-zinc-200">{draft.category}</span>
              </span>
              <ChevronDownSmallIcon />
            </button>
            <div className="grid grid-cols-2 gap-2">
              {techniqueCategories
                .filter((entry) => entry.key !== "All")
                .map((entry) => {
                  const key = entry.key as Exclude<TechniqueCategoryKey, "All">;
                  const active = key === draft.category;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update({ category: key })}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        active ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${entry.dot}`} aria-hidden="true" />
                      {entry.label}
                    </button>
                  );
                })}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Tags</p>
            <div className="flex flex-wrap items-center gap-2">
              {draft.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => update({ tags: draft.tags.filter((value) => value !== tag) })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                  aria-label={`Remove tag ${tag}`}
                >
                  {tag} <span aria-hidden="true" className="text-zinc-400">×</span>
                </button>
              ))}
              <button
                type="button"
                aria-label="Add tags"
                onClick={onOpenTags}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-zinc-200"
              >
                <PlusIcon />
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
            <textarea
              value={draft.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Write notes..."
              className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Links &amp; References</p>
              <button
                type="button"
                aria-label="Add link"
                onClick={addLink}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <PlusIcon />
              </button>
            </div>

            {draft.links.length === 0 ? (
              <input
                placeholder="Enter reference link..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const value = (event.target as HTMLInputElement).value.trim();
                  if (!value) return;
                  update({
                    links: [
                      ...draft.links,
                      { id: `link-${cryptoSafeId()}`, title: value, url: value },
                    ],
                  });
                  (event.target as HTMLInputElement).value = "";
                }}
              />
            ) : (
              <div className="space-y-3">
                {draft.links.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-200">Link</p>
                      <button
                        type="button"
                        aria-label="Remove link"
                        onClick={() => removeLink(link.id)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:bg-white/10"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <input
                      value={link.title}
                      onChange={(event) => updateLink(link.id, { title: event.target.value })}
                      placeholder="Title"
                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                    <input
                      value={link.url}
                      onChange={(event) => updateLink(link.id, { url: event.target.value })}
                      placeholder="URL"
                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      {draft.links.indexOf(link) + 1}/{draft.links.length} links
                    </p>
                  </div>
                ))}
              </div>
            )}
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
              className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </footer>
      </div>
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
