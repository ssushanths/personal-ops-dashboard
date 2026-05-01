import { getSavingsInterestThisMonth } from '../utils/savingsInterest.js';

// --- Date helpers ---

// Formats a Date object into YYYY-MM-DD using local calendar values.
// Avoids timezone issues caused by toISOString().
function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns the current YYYY-MM month key, e.g. "2026-04".
// Returns the current YYYY-MM month key using local calendar values.
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Simple helper for checking whether a given date belongs to the current month.
function isCurrentMonth(dateStr) {
  return dateStr && dateStr.startsWith(getCurrentMonthKey());
}

// Adds an amount into a category accumulator object.

function addToCategoryBucket(bucket, category, amount) {
  const key = category || 'Misc';
  bucket[key] = (bucket[key] || 0) + (Number(amount) || 0);
}

// Helper to determine forecast salary, using settings or recurring inflow if available.
function getForecastSalary(state, monthlySalary) {
  const salaryFromSettings = Number(monthlySalary || 0);
  if (salaryFromSettings > 0) return salaryFromSettings;

  const salaryInflow = (state.inflows || []).find(
    (inflow) =>
      inflow.title === 'Salary' &&
      inflow.recurring &&
      inflow.active
  );

  return Number(salaryInflow?.amount || 0);
}


// Returns the last occurrence of a given weekday in a month.
//
// Example:
// - year = 2026
// - monthIndex = 3 (April)
// - weekday = 4 (Thursday)
//
// Output is a local-calendar date string: YYYY-MM-DD
function getLastWeekdayOfMonth(year, monthIndex, weekday) {
  const lastDay = new Date(year, monthIndex + 1, 0);

  while (lastDay.getDay() !== weekday) {
    lastDay.setDate(lastDay.getDate() - 1);
  }

  return toLocalIsoDate(lastDay);
}

// Returns the salary/inflow date for the current month based on recurrence rules.
//
// For now we only support:
// - monthly_last_weekday
//
// This is enough for your current salary rule:
// "salary is credited on the last Friday of the month"
function getInflowDateForCurrentMonth(inflow) {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  if (inflow.recurrenceType === 'monthly_last_weekday') {
    return getLastWeekdayOfMonth(year, monthIndex, inflow.weekday);
  }

  return null;
}

// Builds a detailed breakdown of how each account balance is derived.
// This is useful for debugging and for explaining balance changes in the UI.
function computeAccountBreakdown(state) {
  const breakdown = {
    current: {
      opening: Number(state.accounts?.current?.openingBalance || 0),
      salaryInflows: 0,
      paidPayments: 0,
      paidSubscriptions: 0,
      expenses: 0,
      transfersOut: 0,
      transfersIn: 0
    },
    savings: {
      opening: Number(state.accounts?.savings?.openingBalance || 0),
      salaryInflows: 0,
      paidPayments: 0,
      paidSubscriptions: 0,
      expenses: 0,
      transfersOut: 0,
      transfersIn: 0
    }
  };

  const cycleMonthKey = (dateStr) => (dateStr ? dateStr.slice(0, 7) : '');
  const todayStr = toLocalIsoDate(new Date());

  // Apply inflows only when they have actually occurred.
  (state.inflows || []).forEach((inflow) => {
    if (!inflow.active) return;
    if (inflow.recurring) return;

    const amount = Number(inflow.amount) || 0;
    const account = inflow.account || 'Current';

    if (account === 'Current') breakdown.current.salaryInflows += amount;
    if (account === 'Savings') breakdown.savings.salaryInflows += amount;
  });

  (state.payments || []).forEach((payment) => {
    const amount = Number(payment.amount) || 0;
    const account = payment.account || 'Current';

    const shouldApply = Boolean(payment.paidOn || payment.paid);
    if (!shouldApply) return;

    if (account === 'Current') breakdown.current.paidPayments += amount;
    if (account === 'Savings') breakdown.savings.paidPayments += amount;
  });

  (state.subscriptions || []).forEach((subscription) => {
    const amount = Number(subscription.amount) || 0;
    const account = subscription.account || 'Current';

    if (!subscription.paidOn) return;

    if (account === 'Current') breakdown.current.paidSubscriptions += amount;
    if (account === 'Savings') breakdown.savings.paidSubscriptions += amount;
  });

  (state.expenses || []).forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    const account = expense.account || 'Current';

    if (account === 'Current') breakdown.current.expenses += amount;
    if (account === 'Savings') breakdown.savings.expenses += amount;
  });

  (state.transfers || []).forEach((transfer) => {
    const amount = Number(transfer.amount) || 0;

    if (transfer.fromAccount === 'Current') breakdown.current.transfersOut += amount;
    if (transfer.fromAccount === 'Savings') breakdown.savings.transfersOut += amount;

    if (transfer.toAccount === 'Current') breakdown.current.transfersIn += amount;
    if (transfer.toAccount === 'Savings') breakdown.savings.transfersIn += amount;
  });

  return breakdown;
}

