(() => {
  const seed = window.BUTTERFIELD_SEED;
  const storageKey = "butterfield-banco-demo-v1";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || !Array.isArray(saved.accounts) || !Array.isArray(saved.assets) || !Array.isArray(saved.transactions)) return clone(seed);
      return {
        ...clone(seed),
        ...saved,
        cardControls: { ...seed.cardControls, ...saved.cardControls },
        preferences: { ...seed.preferences, ...saved.preferences },
        accounts: saved.accounts.filter((item) => item && Number.isFinite(item.balance)),
        assets: saved.assets.filter((item) => item && Number.isFinite(item.amount) && Number.isFinite(item.price)),
        transactions: saved.transactions.filter((item) => item && Number.isFinite(item.amount)),
        wallets: Array.isArray(saved.wallets) ? saved.wallets : clone(seed.wallets)
      };
    } catch (error) {
      console.warn("Could not load saved demo data.", error);
      return clone(seed);
    }
  };
  const state = {
    ...loadState(),
    page: location.hash.slice(1) || "overview",
    query: "",
    period: "1M",
    activityKind: "All",
    activityType: "All",
    transactionPage: 1,
    pageSize: 7
  };
  const pages = {
    overview: "Overview", accounts: "Accounts", cards: "Cards", payments: "Payments",
    activity: "Activity", crypto: "Crypto", earn: "Earn", analytics: "Analytics",
    settings: "Settings", support: "Help & support", signin: "Sign in", signup: "Create account"
  };
  const main = document.querySelector("#main-content");
  const backdrop = document.querySelector("#modal-backdrop");
  const modalContent = document.querySelector("#modal-content");
  const fxRates = { USD: 1, EUR: .92, GBP: .79, CAD: 1.36 };
  const money = (value, compact = false) => {
    const currency = state.preferences?.currency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: compact ? 0 : 2,
      notation: compact ? "compact" : "standard"
    }).format(value * (fxRates[currency] || 1));
  };
  const number = (value, digits = 4) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
  const formatDate = (value, withYear = false) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) }).format(new Date(value));
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const fiatTotal = () => state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const cryptoTotal = () => state.assets.reduce((sum, asset) => sum + asset.amount * asset.price, 0);
  const netWorth = () => fiatTotal() + cryptoTotal();
  const hiddenMoney = (value) => state.hiddenBalance ? "••••••" : money(value);
  const assetFor = (symbol) => state.assets.find((asset) => asset.symbol === symbol);
  const accountFor = (id) => state.accounts.find((account) => account.id === id);
  const accountOptions = (selected = state.accounts[0]?.id) => state.accounts.map((account) =>
    `<option value="${safe(account.id)}" ${account.id === selected ? "selected" : ""}>${safe(account.institution)} · ${safe(account.name)} ···· ${safe(account.mask)} (${hiddenMoney(account.balance)})</option>`
  ).join("");
  const assetOptions = (selected = state.assets[0]?.symbol) => state.assets.map((asset) =>
    `<option value="${safe(asset.symbol)}" ${asset.symbol === selected ? "selected" : ""}>${safe(asset.name)} (${safe(asset.symbol)})</option>`
  ).join("");

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        accounts: state.accounts, assets: state.assets, transactions: state.transactions,
        frozen: state.frozen, hiddenBalance: state.hiddenBalance, stakedUsd: state.stakedUsd,
        cardLimit: state.cardLimit, cardControls: state.cardControls,
        preferences: state.preferences, user: state.user, wallets: state.wallets
      }));
    } catch (error) {
      console.warn("Could not save demo data.", error);
      toast("Your browser could not save this change. Check local storage settings.");
    }
  }

  function toast(message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = `<span class="toast-icon">✓</span><span>${safe(message)}</span>`;
    const region = document.querySelector("#toast-region");
    region.append(item);
    window.setTimeout(() => item.remove(), 3300);
  }

  function pageHeader(eyebrow, title, description, actions = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
  }

  function chartSVG() {
    const pointsByPeriod = {
      "1W": [49, 58, 54, 67, 62, 74, 67, 83, 77, 91, 84, 96],
      "1M": [39, 48, 44, 59, 53, 64, 58, 72, 67, 78, 73, 92],
      "1Y": [31, 38, 35, 47, 44, 57, 51, 66, 60, 77, 69, 90],
      ALL: [22, 30, 27, 39, 36, 50, 47, 61, 55, 70, 68, 94]
    };
    const values = pointsByPeriod[state.period] || pointsByPeriod["1M"];
    const points = values.map((value, index) => `${(index / (values.length - 1)) * 1000},${135 - value * 1.22}`).join(" ");
    return `<svg class="chart-svg" viewBox="0 0 1000 150" preserveAspectRatio="none" role="img" aria-label="Combined cash and crypto portfolio history">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#8eaa6c" stop-opacity=".22"/><stop offset="100%" stop-color="#8eaa6c" stop-opacity="0"/></linearGradient></defs>
      <line class="chart-grid" x1="0" y1="24" x2="1000" y2="24"/><line class="chart-grid" x1="0" y1="64" x2="1000" y2="64"/><line class="chart-grid" x1="0" y1="104" x2="1000" y2="104"/>
      <polygon class="chart-area" points="0,145 ${points} 1000,145"/><polyline class="chart-line" points="${points}"/>
      <circle class="chart-dot" cx="1000" cy="${135 - values[values.length - 1] * 1.22}" r="4"/>
    </svg>`;
  }

  function periodLabels() {
    if (state.period === "1W") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
    if (state.period === "1Y") return ["Nov", "Jan", "Mar", "May", "Jul", "Sep", "Today"];
    if (state.period === "ALL") return ["2021", "2022", "2023", "2024", "2025", "2026", "Today"];
    return ["Sep 06", "Sep 11", "Sep 16", "Sep 21", "Sep 26", "Oct 01", "Today"];
  }

  function assetMark(asset) {
    return `<span class="asset-mark ${safe(asset.tone)}">${safe(asset.mark)}</span>`;
  }

  function accountCards(compact = false) {
    return state.accounts.map((account) => `<article class="card account-card">
      <div class="account-top"><span class="bank-mark ${safe(account.tone || "")}">${safe(account.institution.slice(0, 1))}</span><span class="account-type">${safe(account.type)}</span></div>
      <h3>${safe(account.name)}</h3><p>${safe(account.institution)} ···· ${safe(account.mask)}</p>
      <div class="account-balance">${hiddenMoney(account.balance)}</div>
      <div class="account-actions"><span>${compact ? "Available balance" : "Available to spend"}</span><button class="text-button" data-action="account-menu" data-account="${safe(account.id)}">Manage ···</button></div>
    </article>`).join("");
  }

  function holdingCards() {
    return state.assets.map((asset) => {
      const value = asset.amount * asset.price;
      return `<article class="card holding-card">
        <div class="holding-top">${assetMark(asset)}<div><div class="holding-name">${safe(asset.name)}</div><div class="holding-symbol">${safe(asset.symbol)}</div></div></div>
        <div class="holding-price">${hiddenMoney(value)}</div>
        <div class="holding-bottom"><span>${state.hiddenBalance ? "•••• " + asset.symbol : `${number(asset.amount)} ${safe(asset.symbol)}`}</span><span class="holding-change ${asset.change >= 0 ? "positive" : "negative"}">${asset.change >= 0 ? "+" : ""}${asset.change.toFixed(2)}%</span></div>
      </article>`;
    }).join("");
  }

  function transactionRows(items) {
    if (!items.length) return `<div class="empty-state"><strong>No activity found</strong><p>Try changing your search or filters.</p></div>`;
    return items.map((item) => {
      const label = item.kind === "crypto" ? "Digital assets" : (accountFor(item.account)?.name || "Bank account");
      return `<div class="transaction-row">
        <span class="merchant-mark ${safe(item.tone || "")}">${safe(item.symbol || item.name.slice(0, 1))}</span>
        <span class="transaction-copy"><strong>${safe(item.name)}</strong><small>${safe(item.category)} · ${safe(formatDate(item.date))}</small></span>
        <span class="tx-kind">${safe(label)}</span><span class="tx-date">${safe(formatDate(item.date, true))}</span>
        <span class="tx-amount ${item.amount > 0 ? "positive" : ""}">${state.hiddenBalance ? "••••••" : `${item.amount > 0 ? "+" : "−"}${money(Math.abs(item.amount))}`}</span>
      </div>`;
    }).join("");
  }

  function overviewPage() {
    const total = netWorth();
    const cash = fiatTotal();
    const crypto = cryptoTotal();
    const monthlyIncome = state.transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const tx = state.transactions.slice(0, 5);
    const cashPercent = total ? cash / total * 100 : 0;
    return `<div class="page-wrap">
      ${pageHeader(new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase(), `Good morning, ${safe(state.user.first)} <span aria-hidden="true">✳</span>`, "Your whole financial life, working together.", '<button class="button button-light" data-action="export">⇩ Export</button><button class="button button-primary" data-action="transfer">↗ Send money</button>')}
      <section class="portfolio-banner">
        <div class="portfolio-main"><div class="banner-topline">TOTAL PORTFOLIO <span class="live-pill"><i></i> LIVE DEMO</span></div>
          <div class="portfolio-title"><h1>${hiddenMoney(total)}</h1><button class="visibility-toggle" data-action="toggle-balance" aria-label="Toggle balance visibility">${state.hiddenBalance ? "◉" : "◎"}</button></div>
          <div class="banner-sub">Across your bank accounts and crypto wallets</div><div class="portfolio-change">↗ 8.4% <small>+$2,854.62 this month</small></div>
          <div class="banner-actions"><button class="button button-lime" data-action="buy">＋ Buy crypto</button><button class="button button-light" data-action="deposit">↓ Add money</button><button class="button button-light" data-action="transfer">↗ Transfer</button></div>
        </div>
        <div class="portfolio-side"><div class="portfolio-side-label">PORTFOLIO MIX</div>
          <div class="allocation-row"><span class="allocation-name"><i></i> Bank accounts</span><span class="allocation-value">${hiddenMoney(cash)}</span><div class="allocation-track"><span style="width:${cashPercent.toFixed(1)}%"></span></div></div>
          <div class="allocation-row crypto-alloc"><span class="allocation-name crypto-alloc"><i></i> Crypto assets</span><span class="allocation-value">${hiddenMoney(crypto)}</span><div class="allocation-track"><span style="width:${(100 - cashPercent).toFixed(1)}%"></span></div></div>
          <div class="allocation-foot"><span>${state.accounts.length} linked bank accounts</span><span>${state.assets.length} assets</span></div>
        </div>
      </section>
      <section class="stat-grid">
        <article class="card stat-card"><div class="stat-label">BANK BALANCE <span class="stat-glyph">▣</span></div><div class="stat-value">${hiddenMoney(cash)}</div><div class="stat-foot"><span class="trend-up">↗ 4.8%</span> vs. last month</div></article>
        <article class="card stat-card"><div class="stat-label">CRYPTO PORTFOLIO <span class="stat-glyph blue">◈</span></div><div class="stat-value">${hiddenMoney(crypto)}</div><div class="stat-foot"><span class="trend-up">↗ 12.6%</span> vs. last month</div></article>
        <article class="card stat-card"><div class="stat-label">MONTHLY INCOME <span class="stat-glyph">↙</span></div><div class="stat-value">${hiddenMoney(monthlyIncome)}</div><div class="stat-foot">Bank income and crypto rewards</div></article>
        <article class="card stat-card"><div class="stat-label">MONTHLY SPENDING <span class="stat-glyph purple">↗</span></div><div class="stat-value">${hiddenMoney(Math.abs(state.transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0)))}</div><div class="stat-foot"><span class="trend-down">↘ 3.1%</span> vs. last month</div></article>
      </section>
      <section class="dashboard-grid">
        <article class="panel"><div class="panel-heading"><div><h2>Your net worth</h2><p>Banking + digital assets, all in one view</p></div><button class="subtle-link" data-page-link="analytics">Full report ↗</button></div>
          <div class="chart-value">${hiddenMoney(total)} <span>↗ 8.4%</span></div><div class="chart-caption">Portfolio value over time</div>${chartSVG()}
          <div class="chart-bottom"><div class="chart-xlabels">${periodLabels().map((label) => `<span>${label}</span>`).join("")}</div><div class="periods">${["1W", "1M", "1Y", "ALL"].map((period) => `<button class="${state.period === period ? "selected" : ""}" data-period="${period}">${period}</button>`).join("")}</div></div>
        </article>
        <article class="panel"><div class="panel-heading"><div><h2>Accounts & wallets</h2><p>Balances in one place</p></div><button class="subtle-link" data-page-link="accounts">View all ↗</button></div>
          <div class="account-mini-list">${state.accounts.slice(0, 2).map((account) => `<div class="account-mini"><span class="bank-mark ${safe(account.tone || "")}">${safe(account.institution.slice(0, 1))}</span><span class="mini-copy"><strong>${safe(account.name)}</strong><small>${safe(account.institution)} ···· ${safe(account.mask)}</small></span><span class="mini-balance">${hiddenMoney(account.balance)}</span></div>`).join("")}
          ${state.assets.slice(0, 2).map((asset) => `<div class="account-mini">${assetMark(asset)}<span class="mini-copy"><strong>${safe(asset.name)}</strong><small>${state.hiddenBalance ? "••••" : number(asset.amount)} ${safe(asset.symbol)}</small></span><span class="mini-balance">${hiddenMoney(asset.amount * asset.price)}</span></div>`).join("")}</div>
        </article>
      </section>
      <div class="section-heading"><h2>Your crypto</h2><button class="subtle-link" data-page-link="crypto">Open crypto hub ↗</button></div>
      <section class="holdings-grid">${holdingCards()}</section>
      <section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Bank transactions and on-chain activity together</p></div><button class="subtle-link" data-page-link="activity">All activity ↗</button></div><div class="transaction-list">${transactionRows(tx)}</div></section>
    </div>`;
  }

  function accountsPage() {
    const fiat = fiatTotal();
    const digital = cryptoTotal();
    return `<div class="page-wrap">${pageHeader("ONE CLEAR PICTURE", "Accounts", "Your bank accounts and self-custody assets, together.", '<button class="button button-light" data-action="link-bank">↗ Link a bank</button><button class="button button-primary" data-action="add-account">＋ Add account</button>')}
      <section class="stat-grid"><article class="card stat-card"><div class="stat-label">TOTAL BALANCE <span class="stat-glyph">◉</span></div><div class="stat-value">${hiddenMoney(fiat + digital)}</div><div class="stat-foot">Across ${state.accounts.length + state.assets.length} accounts & assets</div></article><article class="card stat-card"><div class="stat-label">BANK ACCOUNTS <span class="stat-glyph blue">▣</span></div><div class="stat-value">${hiddenMoney(fiat)}</div><div class="stat-foot">${state.accounts.length} connected accounts</div></article><article class="card stat-card"><div class="stat-label">CRYPTO WALLETS <span class="stat-glyph purple">◈</span></div><div class="stat-value">${hiddenMoney(digital)}</div><div class="stat-foot">${state.assets.length} supported assets</div></article></section>
      <div class="section-heading"><h2>Bank accounts</h2><button class="text-button" data-action="refresh">⟳ Refresh balances</button></div><section class="account-grid">${accountCards()}</section>
      <div class="section-heading"><h2>Digital asset wallets</h2><button class="text-button" data-action="add-wallet">＋ Connect wallet</button></div>
      <section class="account-grid">${state.assets.map((asset) => `<article class="card account-card"><div class="account-top">${assetMark(asset)}<span class="account-type">${safe(asset.network)}</span></div><h3>${safe(asset.name)} wallet</h3><p>${safe(asset.symbol)} · Self-custody demo wallet</p><div class="account-balance">${hiddenMoney(asset.amount * asset.price)}</div><div class="account-actions"><span>${state.hiddenBalance ? "•••• " + asset.symbol : `${number(asset.amount)} ${safe(asset.symbol)}`}</span><button class="text-button" data-action="asset-action" data-symbol="${safe(asset.symbol)}">Manage ···</button></div></article>`).join("")}</section>
      <div class="demo-note"><span>◈</span><span><strong>One platform, two worlds.</strong> Linked bank accounts and crypto values share the same portfolio view. Wallets and balances are simulated for this visual demo.</span></div>
    </div>`;
  }

  function cardsPage() {
    return `<div class="page-wrap">${pageHeader("SPEND WITH CONFIDENCE", "Cards", "Your everyday card controls, right at your fingertips.", '<button class="button button-primary" data-action="new-card">＋ Order a card</button>')}
      <section class="cards-layout"><div><article class="debit-card ${state.frozen ? "frozen" : ""}"><div class="debit-top"><span>BUTTERFIELD BANCO<span style="color:#d9f16a">.</span></span><span class="card-chip"></span></div><div class="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 4829</div><div class="debit-bottom"><span>${safe(`${state.user.first} ${state.user.last}`.toUpperCase())}<strong>DEBIT · EVERYDAY</strong></span><span class="card-network">VISA</span></div></article>
        <div class="section-heading"><h2>Card details</h2><button class="text-button" data-action="card-details">View details ↗</button></div>
        <div class="demo-note"><span>◈</span><span>Virtual and physical cards are visual demo features. Sensitive card numbers are never displayed or stored.</span></div></div>
        <article class="panel"><div class="panel-heading"><div><h2>Card controls</h2><p>Make your card work for you</p></div><span class="account-type">${state.frozen ? "Frozen" : "Active"}</span></div>
          <div class="control-list"><div class="control-row"><span><strong>${state.frozen ? "Unfreeze card" : "Freeze card"}</strong><small>Temporarily stop all card transactions</small></span><button class="switch ${state.frozen ? "on" : ""}" data-action="freeze-card" aria-label="Toggle card freeze" aria-pressed="${state.frozen}"></button></div>
          <div class="control-row"><span><strong>Online purchases</strong><small>Allow card-not-present transactions</small></span><button class="switch ${state.cardControls.online ? "on" : ""}" data-action="toggle-control" data-control="online" aria-label="Toggle online purchases" aria-pressed="${state.cardControls.online}"></button></div>
          <div class="control-row"><span><strong>Contactless payments</strong><small>Tap to pay in person</small></span><button class="switch ${state.cardControls.contactless ? "on" : ""}" data-action="toggle-control" data-control="contactless" aria-label="Toggle contactless payments" aria-pressed="${state.cardControls.contactless}"></button></div>
          <div class="control-row"><span><strong>International payments</strong><small>Use your card while traveling</small></span><button class="switch ${state.cardControls.international ? "on" : ""}" data-action="toggle-control" data-control="international" aria-label="Toggle international payments" aria-pressed="${state.cardControls.international}"></button></div></div>
          <div class="section-heading"><h2>Spending limits</h2><button class="text-button" data-action="card-limits">Edit</button></div><div class="control-row"><span><strong>Daily card limit</strong><small>Resets at midnight · ${safe(state.preferences.currency)}</small></span><strong>${money(state.cardLimit || 5000)}</strong></div>
          <div class="control-row"><span><strong>Replace a card</strong><small>Lost, stolen or damaged?</small></span><button class="text-button" data-action="replace-card">Start ↗</button></div>
        </article></section>
    </div>`;
  }

  function paymentsPage() {
    return `<div class="page-wrap">${pageHeader("MOVE MONEY YOUR WAY", "Payments", "Send, request, top up, or move value between cash and crypto.", "")}
      <section class="payments-grid">
        <article class="card payment-tile"><span class="payment-icon">↗</span><h3>Send money</h3><p>Pay a person or move money between your bank accounts.</p><button class="button button-primary button-small" data-action="transfer">Make a transfer</button></article>
        <article class="card payment-tile"><span class="payment-icon blue">↙</span><h3>Request money</h3><p>Create a payment request and share it with someone.</p><button class="button button-light button-small" data-action="request">Create a request</button></article>
        <article class="card payment-tile"><span class="payment-icon purple">＋</span><h3>Add money</h3><p>Top up your demo checking account instantly.</p><button class="button button-light button-small" data-action="deposit">Add funds</button></article>
      </section>
      <section class="panel"><div class="panel-heading"><div><h2>Move between cash & crypto</h2><p>Trade at the reference rate shown in this demo</p></div><span class="account-type">No real settlement</span></div>
        <div class="payments-grid"><article class="card payment-tile"><span class="payment-icon">◈</span><h3>Buy crypto</h3><p>Use your bank balance to add a supported digital asset.</p><button class="button button-primary button-small" data-action="buy">Buy crypto</button></article>
        <article class="card payment-tile"><span class="payment-icon blue">⇄</span><h3>Swap assets</h3><p>Exchange one supported asset for another in one view.</p><button class="button button-light button-small" data-action="swap">Preview a swap</button></article>
        <article class="card payment-tile"><span class="payment-icon purple">↗</span><h3>Send crypto</h3><p>Transfer an asset to an external public wallet address.</p><button class="button button-light button-small" data-action="send-crypto">Send crypto</button></article></div>
        <div class="payments-grid"><article class="card payment-tile"><span class="payment-icon blue">↓</span><h3>Receive crypto</h3><p>Record a simulated incoming wallet transfer.</p><button class="button button-light button-small" data-action="receive-crypto">Receive crypto</button></article>
        <article class="card payment-tile"><span class="payment-icon purple">⇣</span><h3>Withdraw to bank</h3><p>Convert a simulated asset value back into cash.</p><button class="button button-light button-small" data-action="withdraw">Withdraw to bank</button></article>
        <article class="card payment-tile"><span class="payment-icon">↓</span><h3>Deposit crypto</h3><p>Record an incoming transfer from an external public wallet.</p><button class="button button-light button-small" data-action="deposit-crypto">Deposit to wallet</button></article></div>
      </section>
      <section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent payments</h2><p>Latest incoming and outgoing activity</p></div><button class="subtle-link" data-page-link="activity">See all ↗</button></div><div class="transaction-list">${transactionRows(state.transactions.slice(0, 5))}</div></section>
    </div>`;
  }

  function activityPage() {
    const kind = state.activityKind;
    const type = state.activityType;
    const needle = state.query.trim().toLowerCase();
    const filtered = state.transactions.filter((item) => {
      const matchesSearch = !needle || `${item.name} ${item.category} ${item.amount} ${item.kind} ${item.symbol}`.toLowerCase().includes(needle);
      const matchesKind = kind === "All" || (kind === "Income" && item.amount > 0) || (kind === "Expenses" && item.amount < 0);
      const matchesType = type === "All" || (type === "Bank" && item.kind === "bank") || (type === "Crypto" && item.kind === "crypto");
      const matchesAccount = !state.accountFilter || state.accountFilter === "All" || item.account === state.accountFilter;
      return matchesSearch && matchesKind && matchesType && matchesAccount;
    });
    const pagesCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.transactionPage = Math.min(state.transactionPage, pagesCount);
    const visible = filtered.slice((state.transactionPage - 1) * state.pageSize, state.transactionPage * state.pageSize);
    return `<div class="page-wrap">${pageHeader("EVERYTHING, IN ONE LEDGER", "Activity", "Search and explore every bank transaction and crypto movement.", '<button class="button button-light" data-action="export">⇩ Export CSV</button>')}
      <section class="panel"><div class="section-toolbar"><div class="filter-tabs">${["All", "Income", "Expenses"].map((value) => `<button data-activity-kind="${value}" class="${kind === value ? "selected" : ""}">${value}</button>`).join("")}</div>
        <div class="toolbar-group"><select class="field-control" id="type-filter" aria-label="Filter by account type"><option ${type === "All" ? "selected" : ""}>All</option><option ${type === "Bank" ? "selected" : ""}>Bank</option><option ${type === "Crypto" ? "selected" : ""}>Crypto</option></select>
        <select class="field-control" id="account-filter" aria-label="Filter by account"><option value="All">All accounts</option>${state.accounts.map((account) => `<option value="${safe(account.id)}" ${state.accountFilter === account.id ? "selected" : ""}>${safe(account.name)}</option>`).join("")}${state.assets.map((asset) => `<option value="${safe(asset.id)}" ${state.accountFilter === asset.id ? "selected" : ""}>${safe(asset.name)} wallet</option>`).join("")}</select></div></div>
        <div class="transaction-list">${transactionRows(visible)}</div><div class="table-summary"><span>${filtered.length} transactions</span><span>Income ${hiddenMoney(filtered.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0))} · Outgoing ${hiddenMoney(Math.abs(filtered.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0)))}</span></div>
        <div class="pagination"><span>Showing ${filtered.length ? (state.transactionPage - 1) * state.pageSize + 1 : 0}–${Math.min(state.transactionPage * state.pageSize, filtered.length)} of ${filtered.length}</span><div class="page-buttons"><button class="page-button" data-action="page" data-page-number="${Math.max(1, state.transactionPage - 1)}" aria-label="Previous page">‹</button>${Array.from({ length: pagesCount }, (_, i) => i + 1).map((page) => `<button class="page-button ${page === state.transactionPage ? "active" : ""}" data-action="page" data-page-number="${page}">${page}</button>`).join("")}<button class="page-button" data-action="page" data-page-number="${Math.min(pagesCount, state.transactionPage + 1)}" aria-label="Next page">›</button></div></div>
      </section></div>`;
  }

  function cryptoPage() {
    return `<div class="page-wrap">${pageHeader("YOUR DIGITAL ASSET HUB", "Crypto", "A simple, transparent view of your crypto next to your everyday money.", '<button class="button button-light" data-action="deposit-crypto">↓ Deposit</button><button class="button button-primary" data-action="buy">＋ Buy crypto</button>')}
      <section class="portfolio-banner"><div class="portfolio-main"><div class="banner-topline">CRYPTO PORTFOLIO <span class="live-pill"><i></i> MARKET OPEN</span></div><div class="portfolio-title"><h1>${hiddenMoney(cryptoTotal())}</h1><button class="visibility-toggle" data-action="toggle-balance" aria-label="Toggle balance visibility">${state.hiddenBalance ? "◉" : "◎"}</button></div><div class="banner-sub">${state.assets.length} assets · Value shown in USD reference rates</div><div class="portfolio-change">↗ 12.6% <small>performance this month</small></div><div class="banner-actions"><button class="button button-lime" data-action="buy">＋ Buy</button><button class="button button-light" data-action="sell">↑ Sell</button><button class="button button-light" data-action="swap">⇄ Swap</button></div></div>
      <div class="portfolio-side"><div class="portfolio-side-label">YOUR ASSET MIX</div>${state.assets.slice(0, 3).map((asset) => `<div class="allocation-row crypto-alloc"><span class="allocation-name crypto-alloc"><i></i> ${safe(asset.name)}</span><span class="allocation-value">${hiddenMoney(asset.amount * asset.price)}</span><div class="allocation-track"><span style="width:${cryptoTotal() ? (asset.amount * asset.price / cryptoTotal() * 100).toFixed(1) : 0}%"></span></div></div>`).join("")}<div class="allocation-foot"><span>Wallet assets</span><span>${safe(state.wallets?.length || 1)} connected</span></div></div></section>
      <section class="crypto-layout"><div class="panel"><div class="panel-heading"><div><h2>Your assets</h2><p>Holdings and indicative market pricing</p></div><div><button class="text-button" data-action="send-crypto">↗ Send crypto</button> <button class="text-button" data-action="receive-crypto">↓ Receive</button> <button class="text-button" data-action="refresh">⟳ Refresh</button></div></div>
        <div class="market-table"><div class="market-head"><span>ASSET</span><span>PRICE</span><span>24H</span><span class="market-value">HOLDINGS</span><span></span></div>
        ${state.assets.map((asset) => `<div class="market-row"><div class="market-asset">${assetMark(asset)}<span><strong>${safe(asset.name)}</strong><small>${safe(asset.symbol)} · ${safe(asset.network)}</small></span></div><span class="market-cell">${money(asset.price, asset.price > 1000)}</span><span class="market-cell ${asset.change >= 0 ? "positive" : "negative"}">${asset.change >= 0 ? "+" : ""}${asset.change.toFixed(2)}%</span><span class="market-cell market-value">${state.hiddenBalance ? "••••" : `${number(asset.amount)} ${safe(asset.symbol)}`}<small>${hiddenMoney(asset.amount * asset.price)}</small></span><span class="market-actions"><button class="button button-light button-small" data-action="buy" data-symbol="${safe(asset.symbol)}">Trade</button></span></div>`).join("")}</div>
        <div class="demo-note"><span>ⓘ</span><span>Prices and performance are sample reference data for a visual simulation. They are not live market quotes.</span></div>
      </div>
      <aside class="crypto-aside"><section class="panel"><div class="panel-heading"><div><h2>Quick actions</h2><p>Your crypto, your call</p></div></div><div class="quick-actions"><button class="quick-action" data-action="buy"><span>＋</span><strong>Buy</strong></button><button class="quick-action" data-action="sell"><span>↑</span><strong>Sell</strong></button><button class="quick-action" data-action="send-crypto"><span>↗</span><strong>Send</strong></button><button class="quick-action" data-action="receive-crypto"><span>↓</span><strong>Receive</strong></button><button class="quick-action" data-action="swap"><span>⇄</span><strong>Swap</strong></button><button class="quick-action" data-action="stake"><span>✳</span><strong>Stake & earn</strong></button><button class="quick-action" data-action="deposit-crypto"><span>↓</span><strong>Deposit</strong></button><button class="quick-action" data-action="withdraw"><span>↗</span><strong>Withdraw to bank</strong></button></div></section>
      <section class="quote-card"><strong>Your assets can work harder.</strong><p>Put eligible crypto to work with flexible staking. Rewards and availability are illustrative in this demo.</p><button class="text-action" data-page-link="earn">Explore Earn ↗</button></section>
      <section class="panel"><div class="panel-heading"><div><h2>Wallets</h2><p>Connected demo wallets</p></div><button class="text-button" data-action="add-wallet">＋</button></div>${(state.wallets || []).map((wallet) => `<div class="account-mini"><span class="bank-mark purple">◈</span><span class="mini-copy"><strong>${safe(wallet.name)}</strong><small>${safe(wallet.network)} · ${safe(wallet.address)}</small></span></div>`).join("")}</section></aside></section>
    </div>`;
  }

  function earnPage() {
    const stakingAsset = assetFor("ETH") || state.assets[0];
    return `<div class="page-wrap">${pageHeader("A LITTLE MORE FROM YOUR CRYPTO", "Earn", "Explore illustrative staking rewards with flexible access.", "")}
      <section class="stat-grid"><article class="card stat-card"><div class="stat-label">TOTAL STAKED <span class="stat-glyph">✳</span></div><div class="stat-value">${hiddenMoney(state.stakedUsd || 0)}</div><div class="stat-foot">Across eligible demo assets</div></article><article class="card stat-card"><div class="stat-label">ESTIMATED REWARDS <span class="stat-glyph blue">↗</span></div><div class="stat-value">${hiddenMoney((state.stakedUsd || 0) * .042 / 12)}</div><div class="stat-foot">Illustrative monthly estimate</div></article><article class="card stat-card"><div class="stat-label">FLEXIBLE ACCESS <span class="stat-glyph purple">◷</span></div><div class="stat-value">Anytime</div><div class="stat-foot">No fixed term in this simulation</div></article></section>
      <div class="section-heading"><h2>Available to earn</h2><span class="account-type">Sample rates</span></div>
      <section class="account-grid">${[
        { name: "Ethereum", symbol: "ETH", mark: "Ξ", rate: "3.8%", tone: "ethereum" },
        { name: "Solana", symbol: "SOL", mark: "◎", rate: "5.2%", tone: "solana" },
        { name: "USD Coin", symbol: "USDC", mark: "$", rate: "4.2%", tone: "stablecoin" }
      ].map((offer) => {
        const held = assetFor(offer.symbol);
        return `<article class="card account-card"><div class="account-top">${assetMark(offer)}<span class="account-type">${offer.rate} est. APY</span></div><h3>${offer.name} rewards</h3><p>${held ? (state.hiddenBalance ? "••••" : `${number(held.amount)} ${offer.symbol} available`) : "No balance held"}</p><div class="account-balance">${held ? hiddenMoney(held.amount * held.price) : "$0.00"}</div><div class="account-actions"><span>Flexible demo staking</span><button class="text-button" data-action="stake" data-symbol="${offer.symbol}">Stake ↗</button></div></article>`;
      }).join("")}</section>
      <section class="panel activity-panel"><div class="panel-heading"><div><h2>How rewards work</h2><p>A transparent, no-surprises experience</p></div></div><div class="insight-card"><strong>Keep control of your assets</strong><p>Staking and APY figures shown here are visual sample data only. No assets are delegated, locked, or transferred. In a live platform, network rules, fees, eligibility, and reward rates would be clearly shown before confirmation.</p></div></section>
    </div>`;
  }

  function analyticsPage() {
    const income = state.transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const outflow = Math.abs(state.transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
    const categories = ["Groceries", "Travel", "Subscriptions", "Transport"].map((name) => ({
      name, value: Math.abs(state.transactions.filter((item) => item.category === name && item.amount < 0).reduce((sum, item) => sum + item.amount, 0))
    })).filter((item) => item.value > 0);
    return `<div class="page-wrap">${pageHeader("THE BIGGER PICTURE", "Analytics", "See your bank cash flow and crypto portfolio side by side.", '<button class="button button-light" data-action="export">⇩ Export report</button>')}
      <section class="stat-grid"><article class="card stat-card"><div class="stat-label">TOTAL INCOME <span class="stat-glyph">↙</span></div><div class="stat-value">${hiddenMoney(income)}</div><div class="stat-foot">Across bank and crypto rewards</div></article><article class="card stat-card"><div class="stat-label">TOTAL OUTFLOW <span class="stat-glyph blue">↗</span></div><div class="stat-value">${hiddenMoney(outflow)}</div><div class="stat-foot">Purchases and crypto buys</div></article><article class="card stat-card"><div class="stat-label">SAVINGS RATE <span class="stat-glyph purple">◌</span></div><div class="stat-value">32.6%</div><div class="stat-foot"><span class="trend-up">↗ 4.4%</span> vs. last month</div></article></section>
      <section class="analytics-grid"><article class="panel"><div class="panel-heading"><div><h2>Net worth history</h2><p>One combined view across your accounts</p></div><span class="account-type">USD</span></div><div class="chart-value">${hiddenMoney(netWorth())} <span>↗ 8.4%</span></div><div class="chart-caption">Combined portfolio value</div>${chartSVG()}<div class="chart-bottom"><div class="chart-xlabels">${periodLabels().map((label) => `<span>${label}</span>`).join("")}</div><div class="periods">${["1W", "1M", "1Y", "ALL"].map((period) => `<button class="${state.period === period ? "selected" : ""}" data-period="${period}">${period}</button>`).join("")}</div></div></article>
        <article class="panel"><div class="panel-heading"><div><h2>Spending by category</h2><p>Bank and card outflows</p></div></div><div class="category-list">${categories.length ? categories.map((item) => `<div class="category-line"><span class="category-label"><i></i>${safe(item.name)}</span><span class="category-amount">${hiddenMoney(item.value)}</span><span class="category-bar"><span style="width:${Math.max(8, item.value / Math.max(...categories.map((part) => part.value)) * 100)}%"></span></span></div>`).join("") : `<div class="empty-state">No outgoing transactions yet.</div>`}</div><div class="insight-card"><strong>A balanced financial picture</strong><p>Your dashboard brings cash and digital assets together. Use activity filters to see each side of your portfolio in detail.</p></div></article>
      </section><section class="panel activity-panel"><div class="panel-heading"><div><h2>Monthly insights</h2><p>Practical context for the bigger picture</p></div></div><div class="payments-grid"><div><span class="trend-up">↗ Savings momentum</span><p class="chart-caption">Your cash and crypto are visible together, giving you one clearer view of progress.</p></div><div><span class="trend-up">◈ Digital assets</span><p class="chart-caption">Crypto positions represent ${state.assets.length} supported assets in this demo.</p></div><div><span class="trend-down">⌁ Stay informed</span><p class="chart-caption">Sample values are illustrative and not financial advice or live prices.</p></div></div></section>
    </div>`;
  }

  function settingsPage() {
    return `<div class="page-wrap">${pageHeader("YOUR ACCOUNT, YOUR WAY", "Settings", "Manage your personal details, security, and preferences.", "")}
      <section class="panel settings-panel"><div class="settings-profile"><span class="avatar">${safe(`${state.user.first[0] || "J"}${state.user.last[0] || "D"}`.toUpperCase())}</span><div class="settings-profile-copy"><h2>${safe(state.user.first)} ${safe(state.user.last)}</h2><p>${safe(state.user.email)}</p></div><button class="button button-light button-small" data-action="edit-profile">Edit profile</button></div>
        <div class="settings-row"><span><strong>Personal information</strong><p>Name, email address, and account profile</p></span><button class="text-button" data-action="edit-profile">Manage ↗</button></div>
        <div class="settings-row"><span><strong>Security & privacy</strong><p>Manage demo sign-in and account security alerts</p></span><button class="text-button" data-action="security">Manage ↗</button></div>
        <div class="settings-row"><span><strong>Notifications</strong><p>Choose the banking and crypto alerts you receive</p></span><button class="text-button" data-action="notification-settings">Manage ↗</button></div>
        <div class="settings-row"><span><strong>App preferences</strong><p>Change display currency and appearance</p></span><button class="text-button" data-action="preferences">Manage ↗</button></div>
        <div class="settings-row"><span><strong>Privacy mode</strong><p>Hide balances across accounts, activity, and holdings</p></span><button class="switch ${state.hiddenBalance ? "on" : ""}" data-action="toggle-balance" aria-label="Toggle privacy mode" aria-pressed="${state.hiddenBalance}"></button></div>
        <div class="settings-row"><span><strong>Sign out</strong><p>End this local demo session</p></span><button class="text-button" data-action="signout">Sign out ↗</button></div>
      </section></div>`;
  }

  function supportPage() {
    const questions = ["How do I connect a bank account?", "How do I buy or sell crypto?", "Can I freeze my debit card?", "How do transfers and deposits work?", "Are the asset prices real-time?"];
    return `<div class="page-wrap">${pageHeader("HERE WHEN YOU NEED US", "Help & support", "Find a quick answer or start a conversation with our team.", "")}
      <section class="card help-card-main"><span class="promo-kicker">BUTTERFIELD BANCO SUPPORT</span><h2>One team for all your money.</h2><p>Get help with bank accounts, payments, cards, crypto, and account security.</p><button class="button button-lime" data-action="support-chat">Start a conversation ↗</button></section>
      <section class="panel" style="max-width:810px"><div class="panel-heading"><div><h2>Popular questions</h2><p>Quick answers to common questions</p></div><label><input class="field-control" id="help-search" placeholder="Search help..." aria-label="Search help articles"></label></div>
      <div id="faq-list">${questions.map((question) => `<details class="faq-item" data-question="${safe(question.toLowerCase())}"><summary>${safe(question)}<span>＋</span></summary><p>${question.includes("real-time") ? "No. Crypto prices and performance are sample reference data for this visual simulation, not real-time quotes." : question.includes("freeze") ? "Open Cards and use the Freeze card control. It changes the simulated card state only." : question.includes("crypto") ? "Open the Crypto hub to explore simulated buy, sell, swap, send, receive, deposit, withdraw, and staking flows." : question.includes("transfers") ? "Open Payments to create a simulated transfer, request, or deposit. No real money moves." : "Open Accounts and choose Link a bank. Enter the name of any bank or credit union; no financial institution is contacted."}</p></details>`).join("")}</div></section>
      <div class="demo-note" style="max-width:810px"><span>ⓘ</span><span><strong>Security first.</strong> This is a front-end prototype only. It does not connect to banks, process payments, custody cryptocurrency, or collect credentials.</span></div>
    </div>`;
  }

  function authPage(signup) {
    return `<div class="page-wrap"><section class="panel" style="max-width:470px;margin:55px auto;padding:26px">
      <span class="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 23 16 5l11 18H5Zm5.4-4h11.2M16 5v18"/></svg></span>
      <div class="eyebrow" style="margin-top:18px">BUTTERFIELD BANCO · DEMO ACCESS</div><h1>${signup ? "Create your account" : "Welcome back"}</h1><p class="chart-caption">Explore one connected view of your bank and crypto portfolio.</p>
      <form class="modal-form" data-form="auth" data-submit-action="auth" data-signup="${signup}">
        ${signup ? '<label class="field-label">First name<input name="first" required autocomplete="given-name" placeholder="Jordan"></label><label class="field-label">Last name<input name="last" required autocomplete="family-name" placeholder="Davis"></label>' : ""}
        <label class="field-label">Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com" value="${signup ? "" : safe(state.user.email)}"></label>
        <label class="field-label">Password<input name="password" type="password" required minlength="6" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="At least 6 characters"></label>
        <button class="button button-primary modal-submit" type="submit">${signup ? "Create demo account" : "Sign in"}</button>
      </form><p class="modal-note" style="margin-top:12px">Demo only. Do not enter a real password. Credentials are not saved or sent.</p>
      <button class="text-action" style="margin-top:14px" data-action="auth-toggle">${signup ? "Already have an account? Sign in" : "New to Butterfield Banco? Create a demo account"}</button>
    </section></div>`;
  }

  const renderers = { overview: overviewPage, accounts: accountsPage, cards: cardsPage, payments: paymentsPage, activity: activityPage, crypto: cryptoPage, earn: earnPage, analytics: analyticsPage, settings: settingsPage, support: supportPage };

  function render() {
    if (!pages[state.page]) state.page = "overview";
    document.body.dataset.theme = state.preferences.appearance || "light";
    document.querySelector("#breadcrumb").textContent = pages[state.page] || "Overview";
    document.querySelector("#year").textContent = new Date().getFullYear();
    document.querySelectorAll(".nav-link").forEach((link) => {
      const active = link.dataset.page === state.page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.querySelector(".nav-count").textContent = String(state.accounts.length + state.assets.length);
    main.innerHTML = state.page === "signin" || state.page === "signup"
      ? authPage(state.page === "signup")
      : (renderers[state.page] || overviewPage)();
    document.title = `${pages[state.page]} — Butterfield Banco`;
    document.querySelector(".brand > span:last-child").innerHTML = `<span>butterfield<span class="brand-dot">.</span></span><small>BANCO</small>`;
    document.querySelector(".profile-copy strong").textContent = `${state.user.first} ${state.user.last}`;
    document.querySelector(".top-avatar").textContent = `${state.user.first[0] || "J"}${state.user.last[0] || "D"}`.toUpperCase();
    document.querySelector(".footer").firstElementChild.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> Butterfield Banco`;
    document.querySelector("#sidebar").classList.remove("sidebar-open");
    if (location.hash.slice(1) !== state.page) history.replaceState(null, "", `#${state.page}`);
  }

  function openModal(title, description, formMarkup, submitAction, submitLabel = "Continue", symbol = "◈") {
    modalContent.innerHTML = `<span class="modal-symbol">${symbol}</span><div class="eyebrow">BUTTERFIELD BANCO · DEMO</div><h2 id="modal-title">${title}</h2><p class="modal-description">${description}</p><form class="modal-form" data-submit-action="${submitAction}">${formMarkup}<button class="button button-primary modal-submit" type="submit">${submitLabel} ↗</button><p class="modal-note">Simulation only — no real money, bank connection, or crypto transaction occurs.</p></form>`;
    backdrop.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => modalContent.querySelector("input,select")?.focus(), 20);
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function amountField(label = "Amount in USD") {
    return `<label class="field-label">${label}<div class="amount-input"><span>$</span><input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"></div></label>`;
  }

  function actionFor(action, symbol = "", id = "") {
    const sourceSelect = `<label class="field-label">From account<select name="account" required>${accountOptions()}</select></label>`;
    if (action === "transfer") return openModal("Send money", "Send a simulated payment from one of your bank accounts.", `<label class="field-label">Recipient<input name="recipient" required placeholder="Name, email or account number"></label><label class="field-label">Email for receipt (optional)<input name="email" type="email" placeholder="recipient@example.com"></label>${amountField()}${sourceSelect}<label class="field-label">Note (optional)<input name="note" maxlength="80" placeholder="What is it for?"></label>`, "transfer", "Review transfer", "↗");
    if (action === "deposit") return openModal("Add money", "Add demo funds to one of your bank accounts.", amountField() + `<label class="field-label">To account<select name="account" required>${accountOptions()}</select></label><label class="field-label">Funding source<select name="source"><option>Linked external account</option><option>Debit card ending 0291</option></select></label>`, "deposit", "Add demo funds", "↓");
    if (action === "request") return openModal("Request money", "Create a request to share with someone you know.", `<label class="field-label">Request from<input name="recipient" required placeholder="Name, email or phone"></label>${amountField()}<label class="field-label">Message (optional)<input name="note" maxlength="80" placeholder="Add a note"></label>`, "request", "Create request", "↙");
    if (action === "link-bank") return openModal("Link a bank", "Enter any bank or financial institution to add a simulated account. No real institution is contacted.", `<label class="field-label">Financial institution<input name="institution" required maxlength="60" placeholder="Enter any bank or credit union"></label><label class="field-label">Account name<input name="name" required maxlength="40" placeholder="e.g. Everyday checking"></label><label class="field-label">Account type<select name="type"><option>Checking</option><option>Savings</option><option>Business checking</option><option>Credit card</option><option>Other</option></select></label><p class="modal-note">This demo accepts any institution name; actual secure linking is not enabled.</p>`, "link-bank", "Connect demo account", "▣");
    if (action === "add-account") return openModal("Create an account", "Create a local demo account for your combined dashboard.", `<label class="field-label">Account name<input name="name" required maxlength="40" placeholder="e.g. Travel savings"></label><label class="field-label">Account type<select name="type"><option>Checking</option><option>Savings</option><option>Business checking</option><option>Credit card</option><option>Other</option></select></label><label class="field-label">Institution<input name="institution" required value="Butterfield Banco"></label>`, "add-account", "Create account", "＋");
    if (action === "buy" || action === "sell") {
      const selected = assetFor(symbol) ? symbol : state.assets[0]?.symbol;
      return openModal(action === "buy" ? "Buy crypto" : "Sell crypto", action === "buy" ? "Buy a supported asset using your demo bank balance." : "Sell an asset back into your demo bank balance.", `<label class="field-label">Asset<select name="symbol">${assetOptions(selected)}</select></label>${amountField(action === "buy" ? "Spend (USD)" : "Sell value (USD)")}${action === "buy" ? sourceSelect : `<label class="field-label">Deposit to<select name="account">${accountOptions()}</select></label>`}`, action, action === "buy" ? "Review purchase" : "Review sale", action === "buy" ? "＋" : "↑");
    }
    if (action === "swap") return openModal("Swap crypto", "Preview a demo asset swap at the current sample reference prices.", `${amountField("Swap value (USD)")}<label class="field-label">From asset<select name="from">${assetOptions()}</select></label><label class="field-label">To asset<select name="to">${assetOptions(state.assets[1]?.symbol)}</select></label>`, "swap", "Preview swap", "⇄");
    if (action === "send-crypto" || action === "receive-crypto" || action === "deposit-crypto") {
      const sending = action === "send-crypto";
      const submitAction = sending ? "send-crypto" : "receive-crypto";
      return openModal(sending ? "Send crypto" : action === "deposit-crypto" ? "Deposit crypto" : "Receive crypto", sending ? "Send a simulated asset amount to a public wallet address." : "Add a simulated incoming transfer from an external wallet.", `<label class="field-label">Asset<select name="symbol">${assetOptions(assetFor(symbol) ? symbol : undefined)}</select></label>${amountField(sending ? "Send value (USD)" : "Receive value (USD)")}${sending ? '<label class="field-label">Destination public wallet address<input name="address" required minlength="8" maxlength="120" placeholder="Paste a public address — never a private key"></label>' : '<label class="field-label">Sender public address (optional)<input name="address" maxlength="120" placeholder="Public address only"></label>'}<label class="field-label">Network<select name="network">${[...new Set(state.assets.map((asset) => asset.network))].map((network) => `<option>${safe(network)}</option>`).join("")}</select></label>`, submitAction, sending ? "Review crypto transfer" : "Receive demo crypto", sending ? "↗" : "↓");
    }
    if (action === "stake") {
      const selected = assetFor(symbol) ? symbol : (assetFor("ETH") ? "ETH" : state.assets[0]?.symbol);
      return openModal("Stake & earn", "Choose a supported asset to preview flexible demo staking.", `<label class="field-label">Asset<select name="symbol">${assetOptions(selected)}</select></label>${amountField("Stake value (USD)")}<p class="modal-note">Illustrative reward rates only; no assets are locked or delegated.</p>`, "stake", "Stake in demo", "✳");
    }
    if (action === "withdraw") {
      return openModal("Withdraw crypto", "Convert a simulated asset value back into your bank balance.", `<label class="field-label">Asset<select name="symbol">${assetOptions(assetFor("USDC") ? "USDC" : undefined)}</select></label>${amountField("Amount in USD")}<label class="field-label">To bank account<select name="account">${accountOptions()}</select></label>`, action, "Withdraw to bank", "↗");
    }
    if (action === "add-wallet") return openModal("Connect a wallet", "Add a named wallet to your visual demo. Never enter a real seed phrase or private key.", `<label class="field-label">Wallet name<input name="name" required maxlength="40" placeholder="e.g. Hardware wallet"></label><label class="field-label">Network<select name="network"><option>Multi-chain</option><option>Ethereum</option><option>Bitcoin</option><option>Solana</option></select></label><label class="field-label">Public address (optional)<input name="address" maxlength="42" placeholder="Public address only"></label>`, "add-wallet", "Connect demo wallet", "◈");
    if (action === "new-card") return openModal("Order a new card", "Request a new demo debit card. No card will be shipped.", `<label class="field-label">Card name<input name="name" required placeholder="e.g. Everyday card"></label><label class="field-label">Delivery address<input name="address" required placeholder="Street address"></label>`, "new-card", "Place demo order", "▰");
    if (action === "edit-profile") return openModal("Edit profile", "Update the profile shown in your local demo.", `<label class="field-label">First name<input name="first" required value="${safe(state.user.first)}"></label><label class="field-label">Last name<input name="last" required value="${safe(state.user.last)}"></label><label class="field-label">Email<input name="email" type="email" required value="${safe(state.user.email)}"></label>`, "edit-profile", "Save profile", "JD");
    if (action === "account-menu") {
      const account = accountFor(id);
      if (!account) return toast("That account is no longer available.");
      return openModal("Edit account", "Change the name, institution, and account type shown in your dashboard.", `<input type="hidden" name="id" value="${safe(account.id)}"><label class="field-label">Account name<input name="name" required maxlength="40" value="${safe(account.name)}"></label><label class="field-label">Institution<input name="institution" required maxlength="60" value="${safe(account.institution)}"></label><label class="field-label">Account type<select name="type">${["Checking", "Savings", "Business checking", "Credit card", "Other"].map((type) => `<option ${account.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>`, "edit-account", "Save account", "▣");
    }
    if (action === "asset-action") {
      const asset = assetFor(symbol);
      if (!asset) return toast("That wallet is no longer available.");
      return openModal("Edit wallet", "Change the display name or network for this demo wallet.", `<input type="hidden" name="symbol" value="${safe(asset.symbol)}"><label class="field-label">Wallet display name<input name="name" required maxlength="40" value="${safe(asset.name)}"></label><label class="field-label">Network<input name="network" required maxlength="40" value="${safe(asset.network)}"></label>`, "edit-asset", "Save wallet", asset.mark);
    }
    if (action === "card-limits") return openModal("Edit spending limit", "Set a new daily limit for your simulated debit card.", `<label class="field-label">Daily card limit (${safe(state.preferences.currency)})<div class="amount-input"><span>${safe(state.preferences.currency)}</span><input name="limit" type="number" min="1" step="1" required value="${Number((state.cardLimit || 5000) * (fxRates[state.preferences.currency] || 1)).toFixed(2)}"></div></label>`, "card-limit", "Save limit", "▰");
    if (action === "preferences") return openModal("App preferences", "Choose how balances are presented in this demo. Non-USD currency values use illustrative conversion rates.", `<label class="field-label">Display currency<select name="currency">${["USD", "EUR", "GBP", "CAD"].map((currency) => `<option ${state.preferences.currency === currency ? "selected" : ""}>${currency}</option>`).join("")}</select></label><label class="field-label">Appearance<select name="appearance"><option value="light" ${state.preferences.appearance === "light" ? "selected" : ""}>Light</option><option value="dark" ${state.preferences.appearance === "dark" ? "selected" : ""}>Dark</option></select></label>`, "preferences", "Save preferences", "⚙");
    if (action === "security") return openModal("Security & privacy", "Manage the security options for this local demo profile.", `<label class="check-row"><input type="checkbox" name="twoFactor" ${state.preferences.twoFactor ? "checked" : ""}><span><strong>Two-step sign-in</strong><small>Require a second step in a connected product</small></span></label><label class="check-row"><input type="checkbox" name="securityAlerts" ${state.preferences.securityAlerts ? "checked" : ""}><span><strong>Security alerts</strong><small>Notify me about sign-ins and profile changes</small></span></label>`, "security", "Save security settings", "◇");
    if (action === "notification-settings") return openModal("Notification preferences", "Choose which simulated activity alerts you want to see.", `<label class="check-row"><input type="checkbox" name="transferAlerts" ${state.preferences.transferAlerts ? "checked" : ""}><span><strong>Banking and transfer alerts</strong><small>Payments, deposits, and card activity</small></span></label><label class="check-row"><input type="checkbox" name="cryptoAlerts" ${state.preferences.cryptoAlerts ? "checked" : ""}><span><strong>Crypto activity alerts</strong><small>Trades, transfers, and staking activity</small></span></label>`, "notification-settings", "Save notifications", "♧");
    if (action === "security" || action === "notification-settings" || action === "preferences" || action === "card-details" || action === "card-limits" || action === "replace-card" || action === "account-menu" || action === "asset-action") {
      const messages = {
        security: ["Security & privacy", "Biometrics, trusted devices, sign-in alerts, and multi-factor authentication would be managed here in a connected product."],
        "notification-settings": ["Notification preferences", "Choose alerts for transfers, card purchases, crypto price moves, and security activity."],
        preferences: ["App preferences", "Your current display currency is USD. Language and appearance controls are part of this visual demo."],
        "card-details": ["Protected card details", "Your demo card ends in 4829. Full card credentials are never shown or stored."],
        "card-limits": ["Card spending limits", "Your demo daily limit is $5,000. This setting does not affect real transactions."],
        "replace-card": ["Replace a card", "Your demo replacement flow is ready. No physical card will be ordered."],
        "account-menu": ["Account options", "Account details and linked-institution controls are simulated in this prototype."],
        "asset-action": ["Wallet options", "Wallet addresses and on-chain activity are not connected in this demo."]
      };
      const [title, message] = messages[action] || ["Butterfield Banco", "This demo control is ready to explore."];
      return openModal(title, message, `<p class="modal-note">This is a front-end visual prototype. No external service is contacted.</p>`, "info", "Got it", "◈");
    }
    if (action === "support-chat") return toast("Support conversation started in this demo. No message was sent.");
    if (action === "learn") return toast("Explore the combined banking and crypto demo from the navigation.");
    if (action === "profile") return toast(`Signed in as ${state.user.first} ${state.user.last}.`);
    if (action === "notifications") return toast("You're all caught up on banking and crypto notifications.");
    if (action === "refresh") return toast("Your demo account and reference asset balances are up to date.");
  }

  function addTransaction(name, category, amount, kind, account, symbol, tone) {
    state.transactions.unshift({
      id: `tx-${Date.now()}`, name, category, amount, kind, account, symbol, tone,
      status: "Completed", date: new Date().toISOString()
    });
  }

  function submitDemoForm(form) {
    const data = new FormData(form);
    const action = form.dataset.submitAction;
    if (action === "info") return closeModal();
    if (action === "auth") {
      state.user.email = String(data.get("email")).trim();
      if (form.dataset.signup === "true") {
        state.user.first = String(data.get("first")).trim();
        state.user.last = String(data.get("last")).trim();
      }
      persist();
      state.page = "overview";
      history.replaceState(null, "", "#overview");
      render();
      toast("Welcome to Butterfield Banco's demo.");
      return;
    }
    if (action === "link-bank") {
      const institution = String(data.get("institution")).trim();
      const name = String(data.get("name")).trim();
      if (!institution || !name) { toast("Enter an institution and account name."); return; }
      state.accounts.push({ id: `linked-${Date.now()}`, name, institution, type: String(data.get("type")), mask: String(Math.floor(1000 + Math.random() * 9000)), balance: 0, tone: "blue" });
      persist(); closeModal(); render(); toast(`${institution} demo account connected.`); return;
    }
    if (action === "add-account") {
      const name = String(data.get("name")).trim();
      const institution = String(data.get("institution")).trim();
      state.accounts.push({ id: `account-${Date.now()}`, name, institution, type: String(data.get("type")), mask: String(Math.floor(1000 + Math.random() * 9000)), balance: 0, tone: "purple" });
      persist(); closeModal(); render(); toast(`${name} created.`); return;
    }
    if (action === "add-wallet") {
      state.wallets = state.wallets || [];
      state.wallets.push({ name: String(data.get("name")).trim(), network: String(data.get("network")), address: String(data.get("address") || "").trim() || "Address not connected" });
      persist(); closeModal(); render(); toast("Demo wallet added."); return;
    }
    if (action === "new-card") { closeModal(); toast("Your demo card order is ready. No card will be shipped."); return; }
    if (action === "edit-profile") {
      state.user.first = String(data.get("first")).trim();
      state.user.last = String(data.get("last")).trim();
      state.user.email = String(data.get("email")).trim();
      persist(); closeModal(); render(); toast("Profile updated."); return;
    }
    if (action === "edit-account") {
      const account = accountFor(String(data.get("id")));
      if (!account) { toast("That account is no longer available."); return; }
      account.name = String(data.get("name")).trim();
      account.institution = String(data.get("institution")).trim();
      account.type = String(data.get("type"));
      persist(); closeModal(); render(); toast("Account details updated."); return;
    }
    if (action === "edit-asset") {
      const asset = assetFor(String(data.get("symbol")));
      if (!asset) { toast("That wallet is no longer available."); return; }
      asset.name = String(data.get("name")).trim();
      asset.network = String(data.get("network")).trim();
      persist(); closeModal(); render(); toast("Wallet details updated."); return;
    }
    if (action === "card-limit") {
      const limit = Number(data.get("limit"));
      if (!Number.isFinite(limit) || limit < 1) { toast("Enter a daily limit greater than zero."); return; }
      state.cardLimit = limit / (fxRates[state.preferences.currency] || 1);
      persist(); closeModal(); render(); toast("Daily card limit updated."); return;
    }
    if (action === "preferences") {
      state.preferences.currency = String(data.get("currency"));
      state.preferences.appearance = String(data.get("appearance"));
      persist(); closeModal(); render(); toast("App preferences updated."); return;
    }
    if (action === "security" || action === "notification-settings") {
      const checkboxValue = (name) => Boolean(form.elements.namedItem(name)?.checked);
      if (action === "security") {
        state.preferences.twoFactor = checkboxValue("twoFactor");
        state.preferences.securityAlerts = checkboxValue("securityAlerts");
      } else {
        state.preferences.transferAlerts = checkboxValue("transferAlerts");
        state.preferences.cryptoAlerts = checkboxValue("cryptoAlerts");
      }
      persist(); closeModal(); render(); toast(action === "security" ? "Security preferences saved." : "Notification preferences saved."); return;
    }
    if (action === "request") { closeModal(); toast(`Payment request created for ${money(Number(data.get("amount")))}.`); return; }
    if (action === "transfer") {
      const amount = Number(data.get("amount"));
      const account = accountFor(String(data.get("account")));
      const recipient = String(data.get("recipient") || "").trim();
      if (!Number.isFinite(amount) || amount <= 0 || !account || amount > account.balance) { toast("Choose an amount within the available account balance."); return; }
      if (!recipient) { toast("Enter a recipient before continuing."); return; }
      const note = String(data.get("note") || "").trim();
      const email = String(data.get("email") || "").trim();
      return openModal("Review transfer", `You're about to send ${money(amount)} to ${safe(recipient)} from ${safe(account.name)}.`, `<div class="insight-card"><strong>${safe(recipient)}</strong><p>${safe(account.institution)} ···· ${safe(account.mask)}${email ? ` · Receipt: ${safe(email)}` : ""}<br>${note ? safe(note) : "No note added"}</p></div><input type="hidden" name="amount" value="${amount}"><input type="hidden" name="account" value="${safe(account.id)}"><input type="hidden" name="recipient" value="${safe(recipient)}">`, "confirm-transfer", "Confirm demo transfer", "↗");
    }
    if (action === "send-crypto") {
      const amount = Number(data.get("amount"));
      const asset = assetFor(String(data.get("symbol")));
      const address = String(data.get("address") || "").trim();
      if (!Number.isFinite(amount) || amount <= 0 || !asset || amount > asset.amount * asset.price) { toast("Choose an amount within your available wallet balance."); return; }
      if (address.length < 8) { toast("Enter a valid public wallet address."); return; }
      return openModal("Review crypto transfer", `Send ${money(amount)} in ${safe(asset.symbol)} to this public address.`, `<div class="insight-card"><strong>${safe(asset.name)} · ${safe(data.get("network"))}</strong><p>${safe(address)}</p></div><input type="hidden" name="amount" value="${amount}"><input type="hidden" name="symbol" value="${safe(asset.symbol)}"><input type="hidden" name="address" value="${safe(address)}"><input type="hidden" name="network" value="${safe(data.get("network"))}">`, "confirm-crypto-send", "Confirm demo transfer", "↗");
    }
    if (action === "buy" || action === "sell") {
      const asset = assetFor(String(data.get("symbol")));
      const account = accountFor(String(data.get("account")));
      const amount = Number(data.get("amount"));
      if (!Number.isFinite(amount) || amount <= 0 || !asset) { toast("Choose a supported asset and enter an amount greater than zero."); return; }
      if (action === "buy" && (!account || amount > account.balance)) { toast("There aren't enough available funds in that account."); return; }
      if (action === "sell" && amount > asset.amount * asset.price) { toast("The selected wallet doesn't have enough available value."); return; }
      const flow = action === "buy" ? "confirm-buy" : "confirm-sell";
      const description = action === "buy"
        ? `Buy ${money(amount)} of ${safe(asset.name)} using ${safe(account.name)}.`
        : `Sell ${money(amount)} of ${safe(asset.name)} into ${safe(account?.name || "your bank account")}.`;
      return openModal(action === "buy" ? "Review crypto purchase" : "Review crypto sale", description, `<div class="insight-card"><strong>${safe(asset.name)} · ${safe(asset.symbol)}</strong><p>Reference price: ${money(asset.price)} per ${safe(asset.symbol)} · Estimated amount: ${number(amount / asset.price)} ${safe(asset.symbol)}</p></div><input type="hidden" name="amount" value="${amount}"><input type="hidden" name="symbol" value="${safe(asset.symbol)}"><input type="hidden" name="account" value="${safe(account?.id || "")}">`, flow, action === "buy" ? "Confirm demo purchase" : "Confirm demo sale", action === "buy" ? "＋" : "↑");
    }
    if (action === "swap") {
      const amount = Number(data.get("amount"));
      const from = assetFor(String(data.get("from")));
      const to = assetFor(String(data.get("to")));
      if (!Number.isFinite(amount) || amount <= 0 || !from || !to || from === to || amount > from.amount * from.price) { toast("Choose two different assets and an amount within your available balance."); return; }
      return openModal("Review crypto swap", `Swap ${money(amount)} of ${safe(from.name)} for ${safe(to.name)} at the displayed demo reference rates.`, `<input type="hidden" name="amount" value="${amount}"><input type="hidden" name="from" value="${safe(from.symbol)}"><input type="hidden" name="to" value="${safe(to.symbol)}">`, "confirm-swap", "Confirm demo swap", "⇄");
    }
    const amount = Number(data.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) { toast("Enter an amount greater than zero."); return; }
    const account = accountFor(String(data.get("account")));
    if (action === "confirm-transfer" || action === "confirm-crypto-send" || action === "receive-crypto" || action === "deposit" || action === "confirm-buy" || action === "confirm-sell" || action === "confirm-swap" || action === "stake" || action === "withdraw") {
      const asset = assetFor(String(data.get("symbol")));
      if ((action === "confirm-buy" || action === "confirm-sell" || action === "stake" || action === "withdraw" || action === "deposit-crypto" || action === "confirm-crypto-send" || action === "receive-crypto") && !asset) { toast("Choose a supported asset."); return; }
      if (action === "confirm-transfer" && (!account || amount > account.balance)) { toast("Choose an amount within the available account balance."); return; }
      if (action === "deposit" && !account) { toast("Choose an account to receive your demo funds."); return; }
      if (action === "confirm-buy" && (!account || amount > account.balance)) { toast("There aren't enough available funds in that account."); return; }
      if ((action === "confirm-sell" || action === "withdraw") && (!asset || amount > asset.amount * asset.price)) { toast("The selected wallet doesn't have enough available value."); return; }
      if (action === "confirm-crypto-send" && (!asset || amount > asset.amount * asset.price)) { toast("Choose an amount within your available wallet balance."); return; }
      if (action === "confirm-swap" && (!assetFor(String(data.get("from"))) || !assetFor(String(data.get("to"))) || data.get("from") === data.get("to"))) { toast("Choose two different assets to swap."); return; }
      if (action === "confirm-transfer") {
        account.balance -= amount;
        addTransaction(`Transfer to ${String(data.get("recipient")).trim()}`, "Transfer", -amount, "bank", account.id, "↗", "lavender");
      } else if (action === "confirm-crypto-send") {
        asset.amount -= amount / asset.price;
        addTransaction(`Sent ${asset.symbol} to ${String(data.get("address")).trim()}`, "Crypto transfer", -amount, "crypto", asset.id, asset.mark, asset.tone);
      } else if (action === "receive-crypto") {
        asset.amount += amount / asset.price;
        addTransaction(`Received ${asset.symbol}`, "Crypto transfer", amount, "crypto", asset.id, asset.mark, asset.tone);
      } else if (action === "deposit") {
        account.balance += amount;
        addTransaction("Demo account top-up", "Income", amount, "bank", account.id, "$", "mint");
      } else if (action === "confirm-buy") {
        account.balance -= amount;
        asset.amount += amount / asset.price;
        addTransaction(`Buy ${asset.symbol}`, "Crypto trade", -amount, "crypto", asset.id, asset.mark, asset.tone);
      } else if (action === "confirm-sell" || action === "withdraw") {
        account.balance += amount;
        asset.amount -= amount / asset.price;
        addTransaction(`${action === "confirm-sell" ? "Sell" : "Withdraw"} ${asset.symbol}`, action === "confirm-sell" ? "Crypto trade" : "Transfer", amount, "crypto", asset.id, asset.mark, asset.tone);
      } else if (action === "confirm-swap") {
        const from = assetFor(String(data.get("from")));
        const to = assetFor(String(data.get("to")));
        if (!from || !to || amount > from.amount * from.price) { toast("Choose a swap value within your available balance."); return; }
        from.amount -= amount / from.price;
        to.amount += amount / to.price;
        addTransaction(`Swap ${from.symbol} to ${to.symbol}`, "Crypto trade", 0, "crypto", to.id, "⇄", "purple");
      } else if (action === "stake") {
        if (amount > asset.amount * asset.price) { toast("Choose a staking value within your available balance."); return; }
        state.stakedUsd = (state.stakedUsd || 0) + amount;
        addTransaction(`Stake ${asset.symbol}`, "Staking", -amount, "crypto", asset.id, "✳", asset.tone);
      }
      persist(); closeModal(); render();
      const assetSymbol = asset?.symbol || "asset";
      const labels = { "confirm-transfer": `Transfer of ${money(amount)} sent to ${String(data.get("recipient")).trim()}.`, "confirm-crypto-send": `${money(amount)} of ${assetSymbol} sent in the demo.`, "receive-crypto": `${money(amount)} of ${assetSymbol} received in the demo.`, deposit: `${money(amount)} added to your demo account.`, "confirm-buy": `${money(amount)} of ${assetSymbol} added to your demo portfolio.`, "confirm-sell": `${money(amount)} of ${assetSymbol} converted to demo cash.`, withdraw: `${money(amount)} of ${assetSymbol} withdrawn to your demo bank.`, "confirm-swap": "Demo asset swap completed.", stake: "Your demo staking position was updated." };
      toast(labels[action] || "Demo transaction complete.");
    }
  }

  document.addEventListener("click", (event) => {
    const pageLink = event.target.closest("[data-page], [data-page-link]");
    if (pageLink) {
      event.preventDefault();
      state.page = pageLink.dataset.page || pageLink.dataset.pageLink;
      state.transactionPage = 1;
      state.query = "";
      document.querySelector("#global-search").value = "";
      history.pushState(null, "", `#${state.page}`);
      render();
      return;
    }
    const target = event.target.closest("[data-action], [data-period], [data-activity-kind]");
    if (!target) {
      if (event.target === backdrop) closeModal();
      return;
    }
    if (target.dataset.period) { state.period = target.dataset.period; render(); return; }
    if (target.dataset.activityKind) { state.activityKind = target.dataset.activityKind; state.transactionPage = 1; render(); return; }
    const action = target.dataset.action;
    if (action === "menu") { document.querySelector("#sidebar").classList.toggle("sidebar-open"); return; }
    if (action === "close-modal") { closeModal(); return; }
    if (action === "toggle-balance") { state.hiddenBalance = !state.hiddenBalance; persist(); render(); return; }
    if (action === "freeze-card") { state.frozen = !state.frozen; persist(); render(); toast(state.frozen ? "Your demo card is frozen." : "Your demo card is active."); return; }
    if (action === "toggle-control") {
      const control = target.dataset.control;
      if (!control || !Object.hasOwn(state.cardControls, control)) return;
      state.cardControls[control] = !state.cardControls[control];
      persist(); render(); toast(`${control} card payments ${state.cardControls[control] ? "enabled" : "disabled"}.`); return;
    }
    if (action === "export") { exportTransactions(); return; }
    if (action === "page") { state.transactionPage = Number(target.dataset.pageNumber); render(); return; }
    if (action === "auth-toggle") { state.page = state.page === "signup" ? "signin" : "signup"; render(); return; }
    if (action === "signout") { state.page = "signin"; history.pushState(null, "", "#signin"); render(); toast("Signed out of the local demo."); return; }
    actionFor(action, target.dataset.symbol || "", target.dataset.account || "");
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.matches('[data-form="auth"]')) {
      event.preventDefault();
      if (form.reportValidity()) submitDemoForm(form);
      return;
    }
    if (form.matches(".modal-form")) { event.preventDefault(); if (form.reportValidity()) submitDemoForm(form); }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "type-filter") { state.activityType = event.target.value; state.transactionPage = 1; render(); }
    if (event.target.id === "account-filter") { state.accountFilter = event.target.value; state.transactionPage = 1; render(); }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "global-search") {
      state.query = event.target.value;
      state.page = "activity";
      state.transactionPage = 1;
      if (location.hash.slice(1) !== "activity") history.replaceState(null, "", "#activity");
      render();
      const input = document.querySelector("#global-search");
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    if (event.target.id === "help-search") {
      const query = event.target.value.toLowerCase();
      document.querySelectorAll(".faq-item").forEach((item) => { item.hidden = !item.dataset.question.includes(query); });
    }
  });

  function exportTransactions() {
    const rows = [["Date", "Description", "Category", "Type", "Account / asset", "Amount USD", "Status"]];
    state.transactions.forEach((item) => {
      const detail = item.kind === "crypto" ? (assetForSymbolById(item.account)?.name || "Crypto wallet") : (accountFor(item.account)?.name || "Bank account");
      rows.push([new Date(item.date).toISOString(), item.name, item.category, item.kind, detail, item.amount.toFixed(2), item.status]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "butterfield-banco-activity.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Your combined activity statement has been exported.");
  }

  function assetForSymbolById(id) {
    return state.assets.find((asset) => asset.id === id);
  }

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); document.querySelector("#global-search").focus(); }
    if (event.key === "Escape") { closeModal(); document.querySelector("#sidebar").classList.remove("sidebar-open"); }
  });
  window.addEventListener("hashchange", () => { state.page = location.hash.slice(1) || "overview"; render(); });
  window.addEventListener("popstate", () => { state.page = location.hash.slice(1) || "overview"; render(); });
  render();
})();
