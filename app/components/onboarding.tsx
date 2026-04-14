import type { ReactNode } from "react";

import { belts, challenges, stripeOptionsForBelt, type Belt } from "../lib/domain";
import { BookIcon, FlowIcon, TrendIcon } from "./icons";

export function NameStep({
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

export function RankStep({
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

export function ChallengeStep({
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

export function BeltPreview({ belt, stripes }: { belt: Belt; stripes: number }) {
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

export function ReadyScreen({
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

export function PathItem({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
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

export function BJJPalMark() {
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
