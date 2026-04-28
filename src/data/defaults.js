// Helper to generate YYYY-MM-DD dates relative to today.
const iso = (daysFromToday = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
};


export function createDefaultState() {
  return {
    tasks: [],
    payments: [],
    subscriptions: [],
    expenses: [],
    inflows: [],

    accounts: {
      asOfDate: new Date().toISOString().split('T')[0],
      current: {
        openingBalance: 0
      },
      savings: {
        openingBalance: 0
      }
    },

    transfers: [],

    // Savings interest config/tracking
    savingsInterest: {
      aer: 0.015,
      startDate: new Date().toISOString().split('T')[0],
      lastPostedMonth: ''
    }
  };
}

/*
export function createDefaultSettings() {
  return {
    reminderDays: 2,
    notificationsEnabled: false,
    sentReminderKeys: {},
    salaryUnlocked: false,
    salaryMessage: 'Salary hidden.'
  };
} */

export function createDefaultSettings() {
  return {
    reminderDays: 2,
    notificationsEnabled: false,
    sentReminderKeys: {},
    salaryUnlocked: false,
    salaryMessage: 'Salary hidden.',
    monthlySalary: 0,
    salaryPin: ''
  };
}