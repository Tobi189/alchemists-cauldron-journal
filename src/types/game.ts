import type { JournalSessionProgress } from './journal.ts';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'menu' | 'playing' | 'paused' | 'game-over';
export type BrewResult = 'success' | 'failure';
export type GameOverReason = 'time' | 'lives' | 'ingredients';
export type RandomSource = () => number;
export type TimestampSource = () => number;

export type ShelfStock = Readonly<Record<string, number>>;

export interface Ingredient {
  readonly id: string;
  readonly name: string;
  readonly iconUrl: string;
  readonly sigilUrl: string;
  readonly temperature: number;
  readonly density: number;
  readonly magicPower: number;
}

export interface GameRules {
  readonly difficulty: Difficulty;
  readonly shelfSize: number;
  readonly cauldronCapacity: number;
  readonly startingTimeSeconds: number;
  readonly recipeTolerance: number;
  readonly startingLives: number;
  readonly scorePerBrew: number;
  readonly timeBonusSeconds: number;
  readonly reactionCount: number;
}

export interface ParameterValues {
  readonly temperature: number;
  readonly density: number;
  readonly magicPower: number;
}

export interface RecipeRange {
  readonly min: number;
  readonly max: number;
}

export interface Recipe {
  readonly id: string;
  readonly name: string;
  readonly difficulty: Difficulty;
  readonly temperature: RecipeRange;
  readonly density: RecipeRange;
  readonly magicPower: RecipeRange;
}

export type ReactionType = 'ingredients' | 'stats' | 'mix';

export interface Reaction {
  readonly id: string;
  readonly name: string;
  readonly type: ReactionType;
  readonly requiredIngredientIds: readonly string[];
  readonly isActive: (ingredientIds: readonly string[], values: ParameterValues) => boolean;
  readonly apply: (values: ParameterValues) => ParameterValues;
  readonly timePenaltySeconds: number;
  readonly lifePenalty: number;
  readonly clearsCauldron: boolean;
}

export interface GameState {
  readonly difficulty: Difficulty;
  readonly status: GameStatus;
  readonly score: number;
  readonly timeLeft: number;
  readonly timerEndsAt: number | undefined;
  readonly lives: number;
  readonly gameOverReason: GameOverReason | undefined;
  readonly activeRecipe: Recipe | undefined;
  readonly lastBrewResult: BrewResult | undefined;
  readonly enabledReactionIds: readonly string[];
  readonly lastReactionIds: readonly string[];
  readonly shelfStock: ShelfStock;
  readonly cauldronIngredientIds: readonly string[];
  readonly previousCauldronIngredientIds: readonly string[];
  readonly journalSession: JournalSessionProgress | undefined;
}
