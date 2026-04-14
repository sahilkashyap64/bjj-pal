import { useEffect, useMemo, useRef, useState } from "react";

import { deleteVoiceNote, loadVoiceNote, saveVoiceNote } from "../lib/storage";
import {
  cryptoSafeId,
  formatCompactDuration,
  formatSessionCardDate,
  formatShortTime,
  romanizeHindiTranscript,
  sessionTypePillClass,
  submissionLibrary,
  type Session,
  type SessionDraft,
  type SessionFilters,
  type SessionType,
  type SessionVisibility,
  type Technique,
} from "../lib/domain";
import { BottomNav } from "./navigation";
import {
  BackIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronDownSmallIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  DurationIcon,
  ExternalLinkIcon,
  HelpIcon,
  LightningIcon,
  LocationMiniIcon,
  LocationPinIcon,
  MagnifierIcon,
  MediaIcon,
  MicIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  PlusSmallIcon,
  SearchIcon,
  SessionStarRow,
  StarOutlineIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "./icons";

export function SessionsHomeScreen({
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

export function SessionFilterScreen({
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

export function SessionDetailScreen({
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

          {session.voiceNoteId ? (
            <section className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Voice Note</p>
              <VoiceNotePlayer
                voiceNoteId={session.voiceNoteId}
                transcript={session.voiceNoteTranscript}
                romanizedTranscript={session.voiceNoteTranscriptRomanized}
              />
              <p className="text-xs text-zinc-500">Tip: edit the session to delete or replace this recording.</p>
            </section>
          ) : null}

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

export function NewSessionScreen({
  draft,
  onDraftChange,
  onCancel,
  onSave,
  techniques,
  locationSuggestions,
  partnerSuggestions,
  durationSuggestions,
  transcriptLanguage,
  onTranscriptLanguageChange,
  onCreateTechnique,
  mode,
  onDelete,
}: {
  draft: SessionDraft;
  onDraftChange: (next: SessionDraft | null) => void;
  onCancel: () => void;
  onSave: () => void;
  techniques: Technique[];
  locationSuggestions: string[];
  partnerSuggestions: string[];
  durationSuggestions: number[];
  transcriptLanguage?: string;
  onTranscriptLanguageChange: (language: string) => void;
  onCreateTechnique: () => void;
  mode: "new" | "edit";
  onDelete?: () => void;
}) {
  const update = (patch: Partial<SessionDraft>) => onDraftChange({ ...draft, ...patch });
  const [notesOpen, setNotesOpen] = useState(false);
  const [tagPartnersOpen, setTagPartnersOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [techniquePickerOpen, setTechniquePickerOpen] = useState(false);
  const [techniqueQuery, setTechniqueQuery] = useState("");
  const [submissionQuery, setSubmissionQuery] = useState("");
  const [locationFocused, setLocationFocused] = useState(false);
  const [voiceToast, setVoiceToast] = useState<null | { message: string; at: number }>(null);
  const voiceToastTimeoutRef = useRef<number | null>(null);

  const sessionNotesTemplate = useMemo(() => {
    return [
      "🟢 What worked:",
      "",
      "* ",
      "",
      "🔴 I lost because:",
      "",
      "* ",
      "",
      "🎯 Next session focus:",
      "",
      "* ",
      "",
      "🎮 Mini-game:",
      "",
      "* ",
      "",
      "🧠 Pattern:",
      "",
      "* ",
    ].join("\n");
  }, []);

  const applyNotesTemplate = () => {
    const existing = draft.notes.trim();
    if (existing.length > 0) {
      const shouldReplace = window.confirm("Replace your existing notes with the session template?");
      if (!shouldReplace) {
        setNotesOpen(true);
        return;
      }
    }
    update({ notes: sessionNotesTemplate });
    setNotesOpen(true);
  };

  const deleteDraftVoiceNote = async () => {
    const id = typeof draft.voiceNoteId === "string" ? draft.voiceNoteId : "";
    if (!id) return;
    const ok = window.confirm("Remove this voice note from the session?");
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

  const selectedTechniqueIds = useMemo(
    () => (Array.isArray(draft.techniqueIds) ? draft.techniqueIds : []),
    [draft.techniqueIds],
  );

  const selectedTechniques = useMemo(() => {
    const map = new Map(techniques.map((technique) => [technique.id, technique]));
    return selectedTechniqueIds.map((id) => map.get(id)).filter((value): value is Technique => Boolean(value));
  }, [selectedTechniqueIds, techniques]);

  const filteredTechniques = useMemo(() => {
    const query = techniqueQuery.trim().toLowerCase();
    const list = techniques.slice().sort((a, b) => a.title.localeCompare(b.title));
    if (!query) return list;
    return list.filter((technique) => {
      const haystack = `${technique.title} ${technique.category} ${technique.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [techniqueQuery, techniques]);

  const toggleTechnique = (techniqueId: string) => {
    const current = new Set(selectedTechniqueIds);
    if (current.has(techniqueId)) current.delete(techniqueId);
    else current.add(techniqueId);
    update({ techniqueIds: Array.from(current) });
  };

  const removeTechnique = (techniqueId: string) => {
    update({ techniqueIds: selectedTechniqueIds.filter((id) => id !== techniqueId) });
  };

  const filteredLocations = useMemo(() => {
    const base = Array.isArray(locationSuggestions) ? locationSuggestions : [];
    const query = draft.location.trim().toLowerCase();
    const list = base.filter((value) => value.trim().length > 0);
    if (!query) return list.slice(0, 6);
    return list.filter((value) => value.toLowerCase().includes(query)).slice(0, 6);
  }, [draft.location, locationSuggestions]);

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
            <div className="relative">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <LocationPinIcon />
              <input
                value={draft.location}
                onChange={(event) => update({ location: event.target.value })}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setTimeout(() => setLocationFocused(false), 120)}
                placeholder="Gym name..."
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              </div>

              {locationFocused && filteredLocations.length > 0 ? (
                <div className="absolute left-0 right-0 top-[54px] z-20 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
                  {filteredLocations.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => update({ location: value })}
                      className="w-full px-5 py-4 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notes</p>
              <button
                type="button"
                onClick={applyNotesTemplate}
                className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Use template
              </button>
            </div>
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
            onClick={() => setTechniquePickerOpen(true)}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <LightningIcon />
            Add Technique
          </button>

          {selectedTechniques.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedTechniques.map((technique) => (
                <div
                  key={technique.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-blue-600/20 px-4 py-3 shadow-[0_10px_30px_rgba(59,130,246,0.15)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-blue-100">{technique.title}</p>
                    <p className="truncate text-xs text-blue-200/70">{technique.category}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${technique.title}`}
                    onClick={() => removeTechnique(technique.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-black/20 text-blue-100 transition hover:bg-white/10"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
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
          placeholder="What worked? What went wrong? What will you focus on next time?"
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
          suggestions={partnerSuggestions}
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
          suggestions={durationSuggestions}
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

      {techniquePickerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close technique picker"
            className="absolute inset-0 bg-black/65"
            onClick={() => setTechniquePickerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-zinc-950 shadow-[0_-30px_90px_rgba(0,0,0,0.9)]">
            <div className="mx-auto max-w-3xl px-6 pb-8 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">Add Technique</p>
                <button
                  type="button"
                  onClick={() => setTechniquePickerOpen(false)}
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Done
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <SearchIcon />
                <input
                  value={techniqueQuery}
                  onChange={(event) => setTechniqueQuery(event.target.value)}
                  placeholder="Search techniques..."
                  className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
                {techniqueQuery.trim().length > 0 ? (
                  <button
                    type="button"
                    aria-label="Clear technique search"
                    onClick={() => setTechniqueQuery("")}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20 text-zinc-200 transition hover:bg-white/10"
                  >
                    <XIcon />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  setTechniquePickerOpen(false);
                  onCreateTechnique();
                }}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <PlusIcon />
                New Technique
              </button>

              <div className="mt-4 max-h-[45vh] overflow-auto rounded-2xl border border-white/10 bg-black/20">
                {filteredTechniques.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">No techniques found.</p>
                ) : (
                  filteredTechniques.map((technique) => {
                    const active = selectedTechniqueIds.includes(technique.id);
                    return (
                      <button
                        key={technique.id}
                        type="button"
                        onClick={() => toggleTechnique(technique.id)}
                        className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-left transition hover:bg-white/5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100">{technique.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">{technique.category}</p>
                        </div>
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full border ${
                            active ? "border-blue-500/60 bg-blue-600/20 text-blue-200" : "border-white/10 bg-white/5 text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
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

export function SelectTrainingSessionScreen({
  isoDate,
  sessions,
  onBack,
  onSelect,
}: {
  isoDate: string;
  sessions: Session[];
  onBack: () => void;
  onSelect: (sessionId: string) => void;
}) {
  const safeDate = new Date(`${isoDate}T00:00:00`);
  const dateLabel = Number.isNaN(safeDate.getTime())
    ? isoDate
    : new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(safeDate);

  const sessionsForDate = useMemo(() => {
    return sessions
      .filter((session) => session.date === isoDate)
      .slice()
      .sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  }, [isoDate, sessions]);

  const allSessionTypes = ["Gi", "No-Gi", "Open Mat", "Wrestling", "Competition", "Other"] as const;

  const getSafeType = (value: string) => {
    const trimmed = value.trim();
    if ((allSessionTypes as readonly string[]).includes(trimmed)) return trimmed as SessionType;
    return "Other";
  };

  const getSubmissionCount = (session: Session) => {
    const entries = Array.isArray(session.submissionEntries) ? session.submissionEntries : [];
    return entries.reduce((sum, entry) => {
      const add = typeof entry.count === "number" && Number.isFinite(entry.count) ? entry.count : 0;
      return sum + add;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-8">
        <header className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:bg-white/10"
          >
            <BackIcon />
          </button>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white">Select Training Session</p>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{dateLabel}</p>
          </div>
        </header>

        <main className="mt-6 flex-1 space-y-4">
          {sessionsForDate.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm font-semibold text-white">No sessions logged</p>
              <p className="mt-2 text-sm text-zinc-500">Log a session for this day to see it here.</p>
            </div>
          ) : (
            sessionsForDate.map((session) => {
              const safeType = getSafeType(session.type || "");
              const submissionsCount = getSubmissionCount(session);
              const timeLabel = session.time ? formatShortTime(session.time) : "";
              const notesSnippet = session.notes?.trim() ?? "";
              const locationSnippet = session.location?.trim() ?? "";
              const satisfaction = typeof session.satisfaction === "number" ? Math.max(0, Math.min(5, session.satisfaction)) : 0;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${sessionTypePillClass(safeType)}`}>
                      {session.type?.trim() ? session.type : "Other"}
                    </span>
                    {timeLabel ? (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500">
                        <ClockIcon />
                        {timeLabel}
                      </span>
                    ) : null}
                  </div>

                  {locationSnippet ? (
                    <p className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-300">
                      <LocationMiniIcon />
                      {locationSnippet}
                    </p>
                  ) : null}

                  {notesSnippet ? (
                    <p className="mt-2 text-sm text-zinc-400">{notesSnippet}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-4 text-xs text-zinc-500">
                    <p>Satisfaction: {satisfaction}/5</p>
                    <div className="flex items-center gap-3">
                      {session.voiceNoteId ? (
                        <span className="inline-flex items-center gap-2 font-semibold text-zinc-400">
                          <MicIcon />
                          Voice note
                        </span>
                      ) : null}
                      <p>
                        {submissionsCount} submission{submissionsCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

export function NotesModal({
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

export function VoiceNoteRecorder({
  language,
  onLanguageChange,
  onSaved,
}: {
  language?: string;
  onLanguageChange: (language: string) => void;
  onSaved: (payload: { id: string; transcript?: string | null }) => void;
}) {
  const supported =
    typeof window !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder !== "undefined";

  const [status, setStatus] = useState<"idle" | "recording" | "saving" | "error" | "unsupported">(() =>
    supported ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState<string>("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const transcriptFinalRef = useRef<string>("");
  const transcriptInterimRef = useRef<string>("");

  const recognitionSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const anyWindow = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return Boolean(anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition);
  }, []);

  const recognitionLanguage = useMemo(() => {
    const trimmed = language?.trim();
    if (trimmed) return trimmed;
    if (typeof navigator !== "undefined" && navigator.language.trim()) return navigator.language.trim();
    return "en-US";
  }, [language]);

  const recognitionLanguageOptions = useMemo(() => {
    const base = [
      { value: "en-US", label: "English (US)" },
      { value: "en-IN", label: "English (India)" },
      { value: "hi-IN", label: "Hindi" },
    ];
    if (!base.some((option) => option.value === recognitionLanguage)) {
      return [{ value: recognitionLanguage, label: `Device default (${recognitionLanguage})` }, ...base];
    }
    return base;
  }, [recognitionLanguage]);

  useEffect(() => {
    if (status !== "recording") return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {}
      try {
        (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
      } catch {}
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      recognitionRef.current = null;
    };
  }, []);

  const pickMimeType = () => {
    if (typeof window === "undefined") return "";
    const mr = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    const can = (mime: string) => Boolean(mr?.isTypeSupported?.(mime));
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find((mime) => can(mime)) ?? "";
  };

  const start = async () => {
    if (!supported) return;
    setError(null);
    setSeconds(0);
    setTranscript("");
    transcriptFinalRef.current = "";
    transcriptInterimRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      if (recognitionSupported) {
        const anyWindow = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
        const RecognitionCtor = (anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition) as
          | (new () => {
              continuous: boolean;
              interimResults: boolean;
              lang: string;
              onresult: ((event: unknown) => void) | null;
              onerror: ((event: unknown) => void) | null;
              start: () => void;
              stop: () => void;
            })
          | undefined;
        if (RecognitionCtor) {
          const recognition = new RecognitionCtor();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = recognitionLanguage;
          recognition.onresult = (event: unknown) => {
            const safeEvent = event as {
              resultIndex: number;
              results: Array<
                Array<{ transcript?: string }> & { isFinal: boolean }
              >;
            };
            let interim = "";
            for (let i = safeEvent.resultIndex; i < safeEvent.results.length; i += 1) {
              const result = safeEvent.results[i];
              const text = result?.[0]?.transcript ?? "";
              if (!text) continue;
              if (result.isFinal) transcriptFinalRef.current += `${text.trim()} `;
              else interim += text;
            }
            transcriptInterimRef.current = interim.trim();
            const combined = `${transcriptFinalRef.current}${transcriptInterimRef.current ? `\n${transcriptInterimRef.current}` : ""}`.trim();
            setTranscript(combined);
          };
          recognition.onerror = (event: unknown) => {
            const errorValue = (event as { error?: string } | null)?.error ?? "";
            if (errorValue === "not-allowed") {
              setError("Microphone access was blocked. Allow microphone use and try again.");
            } else if (errorValue === "audio-capture") {
              setError("No microphone was found on this device.");
            } else if (errorValue === "no-speech") {
              setError("No speech was detected. Try recording again.");
            } else if (errorValue) {
              setError(`Speech recognition error: ${errorValue}`);
            }
          };
          recognitionRef.current = recognition as unknown;
          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
          }
        }
      }

      recorder.start();
      setStatus("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Microphone permission denied.";
      setError(message);
      setStatus("error");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
    }
  };

  const stop = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setStatus("saving");

    const durationMs =
      typeof startedAtRef.current === "number" ? Math.max(0, Date.now() - startedAtRef.current) : undefined;

    try {
      (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
    } catch {}

    const blob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const mime = recorder.mimeType || pickMimeType() || "audio/webm";
        resolve(new Blob(chunksRef.current, { type: mime }));
      };
      try {
        recorder.stop();
      } catch {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      }
    });

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    recognitionRef.current = null;

    try {
      const id = `voice-${cryptoSafeId()}`;
      await saveVoiceNote(id, blob, durationMs);
      const finalTranscript = transcriptFinalRef.current.trim();
      onSaved({ id, transcript: finalTranscript ? finalTranscript : null });
      setStatus("idle");
      setSeconds(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save recording.";
      setError(message);
      setStatus("error");
    }
  };

  const formatSeconds = (totalSeconds: number) => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  if (status === "unsupported") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
        <p className="text-sm text-zinc-300">Voice notes aren&apos;t supported on this device/browser yet.</p>
        <p className="mt-2 text-xs text-zinc-500">You can still use text notes and the template.</p>
      </div>
    );
  }

  return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
      {recognitionSupported ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <label htmlFor="voice-note-language" className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Transcript Language
          </label>
          <select
            id="voice-note-language"
            value={recognitionLanguage}
            disabled={status === "recording" || status === "saving"}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="min-w-[170px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {recognitionLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {status === "recording" ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Recording…</p>
            <p className="mt-1 text-xs text-zinc-500">{formatSeconds(seconds)}</p>
          </div>
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold text-white transition hover:bg-red-500"
          >
            Stop
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Add a quick voice note</p>
            <p className="mt-1 text-xs text-zinc-500">Great for remembering what happened right after class.</p>
          </div>
          <button
            type="button"
            disabled={status === "saving"}
            onClick={start}
            className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Record
          </button>
        </div>
      )}

      {status === "recording" && recognitionSupported ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Live transcript (beta)</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
            {transcript.trim().length > 0 ? transcript : "Listening…"}
          </p>
        </div>
      ) : null}

      {status === "saving" ? <p className="text-xs text-zinc-500">Saving…</p> : null}
      {status === "error" && error ? (
        <p className="text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}

export function VoiceNotePlayer({
  voiceNoteId,
  transcript,
  romanizedTranscript,
  onDelete,
}: {
  voiceNoteId: string;
  transcript?: string | null;
  romanizedTranscript?: string | null;
  onDelete?: () => void | Promise<void>;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let urlToRevoke: string | null = null;
    (async () => {
      try {
        setStatus("loading");
        setAudioUrl(null);
        setBlob(null);
        setMimeType(null);
        setCreatedAt(null);
        const record = await loadVoiceNote(voiceNoteId);
        if (cancelled) return;
        if (!record) {
          setStatus("missing");
          return;
        }
        const url = URL.createObjectURL(record.blob);
        urlToRevoke = url;
        setAudioUrl(url);
        setBlob(record.blob);
        setMimeType(record.mimeType);
        setCreatedAt(record.createdAt);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [voiceNoteId]);

  if (status === "missing") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
        <p className="text-sm text-zinc-300">Voice note not found on this device.</p>
        {transcript && transcript.trim().length > 0 ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Transcript</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{transcript}</p>
          </div>
        ) : null}
        {romanizedTranscript && romanizedTranscript.trim().length > 0 ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Romanized</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{romanizedTranscript}</p>
          </div>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete()}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            Remove from session
          </button>
        ) : null}
      </div>
    );
  }

  if (status !== "ready" || !audioUrl) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
        <p className="text-sm text-zinc-400">{status === "error" ? "Could not load voice note." : "Loading voice note…"}</p>
      </div>
    );
  }

  const extensionFromMime = (mime: string | null) => {
    if (!mime) return "webm";
    if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("wav")) return "wav";
    return "webm";
  };

  const suggestedFilename = () => {
    const stamp = (createdAt ? createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)).replaceAll(":", "-");
    return `bjj-pal-voice-note-${stamp}.${extensionFromMime(mimeType)}`;
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = suggestedFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], suggestedFilename(), { type: mimeType || blob.type || "audio/webm" });
    const canShare = typeof navigator !== "undefined" && "canShare" in navigator && (navigator as unknown as { canShare?: (data: unknown) => boolean }).canShare;
    const shareFn = typeof navigator !== "undefined" && "share" in navigator ? (navigator as unknown as { share?: (data: unknown) => Promise<void> }).share : null;
    if (shareFn && (!canShare || canShare({ files: [file] }))) {
      await shareFn({ files: [file], title: "BJJ Pal voice note" });
      return;
    }
    download();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
      <audio controls src={audioUrl} className="w-full" />
      {transcript && transcript.trim().length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Transcript</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{transcript}</p>
        </div>
      ) : null}
      {romanizedTranscript && romanizedTranscript.trim().length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Romanized</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{romanizedTranscript}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => share().catch(() => download())}
          className="inline-flex h-9 items-center justify-center rounded-full bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-500"
        >
          Save to device
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete()}
            className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TagPartnersModal({
  value,
  limit,
  suggestions,
  onChange,
  onClose,
}: {
  value: string;
  limit: number;
  suggestions?: string[];
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

  const filteredSuggestions = useMemo(() => {
    const base = Array.isArray(suggestions) ? suggestions : [];
    const cleaned = base
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, arr) => arr.findIndex((value) => value.toLowerCase() === item.toLowerCase()) === index);

    const alreadySelected = new Set(partners.map((partner) => partner.toLowerCase()));
    const queryLower = query.trim().toLowerCase();
    return cleaned
      .filter((item) => !alreadySelected.has(item.toLowerCase()))
      .filter((item) => (queryLower ? item.toLowerCase().includes(queryLower) : true))
      .slice(0, 8);
  }, [partners, query, suggestions]);

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

          {filteredSuggestions.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {filteredSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={!canAddMore}
                  onClick={() => {
                    if (!canAddMore) return;
                    addPartner(item);
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/5 last:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">{item}</span>
                  <span className="text-xs font-semibold text-zinc-500">Tap to add</span>
                </button>
              ))}
            </div>
          ) : null}

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
              Add partners manually or pick from suggestions.
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

export function VisibilitySheet({
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

export function DurationSheet({
  valueMinutes,
  onChange,
  onDone,
  suggestions,
}: {
  valueMinutes: number;
  onChange: (nextMinutes: number) => void;
  onDone: () => void;
  suggestions?: number[];
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

  const durationSuggestions = useMemo(() => {
    const base = Array.isArray(suggestions) ? suggestions : [];
    const cleaned = base
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
      .map((value) => Math.max(1, Math.round(value)));
    const unique = Array.from(new Set(cleaned));
    if (unique.length > 0) return unique.slice(0, 6);
    return [60, 90, 120];
  }, [suggestions]);

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

          <div className="mt-5 flex flex-wrap gap-3">
            {durationSuggestions.map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => {
                  const next = normalize(Math.floor(suggested / 60), suggested % 60);
                  setHours(next.hours);
                  setMinutes(next.minutes);
                  onChange(next.total);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                {formatDuration(suggested)}
              </button>
            ))}
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
