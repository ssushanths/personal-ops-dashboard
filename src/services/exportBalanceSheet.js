// Builds and downloads a balance-sheet-style Excel workbook in the browser.
// Uses the global XLSX object loaded from the SheetJS browser script.

function formatDateForExport(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}-${month}-${year}`;
}

function buildSummaryRows(state, finance) {
  const trackingFrom = state.accounts?.asOfDate || '';
  const currentOpening = Number(state.accounts?.current?.openingBalance || 0);
  const savingsOpening = Number(state.accounts?.savings?.openingBalance || 0);
  const balances = finance.accountBalances || { current: 0, savings: 0, total: 0 };

  return [
    ['Balance Sheet Summary', ''],
    ['', ''],
    ['Tracking From', formatDateForExport(trackingFrom)],
    ['Opening Current Account', currentOpening],
    ['Opening Savings Account', savingsOpening],
    ['', ''],
    ['Predicted Savings', finance.predictedSavings],
    ['Monthly Recurring', finance.monthlyRecurring],
    ['One-Time Payments This Month', finance.oneTimePaymentsThisMonth],
    ['One-Time Expenses This Month', finance.extraExpensesThisMonth],
    ['Total This Month', finance.totalThisMonth],
    ['', ''],
    ['Current Account Balance', balances.current],
    ['Savings Account Balance', balances.savings],
    ['Total Cash', balances.total]
  ];
}

function mapPayments(state) {
  return [
    ['Title', 'Due Date', 'Amount', 'Category', 'Account', 'Recurring', 'Paid', 'Paid On'],
    ...(state.payments || []).map((p) => [
      p.title || '',
      formatDateForExport(p.dueDate || ''),
      Number(p.amount || 0),
      p.category || 'Misc',
      p.account || 'Current',
      p.recurring ? 'Yes' : 'No',
      p.paid ? 'Yes' : 'No',
      formatDateForExport(p.paidOn || '')
    ])
  ];
}

function mapSubscriptions(state) {
  return [
    ['Title', 'Renewal Date', 'Amount', 'Category', 'Account', 'Paid On'],
    ...(state.subscriptions || []).map((s) => [
      s.title || '',
      formatDateForExport(s.renewalDate || ''),
      Number(s.amount || 0),
      s.category || 'Subscriptions',
      s.account || 'Current',
      formatDateForExport(s.paidOn || '')
    ])
  ];
}

function mapExpenses(state) {
  return [
    ['Title', 'Date', 'Amount', 'Category', 'Account'],
    ...(state.expenses || []).map((e) => [
      e.title || '',
      formatDateForExport(e.date || ''),
      Number(e.amount || 0),
      e.category || 'Misc',
      e.account || 'Current'
    ])
  ];
}

function mapTransfers(state) {
  return [
    ['Date', 'Amount', 'From Account', 'To Account', 'Note'],
    ...(state.transfers || []).map((t) => [
      formatDateForExport(t.date || ''),
      Number(t.amount || 0),
      t.fromAccount || '',
      t.toAccount || '',
      t.note || ''
    ])
  ];
}

function autosizeColumns(rows) {
  const widths = [];
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      const len = String(cell ?? '').length;
      widths[i] = Math.max(widths[i] || 10, Math.min(len + 2, 28));
    });
  });
  return widths.map((wch) => ({ wch }));
}

export function exportBalanceSheet(state, finance) {
  if (!window.XLSX) {
    throw new Error('Excel export library not loaded.');
  }

  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();

  const summaryRows = buildSummaryRows(state, finance);
  const paymentsRows = mapPayments(state);
  const subscriptionsRows = mapSubscriptions(state);
  const expensesRows = mapExpenses(state);
  const transfersRows = mapTransfers(state);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  const paymentsWs = XLSX.utils.aoa_to_sheet(paymentsRows);
  const subscriptionsWs = XLSX.utils.aoa_to_sheet(subscriptionsRows);
  const expensesWs = XLSX.utils.aoa_to_sheet(expensesRows);
  const transfersWs = XLSX.utils.aoa_to_sheet(transfersRows);

  summaryWs['!cols'] = autosizeColumns(summaryRows);
  paymentsWs['!cols'] = autosizeColumns(paymentsRows);
  subscriptionsWs['!cols'] = autosizeColumns(subscriptionsRows);
  expensesWs['!cols'] = autosizeColumns(expensesRows);
  transfersWs['!cols'] = autosizeColumns(transfersRows);

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  XLSX.utils.book_append_sheet(wb, paymentsWs, 'Payments');
  XLSX.utils.book_append_sheet(wb, subscriptionsWs, 'Subscriptions');
  XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
  XLSX.utils.book_append_sheet(wb, transfersWs, 'Transfers');

  XLSX.writeFile(wb, 'personal-balance-sheet.xlsx');
}