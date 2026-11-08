import ornateCauldronUrl from '../assets/ui/ornate-cauldron.webp';
import { getDifficultySettings } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import type { BrewResult, GameState } from '../types/game.ts';
import { getDraggedIngredientId, isIngredientDrag } from './drag-and-drop.ts';

const createCauldronContents = (state: GameState): HTMLElement => {
  const contents = document.createElement('div');
  const animationOrigin = `-${Math.round(performance.now())}ms`;
  contents.className = 'cauldron__contents';

  if (state.cauldronIngredientIds.length === 0) {
    const emptyMessage = document.createElement('span');
    emptyMessage.className = 'cauldron__empty-message';
    emptyMessage.textContent =
      state.status === 'menu' ? 'The cauldron is dormant' : 'Add an ingredient';
    contents.append(emptyMessage);

    return contents;
  }

  for (const [index, ingredientId] of state.cauldronIngredientIds.entries()) {
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);

    if (!ingredient) {
      continue;
    }

    const item = document.createElement('span');
    const position = document.createElement('span');
    const icon = document.createElement('img');

    item.className = 'cauldron__ingredient';
    item.style.setProperty('--cauldron-animation-origin', animationOrigin);
    position.className = 'cauldron__ingredient-position';
    icon.className = 'cauldron__ingredient-icon';
    item.title = ingredient.name;
    position.textContent = String(index + 1);
    icon.src = ingredient.iconUrl;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    item.append(position, icon);
    contents.append(item);
  }

  return contents;
};

export const createCauldron = (
  state: GameState,
  onAddIngredient: (ingredientId: string) => void,
  brewVisualFeedback: BrewResult | undefined,
): HTMLElement => {
  const section = document.createElement('section');
  const stage = document.createElement('div');
  const glow = document.createElement('div');
  const vessel = document.createElement('div');
  const artwork = document.createElement('img');
  const rim = document.createElement('div');
  const liquid = document.createElement('div');
  const feedback = document.createElement('div');
  const rules = getDifficultySettings(state.difficulty);
  const canAcceptDrop =
    state.status === 'playing' && state.cauldronIngredientIds.length < rules.cauldronCapacity;

  const removeDropHighlight = (): void => {
    stage.classList.remove('cauldron-stage--drop-target');
  };

  section.className = 'cauldron-area';
  stage.className = 'cauldron-stage';
  stage.setAttribute('aria-label', 'Cauldron drop zone');
  glow.className = 'cauldron-stage__glow';
  vessel.className = 'cauldron';
  artwork.className = 'cauldron__artwork';
  rim.className = 'cauldron__rim';
  liquid.className = 'cauldron__liquid';
  feedback.className = 'cauldron-feedback';
  artwork.src = ornateCauldronUrl;
  artwork.alt = '';
  artwork.draggable = false;
  artwork.setAttribute('aria-hidden', 'true');
  feedback.setAttribute('aria-hidden', 'true');

  if (brewVisualFeedback) {
    stage.classList.add(`cauldron-stage--brew-${brewVisualFeedback}`);
    feedback.classList.add(`cauldron-feedback--${brewVisualFeedback}`);

    for (let particleIndex = 0; particleIndex < 8; particleIndex += 1) {
      const particle = document.createElement('span');
      particle.className = 'cauldron-feedback__particle';
      particle.style.setProperty('--particle-angle', `${particleIndex * 45}deg`);
      feedback.append(particle);
    }
  }

  stage.addEventListener('dragover', (event) => {
    if (!canAcceptDrop || !isIngredientDrag(event)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    stage.classList.add('cauldron-stage--drop-target');
  });
  stage.addEventListener('dragleave', (event) => {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !stage.contains(nextTarget)) {
      removeDropHighlight();
    }
  });
  stage.addEventListener('drop', (event) => {
    removeDropHighlight();

    if (!canAcceptDrop || !isIngredientDrag(event)) {
      return;
    }

    event.preventDefault();

    const ingredientId = getDraggedIngredientId(event);

    if (ingredientId) {
      onAddIngredient(ingredientId);
    }
  });

  liquid.append(createCauldronContents(state));
  rim.append(liquid);
  vessel.append(artwork, rim);
  stage.append(glow, vessel, feedback);

  section.append(stage);

  return section;
};
