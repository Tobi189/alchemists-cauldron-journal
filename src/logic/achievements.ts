import { ACHIEVEMENT_IDS, type AchievementId } from '../data/achievements.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { REACTIONS } from '../data/reactions.ts';
import { RECIPES } from '../data/recipes.ts';
import type { JournalData, UnlockedAchievement } from '../types/journal.ts';

const hasUnlockedAchievement = (journal: JournalData, id: AchievementId): boolean =>
  journal.achievements.some((achievement) => achievement.id === id);

const hasMetAchievement = (journal: JournalData, id: AchievementId): boolean => {
  let totalSuccessfulBrews = 0;

  for (const session of journal.sessions) {
    totalSuccessfulBrews += session.successfulBrews;
  }

  switch (id) {
    case 'first-success': {
      return totalSuccessfulBrews >= 1;
    }
    case 'steady-hand': {
      return journal.sessions.some((session) => session.bestStreak >= 3);
    }
    case 'master-brewer': {
      return totalSuccessfulBrews >= 10;
    }
    case 'dedicated-alchemist': {
      return journal.sessions.filter((session) => session.outcome !== 'abandoned').length >= 5;
    }
    case 'hard-mode-initiate': {
      return journal.sessions.some(
        (session) => session.difficulty === 'hard' && session.successfulBrews > 0,
      );
    }
    case 'ingredient-scholar': {
      return journal.discoveries.ingredientIds.length === INGREDIENTS.length;
    }
    case 'reaction-researcher': {
      return journal.discoveries.reactionIds.length === REACTIONS.length;
    }
    case 'recipe-collector': {
      return journal.discoveries.recipeIds.length === RECIPES.length;
    }
    case 'thousand-point-brew': {
      return journal.sessions.some((session) => session.score >= 1000);
    }
    case 'versatile-alchemist': {
      return (
        new Set(
          journal.sessions
            .filter((session) => session.outcome !== 'abandoned')
            .map((session) => session.difficulty),
        ).size === 3
      );
    }
  }
};

export const unlockJournalAchievements = (
  journal: JournalData,
  unlockedAt: number = Date.now(),
): JournalData => {
  const newlyUnlocked: UnlockedAchievement[] = ACHIEVEMENT_IDS.filter(
    (id) => !hasUnlockedAchievement(journal, id) && hasMetAchievement(journal, id),
  ).map((id) => ({ id, unlockedAt }));

  return newlyUnlocked.length === 0
    ? journal
    : {
        ...journal,
        achievements: [...journal.achievements, ...newlyUnlocked],
      };
};
