import { ACHIEVEMENTS } from '../data/achievements.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { REACTIONS } from '../data/reactions.ts';
import { RECIPES } from '../data/recipes.ts';
import { isValidPlayerName } from '../logic/leaderboard.ts';
import type { JournalData, JournalSession } from '../types/journal.ts';

export const JOURNAL_TABS = ['overview', 'discoveries', 'achievements', 'history'] as const;

export type JournalTab = (typeof JOURNAL_TABS)[number];

interface JournalStatistics {
  readonly sessions: number;
  readonly successfulBrews: number;
  readonly bestScore: number;
  readonly bestStreak: number;
}

const formatLabel = (value: string): string =>
  value
    .split('-')
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');

const formatDate = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));

const getJournalStatistics = (journal: JournalData): JournalStatistics => {
  let successfulBrews = 0;
  let bestScore = 0;
  let bestStreak = 0;

  for (const session of journal.sessions) {
    successfulBrews += session.successfulBrews;
    bestScore = Math.max(bestScore, session.score);
    bestStreak = Math.max(bestStreak, session.bestStreak);
  }

  return {
    sessions: journal.sessions.length,
    successfulBrews,
    bestScore,
    bestStreak,
  };
};

const createStatCard = (label: string, value: string): HTMLElement => {
  const card = document.createElement('article');
  const valueElement = document.createElement('strong');
  const labelElement = document.createElement('span');

  card.className = 'journal-stat';
  valueElement.className = 'journal-stat__value';
  labelElement.className = 'journal-stat__label';
  valueElement.textContent = value;
  labelElement.textContent = label;
  card.append(valueElement, labelElement);

  return card;
};

const createOverview = (
  journal: JournalData,
  onUpdateProfile: (displayName: string) => void,
): HTMLElement => {
  const content = document.createElement('div');
  const introduction = document.createElement('p');
  const profile = document.createElement('section');
  const profileHeading = document.createElement('h3');
  const form = document.createElement('form');
  const label = document.createElement('label');
  const row = document.createElement('div');
  const input = document.createElement('input');
  const submitButton = document.createElement('button');
  const error = document.createElement('p');
  const statistics = document.createElement('section');
  const statisticsHeading = document.createElement('h3');
  const grid = document.createElement('div');
  const stats = getJournalStatistics(journal);

  content.className = 'journal-panel';
  introduction.className = 'journal-panel__introduction';
  introduction.textContent =
    'Your journal records finished experiments, rare discoveries and milestones across every difficulty.';
  profile.className = 'journal-section journal-profile';
  profileHeading.className = 'journal-section__title';
  profileHeading.textContent = 'Alchemist Profile';
  form.className = 'journal-profile__form';
  label.className = 'journal-profile__label';
  label.htmlFor = 'journal-display-name';
  label.textContent = 'Display name';
  row.className = 'journal-profile__row';
  input.className = 'journal-profile__input';
  input.id = 'journal-display-name';
  input.name = 'displayName';
  input.type = 'text';
  input.minLength = 2;
  input.maxLength = 15;
  input.required = true;
  input.autocomplete = 'off';
  input.value = journal.profile.displayName;
  submitButton.className = 'secondary-action journal-profile__submit';
  submitButton.type = 'submit';
  submitButton.textContent = 'Save Name';
  error.className = 'journal-profile__error';
  error.setAttribute('aria-live', 'polite');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!isValidPlayerName(input.value.trim())) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'Use 2–15 letters, digits, spaces, _ or -.';
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    error.textContent = '';
    onUpdateProfile(input.value);
  });
  row.append(input, submitButton);
  form.append(label, row, error);
  profile.append(profileHeading, form);

  statistics.className = 'journal-section';
  statisticsHeading.className = 'journal-section__title';
  statisticsHeading.textContent = 'Career Record';
  grid.className = 'journal-stats';
  grid.append(
    createStatCard('Sessions', String(stats.sessions)),
    createStatCard('Successful brews', String(stats.successfulBrews)),
    createStatCard('Best score', String(stats.bestScore)),
    createStatCard('Best streak', String(stats.bestStreak)),
  );
  statistics.append(statisticsHeading, grid);
  content.append(introduction, profile, statistics);

  return content;
};

