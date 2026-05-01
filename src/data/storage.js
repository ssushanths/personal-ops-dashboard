import { appConfig } from '../config/appConfig.js';
import { createDefaultSettings, createDefaultState } from './defaults.js';

export function createInitialState() {
  return createDefaultState();
}

function migrateState(state) {
  return {
    ...state,
    tasks: state.tasks || [],

    // Ensure payments always have category + account defaults.
    payments: (state.payments || []).map((payment) => ({
      category: 'Misc',
      account: 'Current',
      ...payment
    })),

    inflows: (state.inflows || [
    {
      id: crypto.randomUUID(),
      title: 'Salary',
      amount: 3000,
      recurring: true,
      recurrenceType: 'monthly_last_weekday',
      weekday: 5,
      account: 'Current',
      active: true
    }
  ]).map((inflow) => ({
    account: 'Current',
    active: true,
    ...inflow
  })),

    // Ensure subscriptions always have category + account defaults.
    subscriptions: (state.subscriptions || []).map((subscription) => ({
      category: 'Subscriptions',
      account: 'Current',
      ...subscription
    })),

    // Ensure expenses always have category + account defaults.
    expenses: (state.expenses || []).map((expense) => ({
      category: 'Misc',
      account: 'Current',
      ...expense
    })),

    // Opening balances define the accounting start point.
    // Keep these explicit so you can reset/test without hidden assumptions.
    accounts: {
      asOfDate: state.accounts?.asOfDate || new Date().toISOString().slice(0, 10),
      current: {
        openingBalance: Number(state.accounts?.current?.openingBalance ?? 0)
      },
      savings: {
        openingBalance: Number(state.accounts?.savings?.openingBalance ?? 0)
      }
    },

    savingsInterest: {
      aer: Number(state.savingsInterest?.aer ?? 0.015),
      startDate: state.savingsInterest?.startDate || new Date().toISOString().slice(0, 10),
      lastPostedMonth: state.savingsInterest?.lastPostedMonth || ''
    },

    // Transfers may not exist in older saved state.
    transfers: state.transfers || []
  };
}

export function loadState(fallback = createDefaultState()) {
  try {
    const raw = localStorage.getItem(appConfig.storageKey);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return migrateState(parsed);
  } catch {
    return migrateState(fallback);
  }
}

export function saveState(state) {
  localStorage.setItem(appConfig.storageKey, JSON.stringify(state));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(appConfig.settingsKey);
    return raw ? JSON.parse(raw) : createDefaultSettings();
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(appConfig.settingsKey, JSON.stringify(settings));
}