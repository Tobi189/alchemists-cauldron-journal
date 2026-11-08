import { DIFFICULTIES, getDifficultySettings } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { getReactionsForDifficulty } from '../data/reactions.ts';
import { RECIPES } from '../data/recipes.ts';
import { createJournalSession, MAX_RECIPE_COMBINATIONS } from '../logic/journal-session.ts';
import type { Difficulty, GameState, Recipe, ShelfStock } from '../types/game.ts';
import type { JournalRecipeCombination, JournalSessionProgress } from '../types/journal.ts';

const SAVE_STORAGE_KEY = 'alchemists-cauldron:saved-game';
const LEGACY_SAVE_VERSION = 2;
const JOURNAL_SAVE_VERSION = 3;
const SAVE_VERSION = 4;
const SESSION_ID_MAX_LENGTH = 100;
const compareIds = (left: string, right: string): number => left.localeCompare(right);

interface SavedGame {
  readonly version: number;
  readonly difficulty: Difficulty;
  readonly score: number;
  readonly timeLeft: number;
  readonly lives: number;
  readonly activeRecipe: Recipe;
  readonly enabledReactionIds: readonly string[];
  readonly lastReactionIds: readonly string[];
  readonly cauldronIngredients: readonly string[];
  readonly shelfStock: ShelfStock;
  readonly status: 'playing' | 'paused';
  readonly journalSession: JournalSessionProgress;
}

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

const isWholeNumberInRange = (value: unknown, minimum: number, maximum: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum;

const getCanonicalRecipe = (value: unknown, difficulty: Difficulty): Recipe | undefined => {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return undefined;
  }

  const recipe = RECIPES.find((item) => item.id === value.id && item.difficulty === difficulty);

  return recipe && JSON.stringify(value) === JSON.stringify(recipe) ? recipe : undefined;
};

const parseShelfStock = (value: unknown, difficulty: Difficulty): ShelfStock | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const rules = getDifficultySettings(difficulty);
  const allowedIngredients = INGREDIENTS.slice(0, rules.shelfSize);

  if (Object.keys(value).length !== allowedIngredients.length) {
    return undefined;
  }

  const stock: Record<string, number> = {};

  for (const ingredient of allowedIngredients) {
    const amount = value[ingredient.id];

    if (!isWholeNumberInRange(amount, 0, 15)) {
      return undefined;
    }

    stock[ingredient.id] = amount;
  }

  return stock;
};

const parseCauldronIngredients = (
  value: unknown,
  difficulty: Difficulty,
): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const rules = getDifficultySettings(difficulty);
  const allowedIds = new Set<string>(
    INGREDIENTS.slice(0, rules.shelfSize).map((ingredient) => ingredient.id),
  );

  return value.length <= rules.cauldronCapacity &&
    value.every((ingredientId) => typeof ingredientId === 'string' && allowedIds.has(ingredientId))
    ? value
    : undefined;
};

const parseEnabledReactionIds = (
  value: unknown,
  difficulty: Difficulty,
  expectedCount: number,
): readonly string[] | undefined => {
  if (!Array.isArray(value) || value.length !== expectedCount) {
    return undefined;
  }

  const validIds = new Set(getReactionsForDifficulty(difficulty).map((reaction) => reaction.id));
  const reactionIds = value.filter(
    (reactionId): reactionId is string =>
      typeof reactionId === 'string' && validIds.has(reactionId),
  );

  return reactionIds.length === expectedCount && new Set(reactionIds).size === expectedCount
    ? reactionIds
    : undefined;
};

const parseLastReactionIds = (
  value: unknown,
  enabledReactionIds: readonly string[],
): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const enabledIds = new Set(enabledReactionIds);
  const reactionIds = value.filter(
    (reactionId): reactionId is string =>
      typeof reactionId === 'string' && enabledIds.has(reactionId),
  );

  return reactionIds.length === value.length && new Set(reactionIds).size === reactionIds.length
    ? reactionIds
    : undefined;
};

const parseUniqueSessionIds = (
  value: unknown,
  validIds: ReadonlySet<string>,
): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value.filter((id): id is string => typeof id === 'string' && validIds.has(id));

  return ids.length === value.length && new Set(ids).size === ids.length ? ids : undefined;
};

const parseSessionIngredientUsage = (
  value: unknown,
  difficulty: Difficulty,
): Readonly<Record<string, number>> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const shelfSize = getDifficultySettings(difficulty).shelfSize;
  const allowedIds = new Set<string>(
    INGREDIENTS.slice(0, shelfSize).map((ingredient) => ingredient.id),
  );
  const usage: Record<string, number> = {};

  for (const [ingredientId, amount] of Object.entries(value)) {
    if (
      !allowedIds.has(ingredientId) ||
      !isWholeNumberInRange(amount, 1, Number.MAX_SAFE_INTEGER)
    ) {
      return undefined;
    }

    usage[ingredientId] = amount;
  }

  return usage;
};