interface DiscoveryItem {
  readonly id: string;
  readonly name: string;
  readonly iconUrl?: string;
}

const createDiscoveryGroup = (
  title: string,
  items: readonly DiscoveryItem[],
  discoveredIds: readonly string[],
): HTMLElement => {
  const section = document.createElement('section');
  const heading = document.createElement('div');
  const titleElement = document.createElement('h3');
  const count = document.createElement('span');
  const grid = document.createElement('div');
  const discoveries = new Set(discoveredIds);

  section.className = 'journal-section journal-discoveries';
  heading.className = 'journal-section__heading';
  titleElement.className = 'journal-section__title';
  titleElement.textContent = title;
  count.className = 'journal-section__count';
  count.textContent = `${discoveries.size}/${items.length}`;
  grid.className = 'journal-discovery-grid';

  for (const item of items) {
    const isDiscovered = discoveries.has(item.id);
    const card = document.createElement('article');
    const name = document.createElement('strong');

    card.className = 'journal-discovery';
    card.classList.toggle('journal-discovery--locked', !isDiscovered);
    name.className = 'journal-discovery__name';
    name.textContent = isDiscovered ? item.name : 'Undiscovered';

    if (item.iconUrl) {
      const icon = document.createElement('img');
      icon.className = 'journal-discovery__icon';
      icon.src = item.iconUrl;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      card.append(icon);
    } else {
      const sigil = document.createElement('span');
      sigil.className = 'journal-discovery__sigil';
      sigil.setAttribute('aria-hidden', 'true');
      sigil.textContent = isDiscovered ? '✦' : '?';
      card.append(sigil);
    }

    card.append(name);
    grid.append(card);
  }

  heading.append(titleElement, count);
  section.append(heading, grid);

  return section;
};

const createDiscoveries = (journal: JournalData): HTMLElement => {
  const content = document.createElement('div');

  content.className = 'journal-panel';
  content.append(
    createDiscoveryGroup('Ingredients', INGREDIENTS, journal.discoveries.ingredientIds),
    createDiscoveryGroup('Recipes', RECIPES, journal.discoveries.recipeIds),
    createDiscoveryGroup('Reactions', REACTIONS, journal.discoveries.reactionIds),
  );

  return content;
};

const createAchievements = (journal: JournalData): HTMLElement => {
  const content = document.createElement('div');
  const summary = document.createElement('p');
  const grid = document.createElement('div');
  const unlockedById = new Map(
    journal.achievements.map((achievement) => [achievement.id, achievement]),
  );

  content.className = 'journal-panel';
  summary.className = 'journal-panel__introduction';
  summary.textContent = `${journal.achievements.length} of ${ACHIEVEMENTS.length} achievements unlocked.`;
  grid.className = 'journal-achievements';

  for (const achievement of ACHIEVEMENTS) {
    const unlocked = unlockedById.get(achievement.id);
    const card = document.createElement('article');
    const emblem = document.createElement('span');
    const details = document.createElement('div');
    const title = document.createElement('h3');
    const description = document.createElement('p');

    card.className = 'journal-achievement';
    card.classList.toggle('journal-achievement--locked', !unlocked);
    emblem.className = 'journal-achievement__emblem';
    emblem.setAttribute('aria-hidden', 'true');
    emblem.textContent = unlocked ? '✦' : '◇';
    details.className = 'journal-achievement__details';
    title.className = 'journal-achievement__title';
    title.textContent = achievement.title;
    description.className = 'journal-achievement__description';
    description.textContent = achievement.description;
    details.append(title, description);

    if (unlocked) {
      const unlockedAt = document.createElement('p');
      unlockedAt.className = 'journal-achievement__date';
      unlockedAt.textContent = `Unlocked ${formatDate(unlocked.unlockedAt)}`;
      details.append(unlockedAt);
    }

    card.append(emblem, details);
    grid.append(card);
  }

  content.append(summary, grid);

  return content;
};

