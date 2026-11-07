import { getDifficultySettings } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import type { GameState, Ingredient } from '../types/game.ts';
import { didStartIngredientDrag } from './drag-and-drop.ts';
import { createIngredientTooltip } from './ingredient-tooltip.ts';

const formatModifier = (value: number): string =>
  value > 0 ? `+${value}` : String(value).replace('-', '−');

const createStat = (label: string, value: number, className: string): HTMLElement => {
  const stat = document.createElement('span');
  const abbreviation = document.createElement('abbr');

  stat.className = `ingredient-card__stat ${className}`;
  abbreviation.title = label;
  abbreviation.textContent = label === 'Magic Power' ? 'MP' : (label[0] ?? '');
  stat.append(abbreviation, ` ${formatModifier(value)}`);

  return stat;
};

const createEmptySlot = (position: number): HTMLButtonElement => {
  const slot = document.createElement('button');
  const side = document.createElement('span');
  const badge = document.createElement('span');
  const message = document.createElement('span');

  slot.className = 'ingredient-card ingredient-card--empty';
  slot.type = 'button';
  slot.disabled = true;
  slot.dataset.focusKey = `ingredient-slot-${position}`;
  slot.setAttribute('aria-label', `Empty ingredient slot ${position}`);
  badge.className = 'ingredient-card__stock';
  side.className = 'ingredient-card__side';
  message.className = 'ingredient-card__empty-message';
  badge.textContent = '0';
  message.textContent = 'Empty shelf';
  side.append(badge);
  slot.append(message, side);

  return slot;
};

const createIngredientCard = (
  ingredient: Ingredient,
  position: number,
  state: GameState,
  isShelfBlocked: boolean,
  onAddIngredient: (ingredientId: string) => void,
): HTMLButtonElement => {
  const stock = state.shelfStock[ingredient.id] ?? 0;

  if (stock === 0) {
    return createEmptySlot(position);
  }

  const isTooltipEnabled = state.difficulty === 'hard';
  const card = document.createElement('button');
  const icon = document.createElement('img');
  const content = document.createElement('span');
  const name = document.createElement('span');
  const stats = document.createElement('span');
  const side = document.createElement('span');
  const sigil = document.createElement('img');
  const badge = document.createElement('span');

  card.className = 'ingredient-card';
  card.dataset.focusKey = `ingredient-${ingredient.id}`;
  card.classList.toggle('ingredient-card--tooltip', isTooltipEnabled);
  card.type = 'button';
  card.disabled = isShelfBlocked;
  card.draggable = !isShelfBlocked;
  card.ariaKeyShortcuts = String(position);
  card.setAttribute('aria-label', `Add ${ingredient.name}. ${stock} portions remaining.`);
  icon.className = 'ingredient-card__icon';
  content.className = 'ingredient-card__content';
  name.className = 'ingredient-card__name';
  stats.className = 'ingredient-card__stats';
  side.className = 'ingredient-card__side';
  sigil.className = 'ingredient-card__sigil';
  badge.className = 'ingredient-card__stock';
  icon.src = ingredient.iconUrl;
  icon.draggable = false;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  sigil.src = ingredient.sigilUrl;
  sigil.draggable = false;
  sigil.alt = '';
  sigil.setAttribute('aria-hidden', 'true');
  name.textContent = ingredient.name;
  badge.textContent = String(stock);
  if (isTooltipEnabled) {
    const tooltip = createIngredientTooltip(ingredient, card);
    card.setAttribute('aria-describedby', tooltip.id);
    content.append(name);
    side.append(badge);
    card.append(icon, content, side, tooltip);
  } else {
    stats.append(
      createStat('Temperature', ingredient.temperature, 'ingredient-card__stat--temperature'),
      createStat('Density', ingredient.density, 'ingredient-card__stat--density'),
      createStat('Magic Power', ingredient.magicPower, 'ingredient-card__stat--magic'),
    );
    content.append(name, stats);
    side.append(sigil, badge);
    card.append(icon, content, side);
  }
  card.addEventListener('click', () => {
    onAddIngredient(ingredient.id);
  });
  card.addEventListener('dragstart', (event) => {
    if (card.disabled || !didStartIngredientDrag(event, ingredient.id)) {
      event.preventDefault();
      return;
    }

    card.classList.add('ingredient-card--dragging');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('ingredient-card--dragging');
  });

  return card;
};

export const createShelf = (
  state: GameState,
  onAddIngredient: (ingredientId: string) => void,
): HTMLElement => {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  const list = document.createElement('div');
  const rules = getDifficultySettings(state.difficulty);
  const isShelfBlocked =
    state.status !== 'playing' || state.cauldronIngredientIds.length >= rules.cauldronCapacity;

  section.className = 'ingredient-shelf';
  heading.className = 'panel-heading';
  list.className = 'ingredient-shelf__list';
  heading.textContent = 'Ingredients';
  section.append(heading, list);

  if (state.status === 'menu') {
    for (let position = 1; position <= rules.shelfSize; position += 1) {
      list.append(createEmptySlot(position));
    }
  } else {
    for (const [index, ingredient] of INGREDIENTS.slice(0, rules.shelfSize).entries()) {
      list.append(
        createIngredientCard(ingredient, index + 1, state, isShelfBlocked, onAddIngredient),
      );
    }
  }

  if (state.cauldronIngredientIds.length >= rules.cauldronCapacity) {
    const notice = document.createElement('p');
    notice.className = 'ingredient-shelf__notice';
    notice.textContent = 'The cauldron is full';
    section.append(notice);
  }

  return section;
};
