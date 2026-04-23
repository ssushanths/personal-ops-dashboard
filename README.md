# Personal Ops Dashboard

A modular Vite + vanilla JavaScript version of the Personal Ops Dashboard.

## What is included

- Tasks
- Recurring payments
- Subscriptions
- One-time expenses
- Today Mode
- Mark-as-paid flow
- Monthly balance and savings prediction
- Salary masking with 6-digit PIN
- Browser reminders

## Project structure

- `src/config` app-wide settings
- `src/data` defaults and localStorage persistence
- `src/services` finance, assistant, notifications
- `src/utils` date, money, recurring logic
- `src/ui` rendering
- `src/styles` styling

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Monthly salary is configured in `src/config/appConfig.js`
- The current PIN is also in `src/config/appConfig.js`
- This version keeps data in browser localStorage