const parseSessionRecipeCombinations = (
  value: unknown,
  difficulty: Difficulty,
  enabledReactionIds: readonly string[],
  shouldAllowMissing: boolean,
): readonly JournalRecipeCombination[] | undefined => {
  if (shouldAllowMissing && value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const rules = getDifficultySettings(difficulty);
  const validIngredientIds = new Set<string>(
    INGREDIENTS.slice(0, rules.shelfSize).map((ingredient) => ingredient.id),
  );
  const validRecipeIds = new Set<string>(
    RECIPES.filter((recipe) => recipe.difficulty === difficulty).map((recipe) => recipe.id),
  );
  const validReactionIds = new Set(enabledReactionIds);
  const combinations: JournalRecipeCombination[] = [];
  const keys = new Set<string>();
  const countsByRecipe = new Map<string, number>();

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.recipeId !== 'string' ||
      !validRecipeIds.has(item.recipeId) ||
      !Array.isArray(item.ingredientIds) ||
      item.ingredientIds.length === 0 ||
      item.ingredientIds.length > rules.cauldronCapacity ||
      item.ingredientIds.some(
        (ingredientId) => typeof ingredientId !== 'string' || !validIngredientIds.has(ingredientId),
      ) ||
      !isRecord(item.values) ||
      !Number.isSafeInteger(item.values.temperature) ||
      !Number.isSafeInteger(item.values.density) ||
      !Number.isSafeInteger(item.values.magicPower)
    ) {
      return undefined;
    }

    const reactionIds = parseUniqueSessionIds(item.reactionIds, validReactionIds);

    if (!reactionIds) {
      return undefined;
    }

    const ingredientIds = (item.ingredientIds as string[]).toSorted(compareIds);
    const sortedReactionIds = reactionIds.toSorted(compareIds);
    const key = `${item.recipeId}|${ingredientIds.join(',')}|${sortedReactionIds.join(',')}`;
    const recipeCount = (countsByRecipe.get(item.recipeId) ?? 0) + 1;

    if (keys.has(key) || recipeCount > MAX_RECIPE_COMBINATIONS) {
      return undefined;
    }

    combinations.push({
      recipeId: item.recipeId,
      ingredientIds,
      values: {
        temperature: item.values.temperature as number,
        density: item.values.density as number,
        magicPower: item.values.magicPower as number,
      },
      reactionIds: sortedReactionIds,
    });
    keys.add(key);
    countsByRecipe.set(item.recipeId, recipeCount);
  }

  return combinations;
};

const parseJournalSession = (
  value: unknown,
  difficulty: Difficulty,
  enabledReactionIds: readonly string[],
  shouldAllowMissingCombinations: boolean,
): JournalSessionProgress | undefined => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    value.id.length > SESSION_ID_MAX_LENGTH ||
    !isWholeNumberInRange(value.startedAt, 1, Number.MAX_SAFE_INTEGER) ||
    !isWholeNumberInRange(value.successfulBrews, 0, Number.MAX_SAFE_INTEGER) ||
    !isWholeNumberInRange(value.failedBrews, 0, Number.MAX_SAFE_INTEGER) ||
    !isWholeNumberInRange(value.currentStreak, 0, Number.MAX_SAFE_INTEGER) ||
    !isWholeNumberInRange(value.bestStreak, 0, Number.MAX_SAFE_INTEGER) ||
    value.currentStreak > value.bestStreak ||
    value.bestStreak > value.successfulBrews
  ) {
    return undefined;
  }

  const ingredientUsage = parseSessionIngredientUsage(value.ingredientUsage, difficulty);
  const recipeIds = parseUniqueSessionIds(
    value.recipeIds,
    new Set(
      RECIPES.filter((recipe) => recipe.difficulty === difficulty).map((recipe) => recipe.id),
    ),
  );
  const reactionIds = parseUniqueSessionIds(value.reactionIds, new Set(enabledReactionIds));
  const recipeCombinations = parseSessionRecipeCombinations(
    value.recipeCombinations,
    difficulty,
    enabledReactionIds,
    shouldAllowMissingCombinations,
  );

  if (
    !ingredientUsage ||
    !recipeIds ||
    !reactionIds ||
    !recipeCombinations ||
    recipeIds.length > value.successfulBrews ||
    recipeCombinations.some((combination) => !recipeIds.includes(combination.recipeId))
  ) {
    return undefined;
  }

  return {
    id: value.id,
    startedAt: value.startedAt,
    successfulBrews: value.successfulBrews,
    failedBrews: value.failedBrews,
    currentStreak: value.currentStreak,
    bestStreak: value.bestStreak,
    ingredientUsage,
    recipeIds,
    reactionIds,
    recipeCombinations,
  };
};

