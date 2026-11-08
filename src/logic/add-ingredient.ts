import { getDifficultySettings } from '../data/difficulty.ts';
import { applyReactionTransition } from './reactions.ts';
import { decreaseIngredientStock } from './stock.ts';
import { recordIngredientUse } from './journal-session.ts';
import type { GameState, TimestampSource } from '../types/game.ts';

export const canAddIngredient = (state: GameState, ingredientId: string): boolean => {
  const rules = getDifficultySettings(state.difficulty);

  return (
    state.status === 'playing' &&
    state.cauldronIngredientIds.length < rules.cauldronCapacity &&
    (state.shelfStock[ingredientId] ?? 0) > 0
  );
};

export const addIngredient = (
  state: GameState,
  ingredientId: string,
  getTimestamp: TimestampSource = Date.now,
): GameState => {
  if (!canAddIngredient(state, ingredientId)) {
    return state;
  }

  const nextState = {
    ...state,
    lastBrewResult: undefined,
    shelfStock: decreaseIngredientStock(state.shelfStock, ingredientId),
  };

  const reactedState = applyReactionTransition(
    nextState,
    [...state.cauldronIngredientIds, ingredientId],
    getTimestamp,
  );

  return {
    ...reactedState,
    journalSession: recordIngredientUse(
      reactedState.journalSession,
      ingredientId,
      reactedState.lastReactionIds,
    ),
  };
};
