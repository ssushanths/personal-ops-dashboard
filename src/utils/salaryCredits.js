function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastWeekdayOfMonth(year, monthIndex, weekday) {
  const lastDay = new Date(year, monthIndex + 1, 0);

  while (lastDay.getDay() !== weekday) {
    lastDay.setDate(lastDay.getDate() - 1);
  }

  return toLocalIsoDate(lastDay);
}

function getMostRecentSalaryDate(weekday) {
  const today = new Date();
  const todayStr = toLocalIsoDate(today);

  const currentMonthSalaryDate = getLastWeekdayOfMonth(
    today.getFullYear(),
    today.getMonth(),
    weekday
  );

  if (currentMonthSalaryDate <= todayStr) {
    return currentMonthSalaryDate;
  }

  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  return getLastWeekdayOfMonth(
    previousMonth.getFullYear(),
    previousMonth.getMonth(),
    weekday
  );
}

export function applyDueSalaryCredits(state) {
  const salaryRule = (state.inflows || []).find(
    (inflow) =>
      inflow.title === 'Salary' &&
      inflow.recurring &&
      inflow.recurrenceType === 'monthly_last_weekday' &&
      inflow.active
  );

  if (!salaryRule) return;

  const salaryDate = getMostRecentSalaryDate(salaryRule.weekday ?? 4);
  const salaryMonth = salaryDate.slice(0, 7);

  const alreadyPosted = (state.inflows || []).some(
    (inflow) =>
      inflow.recurring === false &&
      inflow.source === 'auto_salary' &&
      inflow.salaryMonth === salaryMonth
  );

  if (alreadyPosted) return;

  state.inflows.unshift({
    id: crypto.randomUUID(),
    title: 'Salary',
    amount: Number(salaryRule.amount || 0),
    account: salaryRule.account || 'Current',
    date: salaryDate,
    recurring: false,
    active: true,
    source: 'auto_salary',
    salaryMonth
  });
}