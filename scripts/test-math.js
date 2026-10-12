import assert from 'assert';

// 1. Urgency Ratio Calculation
function calculateUrgency(frequencyDays, lastCompletedAt, now) {
  const MS_PER_DAY = 86400000;
  if (lastCompletedAt === null) return { ratio: 2.0, status: 'urgent' };
  const delta = Math.max(0, now - lastCompletedAt);
  const ratio = Number((delta / (frequencyDays * MS_PER_DAY)).toFixed(3));
  let status = 'clean';
  if (ratio < 0.60) status = 'clean';
  else if (ratio <= 1.00) status = 'warning';
  else status = 'urgent';
  return { ratio, status };
}

const now = Date.now();
const day = 86400000;

// Test clean state
const chore1 = calculateUrgency(7, now - 2 * day, now);
assert.strictEqual(chore1.status, 'clean');
assert.ok(chore1.ratio < 0.60);

// Test warning state
const chore2 = calculateUrgency(7, now - 5.5 * day, now);
assert.strictEqual(chore2.status, 'warning');
assert.ok(chore2.ratio >= 0.60 && chore2.ratio <= 1.00);

// Test urgent state
const chore3 = calculateUrgency(7, now - 8 * day, now);
assert.strictEqual(chore3.status, 'urgent');
assert.ok(chore3.ratio > 1.00);

// 2. Room Health Score formula
function calculateRoomScore(ratios) {
  let penaltySum = 0;
  for (const r of ratios) {
    penaltySum += Math.max(0, r - 0.5);
  }
  const avg = penaltySum / ratios.length;
  return Math.max(0, Math.min(100, Math.round(100 - avg * 100)));
}

// When all tasks are fresh (e.g. ratio = 0.2), penalty is 0, score = 100
assert.strictEqual(calculateRoomScore([0.2, 0.3, 0.1]), 100);

// When tasks are overdue (e.g. ratio = 1.5, 1.2), penalties are 1.0 and 0.7 -> avg 0.85 -> score = 15
const overdueScore = calculateRoomScore([1.5, 1.2]);
assert.ok(overdueScore <= 20);

// 3. XP Multiplier formula
function getXpReward(baseXp, ratio) {
  return ratio > 1.0 ? Math.round(baseXp * 1.5) : baseXp;
}
assert.strictEqual(getXpReward(30, 0.5), 30);
assert.strictEqual(getXpReward(30, 1.2), 45); // 1.5x bonus for overdue save

// 4. Cooldown 6 hours
function checkCooldown(lastCompletedAt, now) {
  const delta = now - lastCompletedAt;
  return delta < 6 * 3600 * 1000;
}
assert.strictEqual(checkCooldown(now - 2 * 3600 * 1000, now), true);
assert.strictEqual(checkCooldown(now - 7 * 3600 * 1000, now), false);

// 5. Fair share split
function calculateFairShare(expenses, members) {
  const balances = {};
  members.forEach(m => balances[m] = { paid: 0, share: 0, net: 0 });
  for (const e of expenses) {
    balances[e.paidBy].paid += e.amount;
    const share = e.amount / e.split.length;
    e.split.forEach(u => balances[u].share += share);
  }
  members.forEach(m => balances[m].net = balances[m].paid - balances[m].share);
  return balances;
}

const balances = calculateFairShare(
  [{ amount: 100, paidBy: 'Henrique', split: ['Henrique', 'Mariana'] }],
  ['Henrique', 'Mariana']
);
assert.strictEqual(balances['Henrique'].net, 50);
assert.strictEqual(balances['Mariana'].net, -50);

console.log('✅ ALL DOMUS MATH & ALGORITHM TESTS PASSED SUCCESSFULLY!');
