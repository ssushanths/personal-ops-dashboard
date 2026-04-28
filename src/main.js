import './styles/main.css';
import { appConfig } from './config/appConfig.js';
import { exportBalanceSheet } from './services/exportBalanceSheet.js';
import { createInitialState, loadState, saveState, loadSettings, saveSettings } from './data/storage.js';
import { runAutoRepeat, markPaymentPaid, markSubscriptionPaid } from './utils/recurring.js';
import { computeFinancials } from './services/finance.js';
import { parseAssistantInput } from './services/assistant.js';
import { maybeSendNotifications, requestNotificationPermission } from './services/notifications.js';
import { renderApp } from './ui/dashboard.js';
import { downloadBackup, restoreBackupFromFile } from './services/backupService.js';

// Load persisted state/settings on startup.
// State is migrated in storage.js, so older saved data can still be used safely.
const state = loadState(createInitialState());
const settings = loadSettings();

function render() {
  // Keep recurring items aligned before rendering any UI or calculations.
  //runAutoRepeat(state);

  // Compute all finance-related derived values in one place.
  const finance = computeFinancials(state, Number(settings.monthlySalary || 0));
  const root = document.getElementById('app');

  root.innerHTML = renderApp({
    state,
    settings,
    finance,
    today: new Date(),
    config: appConfig
  });

  // Re-bind events after each render because the UI is re-created from scratch.
  bindEvents();

  focusOverdueItemsOnce();

  // Persist current app state after every render cycle.
  saveState(state);
  saveSettings(settings);

  // Notification logic runs after state/settings are fully updated.
  maybeSendNotifications({ state, settings });
}

let overdueFocusDone = false;

function focusOverdueItemsOnce() {
  if (overdueFocusDone) return;

  const todayModeSection = document.getElementById('todayModeSection');
  const hasOverdue = todayModeSection?.dataset.hasOverdue === 'true';

  if (!hasOverdue) return;

  overdueFocusDone = true;

  setTimeout(() => {
    todayModeSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    todayModeSection.classList.add('focus-overdue');

    setTimeout(() => {
      todayModeSection.classList.remove('focus-overdue');
    }, 1800);
  }, 250);
}

