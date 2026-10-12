import { Chore, Room, RoomStatusLevel } from '../types';

export const MS_PER_DAY = 86_400_000;
export const COOLDOWN_HOURS = 6;
export const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

/**
 * Calculates the Urgency Ratio (R) for a given chore.
 * If never completed, lastCompletedAt is treated as 2 full cycles ago to mark as urgent.
 */
export function calculateChoreUrgency(
  chore: Pick<Chore, 'frequencyDays' | 'lastCompletedAt'>,
  now: number = Date.now()
): { urgencyRatio: number; statusLevel: RoomStatusLevel; deltaMs: number | null } {
  if (chore.lastCompletedAt === null) {
    // Never completed - maximum urgency
    return {
      urgencyRatio: 2.0,
      statusLevel: 'urgent',
      deltaMs: null,
    };
  }

  const deltaMs = Math.max(0, now - chore.lastCompletedAt);
  const cycleMs = chore.frequencyDays * MS_PER_DAY;
  const urgencyRatio = Number((deltaMs / cycleMs).toFixed(3));

  let statusLevel: RoomStatusLevel = 'clean';
  if (urgencyRatio < 0.60) {
    statusLevel = 'clean';
  } else if (urgencyRatio <= 1.00) {
    statusLevel = 'warning';
  } else {
    statusLevel = 'urgent';
  }

  return { urgencyRatio, statusLevel, deltaMs };
}

/**
 * Calculates Room Health Score (S_room) according to the formula:
 * S_room = max(0, 100 - ((sum(max(0, R_i - 0.5)) / N) * 100))
 */
export function calculateRoomScore(chores: Chore[], now: number = Date.now()): {
  score: number;
  statusLevel: RoomStatusLevel;
} {
  if (!chores || chores.length === 0) {
    return { score: 100, statusLevel: 'clean' };
  }

  let penaltySum = 0;
  for (const chore of chores) {
    const { urgencyRatio } = calculateChoreUrgency(chore, now);
    const penalty = Math.max(0, urgencyRatio - 0.5);
    penaltySum += penalty;
  }

  const averagePenalty = penaltySum / chores.length;
  const rawScore = 100 - averagePenalty * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let statusLevel: RoomStatusLevel = 'clean';
  if (score < 50) {
    statusLevel = 'urgent';
  } else if (score < 80) {
    statusLevel = 'warning';
  } else {
    statusLevel = 'clean';
  }

  return { score, statusLevel };
}

/**
 * Calculates House Global Score (S_house):
 * Average of the 9 room health scores.
 */
export function calculateHouseScore(roomScores: number[]): number {
  if (!roomScores || roomScores.length === 0) return 100;
  const sum = roomScores.reduce((acc, curr) => acc + curr, 0);
  return Math.max(0, Math.min(100, Math.round(sum / roomScores.length)));
}

/**
 * Humanizes lastCompletedAt relative to the current clock:
 * - 0h <= delta < 24h: "Hoje" or "Há poucas horas"
 * - 24h <= delta < 48h: "Ontem"
 * - delta >= 48h: "Há X dias"
 * - null: "Nunca limpo"
 */
export function humanizeTimestamp(lastCompletedAt: number | null, now: number = Date.now()): string {
  if (lastCompletedAt === null) {
    return 'Nunca limpo';
  }

  const delta = Math.max(0, now - lastCompletedAt);
  const hours = Math.floor(delta / (3600 * 1000));
  const days = Math.floor(delta / MS_PER_DAY);

  if (hours < 1) {
    return 'Há poucos minutos';
  } else if (hours < 6) {
    return `Há ${hours} horas`;
  } else if (hours < 24) {
    return 'Hoje';
  } else if (hours < 48) {
    return 'Ontem';
  } else {
    return `Há ${days} dias`;
  }
}

/**
 * Anti-Exploit Cooldown Validation:
 * A chore cannot be completed if delta < 6 hours.
 */
export function checkChoreCooldown(
  lastCompletedAt: number | null,
  now: number = Date.now()
): { isBlocked: boolean; remainingMinutes: number; reason?: string } {
  if (lastCompletedAt === null) {
    return { isBlocked: false, remainingMinutes: 0 };
  }

  const delta = now - lastCompletedAt;
  if (delta < COOLDOWN_MS) {
    const remainingMs = COOLDOWN_MS - delta;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return {
      isBlocked: true,
      remainingMinutes,
      reason: 'Já executado recentemente',
    };
  }

  return { isBlocked: false, remainingMinutes: 0 };
}

/**
 * Gamification XP Multiplier:
 * - Standard (R <= 1.0): 1.0 x xpReward
 * - Overdue save (R > 1.0): 1.5 x xpReward (incentivizes tackling urgent neglected tasks)
 */
export function calculateXpReward(baseXp: number, urgencyRatio: number): {
  earnedXp: number;
  multiplier: number;
  isOverdueBonus: boolean;
} {
  if (urgencyRatio > 1.0) {
    const earnedXp = Math.round(baseXp * 1.5);
    return { earnedXp, multiplier: 1.5, isOverdueBonus: true };
  }
  return { earnedXp: baseXp, multiplier: 1.0, isOverdueBonus: false };
}
