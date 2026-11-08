import type { JournalData } from '../types/journal.ts';
import { isValidPlayerName } from './leaderboard.ts';

export const JOURNAL_VERSION = 1 as const;
export const DEFAULT_PROFILE_NAME = 'Alchemist';

export const createDefaultJournal = (createdAt: number = Date.now()): JournalData => ({
  version: JOURNAL_VERSION,
  profile: {
    displayName: DEFAULT_PROFILE_NAME,
    createdAt,
    updatedAt: createdAt,
  },
  sessions: [],
  discoveries: {
    ingredientIds: [],
    recipeIds: [],
    reactionIds: [],
  },
  achievements: [],
});

export const updateJournalProfile = (
  journal: JournalData,
  displayName: string,
  updatedAt: number = Date.now(),
): JournalData => {
  const normalizedName = displayName.trim();

  if (!isValidPlayerName(normalizedName) || normalizedName === journal.profile.displayName) {
    return journal;
  }

  return {
    ...journal,
    profile: {
      ...journal.profile,
      displayName: normalizedName,
      updatedAt: Math.max(updatedAt, journal.profile.createdAt),
    },
  };
};
