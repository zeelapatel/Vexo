const ACHIEVEMENTS_KEY = 'vexo_achievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Complete your first challenge.', icon: '🎯' },
  { id: 'getting_serious', name: 'Getting Serious', description: 'Complete 5 challenges.', icon: '💪' },
  { id: 'veteran', name: 'Veteran', description: 'Complete 20 challenges.', icon: '🏆' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Score S on any challenge.', icon: '✨' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete an advanced challenge in under 30 minutes.', icon: '⚡' },
  { id: 'completionist', name: 'Completionist', description: 'Complete all 15 beginner challenges.', icon: '🌟' },
  { id: 'company_ready', name: 'Company Ready', description: 'Complete a company-specific challenge.', icon: '🏢' },
];

export interface UserStats {
  totalCompleted: number;
  bestGrade: string | null;
  fastestAdvancedMinutes: number | null;
  beginnerCompleted: number;
  hasCompanyCompletion: boolean;
}

function loadEarned(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ACHIEVEMENTS_KEY) : null;
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveEarned(ids: Set<string>) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

/**
 * Checks which achievements are newly earned given current stats.
 * Saves newly earned achievements and returns them for toast notifications.
 */
export function checkAchievements(stats: UserStats): Achievement[] {
  const earned = loadEarned();
  const newlyEarned: Achievement[] = [];

  const conditions: Record<string, boolean> = {
    first_blood: stats.totalCompleted >= 1,
    getting_serious: stats.totalCompleted >= 5,
    veteran: stats.totalCompleted >= 20,
    perfectionist: stats.bestGrade === 'S',
    speed_demon: stats.fastestAdvancedMinutes !== null && stats.fastestAdvancedMinutes < 30,
    completionist: stats.beginnerCompleted >= 15,
    company_ready: stats.hasCompanyCompletion,
  };

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (!earned.has(achievement.id) && conditions[achievement.id]) {
      earned.add(achievement.id);
      newlyEarned.push(achievement);
    }
  }

  if (newlyEarned.length > 0) {
    saveEarned(earned);
  }

  return newlyEarned;
}

export function getEarnedAchievements(): Achievement[] {
  const earned = loadEarned();
  return ALL_ACHIEVEMENTS.filter((a) => earned.has(a.id));
}

export function getAllAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS;
}
