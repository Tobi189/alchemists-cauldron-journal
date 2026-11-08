import { REACTIONS } from '../data/reactions.ts';
import { calculateCauldronValues } from './calculate-cauldron.ts';
import { getRemainingTime } from './timer.ts';
import type { GameState, ParameterValues, Reaction, TimestampSource } from '../types/game.ts';

const getEnabledReactions = (enabledReactionIds: readonly string[]): readonly Reaction[] => {
  const enabledIds = new Set(enabledReactionIds);

  return REACTIONS.filter((reaction) => enabledIds.has(reaction.id));
};

const getActiveReactions = (
  ingredientIds: readonly string[],
  enabledReactionIds: readonly string[],
): readonly Reaction[] => {
  const values = calculateCauldronValues(ingredientIds);

  return getEnabledReactions(enabledReactionIds).filter((reaction) =>
    reaction.isActive(ingredientIds, values),
  );
};

export const getActiveReactionIds = (
  ingredientIds: readonly string[],
  enabledReactionIds: readonly string[],
): readonly string[] =>
  getActiveReactions(ingredientIds, enabledReactionIds).map((reaction) => reaction.id);

export const calculateReactedCauldronValues = (
  ingredientIds: readonly string[],
  enabledReactionIds: readonly string[],
): ParameterValues => {
  const activeReactions = getActiveReactions(ingredientIds, enabledReactionIds);
  let values = calculateCauldronValues(ingredientIds);

  for (const reaction of activeReactions) {
    values = reaction.apply(values);
  }

  return values;
};

export const applyReactionTransition = (
  state: GameState,
  nextIngredientIds: readonly string[],
  getTimestamp: TimestampSource = Date.now,
): GameState => {
  const timestamp = getTimestamp();
  const previouslyActiveIds = new Set(
    getActiveReactions(state.cauldronIngredientIds, state.enabledReactionIds).map(
      (reaction) => reaction.id,
    ),
  );
  const newlyActivated = getActiveReactions(nextIngredientIds, state.enabledReactionIds).filter(
    (reaction) => !previouslyActiveIds.has(reaction.id),
  );

  if (newlyActivated.length === 0) {
    return {
      ...state,
      lastReactionIds: [],
      previousCauldronIngredientIds: state.cauldronIngredientIds,
      cauldronIngredientIds: nextIngredientIds,
    };
  }

  let timePenalty = 0;
  let lifePenalty = 0;

  for (const reaction of newlyActivated) {
    timePenalty += reaction.timePenaltySeconds;
    lifePenalty += reaction.lifePenalty;
  }
  const timeLeft = Math.max(getRemainingTime(state, () => timestamp) - timePenalty, 0);
  const shouldClearCauldron = newlyActivated.some((reaction) => reaction.clearsCauldron);

  return {
    ...state,
    timeLeft,
    timerEndsAt: timeLeft > 0 ? timestamp + timeLeft * 1000 : undefined,
    lives: Math.max(state.lives - lifePenalty, 0),
    lastReactionIds: newlyActivated.map((reaction) => reaction.id),
    previousCauldronIngredientIds: state.cauldronIngredientIds,
    cauldronIngredientIds: shouldClearCauldron ? [] : nextIngredientIds,
  };
};
