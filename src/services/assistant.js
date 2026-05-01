import { computeFinancials } from './finance.js';

// Remembers the last assistant-created or assistant-edited record.
// This enables simple follow-up corrections like:
// - "no, from savings"
// - "change that to 6"
// - "change date to tomorrow"
// - "delete that"
let lastAssistantAction = null;

// Builds a local YYYY-MM-DD date string without UTC conversion.
// This keeps assistant-created dates aligned with app-local calendar logic.
function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function iso(daysFromToday = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return toLocalIsoDate(d);
}

function formatMoney(amount) {
  return `€${Number(amount || 0).toFixed(2)}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

function humanizeDate(dateStr) {
  if (!dateStr) return '';

  const today = toLocalIsoDate(new Date());
  const tomorrow = iso(1);

  if (dateStr === today) return 'today';
  if (dateStr === tomorrow) return 'tomorrow';

  return `on ${formatDisplayDate(dateStr)}`;
}

function normalizeTitle(text) {
  return text
    .replace(/\b(pay|remind me|to|every month|monthly|bill|payment|subscription|expense|spent|spend|from current|from savings)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateFromText(text) {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) return iso(0);
  if (lower.includes('yesterday')) return iso(-1);
  if (lower.includes('tomorrow')) return iso(1);
  if (lower.includes('next week')) return iso(7);
  if (lower.includes('next month')) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return toLocalIsoDate(d);
  }

  const match = lower.match(/(?:on|by|date to)?\s*(\d{1,2})(st|nd|rd|th)\b/);
  if (!match) return '';

  const candidate = new Date(now.getFullYear(), now.getMonth(), Number(match[1]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  return toLocalIsoDate(candidate);
}

// Supports:
// - today / tomorrow / yesterday
// - DD-MM-YYYY
// - YYYY-MM-DD
function parseFlexibleDate(value) {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw === 'today') return iso(0);
  if (raw === 'tomorrow') return iso(1);
  if (raw === 'yesterday') return iso(-1);

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  const yyyymmdd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) return raw;

  return '';
}

function extractAmount(text) {
  const match = text.match(/(?:€|eur\s*)?(\d+[\.,]?\d*)/i);
  return match ? Number(match[1].replace(',', '.')) : 0;
}

function titleCase(value) {
  const text = (value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeAccount(value) {
  const v = (value || '').trim().toLowerCase();
  if (v === 'savings') return 'Savings';
  return 'Current';
}

function detectCategory(text, type = 'expense') {
  const lower = text.toLowerCase();

  if (lower.includes('rent') || lower.includes('mortgage')) return 'Housing';
  if (lower.includes('electricity') || lower.includes('internet') || lower.includes('water') || lower.includes('gas')) return 'Utilities';
  if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('youtube') || lower.includes('subscription')) return 'Subscriptions';
  if (lower.includes('grocer')) return 'Groceries';
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('coffee')) return 'Food';
  if (lower.includes('uber') || lower.includes('taxi') || lower.includes('fuel') || lower.includes('bus') || lower.includes('train') || lower.includes('transport')) return 'Transport';
  if (lower.includes('doctor') || lower.includes('medicine') || lower.includes('health')) return 'Health';
  if (lower.includes('shopping') || lower.includes('amazon') || lower.includes('clothes')) return 'Shopping';
  if (lower.includes('loan') || lower.includes('credit card') || lower.includes('card')) return 'Debt';
  if (lower.includes('insurance')) return 'Insurance';

  if (type === 'subscription') return 'Subscriptions';
  return 'Misc';
}

// Detects which account the user mentioned in loose text.
// Defaults to Current because that is still the most common flow.
function detectAccount(text) {
  const lower = text.toLowerCase();

  if (lower.includes('from savings') || lower.includes('using savings')) return 'Savings';
  if (lower.includes('from current') || lower.includes('using current')) return 'Current';

  return 'Current';
}

// Parses transfer intent such as:
// - transfer 200 to savings
// - move 50 from savings to current
// - transfer 300 from current to savings
function parseTransferIntent(text) {
  const lower = text.toLowerCase();
  const isTransfer = lower.includes('transfer') || lower.includes('move');

  if (!isTransfer) return null;

  const amount = extractAmount(text);
  const date = parseDateFromText(text) || iso(0);

  let fromAccount = 'Current';
  let toAccount = 'Savings';

  if (lower.includes('from savings to current')) {
    fromAccount = 'Savings';
    toAccount = 'Current';
  } else if (lower.includes('from current to savings')) {
    fromAccount = 'Current';
    toAccount = 'Savings';
  } else if (lower.includes('to savings')) {
    fromAccount = 'Current';
    toAccount = 'Savings';
  } else if (lower.includes('to current')) {
    fromAccount = 'Savings';
    toAccount = 'Current';
  }

  const note = text
    .replace(/\b(transfer|move|from|to|current|savings)\b/gi, ' ')
    .replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    date,
    fromAccount,
    toAccount,
    note: note || 'Transfer'
  };
}

// Keyword parser for predictable command entry.
// Recommended formats:
//
// Payment,amount,category,account,date,title
// Expense,amount,category,account,date,title
// Subscription,amount,category,account,date,title
// Transfer,amount,fromAccount,toAccount,date,note
// Task,title,date
//
// Example:
// Expense,5,Food,Current,today,Coffee
function parseKeywordCommand(input, state) {
  const parts = input.split(',').map((p) => p.trim());
  const command = (parts[0] || '').toLowerCase();

  if (!command) return null;

  if (command === 'start') {
  const [, currentRaw, savingsRaw, salaryRaw] = parts;

  const current = Number(currentRaw || 0);
  const savings = Number(savingsRaw || 0);
  const salary = Number(salaryRaw || 0);

  if (Number.isNaN(current) || Number.isNaN(savings)) {
    return {
      changed: false,
      clearInput: false,
      message: 'Start format: Start,currentBalance,savingsBalance,salary'
    };
  }

  state.accounts = {
    asOfDate: new Date().toISOString().split('T')[0],
    current: { openingBalance: current },
    savings: { openingBalance: savings }
  };

  state.inflows = salary > 0
    ? [
        {
          id: crypto.randomUUID(),
          title: 'Salary',
          amount: salary,
          recurring: true,
          recurrenceType: 'monthly_last_weekday',
          weekday: 5,
          account: 'Current',
          active: true
        }
      ]
    : [];

  return {
    changed: true,
    clearInput: true,
    message: salary > 0
      ? `Started with Current ${formatMoney(current)}, Savings ${formatMoney(savings)}, Salary ${formatMoney(salary)}.`
      : `Started with Current ${formatMoney(current)} and Savings ${formatMoney(savings)}.`
  };
}

  if (command === 'income') {
  const [, amountRaw, accountRaw, dateRaw, titleRaw] = parts;

  const amount = Number(amountRaw || 0);
  const account = normalizeAccount(accountRaw);
  const date = parseFlexibleDate(dateRaw) || iso(0);
  const title = titleRaw || 'Income';

  if (!amount) {
    return {
      changed: false,
      clearInput: false,
      message: 'Income format: Income,amount,account,date,title'
    };
  }

  state.inflows.unshift({
    id: crypto.randomUUID(),
    title,
    amount,
    account,
    date,
    recurring: false,
    active: true
  });

  return {
    changed: true,
    clearInput: true,
    message: `Income added: ${title} €${amount.toFixed(2)} to ${account}.`
  };
}

  if (command === 'report' || command === 'export') {
    return {
      changed: false,
      clearInput: true,
      action: 'export_report',
      message: 'Generating report...'
    };
  }

  if (command === 'task') {
    const [, title, dateRaw] = parts;
    if (!title) {
      return {
        changed: false,
        clearInput: false,
        message: 'Task format: Task,title,date'
      };
    }

    const dueDate = parseFlexibleDate(dateRaw);

    state.tasks.unshift({
      id: crypto.randomUUID(),
      title,
      dueDate,
      done: false
    });

    lastAssistantAction = null;

    return {
      changed: true,
      clearInput: true,
      message: `Task added: ${title}.`
    };
  }

  if (command === 'expense') {
    const [, amountRaw, categoryRaw, accountRaw, dateRaw, titleRaw] = parts;
    const amount = Number(amountRaw || 0);
    const category = titleCase(categoryRaw || 'Misc');
    const account = normalizeAccount(accountRaw);
    const date = parseFlexibleDate(dateRaw) || iso(0);
    const title = titleRaw || 'Expense';

    if (!amount || !title) {
      return {
        changed: false,
        clearInput: false,
        message: 'Expense format: Expense,amount,category,account,date,title'
      };
    }

    const expenseItem = {
      id: crypto.randomUUID(),
      title,
      date,
      amount,
      category,
      account
    };

    state.expenses.unshift(expenseItem);
    lastAssistantAction = { type: 'expenses', id: expenseItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Expense added: ${title} ${formatMoney(amount)} from ${account}.`
    };
  }

  if (command === 'payment') {
    const [, amountRaw, categoryRaw, accountRaw, dateRaw, titleRaw] = parts;
    const amount = Number(amountRaw || 0);
    const category = titleCase(categoryRaw || 'Misc');
    const account = normalizeAccount(accountRaw);
    const dueDate = parseFlexibleDate(dateRaw) || iso(7);
    const title = titleRaw || 'Payment';

    if (!amount || !title) {
      return {
        changed: false,
        clearInput: false,
        message: 'Payment format: Payment,amount,category,account,date,title'
      };
    }

    const paymentItem = {
      id: crypto.randomUUID(),
      title,
      dueDate,
      amount,
      category,
      account,
      recurring: false,
      recurrenceDay: null,
      lastPaidMonth: '',
      paid: false,
      paidOn: ''
    };

    state.payments.unshift(paymentItem);
    lastAssistantAction = { type: 'payments', id: paymentItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Payment added: ${title} ${formatMoney(amount)} from ${account}.`
    };
  }

  if (command === 'subscription') {
    const [, amountRaw, categoryRaw, accountRaw, dateRaw, titleRaw] = parts;
    const amount = Number(amountRaw || 0);
    const category = titleCase(categoryRaw || 'Subscriptions');
    const account = normalizeAccount(accountRaw);
    const renewalDate = parseFlexibleDate(dateRaw) || iso(30);
    const title = titleRaw || 'Subscription';

    if (!amount || !title) {
      return {
        changed: false,
        clearInput: false,
        message: 'Subscription format: Subscription,amount,category,account,date,title'
      };
    }

    const subscriptionItem = {
      id: crypto.randomUUID(),
      title,
      renewalDate,
      amount,
      category,
      account,
      recurring: true,
      recurrenceDay: new Date(`${renewalDate}T00:00:00`).getDate(),
      lastPaidMonth: ''
    };

    state.subscriptions.unshift(subscriptionItem);
    lastAssistantAction = { type: 'subscriptions', id: subscriptionItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Subscription added: ${title} ${formatMoney(amount)} from ${account}.`
    };
  }

  if (command === 'transfer') {
    const [, amountRaw, fromRaw, toRaw, dateRaw, noteRaw] = parts;
    const amount = Number(amountRaw || 0);
    const fromAccount = normalizeAccount(fromRaw);
    const desiredToAccount = normalizeAccount(toRaw);
    const toAccount =
      desiredToAccount === fromAccount
        ? (fromAccount === 'Current' ? 'Savings' : 'Current')
        : desiredToAccount;
    const date = parseFlexibleDate(dateRaw) || iso(0);
    const note = noteRaw || 'Transfer';

    if (!amount) {
      return {
        changed: false,
        clearInput: false,
        message: 'Transfer format: Transfer,amount,fromAccount,toAccount,date,note'
      };
    }

    const transferItem = {
      id: crypto.randomUUID(),
      fromAccount,
      toAccount,
      date,
      amount,
      note
    };

    state.transfers.unshift(transferItem);
    lastAssistantAction = { type: 'transfers', id: transferItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Transfer added: ${formatMoney(amount)} from ${fromAccount} to ${toAccount}.`
    };
  }

  return null;
}

// Finds an item by remembered type/id.
function findRememberedItem(state) {
  if (!lastAssistantAction?.type || !lastAssistantAction?.id) return null;

  const collection = state[lastAssistantAction.type];
  if (!Array.isArray(collection)) return null;

  const item = collection.find((entry) => entry.id === lastAssistantAction.id);
  if (!item) return null;

  return {
    type: lastAssistantAction.type,
    item
  };
}

function getItemTitle(type, item) {
  if (type === 'transfers') {
    return item.note || 'Transfer';
  }
  return item.title || 'Item';
}

// Applies correction commands to the last assistant-created item.
function handleCorrectionIntent(input, state) {
  const lower = input.toLowerCase().trim();
  const remembered = findRememberedItem(state);

  if (!remembered) return null;

  const { type, item } = remembered;

  if (lower === 'delete that' || lower === 'remove that' || lower === 'undo that') {
    state[type] = state[type].filter((entry) => entry.id !== item.id);

    const deletedTitle = getItemTitle(type, item);
    lastAssistantAction = null;

    return {
      changed: true,
      clearInput: true,
      message: `Removed ${deletedTitle}.`
    };
  }

  if (
    lower.includes('from current') ||
    lower.includes('from savings') ||
    lower === 'current' ||
    lower === 'savings' ||
    lower.startsWith('no')
  ) {
    const newAccount = detectAccount(input);

    if (type === 'transfers') {
      item.fromAccount = newAccount;
      item.toAccount = newAccount === 'Current' ? 'Savings' : 'Current';

      lastAssistantAction = { type, id: item.id };

      return {
        changed: true,
        clearInput: true,
        message: `Got it — transfer now from ${item.fromAccount} to ${item.toAccount}.`
      };
    }

    item.account = newAccount;
    lastAssistantAction = { type, id: item.id };

    return {
      changed: true,
      clearInput: true,
      message: `Got it — ${getItemTitle(type, item)} will use ${newAccount}.`
    };
  }

  if (
    lower.startsWith('change that to') ||
    lower.startsWith('make that') ||
    lower.startsWith('change amount to')
  ) {
    const newAmount = extractAmount(input);
    if (!newAmount) {
      return {
        changed: false,
        clearInput: false,
        message: 'I could not find the new amount.'
      };
    }

    item.amount = newAmount;
    lastAssistantAction = { type, id: item.id };

    return {
      changed: true,
      clearInput: true,
      message: `Done — ${getItemTitle(type, item)} is now ${formatMoney(newAmount)}.`
    };
  }

  if (
    lower.startsWith('change date to') ||
    lower.startsWith('move that to') ||
    lower.startsWith('set date to')
  ) {
    const newDate = parseDateFromText(input);
    if (!newDate) {
      return {
        changed: false,
        clearInput: false,
        message: 'I could not understand the new date.'
      };
    }

    if (type === 'payments') item.dueDate = newDate;
    if (type === 'subscriptions') item.renewalDate = newDate;
    if (type === 'expenses') item.date = newDate;
    if (type === 'transfers') item.date = newDate;

    if (type === 'payments' && item.recurring) {
      item.recurrenceDay = new Date(`${newDate}T00:00:00`).getDate();
    }
    if (type === 'subscriptions') {
      item.recurrenceDay = new Date(`${newDate}T00:00:00`).getDate();
    }

    lastAssistantAction = { type, id: item.id };

    return {
      changed: true,
      clearInput: true,
      message: `Moved ${getItemTitle(type, item)} to ${humanizeDate(newDate)}.`
    };
  }

  return null;
}

export function parseAssistantInput({ text, state, salary }) {
  const input = text.trim();
  if (!input) {
    return {
      changed: false,
      clearInput: false,
      message: 'Type something first.'
    };
  }

  // 1) Strict keyword commands come first for predictability.
  const keywordResult = parseKeywordCommand(input, state);
  if (keywordResult) {
    return keywordResult;
  }

  // 2) Then allow correction-style follow-ups.
  const correctionResult = handleCorrectionIntent(input, state);
  if (correctionResult) {
    return correctionResult;
  }

  const lower = input.toLowerCase();
  const recurring = lower.includes('every month') || lower.includes('monthly');
  const amount = extractAmount(input);
  const date = parseDateFromText(input);
  const account = detectAccount(input);

  // Forecast-style questions
  if (lower.includes('save') || lower.includes('savings')) {
    const finance = computeFinancials(state, salary);
    return {
      changed: false,
      clearInput: false,
      message: `You’re on track to save ${formatMoney(finance.predictedSavings)} this month. Projected leftover: ${formatMoney(finance.balanceLeft)}.`
    };
  }

  if (lower.includes('due this week')) {
    return {
      changed: false,
      clearInput: false,
      message: 'Check Today Mode and the payments list for the current weekly view.'
    };
  }

  // Keep transfer detection before expenses/payments because they also contain amounts.
  const transfer = parseTransferIntent(input);
  if (transfer && transfer.amount > 0 && transfer.fromAccount !== transfer.toAccount) {
    const transferItem = {
      id: crypto.randomUUID(),
      fromAccount: transfer.fromAccount,
      toAccount: transfer.toAccount,
      date: transfer.date,
      amount: transfer.amount,
      note: transfer.note
    };

    state.transfers.unshift(transferItem);
    lastAssistantAction = { type: 'transfers', id: transferItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Moved ${formatMoney(transfer.amount)} from ${transfer.fromAccount} to ${transfer.toAccount} (${humanizeDate(transfer.date)}).`
    };
  }

  // Natural-language expense fallback
  if (
    lower.includes('grocer') ||
    lower.includes('expense') ||
    lower.includes('spent') ||
    lower.includes('shopping') ||
    lower.includes('food') ||
    lower.includes('transport') ||
    lower.includes('coffee') ||
    lower.includes('lunch') ||
    lower.includes('dinner')
  ) {
    const title =
      normalizeTitle(input.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi, '')) || 'Expense';

    const expenseItem = {
      id: crypto.randomUUID(),
      title,
      date: date || iso(0),
      amount,
      category: detectCategory(input, 'expense'),
      account
    };

    state.expenses.unshift(expenseItem);
    lastAssistantAction = { type: 'expenses', id: expenseItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Logged ${formatMoney(amount)} for ${title} from ${account} (${humanizeDate(date || iso(0))}).`
    };
  }

  // Natural-language subscription fallback
  if (
    lower.includes('netflix') ||
    lower.includes('spotify') ||
    lower.includes('subscription') ||
    (recurring && !lower.includes('pay') && !lower.includes('rent'))
  ) {
    const title =
      normalizeTitle(input.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi, '')) || 'Subscription';

    const subscriptionItem = {
      id: crypto.randomUUID(),
      title,
      renewalDate: date || iso(30),
      amount,
      recurring: true,
      recurrenceDay: new Date(`${date || iso(30)}T00:00:00`).getDate(),
      lastPaidMonth: '',
      category: detectCategory(input, 'subscription'),
      account
    };

    state.subscriptions.unshift(subscriptionItem);
    lastAssistantAction = { type: 'subscriptions', id: subscriptionItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Started ${title} at ${formatMoney(amount)} from ${account}, renewing ${humanizeDate(date || iso(30))}.`
    };
  }

  // Natural-language payment fallback
  if (
    lower.includes('pay') ||
    lower.includes('bill') ||
    lower.includes('card') ||
    lower.includes('rent') ||
    lower.includes('loan') ||
    lower.includes('insurance')
  ) {
    const title =
      normalizeTitle(input.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi, '')) || 'Payment';

    const paymentItem = {
      id: crypto.randomUUID(),
      title,
      dueDate: date || iso(7),
      amount,
      recurring,
      recurrenceDay: recurring ? new Date(`${date || iso(7)}T00:00:00`).getDate() : null,
      lastPaidMonth: '',
      paid: false,
      paidOn: '',
      category: detectCategory(input, 'payment'),
      account
    };

    state.payments.unshift(paymentItem);
    lastAssistantAction = { type: 'payments', id: paymentItem.id };

    return {
      changed: true,
      clearInput: true,
      message: `Scheduled ${title} for ${formatMoney(amount)} from ${account} (${humanizeDate(date || iso(7))}).`
    };
  }

  // Fall back to task creation if no finance intent matches.
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: normalizeTitle(input) || input,
    dueDate: date,
    done: false
  });

  lastAssistantAction = null;

  return {
    changed: true,
    clearInput: true,
    message: 'Task added.'
  };
}