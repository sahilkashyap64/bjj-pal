"use client";

import localforage from "localforage";

const store = localforage.createInstance({
  name: "bjj-pal",
  storeName: "bjjpal",
  description: "BJJ Pal offline storage",
});

const KEYS = {
  sessions: "bjjpal_sessions_v1",
  techniques: "bjjpal_techniques_v1",
  tourDone: "bjjpal_tour_done",
  profile: "bjjpal_profile_v1",
  theme: "bjjpal_theme_v1",
  sessionDefaults: "bjjpal_session_defaults_v1",
  migrationFlag: "bjjpal_storage_migrated_to_localforage_v1",
} as const;

const LEGACY_KEYS = {
  sessions: "flowroll_sessions_v1",
  techniques: "flowroll_techniques_v1",
  tourDone: "flowroll_tour_done",
} as const;

const VOICE_NOTE_PREFIX = "bjjpal_voice_note_v1:" as const;

export type VoiceNoteV1 = {
  version: 1;
  blob: Blob;
  mimeType: string;
  createdAt: string;
  durationMs?: number;
};

const voiceNoteKey = (id: string) => `${VOICE_NOTE_PREFIX}${id}`;

export const saveVoiceNote = async (id: string, blob: Blob, durationMs?: number) => {
  const record: VoiceNoteV1 = {
    version: 1,
    blob,
    mimeType: blob.type || "audio/webm",
    createdAt: new Date().toISOString(),
    durationMs: typeof durationMs === "number" && Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : undefined,
  };
  await store.setItem(voiceNoteKey(id), record);
};

export const loadVoiceNote = async (id: string): Promise<VoiceNoteV1 | null> => {
  const value = await store.getItem<unknown>(voiceNoteKey(id));
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<VoiceNoteV1>;
  if (record.version !== 1) return null;
  if (!(record.blob instanceof Blob)) return null;
  if (typeof record.mimeType !== "string") return null;
  if (typeof record.createdAt !== "string") return null;
  if (record.durationMs != null && (typeof record.durationMs !== "number" || !Number.isFinite(record.durationMs))) return null;
  return {
    version: 1,
    blob: record.blob,
    mimeType: record.mimeType,
    createdAt: record.createdAt,
    durationMs: record.durationMs,
  };
};

export const deleteVoiceNote = async (id: string) => {
  await store.removeItem(voiceNoteKey(id));
};

const safeParseJson = (raw: string) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const readLegacyLocalStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return safeParseJson(raw);
  } catch {
    return null;
  }
};

const readLegacyLocalStorageString = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const migrateLocalStorageToLocalForageIfNeeded = async () => {
  const already = await store.getItem(KEYS.migrationFlag);
  if (already === "1") return;

  const existingSessions = await store.getItem(KEYS.sessions);
  if (existingSessions == null) {
    const fromBjjPal = readLegacyLocalStorage(KEYS.sessions);
    const fromFlowRoll = readLegacyLocalStorage(LEGACY_KEYS.sessions);
    const next = Array.isArray(fromBjjPal) ? fromBjjPal : Array.isArray(fromFlowRoll) ? fromFlowRoll : null;
    if (next) await store.setItem(KEYS.sessions, next);
  }

  const existingTechniques = await store.getItem(KEYS.techniques);
  if (existingTechniques == null) {
    const fromBjjPal = readLegacyLocalStorage(KEYS.techniques);
    const fromFlowRoll = readLegacyLocalStorage(LEGACY_KEYS.techniques);
    const next = Array.isArray(fromBjjPal) ? fromBjjPal : Array.isArray(fromFlowRoll) ? fromFlowRoll : null;
    if (next) await store.setItem(KEYS.techniques, next);
  }

  const existingTourDone = await store.getItem(KEYS.tourDone);
  if (existingTourDone == null) {
    const fromBjjPal = readLegacyLocalStorageString(KEYS.tourDone);
    const fromFlowRoll = readLegacyLocalStorageString(LEGACY_KEYS.tourDone);
    const next = fromBjjPal ?? fromFlowRoll;
    if (next != null) await store.setItem(KEYS.tourDone, next);
  }

  await store.setItem(KEYS.migrationFlag, "1");
};

export const loadSessions = async <T>(): Promise<T[]> => {
  const value = await store.getItem<unknown>(KEYS.sessions);
  return Array.isArray(value) ? (value as T[]) : [];
};

export const saveSessions = async <T>(sessions: T[]) => {
  await store.setItem(KEYS.sessions, sessions);
};

export const loadTechniques = async <T>(): Promise<T[]> => {
  const value = await store.getItem<unknown>(KEYS.techniques);
  return Array.isArray(value) ? (value as T[]) : [];
};

export const saveTechniques = async <T>(techniques: T[]) => {
  await store.setItem(KEYS.techniques, techniques);
};

export const loadTourDone = async (): Promise<boolean> => {
  const value = await store.getItem<unknown>(KEYS.tourDone);
  return value === "1";
};

export const saveTourDone = async (done: boolean) => {
  await store.setItem(KEYS.tourDone, done ? "1" : "0");
};

export type ThemePreference = "system" | "dark" | "light";

export const loadThemePreference = async (): Promise<ThemePreference> => {
  const value = await store.getItem<unknown>(KEYS.theme);
  if (value === "dark" || value === "light" || value === "system") return value;
  return "system";
};

export const saveThemePreference = async (next: ThemePreference) => {
  await store.setItem(KEYS.theme, next);
};

export type SessionDefaultsV1 = {
  version: 1;
  lastLocation?: string;
  lastTime?: string; // "HH:MM"
  recentLocations: string[];
  partnerNames: string[];
  lastDurationMinutes?: number;
  recentDurations?: number[];
  seededExampleSession?: boolean;
  transcriptLanguage?: string;
};

