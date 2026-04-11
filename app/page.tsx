"use client";

import { useMemo, useState } from "react";

type Rank = {
  belt: string;
  stripes: number;
};

const ranks: Rank[] = [
  { belt: "White", stripes: 0 },
  { belt: "White", stripes: 1 },
  { belt: "White", stripes: 2 },
  { belt: "White", stripes: 3 },
  { belt: "White", stripes: 4 },
  { belt: "Blue", stripes: 0 },
  { belt: "Blue", stripes: 1 },
  { belt: "Blue", stripes: 2 },
  { belt: "Blue", stripes: 3 },
  { belt: "Blue", stripes: 4 },
  { belt: "Purple", stripes: 0 },
  { belt: "Brown", stripes: 0 },
  { belt: "Black", stripes: 0 },
];

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
  const [rankIndex, setRankIndex] = useState(0);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [doneOnboarding, setDoneOnboarding] = useState(false);

  const activeRank = ranks[rankIndex];
  const completedSteps = useMemo(() => {
    return [name.trim().length > 0, rankIndex >= 0, selectedChallenges.length > 0];
  }, [name, rankIndex, selectedChallenges.length]);

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
              <RankStep
                name={name}
                rank={activeRank}
                onPrev={() => setRankIndex((value) => Math.max(0, value - 1))}
                onNext={() =>
                  setRankIndex((value) => Math.min(ranks.length - 1, value + 1))
                }
              />
            ) : null}
            {step === 2 ? (
              <ChallengeStep
                selected={selectedChallenges}
                onToggle={toggleChallenge}
              />
            ) : null}
          </section>

          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="h-16 w-full rounded-full bg-blue-600 text-3xl font-semibold tracking-tight shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300 disabled:shadow-none"
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
  rank,
  onPrev,
  onNext,
}: {
  name: string;
  rank: Rank;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-12 pt-8">
      <h1 className="mx-auto max-w-3xl text-center text-4xl font-semibold leading-tight sm:text-5xl">
        Hi <span className="text-blue-500">{name || "there"}</span>, what&apos;s your current rank?
      </h1>

      <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900/80 p-8">
        <p className="text-center text-4xl font-bold tracking-wide">{rank.belt} Belt</p>
        <p className="mt-3 text-center text-2xl text-zinc-300">Stripes: {rank.stripes}</p>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="h-12 flex-1 rounded-xl border border-white/20 bg-black/40 text-lg"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="h-12 flex-1 rounded-xl bg-white text-lg font-semibold text-black"
          >
            Next Rank
          </button>
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

      <div className="mx-auto mt-8 max-w-3xl space-y-3">
        {challenges.map((challenge) => {
          const active = selected.includes(challenge);

          return (
            <button
              key={challenge}
              type="button"
              onClick={() => onToggle(challenge)}
              className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-xl transition ${
                active
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-zinc-900/60 hover:border-white/30"
              }`}
            >
              <span>{challenge}</span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-sm ${
                  active ? "bg-blue-500 text-black" : "bg-zinc-700 text-zinc-300"
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
