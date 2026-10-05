# Butterfield Banco · Unified Banking + Crypto

A responsive, multi-page financial dashboard demo built with plain HTML, CSS, and JavaScript. It brings everyday bank accounts and digital assets into one portfolio, one activity ledger, and a unified set of money movement tools.

## Run locally

Open `index.html` in a modern browser. The app has no build step, framework, package dependency, backend, financial institution connection, or wallet integration.

## Project files

- `index.html` — app shell, navigation, modal, and accessible live notifications
- `styles.css` — responsive visual system, charts, cards, tables, and modal styling
- `app.js` — page rendering, filters, forms, demo actions, and local persistence
- `data.js` — starter account, crypto, wallet, and transaction data
- `statement.html`, `statement.css`, and `statement.js` — printable account statement, downloadable standalone HTML copy, and demo-data rendering

## Included experiences

- Combined net-worth dashboard with cash/crypto allocation, chart ranges, balance privacy, accounts, holdings, and recent activity
- Bank and wallet views, simulated institution linking, account creation, and wallet connections
- Payments: transfer review and confirmation, money requests, deposits, crypto purchases, bank-to-crypto buys, swaps, and crypto send/receive transfers
- Debit card preview, persistent freeze and card controls, editable daily spending limit, and replacement entry points
- Unified searchable activity with income/outgoing and bank/crypto/account filters, pagination, and printable account statements
- Account statements with selectable account and period, customer/account details, masked account number, reconciled demo balances, transaction ledger, and signature styling
- Crypto market/holdings overview, deposit/withdraw previews, and an illustrative staking/rewards page
- Analytics, account/profile/preferences/security views, help FAQs, notifications, and demo sign-in/sign-up screens
- Responsive desktop/mobile navigation and keyboard search shortcut (`Ctrl/Cmd + K`)

Bank linking accepts any institution name, while balances, market prices, transfers, card controls, wallet connections, and staking remain simulated. Profile, account, wallet, card, security, notification, and appearance preferences can be edited and are saved in this browser's local storage. Currency display uses approximate demo conversion rates. Do not enter real passwords, private keys, seed phrases, payment details, or sensitive information.

Open an account statement from an account card, the dashboard, activity, or analytics. The statement reads the same local demo data as the platform. **Print** opens the browser print dialog, where you can also choose **Save as PDF**. **Download** saves a standalone HTML copy with its styling and statement contents embedded, so it can be opened locally without the app. No server-side renderer or external PDF library is required.
