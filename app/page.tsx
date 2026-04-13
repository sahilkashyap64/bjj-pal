"use client";

import { useMemo, useState } from "react";

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
  const [doneOnboarding, setDoneOnboarding] = useState(false);

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

    setDoneOnboarding(true);
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

  if (doneOnboarding) {
    return <MainScreen name={name} />;
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

function MainScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Welcome back</p>
            <h1 className="text-3xl font-semibold">{name}&apos;s Library</h1>
          </div>
          <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-zinc-300">
            Settings
          </button>
        </header>

        <main className="mt-10 grid flex-1 gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-blue-500/40 bg-blue-600/10 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-blue-300">Action</p>
            <h2 className="mt-3 text-3xl font-bold">Add technique to your collection</h2>
            <p className="mt-2 text-zinc-300">
              Tap the + button to capture a technique from class and save key details.
            </p>
            <button className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold">
              + Add Technique
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
            <h2 className="text-2xl font-semibold">Sessions</h2>
            <p className="mt-2 text-zinc-400">Under construction.</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
            <h2 className="text-2xl font-semibold">Systems</h2>
            <p className="mt-2 text-zinc-400">Under construction.</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
            <h2 className="text-2xl font-semibold">Discover</h2>
            <p className="mt-2 text-zinc-400">Under construction.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
