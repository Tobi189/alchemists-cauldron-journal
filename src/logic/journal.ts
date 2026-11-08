import type { JournalData } from '../types/journal.ts';

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
