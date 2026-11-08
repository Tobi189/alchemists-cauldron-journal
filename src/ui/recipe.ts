import densityIconUrl from '../assets/ui/density.svg';
import magicIconUrl from '../assets/ui/magic.svg';
import potionSketchUrl from '../assets/ui/potion-sketch.svg';
import temperatureIconUrl from '../assets/ui/temperature.svg';
import { getDifficultySettings } from '../data/difficulty.ts';
import { getRecipeArtworkUrl } from '../data/recipe-artwork.ts';
import type { GameState, RecipeRange } from '../types/game.ts';

const formatRange = (range: RecipeRange): string => `${range.min}–${range.max}`;

const createRangeRow = (
  label: string,
  value: string,
  className: string,
  iconUrl: string,
): HTMLElement => {
  const row = document.createElement('div');
  const icon = document.createElement('img');
  const rowLabel = document.createElement('span');
  const rowValue = document.createElement('strong');

  row.className = `recipe-panel__range ${className}`;
  icon.className = 'recipe-panel__range-icon';
  icon.src = iconUrl;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  rowLabel.textContent = label;
  rowValue.textContent = value;
  row.append(icon, rowLabel, rowValue);

  return row;
};

export const createRecipePanel = (state: GameState): HTMLElement => {
  const panel = document.createElement('aside');
  const eyebrow = document.createElement('p');
  const title = document.createElement('h2');
  const sketch = document.createElement('img');
  const content = document.createElement('div');
  const counter = document.createElement('p');
  const count = state.cauldronIngredientIds.length;
  const rules = getDifficultySettings(state.difficulty);

  panel.className = 'recipe-panel';
  eyebrow.className = 'recipe-panel__eyebrow';
  title.className = 'recipe-panel__title';
  sketch.className = 'recipe-panel__sketch';
  sketch.src = potionSketchUrl;
  sketch.alt = '';
  sketch.setAttribute('aria-hidden', 'true');
  content.className = 'recipe-panel__content';
  counter.className = 'recipe-panel__counter';
  eyebrow.textContent = 'Current Recipe';
  counter.textContent = `Ingredients: ${count} / ${rules.cauldronCapacity}`;

  if (state.activeRecipe) {
    const artworkUrl = getRecipeArtworkUrl(state.activeRecipe.id);

    panel.classList.add('recipe-panel--active', `recipe-panel--${state.activeRecipe.difficulty}`);
    title.textContent = state.activeRecipe.name;
    sketch.className = 'recipe-panel__artwork';
    sketch.src = artworkUrl ?? potionSketchUrl;
    sketch.alt = `${state.activeRecipe.name} recipe emblem`;
    sketch.removeAttribute('aria-hidden');
    content.classList.add('recipe-panel__ranges');
    content.append(
      createRangeRow(
        'Temperature',
        formatRange(state.activeRecipe.temperature),
        'recipe-panel__range--temperature',
        temperatureIconUrl,
      ),
      createRangeRow(
        'Density',
        formatRange(state.activeRecipe.density),
        'recipe-panel__range--density',
        densityIconUrl,
      ),
      createRangeRow(
        'Magic Power',
        formatRange(state.activeRecipe.magicPower),
        'recipe-panel__range--magic',
        magicIconUrl,
      ),
    );
  } else {
    const message = document.createElement('p');
    title.textContent = 'The Grimoire Sleeps';
    message.className = 'recipe-panel__message';
    message.textContent = 'Begin a new game to open the recipe book.';
    content.append(message);
  }

  if (count === rules.cauldronCapacity) {
    counter.classList.add('recipe-panel__counter--full');
  }

  panel.append(eyebrow, title, sketch, content, counter);

  return panel;
};
