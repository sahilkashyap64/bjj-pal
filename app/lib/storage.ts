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
  migrationFlag: "bjjpal_storage_migrated_to_localforage_v1",
} as const;

const LEGACY_KEYS = {
  sessions: "flowroll_sessions_v1",
  techniques: "flowroll_techniques_v1",
  tourDone: "flowroll_tour_done",
} as const;

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

export type BjjPalProfileV1 = {
  version: 1;
  name: string;
  belt?: string;
  stripes?: number;
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
  if (profile.belt != null && typeof profile.belt !== "string") return null;
  if (profile.stripes != null && typeof profile.stripes !== "number") return null;
  if (profile.selectedChallenges != null && !Array.isArray(profile.selectedChallenges)) return null;
  if (Array.isArray(profile.selectedChallenges) && !profile.selectedChallenges.every((item) => typeof item === "string")) {
    return null;
  }

  return profile as BjjPalProfileV1;
};

export const saveProfile = async (profile: BjjPalProfileV1) => {
  await store.setItem(KEYS.profile, profile);
};

export type BjjPalBackupV1 = {
  version: 1;
  exportedAt: string;
  sessions: unknown[];
  techniques: unknown[];
  tourDone?: boolean;
  profile?: BjjPalProfileV1;
};

export const createBackup = async (): Promise<BjjPalBackupV1> => {
  const [sessions, techniques, tourDone, profile] = await Promise.all([
    loadSessions<unknown>(),
    loadTechniques<unknown>(),
    loadTourDone(),
    loadProfile(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    techniques,
    tourDone,
    profile: profile ?? undefined,
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

  await store.setItem(KEYS.migrationFlag, "1");
};