export const loadSessionDefaults = async (): Promise<SessionDefaultsV1> => {
  const value = await store.getItem<unknown>(KEYS.sessionDefaults);
  if (!value || typeof value !== "object") {
    return {
      version: 1,
      recentLocations: [],
      partnerNames: [],
      lastDurationMinutes: 90,
      recentDurations: [],
      seededExampleSession: false,
      transcriptLanguage: undefined,
    };
  }
  const data = value as Partial<SessionDefaultsV1>;
  if (data.version !== 1)
    return {
      version: 1,
      recentLocations: [],
      partnerNames: [],
      lastDurationMinutes: 90,
      recentDurations: [],
      seededExampleSession: false,
      transcriptLanguage: undefined,
    };
  const recentLocations = Array.isArray(data.recentLocations)
    ? data.recentLocations.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const partnerNames = Array.isArray(data.partnerNames)
    ? data.partnerNames.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const recentDurations = Array.isArray(data.recentDurations)
    ? data.recentDurations
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
        .map((value) => Math.max(1, Math.round(value)))
    : [];
  const lastDurationMinutes =
    typeof data.lastDurationMinutes === "number" && Number.isFinite(data.lastDurationMinutes)
      ? Math.max(0, Math.round(data.lastDurationMinutes))
      : 90;

  return {
    version: 1,
    lastLocation: typeof data.lastLocation === "string" ? data.lastLocation : undefined,
    lastTime: typeof data.lastTime === "string" ? data.lastTime : undefined,
    recentLocations,
    partnerNames,
    lastDurationMinutes,
    recentDurations,
    seededExampleSession: typeof data.seededExampleSession === "boolean" ? data.seededExampleSession : false,
    transcriptLanguage: typeof data.transcriptLanguage === "string" && data.transcriptLanguage.trim().length > 0
      ? data.transcriptLanguage.trim()
      : undefined,
  };
};

export const saveSessionDefaults = async (next: SessionDefaultsV1) => {
  await store.setItem(KEYS.sessionDefaults, next);
};

export type BjjPalProfileV1 = {
  version: 1;
  username?: string;
  displayName?: string;
  name: string;
  belt?: string;
  stripes?: number;
  gym?: string;
  bio?: string;
  privacy?: "Public" | "Private";
  selectedChallenges?: string[];
  onboardingDone: boolean;
};

export const loadProfile = async (): Promise<BjjPalProfileV1 | null> => {
  const value = await store.getItem<unknown>(KEYS.profile);
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<BjjPalProfileV1>;
  if (profile.version !== 1) return null;
  if (typeof profile.name !== "string") return null;
  if (typeof profile.onboardingDone !== "boolean") return null;
  if (profile.username != null && typeof profile.username !== "string") return null;
  if (profile.displayName != null && typeof profile.displayName !== "string") return null;
  if (profile.belt != null && typeof profile.belt !== "string") return null;
  if (profile.stripes != null && typeof profile.stripes !== "number") return null;
  if (profile.gym != null && typeof profile.gym !== "string") return null;
  if (profile.bio != null && typeof profile.bio !== "string") return null;
  if (profile.privacy != null && profile.privacy !== "Public" && profile.privacy !== "Private") return null;
  if (profile.selectedChallenges != null && !Array.isArray(profile.selectedChallenges)) return null;
  if (Array.isArray(profile.selectedChallenges) && !profile.selectedChallenges.every((item) => typeof item === "string")) {
    return null;
  }

  return profile as BjjPalProfileV1;
};

export const saveProfile = async (profile: BjjPalProfileV1) => {
  await store.setItem(KEYS.profile, profile);
};

export const upsertProfile = async (patch: Partial<Omit<BjjPalProfileV1, "version">>) => {
  const existing = await loadProfile();
  const merged: BjjPalProfileV1 = {
    version: 1,
    name: existing?.name ?? "",
    onboardingDone: existing?.onboardingDone ?? false,
    ...existing,
    ...patch,
  };
  await saveProfile(merged);
  return merged;
};

export type BjjPalBackupV1 = {
  version: 1;
  exportedAt: string;
  sessions: unknown[];
  techniques: unknown[];
  tourDone?: boolean;
  profile?: BjjPalProfileV1;
  sessionDefaults?: SessionDefaultsV1;
};

export const createBackup = async (): Promise<BjjPalBackupV1> => {
  const [sessions, techniques, tourDone, profile, sessionDefaults] = await Promise.all([
    loadSessions<unknown>(),
    loadTechniques<unknown>(),
    loadTourDone(),
    loadProfile(),
    loadSessionDefaults(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    techniques,
    tourDone,
    profile: profile ?? undefined,
    sessionDefaults,
  };
};

export const restoreBackup = async (raw: string) => {
  const parsed = safeParseJson(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup file");
  }

  const data = parsed as Partial<BjjPalBackupV1>;
  if (data.version !== 1) {
    throw new Error("Unsupported backup version");
  }
  if (!Array.isArray(data.sessions) || !Array.isArray(data.techniques)) {
    throw new Error("Backup missing sessions/techniques arrays");
  }

  await store.setItem(KEYS.sessions, data.sessions);
  await store.setItem(KEYS.techniques, data.techniques);
  if (typeof data.tourDone === "boolean") {
    await saveTourDone(data.tourDone);
  }
  if (data.profile) {
    await saveProfile(data.profile);
  }
  if (data.sessionDefaults && data.sessionDefaults.version === 1) {
    await saveSessionDefaults(data.sessionDefaults);
  }

  await store.setItem(KEYS.migrationFlag, "1");
};
