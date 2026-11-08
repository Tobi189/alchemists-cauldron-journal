import type { AchievementId } from '../data/achievements.ts';
import type { Difficulty, GameOverReason } from './game.ts';

export type SessionOutcome = GameOverReason | 'abandoned';

export interface JournalProfile {
  readonly displayName: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface JournalSession {
  readonly id: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly difficulty: Difficulty;
  readonly score: number;
  readonly outcome: SessionOutcome;
  readonly successfulBrews: number;
  readonly failedBrews: number;
  readonly bestStreak: number;
  readonly ingredientUsage: Readonly<Record<string, number>>;
  readonly recipeIds: readonly string[];
  readonly reactionIds: readonly string[];
}

export interface JournalSessionProgress {
  readonly id: string;
  readonly startedAt: number;
  readonly successfulBrews: number;
  readonly failedBrews: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly ingredientUsage: Readonly<Record<string, number>>;
  readonly recipeIds: readonly string[];
  readonly reactionIds: readonly string[];
}

export interface JournalDiscoveries {
  readonly ingredientIds: readonly string[];
  readonly recipeIds: readonly string[];
  readonly reactionIds: readonly string[];
}

export interface UnlockedAchievement {
  readonly id: AchievementId;
  readonly unlockedAt: number;
}

export interface JournalDataV1 {
  readonly version: 1;
  readonly profile: JournalProfile;
  readonly sessions: readonly JournalSession[];
  readonly discoveries: JournalDiscoveries;
  readonly achievements: readonly UnlockedAchievement[];
}

export type JournalData = JournalDataV1;
