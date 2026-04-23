import { daysUntil, toISO } from '../utils/date.js';
import { isPaymentPaidForCurrentCycle, isSubscriptionPaidForCurrentCycle } from '../utils/recurring.js';

export async function requestNotificationPermission(settings) {
  if (!('Notification' in window)) return;
  const result = await Notification.requestPermission();
  settings.notificationsEnabled = result === 'granted';
}

export function maybeSendNotifications({ state, settings }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const reminderDays = Number(settings.reminderDays || 0);
  const todayKey = toISO(new Date());
  const items = [
    ...state.payments.filter((p) => !isPaymentPaidForCurrentCycle(p)).map((p) => ({ id: p.id, type: 'payment', title: p.title, date: p.dueDate })),
    ...state.subscriptions.filter((s) => !isSubscriptionPaidForCurrentCycle(s)).map((s) => ({ id: s.id, type: 'subscription', title: s.title, date: s.renewalDate })),
    ...state.tasks.filter((t) => !t.done).map((t) => ({ id: t.id, type: 'task', title: t.title, date: t.dueDate }))
  ].filter((item) => item.date);

  items.forEach((item) => {
    const days = daysUntil(item.date);
    const shouldNotify = days === reminderDays || days === 0;
    const key = `${todayKey}:${item.type}:${item.id}:${days}`;
    if (!shouldNotify || settings.sentReminderKeys[key]) return;

    const whenText = days === 0 ? 'due today' : `due in ${days} day(s)`;
    new Notification('Personal Ops Reminder', { body: `${item.title} is ${whenText}.` });
    settings.sentReminderKeys[key] = true;
  });
}