const parseSavedGame = (value: unknown): GameState | undefined => {
  if (
    !isRecord(value) ||
    (value.version !== LEGACY_SAVE_VERSION &&
      value.version !== JOURNAL_SAVE_VERSION &&
      value.version !== SAVE_VERSION) ||
    !isDifficulty(value.difficulty)
  ) {
    return undefined;
  }

  const difficulty = value.difficulty;
  const rules = getDifficultySettings(difficulty);
  const activeRecipe = getCanonicalRecipe(value.activeRecipe, difficulty);
  const shelfStock = parseShelfStock(value.shelfStock, difficulty);
  const cauldronIngredientIds = parseCauldronIngredients(value.cauldronIngredients, difficulty);
  const enabledReactionIds = parseEnabledReactionIds(
    value.enabledReactionIds,
    difficulty,
    rules.reactionCount,
  );
  const lastReactionIds = enabledReactionIds
    ? parseLastReactionIds(value.lastReactionIds, enabledReactionIds)
    : undefined;
  const journalSession = enabledReactionIds
    ? value.version === LEGACY_SAVE_VERSION
      ? createJournalSession()
      : parseJournalSession(
          value.journalSession,
          difficulty,
          enabledReactionIds,
          value.version === JOURNAL_SAVE_VERSION,
        )
    : undefined;
  const hasValidStatus = value.status === 'playing' || value.status === 'paused';

  if (
    !hasValidStatus ||
    !activeRecipe ||
    !shelfStock ||
    !cauldronIngredientIds ||
    !enabledReactionIds ||
    !lastReactionIds ||
    !journalSession
  ) {
    return undefined;
  }

  const hasIngredientsRemaining =
    Object.values(shelfStock).some((amount) => amount > 0) || cauldronIngredientIds.length > 0;

  if (
    !hasIngredientsRemaining ||
    !isWholeNumberInRange(value.score, 0, Number.MAX_SAFE_INTEGER) ||
    !isWholeNumberInRange(value.timeLeft, 1, rules.startingTimeSeconds) ||
    !isWholeNumberInRange(value.lives, 1, rules.startingLives)
  ) {
    return undefined;
  }

  return {
    difficulty,
    status: 'paused',
    score: value.score,
    timeLeft: value.timeLeft,
    timerEndsAt: undefined,
    lives: value.lives,
    gameOverReason: undefined,
    activeRecipe,
    lastBrewResult: undefined,
    enabledReactionIds,
    lastReactionIds,
    shelfStock,
    cauldronIngredientIds,
    previousCauldronIngredientIds: cauldronIngredientIds,
    journalSession,
  };
};

export const didSaveGame = (state: GameState): boolean => {
  if (
    (state.status !== 'playing' && state.status !== 'paused') ||
    !state.activeRecipe ||
    !state.journalSession ||
    state.timeLeft <= 0 ||
    state.lives <= 0
  ) {
    return false;
  }

  const savedGame: SavedGame = {
    version: SAVE_VERSION,
    difficulty: state.difficulty,
    score: state.score,
    timeLeft: state.timeLeft,
    lives: state.lives,
    activeRecipe: state.activeRecipe,
    enabledReactionIds: state.enabledReactionIds,
    lastReactionIds: state.lastReactionIds,
    cauldronIngredients: state.cauldronIngredientIds,
    shelfStock: state.shelfStock,
    status: state.status,
    journalSession: state.journalSession,
  };

  try {
    const storage = getBrowserStorage();

    if (!storage) {
      return false;
    }

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(savedGame));

    return true;
  } catch {
    return false;
  }
};

export const loadGame = (): GameState | undefined => {
  try {
    const storage = getBrowserStorage();
    const savedValue = storage?.getItem(SAVE_STORAGE_KEY);

    if (!storage || !savedValue) {
      return undefined;
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    const gameState = parseSavedGame(parsedValue);

    if (!gameState) {
      storage.removeItem(SAVE_STORAGE_KEY);
    }

    return gameState;
  } catch {
    try {
      getBrowserStorage()?.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Storage is unavailable, so there is nothing else to recover.
    }

    return undefined;
  }
};

export const didClearSavedGame = (): boolean => {
  try {
    const storage = getBrowserStorage();

    if (!storage) {
      return false;
    }

    storage.removeItem(SAVE_STORAGE_KEY);

    return true;
  } catch {
    return false;
  }
};
