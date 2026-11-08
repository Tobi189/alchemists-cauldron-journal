import { DEFAULT_DIFFICULTY, getDifficultySettings } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { selectRandomRecipe } from '../logic/recipe-generator.ts';
import { selectRandomReactionIds } from '../data/reactions.ts';
import { createShelfStock } from '../logic/stock.ts';
import { createJournalSession } from '../logic/journal-session.ts';
import type { Difficulty, GameState, RandomSource, TimestampSource } from '../types/game.ts';

export const createMenuState = (difficulty: Difficulty = DEFAULT_DIFFICULTY): GameState => ({
  difficulty,
  status: 'menu',
  score: 0,
  timeLeft: 0,
  timerEndsAt: undefined,
  lives: 0,
  gameOverReason: undefined,
  activeRecipe: undefined,
  lastBrewResult: undefined,
  enabledReactionIds: [],
  lastReactionIds: [],
  shelfStock: {},
  cauldronIngredientIds: [],
  previousCauldronIngredientIds: [],
  journalSession: undefined,
});

export const createNewGameState = (
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
  random: RandomSource = Math.random,
  getTimestamp: TimestampSource = Date.now,
): GameState => {
  const rules = getDifficultySettings(difficulty);
  const timeLeft = rules.startingTimeSeconds;

  return {
    difficulty,
    status: 'playing',
    score: 0,
    timeLeft,
    timerEndsAt: getTimestamp() + timeLeft * 1000,
    lives: rules.startingLives,
    gameOverReason: undefined,
    activeRecipe: selectRandomRecipe(difficulty, random),
    lastBrewResult: undefined,
    enabledReactionIds: selectRandomReactionIds(rules.reactionCount, difficulty, random),
    lastReactionIds: [],
    shelfStock: createShelfStock(INGREDIENTS, rules.shelfSize, random),
    cauldronIngredientIds: [],
    previousCauldronIngredientIds: [],
    journalSession: createJournalSession(getTimestamp()),
  };
};
