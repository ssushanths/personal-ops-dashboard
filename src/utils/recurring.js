import { addMonthsKeepingDay, daysUntil, toISO } from './date.js';
import { applyMonthEndSavingsInterest } from './savingsInterest.js';

export function runAutoRepeat(state) {
  // Intentionally disabled.
  // Recurring payments and subscriptions must stay in the current cycle
  // until the user explicitly marks them paid.
  applyMonthEndSavingsInterest(state);
}

export function isPaymentPaidForCurrentCycle(payment) {
  return payment.recurring
    ? payment.lastPaidMonth === payment.dueDate.slice(0, 7)
    : Boolean(payment.paid);
}

export function isSubscriptionPaidForCurrentCycle(subscription) {
  return subscription.lastPaidMonth === subscription.renewalDate.slice(0, 7);
}

export function markPaymentPaid(state, id) {
  const today = toISO(new Date());

  state.payments = state.payments.map((payment) => {
    if (payment.id !== id) return payment;

    if (payment.recurring) {
      return {
        ...payment,
        lastPaidMonth: payment.dueDate.slice(0, 7),
        paidOn: today,
        dueDate: addMonthsKeepingDay(
          payment.dueDate,
          payment.recurrenceDay || new Date(`${payment.dueDate}T00:00:00`).getDate()
        )
      };
    }

    return { ...payment, paid: true, paidOn: today };
  });
}

export function markSubscriptionPaid(state, id) {
  const today = toISO(new Date());

  state.subscriptions = state.subscriptions.map((subscription) => {
    if (subscription.id !== id) return subscription;

    return {
      ...subscription,
      lastPaidMonth: subscription.renewalDate.slice(0, 7),
      paidOn: today,
      renewalDate: addMonthsKeepingDay(
        subscription.renewalDate,
        subscription.recurrenceDay || new Date(`${subscription.renewalDate}T00:00:00`).getDate()
      )
    };
  });
}