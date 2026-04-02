const STREAK_KEY = 'vexo_streak';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string (YYYY-MM-DD)
  freezesUsedThisMonth: number;
  freezeMonthKey: string; // YYYY-MM
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function loadStreak(): StreakData {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STREAK_KEY) : null;
    return raw
      ? (JSON.parse(raw) as StreakData)
      : { currentStreak: 0, longestStreak: 0, lastActivityDate: null, freezesUsedThisMonth: 0, freezeMonthKey: currentMonthKey() };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, freezesUsedThisMonth: 0, freezeMonthKey: currentMonthKey() };
  }
}

function saveStreak(data: StreakData) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * Records activity for today.
 * - If activity already recorded today: no-op.
 * - If yesterday: increment streak.
 * - Otherwise: reset streak to 1.
 */
export function recordActivity(): StreakData {
  const streak = loadStreak();
  const todayStr = today();
  const yesterdayStr = yesterday();
  const monthKey = currentMonthKey();

  if (streak.lastActivityDate === todayStr) {
    return streak; // already recorded today
  }

  let newCurrentStreak = 1;
  if (streak.lastActivityDate === yesterdayStr) {
    newCurrentStreak = streak.currentStreak + 1;
  }
  // Reset freeze count on new month
  const freezesThisMonth = streak.freezeMonthKey === monthKey ? streak.freezesUsedThisMonth : 0;

  const updated: StreakData = {
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
    lastActivityDate: todayStr,
    freezesUsedThisMonth: freezesThisMonth,
    freezeMonthKey: monthKey,
  };

  saveStreak(updated);
  return updated;
}

/**
 * Checks streak validity on app load.
 * If today is not today or yesterday, reset streak (unless freeze used).
 */
export function checkStreakOnLoad(): StreakData {
  const streak = loadStreak();
  if (!streak.lastActivityDate) return streak;

  const todayStr = today();
  const yesterdayStr = yesterday();

  if (streak.lastActivityDate === todayStr || streak.lastActivityDate === yesterdayStr) {
    return streak; // streak is still alive
  }

  // Check if we can use a freeze
  const monthKey = currentMonthKey();
  const freezesAvailable = 2 - (streak.freezeMonthKey === monthKey ? streak.freezesUsedThisMonth : 0);

  if (freezesAvailable > 0) {
    const updated: StreakData = {
      ...streak,
      freezesUsedThisMonth: (streak.freezeMonthKey === monthKey ? streak.freezesUsedThisMonth : 0) + 1,
      freezeMonthKey: monthKey,
    };
    saveStreak(updated);
    return updated;
  }

  // Streak broken
  const updated: StreakData = {
    ...streak,
    currentStreak: 0,
    lastActivityDate: null,
  };
  saveStreak(updated);
  return updated;
}
