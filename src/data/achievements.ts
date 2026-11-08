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

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
}

export const ACHIEVEMENTS = [
  {
    id: 'first-success',
    title: 'First Success',
    description: 'Brew your first successful potion.',
  },
  {
    id: 'steady-hand',
    title: 'Steady Hand',
    description: 'Complete three successful brews in a row.',
  },
  {
    id: 'master-brewer',
    title: 'Master Brewer',
    description: 'Complete ten successful brews across all sessions.',
  },
  {
    id: 'dedicated-alchemist',
    title: 'Dedicated Alchemist',
    description: 'Complete five game sessions.',
  },
  {
    id: 'hard-mode-initiate',
    title: 'Hard Mode Initiate',
    description: 'Successfully brew a potion on Hard difficulty.',
  },
  {
    id: 'ingredient-scholar',
    title: 'Ingredient Scholar',
    description: 'Discover every ingredient in the journal.',
  },
  {
    id: 'reaction-researcher',
    title: 'Reaction Researcher',
    description: 'Trigger every known chemical reaction.',
  },
  {
    id: 'recipe-collector',
    title: 'Recipe Collector',
    description: 'Successfully brew every recipe.',
  },
  {
    id: 'thousand-point-brew',
    title: 'Thousand-Point Brew',
    description: 'Finish a session with at least 1,000 points.',
  },
  {
    id: 'versatile-alchemist',
    title: 'Versatile Alchemist',
    description: 'Complete a session on every difficulty.',
  },
] as const satisfies readonly AchievementDefinition[];
