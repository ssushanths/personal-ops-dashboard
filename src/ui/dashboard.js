import { formatMoney } from '../utils/money.js';
import { daysUntil } from '../utils/date.js';
import { formatDate } from '../utils/formatDate.js';
import { isPaymentPaidForCurrentCycle, isSubscriptionPaidForCurrentCycle } from '../utils/recurring.js';

function badge(days) {
  if (days === null) return ['No date', 'blue'];
  if (days < 0) return [`${Math.abs(days)} day(s) overdue`, 'danger'];
  if (days === 0) return ['Due today', 'danger'];
  if (days <= 2) return [`Due in ${days} day(s)`, 'danger'];
  if (days <= 7) return [`Due in ${days} day(s)`, 'warn'];
  return [`Due in ${days} day(s)`, 'ok'];
}

// Formats a Date object into YYYY-MM-DD using local calendar values.
function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns the last Thursday of a given month using local calendar values.
function getLastThursday(year, monthIndex) {
  const lastDay = new Date(year, monthIndex + 1, 0);

  while (lastDay.getDay() !== 4) {
    lastDay.setDate(lastDay.getDate() - 1);
  }

  return toLocalIsoDate(lastDay);
}

// Masks sensitive financial values until the user unlocks them with PIN.
function maskAmount(value, isUnlocked) {
  return isUnlocked ? formatMoney(value) : '******';
}

