import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Gamification & Streak Calculation Logic', () => {
  function calculateStreak(
    lastActivityDateStr: string | null,
    todayStr: string,
    currentStreak: number,
    longestStreak: number,
  ) {
    if (!lastActivityDateStr) {
      return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) };
    }

    const d1 = new Date(lastActivityDateStr + 'T00:00:00Z');
    const d2 = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, streak unchanged
      return { currentStreak, longestStreak };
    } else if (diffDays === 1) {
      // Consecutive day, increment
      const newCurrent = currentStreak + 1;
      return { currentStreak: newCurrent, longestStreak: Math.max(newCurrent, longestStreak) };
    } else {
      // Gap >= 2 days, reset streak to 1
      return { currentStreak: 1, longestStreak };
    }
  }

  it('should initialize streak to 1 for first activity', () => {
    const result = calculateStreak(null, '2026-09-06', 0, 0);
    assert.strictEqual(result.currentStreak, 1);
    assert.strictEqual(result.longestStreak, 1);
  });

  it('should not increment streak if user already practiced today', () => {
    const result = calculateStreak('2026-09-06', '2026-09-06', 5, 10);
    assert.strictEqual(result.currentStreak, 5);
    assert.strictEqual(result.longestStreak, 10);
  });

  it('should increment streak if practiced yesterday', () => {
    const result = calculateStreak('2026-09-05', '2026-09-06', 5, 10);
    assert.strictEqual(result.currentStreak, 6);
    assert.strictEqual(result.longestStreak, 10);
  });

  it('should update longestStreak when currentStreak exceeds record', () => {
    const result = calculateStreak('2026-09-05', '2026-09-06', 10, 10);
    assert.strictEqual(result.currentStreak, 11);
    assert.strictEqual(result.longestStreak, 11);
  });

  it('should reset currentStreak to 1 if user missed a day (> 1 day gap)', () => {
    const result = calculateStreak('2026-09-03', '2026-09-06', 14, 14);
    assert.strictEqual(result.currentStreak, 1);
    assert.strictEqual(result.longestStreak, 14); // preserves personal record
  });
});
