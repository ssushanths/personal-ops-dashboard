function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getFirstDayOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

function getLastDayOfMonth(dateStr) {
  const [year, month] = dateStr.slice(0, 7).split('-').map(Number);
  const d = new Date(year, month, 0);
  return toLocalIsoDate(d);
}

function addMovement(map, date, amount) {
  if (!date) return;
  map[date] = (map[date] || 0) + (Number(amount) || 0);
}

function buildSavingsMovementMap(state) {
  const movementMap = {};

  // One-time/manual inflows into Savings (includes posted monthly interest)
  (state.inflows || []).forEach((inflow) => {
    if (!inflow.active) return;
    if (inflow.account !== 'Savings') return;
    if (inflow.recurring) return;
    addMovement(movementMap, inflow.date, inflow.amount);
  });

  // Savings expenses
  (state.expenses || []).forEach((expense) => {
    if (expense.account !== 'Savings') return;
    addMovement(movementMap, expense.date, -Number(expense.amount || 0));
  });

  // Savings payments (one-time or recurring) based on paidOn date
  (state.payments || []).forEach((payment) => {
    if (payment.account !== 'Savings') return;
    if (!payment.paidOn) return;
    addMovement(movementMap, payment.paidOn, -Number(payment.amount || 0));
  });

  // Savings subscriptions based on paidOn date
  (state.subscriptions || []).forEach((subscription) => {
    if (subscription.account !== 'Savings') return;
    if (!subscription.paidOn) return;
    addMovement(movementMap, subscription.paidOn, -Number(subscription.amount || 0));
  });

  // Transfers
  (state.transfers || []).forEach((transfer) => {
    const amount = Number(transfer.amount || 0);
    if (transfer.toAccount === 'Savings') addMovement(movementMap, transfer.date, amount);
    if (transfer.fromAccount === 'Savings') addMovement(movementMap, transfer.date, -amount);
  });

  return movementMap;
}

function getSavingsBalanceAtDate(state, dateStr) {
  const opening = Number(state.accounts?.savings?.openingBalance || 0);
  const movementMap = buildSavingsMovementMap(state);

  let balance = opening;

  Object.keys(movementMap)
    .sort()
    .forEach((date) => {
      if (date < dateStr) {
        balance += movementMap[date];
      }
    });

  return balance;
}

export function getSavingsInterestThisMonth(state) {
  const todayStr = toLocalIsoDate(new Date());
  const interestState = state.savingsInterest || {};
  const startDate = interestState.startDate || todayStr;
  const monthStart = getFirstDayOfMonth(todayStr);

  // Start from whichever is later:
  // - first day of current month
  // - explicit interest start date
  const calculationStart = startDate > monthStart ? startDate : monthStart;

  if (calculationStart > todayStr) return 0;

  const aer = Number(interestState.aer || 0.015);
  const dailyRate = Math.pow(1 + aer, 1 / 365) - 1;

  const movementMap = buildSavingsMovementMap(state);
  let balance = getSavingsBalanceAtDate(state, calculationStart);
  let accrued = 0;

  const cursor = new Date(`${calculationStart}T00:00:00`);
  const end = new Date(`${todayStr}T00:00:00`);

  while (cursor <= end) {
    const dayKey = toLocalIsoDate(cursor);

    // Use end-of-day balance for the interest calculation.
    balance += movementMap[dayKey] || 0;
    accrued += balance * dailyRate;

    cursor.setDate(cursor.getDate() + 1);
  }

  return roundMoney(accrued);
}

export function applyMonthEndSavingsInterest(state) {
  const todayStr = toLocalIsoDate(new Date());
  const currentMonth = monthKey(todayStr);
  const lastDay = getLastDayOfMonth(todayStr);

  if (todayStr !== lastDay) return;

  state.savingsInterest = state.savingsInterest || {
    aer: 0.015,
    startDate: todayStr,
    lastPostedMonth: ''
  };

  if (state.savingsInterest.lastPostedMonth === currentMonth) return;

  const interestAmount = getSavingsInterestThisMonth(state);
  if (interestAmount <= 0) return;

  state.inflows.unshift({
    id: crypto.randomUUID(),
    title: 'Savings Interest',
    amount: interestAmount,
    recurring: false,
    account: 'Savings',
    date: todayStr,
    active: true
  });

  state.savingsInterest.lastPostedMonth = currentMonth;
}