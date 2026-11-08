import type { BrewResult, Difficulty } from '../types/game.ts';
import type { JournalData, JournalSessionProgress, SessionOutcome } from '../types/journal.ts';

const createSessionId = (): string => globalThis.crypto.randomUUID();

const appendUnique = (
  values: readonly string[],
  additions: readonly string[],
): readonly string[] => {
  const nextValues = [...values];
  const knownValues = new Set(values);

  for (const addition of additions) {
    if (knownValues.has(addition)) {
      continue;
    }

    nextValues.push(addition);
    knownValues.add(addition);
  }

  return nextValues;
};

export const createJournalSession = (
  startedAt: number = Date.now(),
  id: string = createSessionId(),
): JournalSessionProgress => ({
  id,
  startedAt,
  successfulBrews: 0,
  failedBrews: 0,
  currentStreak: 0,
  bestStreak: 0,
  ingredientUsage: {},
  recipeIds: [],
  reactionIds: [],
});

export const recordIngredientUse = (
  session: JournalSessionProgress | undefined,
  ingredientId: string,
  reactionIds: readonly string[],
): JournalSessionProgress | undefined =>
  session
    ? {
        ...session,
        ingredientUsage: {
          ...session.ingredientUsage,
          [ingredientId]: (session.ingredientUsage[ingredientId] ?? 0) + 1,
        },
        reactionIds: appendUnique(session.reactionIds, reactionIds),
      }
    : undefined;

export const recordBrew = (
  session: JournalSessionProgress | undefined,
  result: BrewResult,
  recipeId: string,
): JournalSessionProgress | undefined => {
  if (!session) {
    return undefined;
  }

  if (result === 'failure') {
    return {
      ...session,
      failedBrews: session.failedBrews + 1,
      currentStreak: 0,
    };
  }

  const currentStreak = session.currentStreak + 1;

  return {
    ...session,
    successfulBrews: session.successfulBrews + 1,
    currentStreak,
    bestStreak: Math.max(session.bestStreak, currentStreak),
    recipeIds: appendUnique(session.recipeIds, [recipeId]),
  };
};

export const syncJournalDiscoveries = (
  journal: JournalData,
  session: JournalSessionProgress | undefined,
): JournalData => {
  if (!session) {
    return journal;
  }

  const ingredientIds = appendUnique(
    journal.discoveries.ingredientIds,
    Object.keys(session.ingredientUsage),
  );
  const recipeIds = appendUnique(journal.discoveries.recipeIds, session.recipeIds);
  const reactionIds = appendUnique(journal.discoveries.reactionIds, session.reactionIds);

  if (
    ingredientIds.length === journal.discoveries.ingredientIds.length &&
    recipeIds.length === journal.discoveries.recipeIds.length &&
    reactionIds.length === journal.discoveries.reactionIds.length
  ) {
    return journal;
  }

  return {
    ...journal,
    discoveries: { ingredientIds, recipeIds, reactionIds },
  };
};

export const finalizeJournalSession = (
  journal: JournalData,
  session: JournalSessionProgress | undefined,
  difficulty: Difficulty,
  score: number,
  outcome: SessionOutcome,
  endedAt: number = Date.now(),
): JournalData => {
  const journalWithDiscoveries = syncJournalDiscoveries(journal, session);

  if (!session || journalWithDiscoveries.sessions.some((item) => item.id === session.id)) {
    return journalWithDiscoveries;
  }

  return {
    ...journalWithDiscoveries,
    sessions: [
      ...journalWithDiscoveries.sessions,
      {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: Math.max(endedAt, session.startedAt),
        difficulty,
        score,
        outcome,
        successfulBrews: session.successfulBrews,
        failedBrews: session.failedBrews,
        bestStreak: session.bestStreak,
        ingredientUsage: session.ingredientUsage,
        recipeIds: session.recipeIds,
        reactionIds: session.reactionIds,
      },
    ],
  };
};