function renderSalaryInfo(state) {
  const inflow = (state.inflows || []).find(i => i.title === 'Salary' && i.active);
  if (!inflow) return '';

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const salaryDate = getLastThursday(now.getFullYear(), now.getMonth());

  const isCredited = salaryDate <= todayStr;

  return `
    <div class="finance-box">
      <div class="section-head"><h3>Salary</h3></div>
      <div class="finance-grid">
        <div class="finance-metric">
          <div class="label">Next credit</div>
          <div class="value">${formatDate(salaryDate)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Status</div>
          <div class="value ${isCredited ? 'ok' : 'warn'}">
            ${isCredited ? 'Credited' : 'Pending'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function sectionItem(title, meta, actions, badgeHtml = '') {
  return `
    <div class="item">
      <div class="item-main">
        <h4>${title}</h4>
        <div class="meta">${meta}</div>
        <div class="badges">${badgeHtml}</div>
      </div>
      <div>${actions}</div>
    </div>
  `;
}

function renderTodayMode(state) {
  const overdue = [];
  const today = [];
  const soon = [];
  const priority = [];

  state.payments.forEach((p) => {
    if (isPaymentPaidForCurrentCycle(p)) return;

    const d = daysUntil(p.dueDate);
    const text = `${p.title} (${formatMoney(p.amount)})`;

    if (d < 0) overdue.push(`Payment: ${text}`);
    else if (d === 0) today.push(`Payment: ${text}`);
    else if (d > 0 && d <= 2) soon.push(`Payment: ${text}`);

    if (d !== null && d <= 3) {
      priority.push(`Payment: ${text}`);
    }
  });

  state.subscriptions.forEach((s) => {
    if (isSubscriptionPaidForCurrentCycle(s)) return;

    const d = daysUntil(s.renewalDate);
    const text = `${s.title} (${formatMoney(s.amount)})`;

    if (d < 0) overdue.push(`Subscription: ${text}`);
    else if (d === 0) today.push(`Subscription: ${text}`);
    else if (d > 0 && d <= 2) soon.push(`Subscription: ${text}`);

    if (d !== null && d <= 3) {
      priority.push(`Subscription: ${text}`);
    }
  });

  state.tasks.filter((t) => !t.done).forEach((t) => {
    const d = daysUntil(t.dueDate);

    if (d < 0) overdue.push(`Task: ${t.title}`);
    else if (d === 0) today.push(`Task: ${t.title}`);
    else if (d > 0 && d <= 2) soon.push(`Task: ${t.title}`);

    if (d !== null && d <= 3) {
      priority.push(`Task: ${t.title}`);
    }
  });

  return {
    dueLabel: overdue.length ? 'Overdue' : 'Due today',
    due: overdue.length
      ? overdue.join(' • ')
      : today.join(' • ') || 'Nothing due today.',
    soon: soon.join(' • ') || 'Nothing urgent in the next 2 days.',
    priority: priority.slice(0, 3).join(' • ') || 'No high pressure items.',
    hasPriority: priority.length > 0,
    hasOverdue: overdue.length > 0
  };
}

function renderCategoryInsights(state) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const totals = {};

  state.expenses
    .filter((e) => e.date && e.date.startsWith(currentMonth))
    .forEach((expense) => {
      const category = expense.category || 'Misc';
      totals[category] = (totals[category] || 0) + (Number(expense.amount) || 0);
    });

  state.payments.forEach((payment) => {
    const include = payment.recurring || (payment.dueDate && payment.dueDate.startsWith(currentMonth));
    if (!include) return;
    const category = payment.category || 'Misc';
    totals[category] = (totals[category] || 0) + (Number(payment.amount) || 0);
  });

  state.subscriptions.forEach((subscription) => {
    const category = subscription.category || 'Subscriptions';
    totals[category] = (totals[category] || 0) + (Number(subscription.amount) || 0);
  });

  const entries = Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  if (!entries.length) {
    return `
      <div class="finance-box">
        <div class="section-head"><h3>Category insights</h3></div>
        <div class="small-note">No category data for this month yet.</div>
      </div>
    `;
  }

  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  const max = Math.max(...entries.map((item) => item.amount));
  const topCategory = entries[0];

  return `
    <div class="finance-box">
      <div class="section-head"><h3>Category insights</h3></div>
      <div class="small-note">
        Top category this month: <strong>${topCategory.category}</strong>
        (${formatMoney(topCategory.amount)})
      </div>

      <div class="category-chart">
        ${entries.map((item) => {
          const percentOfTotal = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          const barWidth = max > 0 ? Math.max(8, Math.round((item.amount / max) * 100)) : 0;

          return `
            <div class="category-row">
              <div class="category-row-top">
                <span>${item.category}</span>
                <span>${formatMoney(item.amount)} · ${percentOfTotal}%</span>
              </div>
              <div class="category-bar-track">
                <div class="category-bar-fill" style="width: ${barWidth}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderAccountTally(finance, state, settings) {
  const balances = finance.accountBalances || {
    current: 0,
    savings: 0,
    total: 0
  };

  const trackingFrom = state.accounts?.asOfDate || new Date().toISOString().slice(0, 10);

  return `
    <div class="finance-box">
      <div class="section-head"><h3>Account tally</h3></div>
      <div class="small-note">
        Running balances based on opening balances and tracked movements from your start date.
      </div>

      <div class="finance-grid">
        <div class="finance-metric">
          <div class="label">Current account</div>
          <div class="value">${maskAmount(balances.current, settings.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Savings account</div>
          <div class="value">${maskAmount(balances.savings, settings.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Total cash</div>
          <div class="value">${maskAmount(balances.total, settings.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Interest this month</div>
          <div class="value">${formatMoney(finance.savingsInterestThisMonth || 0)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Tracking from</div>
          <div class="value">${formatDate(trackingFrom)}</div>
        </div>
      </div>

      
    </div>
  `;
}
function renderTransfers(state) {
  const transfers = [...(state.transfers || [])]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!transfers.length) {
    return '<div class="empty">No transfers yet.</div>';
  }

  return transfers.map((transfer) => sectionItem(
    transfer.note || 'Account transfer',
    `${formatDate(transfer.date)} · ${formatMoney(transfer.amount)} · ${transfer.fromAccount} → ${transfer.toAccount}`,
    `<button class="secondary" data-remove="transfers:${transfer.id}">Delete</button>`,
    '<span class="badge blue">Transfer</span>'
  )).join('');
}

function renderMobileApp({ state, settings, finance, today, config }) {
  const todayMode = renderTodayMode(state);
  const accountTallyHtml = renderAccountTally(finance, state, settings);
  const visiblePayments = state.payments.filter((p) => !isPaymentPaidForCurrentCycle(p));

  const paymentHtml = visiblePayments.length
    ? visiblePayments.map((p) => {
        const [label, level] = badge(daysUntil(p.dueDate));
        return sectionItem(
          p.title,
          `${formatDate(p.dueDate)} · ${formatMoney(p.amount)} · ${p.category || 'Misc'} · ${p.account || 'Current'}`,
          `<button class="success" data-mark-payment-paid="${p.id}">Mark paid</button><div style="height:8px"></div><button class="secondary" data-remove="payments:${p.id}">Delete</button>`,
          `<span class="badge ${level}">${label}</span>${p.recurring ? '<span class="badge blue">Monthly repeat</span>' : ''}`
        );
      }).join('')
    : '<div class="empty">No unpaid payments right now.</div>';

  const taskHtml = state.tasks.length
    ? state.tasks.map((t) => {
        const dueInDays = daysUntil(t.dueDate);
        const [label, level] = badge(dueInDays);

        return sectionItem(
          t.title,
          t.dueDate ? `Due ${formatDate(t.dueDate)}` : 'No due date',
          `<button class="secondary" data-toggle-task="${t.id}">${t.done ? 'Undo' : 'Done'}</button><div style="height:8px"></div><button class="secondary" data-remove="tasks:${t.id}">Delete</button>`,
          `<span class="badge ${level}">${label}</span>`
        );
      }).join('')
    : '<div class="empty">No tasks yet.</div>';

  const salaryValue = settings.salaryUnlocked ? formatMoney(settings.monthlySalary || 0) : '******';
  const salaryMessage = settings.salaryUnlocked ? 'Salary visible.' : (settings.salaryMessage || 'Salary hidden.');

  return `
    <div class="app mobile-app">
      <section class="hero mobile-hero">
        <div>
          <h1>${config.appName}</h1>
          <p>${today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div class="hero-right">
          <div class="headline ${todayMode.hasOverdue ? 'status-danger' : todayMode.hasPriority ? 'status-warn' : 'status-ok'}">
            ${todayMode.hasOverdue ? 'Urgent' : todayMode.hasPriority ? 'Focus needed' : 'All clear'}
          </div>
          <div class="sub">${todayMode.priority}</div>
        </div>
      </section>

      <section class="panel" id="todayModeSection" data-has-overdue="${todayMode.hasOverdue ? 'true' : 'false'}">
        <h2>Today mode</h2>
        <div class="today-box">
          <div class="today-grid">
            <div class="today-card ${todayMode.hasOverdue ? 'today-overdue' : ''}">
              <h4>${todayMode.dueLabel}</h4>
              <div class="small-note">${todayMode.due}</div>
            </div>
            <div class="today-card">
              <h4>Next 2 days</h4>
              <div class="small-note">${todayMode.soon}</div>
            </div>
            <div class="today-card ${todayMode.hasPriority ? 'today-priority' : ''}">
              <h4>Top priority</h4>
              <div class="small-note">${todayMode.priority}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Assistant</h2>
        <div class="assistant-box">
          <div class="assistant-row">
            <input id="assistantInput" type="text" placeholder="Expense,5,Food,Current,today,Coffee" />
            <button id="assistantBtn">Send</button>
          </div>
          <div class="chips">
            <button class="chip" data-fill="Start,currentBalance,savingsBalance,salary">Start</button>
            <button class="chip" data-fill="Expense,5,Food,Current,today,Coffee">Expense</button>
            <button class="chip" data-fill="Payment,200,Insurance,Current,25-04-2026,Car insurance">Payment</button>
            <button class="chip" data-fill="Transfer,300,Current,Savings,today,Monthly savings">Transfer</button>
          </div>
          <div class="small-note" id="assistantFeedback"></div>
        </div>
      </section>

      <section class="panel">
        <h2>Financial view</h2>
        <div class="salary-box">
          <div class="finance-grid">
            <div class="finance-metric">
              <div class="label">Monthly salary</div>
              <div id="salaryDisplay" class="value ${settings.salaryUnlocked ? '' : 'masked'}">${salaryValue}</div>
            </div>
            <div class="finance-metric">
              <div class="label">Projected balance</div>
              <div class="value">${maskAmount(finance.balanceLeft, settings.salaryUnlocked)}</div>
            </div>
            <div class="finance-metric">
              <div class="label">This month spend</div>
              <div class="value">${formatMoney(finance.totalThisMonth)}</div>
            </div>
            <div class="finance-metric">
              <div class="label">Predicted savings</div>
              <div class="value">${formatMoney(finance.predictedSavings)}</div>
            </div>
          </div>

          <div class="three-col" style="margin-top:8px">
            <input id="salaryPinInput" type="password" inputmode="numeric" maxlength="6" placeholder="PIN" />
            <button id="unlockSalaryBtn">Unlock</button>
            <button id="lockSalaryBtn" class="secondary">Lock</button>
          </div>

          <div class="small-note" id="salaryStatus">${salaryMessage}</div>
        </div>

        ${accountTallyHtml}
        ${renderSalaryInfo(state)}
      </section>

      <section class="panel">
        <div class="section-head"><h2>Payments</h2></div>
        <div class="list">${paymentHtml}</div>
      </section>

      <section class="panel">
        <div class="section-head"><h2>Tasks</h2><button class="secondary" id="clearDoneBtn">Clear done</button></div>
        <div class="list">${taskHtml}</div>
      </section>

      <section class="panel">
        <h2>Backup</h2>
        <p class="panel-sub">Download or restore your local data.</p>

        <div class="quick-add">
          <button id="downloadBackupBtn">Download backup</button>
          <input id="restoreBackupInput" type="file" accept=".json,application/json" />
          <button id="restoreBackupBtn" class="secondary">Restore backup</button>
          <div class="small-note" id="backupStatus">No backup action yet.</div>
        </div>
      </section>
    </div>
  `;
}

export function renderApp({ state, settings, finance, today, config }) {
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    return renderMobileApp({ state, settings, finance, today, config });
  }

  return renderDesktopApp({ state, settings, finance, today, config });
}

function renderDesktopApp({ state, settings, finance, today, config }) {
  const todayMode = renderTodayMode(state);
  const categoryInsightsHtml = renderCategoryInsights(state);
  const accountTallyHtml = renderAccountTally(finance, state, settings);
  const transferHtml = renderTransfers(state);
  const openTasks = state.tasks.filter((t) => !t.done).length;
  // Check if any open task is urgent (due within 2 days)
  const hasUrgentTasks = state.tasks.some((t) => {
  const d = daysUntil(t.dueDate);
  return !t.done && d !== null && d >= 0 && d <= 2;
});
  const dueThisWeek = [
    ...state.tasks.filter((t) => !t.done).map((t) => t.dueDate),
    ...state.payments.filter((p) => !isPaymentPaidForCurrentCycle(p)).map((p) => p.dueDate),
    ...state.subscriptions.filter((s) => !isSubscriptionPaidForCurrentCycle(s)).map((s) => s.renewalDate)
  ].filter(Boolean).filter((date) => {
    const d = daysUntil(date);
    return d >= 0 && d <= 7;
  }).length;

  const visiblePayments = state.payments.filter((p) => !isPaymentPaidForCurrentCycle(p));
  const paymentHtml = visiblePayments.length
    ? visiblePayments.map((p) => {
        const [label, level] = badge(daysUntil(p.dueDate));
        return sectionItem(
          p.title,
          `${formatDate(p.dueDate)} · ${formatMoney(p.amount)} · ${p.category || 'Misc'} · ${p.account || 'Current'}`,
          `<button class="success" data-mark-payment-paid="${p.id}">Mark paid</button><div style="height:8px"></div><button class="secondary" data-remove="payments:${p.id}">Delete</button>`,
          `<span class="badge ${level}">${label}</span>${p.recurring ? '<span class="badge blue">Monthly repeat</span>' : ''}`
        );
      }).join('')
    : '<div class="empty">No unpaid payments right now.</div>';

  const taskHtml = state.tasks.length
    ? state.tasks.map((t) => {
        const dueInDays = daysUntil(t.dueDate);
        const [label, level] = badge(dueInDays);

        // Highlight open tasks that are due today or within the next 2 days.
        const urgentTaskClass = !t.done && dueInDays !== null && dueInDays >= 0 && dueInDays <= 2
          ? ' task-urgent'
          : '';

        return `
          <div class="item${urgentTaskClass}">
            <div class="item-main">
              <h4><span class="${t.done ? 'strike' : ''}">${t.title}</span></h4>
              <div class="meta">${t.dueDate ? `Due ${formatDate(t.dueDate)}` : 'No due date'}</div>
              <div class="badges"><span class="badge ${level}">${label}</span></div>
            </div>
            <div>
              <button class="secondary" data-toggle-task="${t.id}">${t.done ? 'Undo' : 'Done'}</button>
              <div style="height:8px"></div>
              <button class="secondary" data-remove="tasks:${t.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('')
    : '<div class="empty">No tasks yet.</div>';

  const subscriptionHtml = state.subscriptions.length
    ? state.subscriptions.map((s) => {
        const [label, level] = badge(daysUntil(s.renewalDate));
        const paid = isSubscriptionPaidForCurrentCycle(s) ? '<span class="badge ok">Paid this cycle</span>' : '';
        return sectionItem(
          s.title,
          `Renews ${formatDate(s.renewalDate)} · ${formatMoney(s.amount)}/month · ${s.category || 'Subscriptions'} · ${s.account || 'Current'}`,
          `<button class="success" data-mark-subscription-paid="${s.id}">Mark paid</button><div style="height:8px"></div><button class="secondary" data-remove="subscriptions:${s.id}">Delete</button>`,
          `<span class="badge ${level}">${label}</span><span class="badge blue">Monthly repeat</span>${paid}`
        );
      }).join('')
    : '<div class="empty">No subscriptions yet.</div>';

  const expenseHtml = state.expenses.length
    ? state.expenses.map((e) => sectionItem(
        e.title,
        `${formatDate(e.date)} · ${formatMoney(e.amount)} · ${e.category} · ${e.account || 'Current'}`,
        `<button class="secondary" data-remove="expenses:${e.id}">Delete</button>`,
        '<span class="badge warn">One-time expense</span>'
      )).join('')
    : '<div class="empty">No extra expenses yet.</div>';

  const salaryValue = settings.salaryUnlocked ? formatMoney(settings.monthlySalary || 0) : '******';
  const salaryMessage = settings.salaryUnlocked ? 'Salary visible.' : (settings.salaryMessage || 'Salary hidden.');

  return `
    <div class="app">
      <section class="hero">
        <div>
          <h1>${config.appName}</h1>
          <p>Your personal assistant for tasks, bills, subscriptions, one-time expenses, monthly balance, and savings prediction.</p>
        </div>
        <div class="hero-right">
          <div class="date">${today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div>
            <div class="headline ${todayMode.hasOverdue ? 'status-danger' : todayMode.hasPriority ? 'status-warn' : 'status-ok'}">
              ${todayMode.hasOverdue ? 'Urgent' : todayMode.hasPriority ? 'Focus needed' : 'All clear'}
            </div>
            <div class="sub">${todayMode.priority}</div>
          </div>
        </div>
      </section>

      <section class="top-grid">
        <div class="stat ${hasUrgentTasks ? 'stat-urgent' : ''}">
          <div class="label">Open tasks</div>
          <div class="value">${openTasks}</div>
        </div>
        <div class="stat"><div class="label">Due this week</div><div class="value">${dueThisWeek}</div></div>
        <div class="stat"><div class="label">Monthly recurring</div><div class="value">${formatMoney(finance.monthlyRecurring)}</div></div>
        <div class="stat"><div class="label">This month spend</div><div class="value">${formatMoney(finance.totalThisMonth)}</div></div>
        <div class="stat"><div class="label">Predicted savings</div><div class="value">${formatMoney(finance.predictedSavings)}</div></div>
      </section>

      <section class="layout">
        <div>
          <div class="panel" id="todayModeSection" data-has-overdue="${todayMode.hasOverdue ? 'true' : 'false'}">
            <h2>Today mode</h2>
            <div class="panel-sub">Focus on what matters right now instead of scanning everything.</div>
            <div class="today-box">
              <div class="today-grid">
                <div class="today-card ${todayMode.hasOverdue ? 'today-overdue' : ''}">
                  <h4>${todayMode.dueLabel}</h4>
                  <div class="small-note">${todayMode.due}</div>
                </div>

                <div class="today-card">
                  <h4>Next 2 days</h4>
                  <div class="small-note">${todayMode.soon}</div>
                </div>

                <div class="today-card ${todayMode.hasPriority ? 'today-priority' : ''}">
                  <h4>Top priority</h4>
                  <div class="small-note">${todayMode.priority}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>Assistant</h2>
            <div class="panel-sub">Try natural input for payments, subscriptions, expenses, or savings questions.</div>
            <div class="assistant-box">
              <div class="assistant-row">
                <input id="assistantInput" type="text" placeholder="Type command, e.g. Expense,5,Food,Current,today,Coffee" />
                <button id="assistantBtn">Send</button>
              </div>
              <div class="chips">
                <button class="chip" data-fill="Start,currentBalance,savingsBalance,salary">Start setup</button>
                <button class="chip" data-fill="Income,500,Current,today,Tax refund">Add income</button>
                <button class="chip" data-fill="Expense,5,Food,Current,today,Coffee">Expense example</button>
                <button class="chip" data-fill="Payment,200,Insurance,Current,25-04-2026,Car insurance">Payment example</button>
                <button class="chip" data-fill="Subscription,12.99,Subscriptions,Current,05-05-2026,Netflix">Subscription example</button>
                <button class="chip" data-fill="Transfer,300,Current,Savings,today,Monthly savings">Transfer example</button>
                <button class="chip" data-fill="Task,Book dentist,20-04-2026">Task example</button>
              </div>
              <div class="small-note" id="assistantFeedback"></div>        
            </div>

            

            <div class="section">
              <div class="section-head"><h3>Upcoming payments</h3></div>
              <div class="list">${paymentHtml}</div>
            </div>

            <div class="section">
              <div class="section-head"><h3>Tasks</h3><button class="secondary" id="clearDoneBtn">Clear done</button></div>
              <div class="list">${taskHtml}</div>
            </div>
          </div>

          <div class="panel">
            <div class="section-head"><h2>Expenses & subscriptions</h2></div>
            <div class="panel-sub">Recurring services, one-time expenses, and mark-as-paid workflow.</div>
            <div class="mini-grid">${subscriptionHtml}</div>
            <div class="section">
              <div class="section-head"><h3>Extra expenses</h3></div>
              <div class="mini-grid">${expenseHtml}</div>
            </div>
          </div>

        </div>

        <div class="right-stack">
          <div class="panel">
            <h2>Financial view</h2>
            <div class="panel-sub">Monthly salary is masked by default. Enter your 6-digit PIN to reveal it.</div>
            <div class="salary-box">
            <div class="salary-box">
            <div class="salary-grid">
              <div>
                <div class="small-note">Monthly salary</div>
                <div id="salaryDisplay" class="finance-metric value ${settings.salaryUnlocked ? '' : 'masked'}">
                  ${salaryValue}
                </div>
              </div>

              <div>
                <div class="small-note">Reveal salary</div>
                <div class="three-col">
                  <input id="salaryPinInput" type="password" inputmode="numeric" maxlength="6" placeholder="6-digit PIN" />
                  <button id="unlockSalaryBtn">Unlock</button>
                  <button id="lockSalaryBtn" class="secondary">Lock</button>
                </div>
              </div>
            </div>

            ${(!settings.monthlySalary || !settings.salaryPin) ? `
              <div class="salary-box" style="margin-top:10px">
                <div class="salary-grid">
                  <div>
                    <div class="small-note">Set monthly salary</div>
                    <input id="monthlySalaryInput" type="number" min="0" step="0.01" placeholder="Monthly salary" />
                  </div>

                  <div>
                    <div class="small-note">Set PIN</div>
                    <input id="salaryPinSetupInput" type="password" inputmode="numeric" maxlength="6" placeholder="Set 6-digit PIN" />
                  </div>
                </div>

                <div style="margin-top:8px">
                  <button id="saveSalarySettingsBtn">Save salary settings</button>
                </div>
              </div>
            ` : ''}

            <div class="small-note" id="salaryStatus">${salaryMessage}</div>
          </div> 

            <div class="finance-box">
              <div class="finance-grid">
                <div class="finance-metric"><div class="label">Monthly recurring</div><div class="value">${formatMoney(finance.monthlyRecurring)}</div></div>
                <div class="finance-metric"><div class="label">Extra expenses</div><div class="value">${formatMoney(finance.extraExpensesThisMonth)}</div></div>
                <div class="finance-metric"><div class="label">Total this month</div><div class="value">${formatMoney(finance.totalThisMonth)}</div></div>
                <div class="finance-metric"><div class="label">Projected Balance</div><div class="value">${maskAmount(finance.balanceLeft, settings.salaryUnlocked)}</div></div>
                <div class="finance-metric"><div class="label">Predicted savings</div><div class="value">${formatMoney(finance.predictedSavings)}</div></div>
                <div class="finance-metric"><div class="label">Risk level</div><div class="value">${finance.riskLevel}</div></div>
              </div>
            </div>
            
            ${renderSalaryInfo(state)}
            ${accountTallyHtml}
            ${categoryInsightsHtml}
          </div>

          <div class="panel">
            <h2>Transfers</h2>
            <div class="panel-sub">Move money between Current and Savings without counting it as spending.</div>

            <div class="quick-add">
              <div class="row">
                <select id="transferFromAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
                <select id="transferToAccount">
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>

              <div class="row">
                <input id="transferDate" type="date" />
                <input id="transferAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>

              <input id="transferNote" type="text" placeholder="Note (optional)" />

              <div class="row">
                <div></div>
                <button id="addTransferBtn">Add transfer</button>
              </div>
            </div>

            <div class="section">
              <div class="section-head"><h3>Transfer history</h3></div>
              <div class="mini-grid">${transferHtml}</div>
            </div>
          </div>

          <div class="panel">
            <h2>Quick add</h2>
            <div class="panel-sub">Add tasks, payments, subscriptions, and one-time expenses.</div>
            <div class="quick-add">
              <input id="taskTitle" type="text" placeholder="Task title" />
              <div class="row">
                <input id="taskDate" type="date" />
                <button id="addTaskBtn">Add task</button>
              </div>

              <input id="paymentTitle" type="text" placeholder="Payment title" />
              <div class="row">
                <input id="paymentDate" type="date" />
                <input id="paymentAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>
              <div class="row">
                <select id="paymentCategory">
                  <option value="Misc">Misc</option>
                  <option value="Housing">Housing</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Debt">Debt</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Transport">Transport</option>
                </select>
                <select id="paymentAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <select id="paymentRecurring">
                  <option value="false">One-time payment</option>
                  <option value="true">Repeat monthly</option>
                </select>
                <div></div>
              </div>

              <div class="row">
                <div></div>
                <button id="addPaymentBtn">Add payment</button>
              </div>

              <input id="subscriptionTitle" type="text" placeholder="Subscription name" />
              <div class="row">
                <input id="subscriptionDate" type="date" />
                <input id="subscriptionAmount" type="number" min="0" step="0.01" placeholder="Monthly amount" />
              </div>
              <div class="row">
                <select id="subscriptionCategory">
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Misc">Misc</option>
                </select>
                <select id="subscriptionAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <div></div>
                <button id="addSubscriptionBtn">Add subscription</button>
              </div>

              <input id="expenseTitle" type="text" placeholder="Extra expense name" />
              <div class="row">
                <input id="expenseDate" type="date" />
                <input id="expenseAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>
              <div class="row">
                <select id="expenseCategory">
                  <option value="Misc">Misc</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transport">Transport</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                </select>
                <select id="expenseAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <div></div>
                <button id="addExpenseBtn">Add expense</button>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>Reminder settings</h2>
            <div class="panel-sub">Enable browser alerts and choose how many days before due date you want a reminder.</div>
            <div class="settings-box">
              <div class="settings-grid">
                <select id="reminderDaysSelect">
                  <option value="0" ${settings.reminderDays === 0 ? 'selected' : ''}>On the same day</option>
                  <option value="1" ${settings.reminderDays === 1 ? 'selected' : ''}>1 day before</option>
                  <option value="2" ${settings.reminderDays === 2 ? 'selected' : ''}>2 days before</option>
                  <option value="3" ${settings.reminderDays === 3 ? 'selected' : ''}>3 days before</option>
                  <option value="5" ${settings.reminderDays === 5 ? 'selected' : ''}>5 days before</option>
                  <option value="7" ${settings.reminderDays === 7 ? 'selected' : ''}>7 days before</option>
                </select>
                <button id="enableNotificationsBtn">Enable notifications</button>
              </div>
              <div class="small-note" id="notificationStatus">${('Notification' in window) ? (Notification.permission === 'granted' ? `Notifications are on. Reminding ${settings.reminderDays} day(s) before due date.` : 'Notifications are available but not enabled yet.') : 'This browser does not support notifications.'}</div>
            </div>
          </div>

          <div class="panel">
            <h2>Backup</h2>
            <p class="panel-sub">Download or restore your local data.</p>

            <div class="quick-add">
              <button id="downloadBackupBtn">Download backup</button>
              <input id="restoreBackupInput" type="file" accept=".json,application/json" />
              <button id="restoreBackupBtn" class="secondary">Restore backup</button>
              <div class="small-note" id="backupStatus">No backup action yet.</div>
            </div>
          </div>

          

          
        </div>
      </section>
    </div>
  `;
}
