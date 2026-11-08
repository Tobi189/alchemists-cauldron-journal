export const ACHIEVEMENT_IDS = [
  'first-success',
  'steady-hand',
  'master-brewer',
  'dedicated-alchemist',
  'hard-mode-initiate',
  'ingredient-scholar',
  'reaction-researcher',
  'recipe-collector',
  'thousand-point-brew',
  'versatile-alchemist',
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
