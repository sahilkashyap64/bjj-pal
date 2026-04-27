import { useEffect, useMemo, useRef, useState } from "react";

import {
  romanizeHindiTranscript,
  cryptoSafeId,
  categoryDotClass,
  categoryPillClass,
  formatLongDateTimeLabel,
  parseTechniqueImport,
  techniqueCategories,
  toExternalUrl,
  type ImportCandidate,
  type Technique,
  type TechniqueCategoryKey,
  type TechniqueDraft,
} from "../lib/domain";
import { deleteVoiceNote } from "../lib/storage";
import {
  BackIcon,
  ChevronDownSmallIcon,
  CopyIcon,
  ImportIcon,
  LightningIcon,
  LinkIcon,
  MediaIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "./icons";
import { VoiceNotePlayer, VoiceNoteRecorder } from "./sessions";

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

export function TagPickerScreen({
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

export function SelectTagsModal({
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

export function LinkedTechniquesModal({
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

export function AddTechniqueChoiceScreen({
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

export function ImportTechniquesScreen({
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

export function StepBadge({ number }: { number: number }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-200 ring-1 ring-blue-500/30">
      {number}
    </span>
  );
}

export function ReviewAndSaveScreen({
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

export function CategoryPickerModal({
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

export function TechniqueDetailScreen({
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
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Voice Note</p>
              <button
                type="button"
                aria-label="Edit voice note"
                onClick={onEdit}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              >
                <PencilIcon />
              </button>
            </div>
            {technique.voiceNoteId ? (
              <VoiceNotePlayer
                voiceNoteId={technique.voiceNoteId}
                transcript={technique.voiceNoteTranscript}
                romanizedTranscript={technique.voiceNoteTranscriptRomanized}
              />
            ) : (
              <p className="text-sm text-zinc-500">No voice note yet.</p>
            )}
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
                  <a
                    key={link.id}
                    href={toExternalUrl(link.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{link.title}</p>
                      <p className="truncate text-xs text-zinc-500">{link.url}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-400">
                      <LinkIcon />
                    </span>
                  </a>
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

export function TechniqueEditScreen({
  draft,
  onDraftChange,
  onCancel,
  onSave,
  onDelete,
  onImport,
  allTechniques,
  transcriptLanguage,
  onTranscriptLanguageChange,
}: {
  draft: TechniqueDraft;
  onDraftChange: (next: TechniqueDraft) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onImport: () => void;
  allTechniques: Technique[];
  transcriptLanguage?: string;
  onTranscriptLanguageChange: (language: string) => void;
}) {
  const update = (patch: Partial<TechniqueDraft>) => onDraftChange({ ...draft, ...patch });
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [isLinkedModalOpen, setIsLinkedModalOpen] = useState(false);
  const [linkedQuery, setLinkedQuery] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [voiceToast, setVoiceToast] = useState<null | { message: string; at: number }>(null);
  const voiceToastTimeoutRef = useRef<number | null>(null);

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

  const deleteDraftVoiceNote = async () => {
    const id = typeof draft.voiceNoteId === "string" ? draft.voiceNoteId : "";
    if (!id) return;
    const ok = window.confirm("Remove this voice note from the technique?");
    if (!ok) return;
    await deleteVoiceNote(id).catch(() => {});
    update({ voiceNoteId: null, voiceNoteTranscript: null, voiceNoteTranscriptRomanized: null });
  };

  useEffect(() => {
    return () => {
      if (voiceToastTimeoutRef.current) window.clearTimeout(voiceToastTimeoutRef.current);
    };
  }, []);

  const showVoiceToast = (message: string) => {
    setVoiceToast({ message, at: Date.now() });
    if (voiceToastTimeoutRef.current) window.clearTimeout(voiceToastTimeoutRef.current);
    voiceToastTimeoutRef.current = window.setTimeout(() => setVoiceToast(null), 2000);
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

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Voice Note</p>
            {draft.voiceNoteId ? (
              <div className="space-y-3">
                <VoiceNotePlayer
                  voiceNoteId={draft.voiceNoteId}
                  transcript={draft.voiceNoteTranscript}
                  romanizedTranscript={draft.voiceNoteTranscriptRomanized}
                  onDelete={deleteDraftVoiceNote}
                />
              </div>
            ) : (
              <VoiceNoteRecorder
                language={transcriptLanguage}
                onLanguageChange={onTranscriptLanguageChange}
                onSaved={({ id, transcript }) => {
                  const romanizedTranscript = transcript ? romanizeHindiTranscript(transcript) : null;
                  update({
                    voiceNoteId: id,
                    voiceNoteTranscript: transcript ?? null,
                    voiceNoteTranscriptRomanized: romanizedTranscript,
                  });
                  showVoiceToast(transcript && transcript.trim() ? "Voice note + transcript saved" : "Voice note saved");
                }}
              />
            )}
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
                    <a
                      href={toExternalUrl(link.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-semibold text-zinc-200">{link.title}</p>
                      <p className="truncate text-xs text-zinc-500">{link.url}</p>
                    </a>
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

      {voiceToast ? (
        <div className="fixed bottom-[92px] left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(0,0,0,0.75)] backdrop-blur">
            {voiceToast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