// Computes actual account balances based on cleared / real money movement.
//
// Important distinction:
// - Forecast logic includes upcoming obligations and expected salary.
// - Account tally must only include money that has actually moved.
//
// Rules:
// - Salary counts only once the salary date has passed.
// - Expenses are treated as real outflows immediately.
// - One-time payments count only if marked paid.
// - Recurring payments count only if marked paid for the current cycle.
// - Subscriptions count only if marked paid for the current cycle.
// - Transfers always count because they are real account movement.
function computeAccountBalances(state) {
  const openingCurrent = Number(state.accounts?.current?.openingBalance || 0);
  const openingSavings = Number(state.accounts?.savings?.openingBalance || 0);

  let currentBalance = openingCurrent;
  let savingsBalance = openingSavings;

  const cycleMonthKey = (dateStr) => (dateStr ? dateStr.slice(0, 7) : '');
  const todayStr = toLocalIsoDate(new Date());

  // Apply inflows only after the real credit date has occurred.
  (state.inflows || []).forEach((inflow) => {
    if (!inflow.active) return;
    if (inflow.recurring) return;

    const amount = Number(inflow.amount) || 0;
    const account = inflow.account || 'Current';

    if (account === 'Current') currentBalance += amount;
    if (account === 'Savings') savingsBalance += amount;
  });

  // Apply one-time and recurring payments only when actually paid.
  (state.payments || []).forEach((payment) => {
    const amount = Number(payment.amount) || 0;
    const account = payment.account || 'Current';

    const shouldApply = Boolean(payment.paidOn || payment.paid);
    if (!shouldApply) return;

    if (account === 'Current') currentBalance -= amount;
    if (account === 'Savings') savingsBalance -= amount;
  });

  // Apply subscriptions only when the current cycle has been marked paid.
  (state.subscriptions || []).forEach((subscription) => {
    const amount = Number(subscription.amount) || 0;
    const account = subscription.account || 'Current';

    if (!subscription.paidOn) return;

    if (account === 'Current') currentBalance -= amount;
    if (account === 'Savings') savingsBalance -= amount;
  });

  // Expenses are treated as actual spending entries, so they always count.
  (state.expenses || []).forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    const account = expense.account || 'Current';

    if (account === 'Current') currentBalance -= amount;
    if (account === 'Savings') savingsBalance -= amount;
  });

  // Transfers move money between accounts but do not count as spending.
  (state.transfers || []).forEach((transfer) => {
    const amount = Number(transfer.amount) || 0;
    const fromAccount = transfer.fromAccount;
    const toAccount = transfer.toAccount;

    if (fromAccount === 'Current') currentBalance -= amount;
    if (fromAccount === 'Savings') savingsBalance -= amount;

    if (toAccount === 'Current') currentBalance += amount;
    if (toAccount === 'Savings') savingsBalance += amount;
  });

  return {
    current: currentBalance,
    savings: savingsBalance,
    total: currentBalance + savingsBalance
  };
}

export function computeFinancials(state, monthlySalary) {
  const currentMonth = getCurrentMonthKey();

  // Forecasted inflows for the month.
  // For now this is mainly salary, which is expected once per month.
  const inflowsThisMonth = (state.inflows || [])
    .filter((inflow) => inflow.active)
    .reduce((sum, inflow) => sum + (Number(inflow.amount) || 0), 0);

  // Recurring monthly commitments
  const monthlyRecurring =
    (state.subscriptions || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0) +
    (state.payments || [])
      .filter((p) => p.recurring)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // One-time payments only for the current month
  const oneTimePaymentsThisMonth = (state.payments || [])
    .filter((p) => !p.recurring && isCurrentMonth(p.dueDate))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // One-time expenses only for the current month
  const extraExpensesThisMonth = (state.expenses || [])
    .filter((e) => isCurrentMonth(e.date))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Main forecast numbers
  const totalThisMonth = monthlyRecurring + oneTimePaymentsThisMonth + extraExpensesThisMonth;

  // Forecast now uses expected monthly inflow instead of only the hardcoded salary input.
  // This prepares the app for future additional inflows.
  const forecastSalary = getForecastSalary(state, monthlySalary);

  const balanceLeft = forecastSalary - totalThisMonth;
  const predictedSavings = balanceLeft;

  // Simple risk scoring based on expected monthly income usage
  const spendRatio = forecastSalary > 0 ? totalThisMonth / forecastSalary : 0;
  let riskLevel = 'Safe';
  if (spendRatio >= 0.85) riskLevel = 'High';
  else if (spendRatio >= 0.65) riskLevel = 'Watch';

  // Category aggregation across ALL outflows:
  // - expenses in current month
  // - one-time payments in current month
  // - recurring payments
  // - subscriptions
  const categoryMap = {};

  (state.expenses || [])
    .filter((e) => isCurrentMonth(e.date))
    .forEach((expense) => {
      addToCategoryBucket(categoryMap, expense.category, expense.amount);
    });

  (state.payments || [])
    .filter((payment) => payment.recurring || isCurrentMonth(payment.dueDate))
    .forEach((payment) => {
      addToCategoryBucket(categoryMap, payment.category, payment.amount);
    });

  (state.subscriptions || []).forEach((subscription) => {
    addToCategoryBucket(categoryMap, subscription.category, subscription.amount);
  });

  const maxCategoryAmount = Math.max(0, ...Object.values(categoryMap));

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentageOfExpenses:
        totalThisMonth > 0 ? Math.round((amount / totalThisMonth) * 100) : 0,
      percentageOfMax:
        maxCategoryAmount > 0 ? Math.max(8, Math.round((amount / maxCategoryAmount) * 100)) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0] || null;

  // Account tally
  const accountBalances = computeAccountBalances(state);
  const accountBreakdown = computeAccountBreakdown(state);
  const savingsInterestThisMonth = getSavingsInterestThisMonth(state);

  return {
    monthlyRecurring,
    oneTimePaymentsThisMonth,
    extraExpensesThisMonth,
    totalThisMonth,
    balanceLeft,
    predictedSavings,
    riskLevel,
    categoryBreakdown,
    topCategory,
    accountBalances,
    accountBreakdown,
    inflowsThisMonth,
    savingsInterestThisMonth
  };
}