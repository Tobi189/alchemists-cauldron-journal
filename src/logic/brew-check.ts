import { getDifficultySettings } from '../data/difficulty.ts';
import { clearCauldron } from './clear-cauldron.ts';
import { isValueInRange } from './range.ts';
import { calculateReactedCauldronValues, getActiveReactionIds } from './reactions.ts';
import { selectRandomRecipe } from './recipe-generator.ts';
import { getRemainingTime } from './timer.ts';
import { recordBrew } from './journal-session.ts';
import type {
  GameState,
  ParameterValues,
  RandomSource,
  Recipe,
  TimestampSource,
} from '../types/game.ts';

export const isSuccessfulBrew = (
  values: ParameterValues,
  recipe: Recipe,
  tolerance: number,
): boolean =>
  isValueInRange(values.temperature, recipe.temperature, tolerance) &&
  isValueInRange(values.density, recipe.density, tolerance) &&
  isValueInRange(values.magicPower, recipe.magicPower, tolerance);

export const brewPotion = (
  state: GameState,
  random: RandomSource = Math.random,
  getTimestamp: TimestampSource = Date.now,
): GameState => {
  if (
    state.status !== 'playing' ||
    state.cauldronIngredientIds.length === 0 ||
    !state.activeRecipe
  ) {
    return state;
  }

  const timestamp = getTimestamp();
  const timeLeft = getRemainingTime(state, () => timestamp);
  const rules = getDifficultySettings(state.difficulty);

  if (timeLeft === 0) {
    return { ...state, timeLeft };
  }

  const values = calculateReactedCauldronValues(
    state.cauldronIngredientIds,
    state.enabledReactionIds,
  );
  const activeReactionIds = getActiveReactionIds(
    state.cauldronIngredientIds,
    state.enabledReactionIds,
  );
  const isSuccess = isSuccessfulBrew(values, state.activeRecipe, rules.recipeTolerance);
  const clearedState = clearCauldron({
    ...state,
    timeLeft,
  });

  if (isSuccess) {
    const nextTimeLeft = Math.min(timeLeft + rules.timeBonusSeconds, rules.startingTimeSeconds);

    return {
      ...clearedState,
      score: state.score + rules.scorePerBrew,
      timeLeft: nextTimeLeft,
      timerEndsAt: timestamp + nextTimeLeft * 1000,
      activeRecipe: selectRandomRecipe(state.difficulty, random),
      lastBrewResult: 'success',
      journalSession: recordBrew(state.journalSession, 'success', state.activeRecipe.id, {
        recipeId: state.activeRecipe.id,
        ingredientIds: state.cauldronIngredientIds,
        values,
        reactionIds: activeReactionIds,
      }),
    };
  }

  return {
    ...clearedState,
    lives: Math.max(state.lives - 1, 0),
    lastBrewResult: 'failure',
    journalSession: recordBrew(state.journalSession, 'failure', state.activeRecipe.id),
  };
};