const createSessionCard = (session: JournalSession): HTMLElement => {
  const card = document.createElement('article');
  const heading = document.createElement('div');
  const difficulty = document.createElement('strong');
  const date = document.createElement('time');
  const score = document.createElement('p');
  const details = document.createElement('dl');
  const detailValues: readonly [string, string][] = [
    ['Outcome', formatLabel(session.outcome)],
    ['Successful', String(session.successfulBrews)],
    ['Failed', String(session.failedBrews)],
    ['Best streak', String(session.bestStreak)],
  ];

  card.className = 'journal-session';
  heading.className = 'journal-session__heading';
  difficulty.className = `journal-session__difficulty journal-session__difficulty--${session.difficulty}`;
  difficulty.textContent = formatLabel(session.difficulty);
  date.className = 'journal-session__date';
  date.dateTime = new Date(session.endedAt).toISOString();
  date.textContent = formatDate(session.endedAt);
  score.className = 'journal-session__score';
  score.textContent = `${session.score} points`;
  details.className = 'journal-session__details';

  for (const [termValue, descriptionValue] of detailValues) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = termValue;
    description.textContent = descriptionValue;
    details.append(term, description);
  }

  heading.append(difficulty, date);
  card.append(heading, score, details);

  return card;
};

const createHistory = (journal: JournalData): HTMLElement => {
  const content = document.createElement('div');

  content.className = 'journal-panel';

  if (journal.sessions.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'journal-empty';
    empty.textContent = 'No experiments recorded yet. Finish or leave a game to create an entry.';
    content.append(empty);
    return content;
  }

  const list = document.createElement('div');
  const sessions = journal.sessions.toSorted((a, b) => b.endedAt - a.endedAt);
  list.className = 'journal-history';

  for (const session of sessions) {
    list.append(createSessionCard(session));
  }

  content.append(list);

  return content;
};

const createJournalPanel = (
  journal: JournalData,
  selectedTab: JournalTab,
  onUpdateProfile: (displayName: string) => void,
): HTMLElement => {
  switch (selectedTab) {
    case 'overview': {
      return createOverview(journal, onUpdateProfile);
    }
    case 'discoveries': {
      return createDiscoveries(journal);
    }
    case 'achievements': {
      return createAchievements(journal);
    }
    case 'history': {
      return createHistory(journal);
    }
  }
};

export const createJournalDialog = (
  journal: JournalData,
  selectedTab: JournalTab,
  onSelectTab: (tab: JournalTab) => void,
  onUpdateProfile: (displayName: string) => void,
  onClose: () => void,
): HTMLElement => {
  const overlay = document.createElement('div');
  const dialog = document.createElement('section');
  const eyebrow = document.createElement('p');
  const title = document.createElement('h2');
  const tabs = document.createElement('div');
  const panel = createJournalPanel(journal, selectedTab, onUpdateProfile);
  const actions = document.createElement('div');
  const closeButton = document.createElement('button');

  overlay.className = 'dialog-overlay';
  dialog.className = 'game-over-dialog journal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'journal-dialog-title');
  eyebrow.className = 'game-over-dialog__eyebrow';
  eyebrow.textContent = `${journal.profile.displayName}'s private records`;
  title.className = 'game-over-dialog__title journal-dialog__title';
  title.id = 'journal-dialog-title';
  title.textContent = "Alchemist's Journal";
  tabs.className = 'journal-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Journal sections');

  for (const tab of JOURNAL_TABS) {
    const button = document.createElement('button');
    const isSelected = selectedTab === tab;
    button.className = 'journal-tabs__button';
    button.classList.toggle('journal-tabs__button--selected', isSelected);
    button.type = 'button';
    button.role = 'tab';
    button.setAttribute('aria-selected', String(isSelected));
    button.autofocus = isSelected;
    button.textContent = formatLabel(tab);
    button.addEventListener('click', () => {
      onSelectTab(tab);
    });
    tabs.append(button);
  }

  panel.id = `journal-panel-${selectedTab}`;
  panel.setAttribute('role', 'tabpanel');
  actions.className = 'dialog-actions';
  closeButton.className = 'primary-action';
  closeButton.type = 'button';
  closeButton.textContent = 'Close Journal';
  closeButton.addEventListener('click', onClose);
  actions.append(closeButton);
  dialog.append(eyebrow, title, tabs, panel, actions);
  overlay.append(dialog);

  return overlay;
};
