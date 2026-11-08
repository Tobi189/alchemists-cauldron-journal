import { ACHIEVEMENT_IDS, type AchievementId } from '../data/achievements.ts';
import { DIFFICULTIES, getDifficultySettings } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { getReactionsForDifficulty, REACTIONS } from '../data/reactions.ts';
import { RECIPES } from '../data/recipes.ts';
import { isValidPlayerName } from '../logic/leaderboard.ts';
import { createDefaultJournal, JOURNAL_VERSION } from '../logic/journal.ts';
import type { Difficulty } from '../types/game.ts';
import type {
  JournalData,
  JournalDiscoveries,
  JournalProfile,
  JournalSession,
  SessionOutcome,
  UnlockedAchievement,
} from '../types/journal.ts';

const JOURNAL_STORAGE_KEY = 'alchemists-cauldron:journal';
const SESSION_ID_MAX_LENGTH = 100;

const INGREDIENT_IDS = new Set<string>(INGREDIENTS.map((ingredient) => ingredient.id));
const RECIPE_IDS = new Set<string>(RECIPES.map((recipe) => recipe.id));
const REACTION_IDS = new Set<string>(REACTIONS.map((reaction) => reaction.id));
const VALID_ACHIEVEMENT_IDS = new Set<string>(ACHIEVEMENT_IDS);
const SESSION_OUTCOMES = new Set<SessionOutcome>(['time', 'lives', 'ingredients', 'abandoned']);

const getBrowserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && DIFFICULTIES.includes(value as Difficulty);

const isTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const isNonNegativeWholeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const parseUniqueIds = (
  value: unknown,
  validIds: ReadonlySet<string>,
): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids: string[] = [];
  const seenIds = new Set<string>();

  for (const id of value) {
    if (typeof id !== 'string' || !validIds.has(id) || seenIds.has(id)) {
      return undefined;
    }

    ids.push(id);
    seenIds.add(id);
  }

  return ids;
};

const parseProfile = (value: unknown): JournalProfile | undefined => {
  if (
    !isRecord(value) ||
    typeof value.displayName !== 'string' ||
    !isValidPlayerName(value.displayName) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    value.updatedAt < value.createdAt
  ) {
    return undefined;
  }

  return {
    displayName: value.displayName,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const parseIngredientUsage = (
  value: unknown,
  difficulty: Difficulty,
): Readonly<Record<string, number>> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const shelfSize = getDifficultySettings(difficulty).shelfSize;
  const availableIds = new Set<string>(
    INGREDIENTS.slice(0, shelfSize).map((ingredient) => ingredient.id),
  );
  const usage: Record<string, number> = {};

  for (const [ingredientId, amount] of Object.entries(value)) {
    if (amount === 0 || !availableIds.has(ingredientId) || !isNonNegativeWholeNumber(amount)) {
      return undefined;
    }

    usage[ingredientId] = amount;
  }

  return usage;
};

const parseSession = (value: unknown): JournalSession | undefined => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    value.id.length > SESSION_ID_MAX_LENGTH ||
    !isTimestamp(value.startedAt) ||
    !isTimestamp(value.endedAt) ||
    value.endedAt < value.startedAt ||
    !isDifficulty(value.difficulty) ||
    !isNonNegativeWholeNumber(value.score) ||
    typeof value.outcome !== 'string' ||
    !SESSION_OUTCOMES.has(value.outcome as SessionOutcome) ||
    !isNonNegativeWholeNumber(value.successfulBrews) ||
    !isNonNegativeWholeNumber(value.failedBrews) ||
    !isNonNegativeWholeNumber(value.bestStreak) ||
    value.bestStreak > value.successfulBrews
  ) {
    return undefined;
  }

  const difficulty = value.difficulty;
  const ingredientUsage = parseIngredientUsage(value.ingredientUsage, difficulty);
  const recipeIds = parseUniqueIds(
    value.recipeIds,
    new Set(
      RECIPES.filter((recipe) => recipe.difficulty === difficulty).map((recipe) => recipe.id),
    ),
  );
  const availableReactionIds =
    getDifficultySettings(difficulty).reactionCount === 0
      ? new Set<string>()
      : new Set(getReactionsForDifficulty(difficulty).map((reaction) => reaction.id));
  const reactionIds = parseUniqueIds(value.reactionIds, availableReactionIds);

  if (!ingredientUsage || !recipeIds || !reactionIds) {
    return undefined;
  }

  return {
    id: value.id,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    difficulty,
    score: value.score,
    outcome: value.outcome as SessionOutcome,
    successfulBrews: value.successfulBrews,
    failedBrews: value.failedBrews,
    bestStreak: value.bestStreak,
    ingredientUsage,
    recipeIds,
    reactionIds,
  };
};

const parseSessions = (value: unknown): readonly JournalSession[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sessions: JournalSession[] = [];
  const sessionIds = new Set<string>();

  for (const item of value) {
    const session = parseSession(item);

    if (!session || sessionIds.has(session.id)) {
      return undefined;
    }

    sessions.push(session);
    sessionIds.add(session.id);
  }

  return sessions;
};

const parseDiscoveries = (value: unknown): JournalDiscoveries | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const ingredientIds = parseUniqueIds(value.ingredientIds, INGREDIENT_IDS);
  const recipeIds = parseUniqueIds(value.recipeIds, RECIPE_IDS);
  const reactionIds = parseUniqueIds(value.reactionIds, REACTION_IDS);

  return ingredientIds && recipeIds && reactionIds
    ? { ingredientIds, recipeIds, reactionIds }
    : undefined;
};

const parseAchievements = (value: unknown): readonly UnlockedAchievement[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const achievements: UnlockedAchievement[] = [];
  const achievementIds = new Set<string>();

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      !VALID_ACHIEVEMENT_IDS.has(item.id) ||
      achievementIds.has(item.id) ||
      !isTimestamp(item.unlockedAt)
    ) {
      return undefined;
    }

    achievements.push({
      id: item.id as AchievementId,
      unlockedAt: item.unlockedAt,
    });
    achievementIds.add(item.id);
  }

  return achievements;
};

export const parseJournalData = (value: unknown): JournalData | undefined => {
  if (!isRecord(value) || value.version !== JOURNAL_VERSION) {
    return undefined;
  }

  const profile = parseProfile(value.profile);
  const sessions = parseSessions(value.sessions);
  const discoveries = parseDiscoveries(value.discoveries);
  const achievements = parseAchievements(value.achievements);

  return profile && sessions && discoveries && achievements
    ? {
        version: JOURNAL_VERSION,
        profile,
        sessions,
        discoveries,
        achievements,
      }
    : undefined;
};

export const loadJournal = (): JournalData => {
  try {
    const savedValue = getBrowserStorage()?.getItem(JOURNAL_STORAGE_KEY);

    if (!savedValue) {
      return createDefaultJournal();
    }

    const parsedValue: unknown = JSON.parse(savedValue);

    return parseJournalData(parsedValue) ?? createDefaultJournal();
  } catch {
    return createDefaultJournal();
  }
};

export const didSaveJournal = (journal: JournalData): boolean => {
  if (!parseJournalData(journal)) {
    return false;
  }

  try {
    const storage = getBrowserStorage();

    if (!storage) {
      return false;
    }

    storage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journal));

    return true;
  } catch {
    return false;
  }
};

export const didClearJournal = (): boolean => {
  try {
    const storage = getBrowserStorage();

    if (!storage) {
      return false;
    }

    storage.removeItem(JOURNAL_STORAGE_KEY);

    return true;
  } catch {
    return false;
  }
};
