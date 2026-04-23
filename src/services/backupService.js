import { appConfig } from '../config/appConfig.js';

function getBackupTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export function downloadBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: JSON.parse(localStorage.getItem(appConfig.storageKey) || '{}'),
    settings: JSON.parse(localStorage.getItem(appConfig.settingsKey) || '{}')
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PersonalFinanceData_BackUp_${getBackupTimestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackupFromFile(file) {
  if (!file) throw new Error('No file selected');

  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!parsed.data || !parsed.settings) {
    throw new Error('Invalid backup file');
  }

  localStorage.setItem(appConfig.storageKey, JSON.stringify(parsed.data));
  localStorage.setItem(appConfig.settingsKey, JSON.stringify(parsed.settings));
}