function bindEvents() {
  document.getElementById('assistantBtn')?.addEventListener('click', onAssistantSubmit);

  document.getElementById('assistantInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAssistantSubmit();
    }
  });

  document.getElementById('exportBalanceSheetBtn')?.addEventListener('click', () => {
    const status = document.getElementById('exportStatus');

    try {
      const finance = computeFinancials(state, Number(settings.monthlySalary || 0));
      exportBalanceSheet(state, finance);
      if (status) status.textContent = 'Balance sheet exported.';
    } catch (error) {
      if (status) status.textContent = 'Export failed.';
      console.error(error);
    }
  });

  document.querySelectorAll('[data-fill]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('assistantInput').value = button.dataset.fill;
    });
  });

  document.getElementById('addTaskBtn')?.addEventListener('click', () => {
    const title = document.getElementById('taskTitle').value.trim();
    const dueDate = document.getElementById('taskDate').value;

    if (!title) return;

    state.tasks.unshift({
      id: crypto.randomUUID(),
      title,
      dueDate,
      done: false
    });

    render();
  });

  document.getElementById('addPaymentBtn')?.addEventListener('click', () => {
    const title = document.getElementById('paymentTitle').value.trim();
    const dueDate = document.getElementById('paymentDate').value;
    const amount = Number(document.getElementById('paymentAmount').value || 0);
    const category = document.getElementById('paymentCategory').value;
    const account = document.getElementById('paymentAccount').value;
    const recurring = document.getElementById('paymentRecurring').value === 'true';

    if (!title || !dueDate) return;

    // Payments now explicitly capture which account the money should come from.
    state.payments.unshift({
      id: crypto.randomUUID(),
      title,
      dueDate,
      amount,
      category,
      account,
      recurring,
      recurrenceDay: recurring ? new Date(`${dueDate}T00:00:00`).getDate() : null,
      lastPaidMonth: '',
      paid: false,
      paidOn: ''
    });

    render();
  });

  document.getElementById('addSubscriptionBtn')?.addEventListener('click', () => {
    const title = document.getElementById('subscriptionTitle').value.trim();
    const renewalDate = document.getElementById('subscriptionDate').value;
    const amount = Number(document.getElementById('subscriptionAmount').value || 0);
    const category = document.getElementById('subscriptionCategory').value;
    const account = document.getElementById('subscriptionAccount').value;

    if (!title || !renewalDate) return;

    // Subscriptions can now be tied to either Current or Savings.
    state.subscriptions.unshift({
      id: crypto.randomUUID(),
      title,
      renewalDate,
      amount,
      category,
      account,
      recurring: true,
      recurrenceDay: new Date(`${renewalDate}T00:00:00`).getDate(),
      lastPaidMonth: ''
    });

    render();
  });

  document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
    const title = document.getElementById('expenseTitle').value.trim();
    const date = document.getElementById('expenseDate').value;
    const amount = Number(document.getElementById('expenseAmount').value || 0);
    const category = document.getElementById('expenseCategory').value;
    const account = document.getElementById('expenseAccount').value;

    if (!title || !date || !amount) return;

    // One-time expenses should affect the selected account balance.
    state.expenses.unshift({
      id: crypto.randomUUID(),
      title,
      date,
      amount,
      category,
      account
    });

    render();
  });

  document.getElementById('addTransferBtn')?.addEventListener('click', () => {
    const fromAccount = document.getElementById('transferFromAccount').value;
    const toAccount = document.getElementById('transferToAccount').value;
    const date = document.getElementById('transferDate').value;
    const amount = Number(document.getElementById('transferAmount').value || 0);
    const note = document.getElementById('transferNote').value.trim();

    // Transfers must move money between different accounts.
    if (fromAccount === toAccount) return;
    if (!date || !amount) return;

    state.transfers.unshift({
      id: crypto.randomUUID(),
      fromAccount,
      toAccount,
      date,
      amount,
      note
    });

    render();
  });

  document.getElementById('clearDoneBtn')?.addEventListener('click', () => {
    state.tasks = state.tasks.filter((task) => !task.done);
    render();
  });

  document.querySelectorAll('[data-toggle-task]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.toggleTask;
      state.tasks = state.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      );
      render();
    });
  });

  document.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const [type, id] = button.dataset.remove.split(':');
      state[type] = state[type].filter((item) => item.id !== id);
      render();
    });
  });

  document.querySelectorAll('[data-mark-payment-paid]').forEach((button) => {
    button.addEventListener('click', () => {
      markPaymentPaid(state, button.dataset.markPaymentPaid);
      render();
    });
  });

  document.querySelectorAll('[data-mark-subscription-paid]').forEach((button) => {
    button.addEventListener('click', () => {
      markSubscriptionPaid(state, button.dataset.markSubscriptionPaid);
      render();
    });
  });

  document.getElementById('reminderDaysSelect')?.addEventListener('change', (e) => {
    settings.reminderDays = Number(e.target.value);
    render();
  });

  document.getElementById('enableNotificationsBtn')?.addEventListener('click', async () => {
    await requestNotificationPermission(settings);
    render();
  });

  document.getElementById('unlockSalaryBtn')?.addEventListener('click', () => {
    const pin = document.getElementById('salaryPinInput').value.trim();
    const savedPin = settings.salaryPin || '';
    settings.salaryUnlocked = Boolean(savedPin && pin === savedPin);
    settings.salaryMessage = settings.salaryUnlocked ? 'Salary visible.' : 'Wrong PIN.';
    render();
  });

  document.getElementById('lockSalaryBtn')?.addEventListener('click', () => {
    settings.salaryUnlocked = false;
    settings.salaryMessage = 'Salary hidden.';
    render();
  });

  document.getElementById('downloadBackupBtn')?.addEventListener('click', () => {
    const status = document.getElementById('backupStatus');

    try {
      downloadBackup();
      if (status) status.textContent = 'Backup downloaded.';
    } catch (error) {
      if (status) status.textContent = 'Download failed.';
      console.error(error);
    }
  });

  document.getElementById('restoreBackupBtn')?.addEventListener('click', async () => {
    const status = document.getElementById('backupStatus');
    const file = document.getElementById('restoreBackupInput')?.files?.[0];

    if (!file) {
      if (status) status.textContent = 'Select a backup file first.';
      return;
    }

    const confirmed = window.confirm('This will overwrite your current local data. Continue?');
    if (!confirmed) return;

    try {
      await restoreBackupFromFile(file);
      if (status) status.textContent = 'Backup restored. Reloading...';
      window.location.reload();
    } catch (error) {
      if (status) status.textContent = 'Restore failed.';
      console.error(error);
    }
  });

  document.getElementById('saveSalarySettingsBtn')?.addEventListener('click', () => {
    const salaryValue = Number(document.getElementById('monthlySalaryInput')?.value || 0);
    const pinValue = document.getElementById('salaryPinSetupInput')?.value.trim() || '';

    settings.monthlySalary = salaryValue;

    if (pinValue) {
      settings.salaryPin = pinValue;
      settings.salaryUnlocked = false;
      settings.salaryMessage = 'Salary settings saved. Unlock to view.';
    } else {
      settings.salaryMessage = 'Salary updated.';
    }

    render();
  });
}

function onAssistantSubmit() {
  const input = document.getElementById('assistantInput');

  const result = parseAssistantInput({
    text: input.value,
    state,
    salary: appConfig.monthlySalary
  });

  if (result.changed) {
    render();
  }

  if (result.action === 'export_report') {
    const finance = computeFinancials(state, Number(settings.monthlySalary || 0));
    exportBalanceSheet(state, finance);
  }

  const feedback = document.getElementById('assistantFeedback');
  if (feedback) feedback.textContent = result.message;

  if (result.clearInput) {
    const refreshedInput = document.getElementById('assistantInput');
    if (refreshedInput) refreshedInput.value = '';
  }
}

render();