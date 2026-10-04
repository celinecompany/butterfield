(() => {
  const date = (daysAgo, hour = 12) => {
    const value = new Date();
    value.setDate(value.getDate() - daysAgo);
    value.setHours(hour, 0, 0, 0);
    return value.toISOString();
  };

  window.BUTTERFIELD_SEED = {
    accounts: [
      { id: "checking", name: "Everyday checking", institution: "Butterfield Banco", type: "Checking", mask: "4829", balance: 24850.75, tone: "green" },
      { id: "savings", name: "High-yield savings", institution: "Butterfield Banco", type: "Savings", mask: "1904", balance: 12500, tone: "blue" },
      { id: "linked-chase", name: "Total Checking", institution: "Chase", type: "Checking", mask: "6103", balance: 6842.17, tone: "purple" }
    ],
    assets: [
      { id: "btc", name: "Bitcoin", symbol: "BTC", mark: "₿", price: 69252.14, amount: 0.0842, change: 2.84, tone: "bitcoin", network: "Bitcoin" },
      { id: "eth", name: "Ethereum", symbol: "ETH", mark: "Ξ", price: 3146.20, amount: 1.25, change: 1.62, tone: "ethereum", network: "Ethereum" },
      { id: "sol", name: "Solana", symbol: "SOL", mark: "◎", price: 148.72, amount: 8.4, change: -0.94, tone: "solana", network: "Solana" },
      { id: "usdc", name: "USD Coin", symbol: "USDC", mark: "$", price: 1, amount: 2140, change: 0.01, tone: "stablecoin", network: "Ethereum" }
    ],
    transactions: [
      { id: "tx1", name: "Whole Foods Market", category: "Groceries", date: date(0, 10), amount: -64.32, kind: "bank", account: "checking", status: "Completed", symbol: "W", tone: "mint" },
      { id: "tx2", name: "Salary · Acme Studio", category: "Income", date: date(1, 9), amount: 4250, kind: "bank", account: "checking", status: "Completed", symbol: "A", tone: "blue" },
      { id: "tx3", name: "Bitcoin purchase", category: "Crypto trade", date: date(1, 14), amount: -250, kind: "crypto", account: "btc", status: "Completed", symbol: "₿", tone: "orange" },
      { id: "tx4", name: "Spotify Premium", category: "Subscriptions", date: date(2, 18), amount: -10.99, kind: "bank", account: "checking", status: "Completed", symbol: "♫", tone: "green" },
      { id: "tx5", name: "USDC rewards", category: "Rewards", date: date(3, 8), amount: 8.42, kind: "crypto", account: "usdc", status: "Completed", symbol: "$", tone: "mint" },
      { id: "tx6", name: "Uber Technologies", category: "Transport", date: date(4, 12), amount: -22.5, kind: "bank", account: "linked-chase", status: "Completed", symbol: "U", tone: "dark" },
      { id: "tx7", name: "Airbnb · Portland", category: "Travel", date: date(5, 14), amount: -183, kind: "bank", account: "checking", status: "Completed", symbol: "⌂", tone: "rose" },
      { id: "tx8", name: "Ethereum staking reward", category: "Staking", date: date(6, 8), amount: 4.82, kind: "crypto", account: "eth", status: "Completed", symbol: "Ξ", tone: "purple" },
      { id: "tx9", name: "Trader Joe's", category: "Groceries", date: date(7, 11), amount: -48.71, kind: "bank", account: "checking", status: "Completed", symbol: "T", tone: "red" },
      { id: "tx10", name: "Monthly interest", category: "Interest", date: date(9, 8), amount: 42.18, kind: "bank", account: "savings", status: "Completed", symbol: "$", tone: "mint" },
      { id: "tx11", name: "Solana purchase", category: "Crypto trade", date: date(11, 15), amount: -175, kind: "crypto", account: "sol", status: "Completed", symbol: "◎", tone: "purple" },
      { id: "tx12", name: "Transfer from Alex", category: "Transfer", date: date(13, 16), amount: 120, kind: "bank", account: "checking", status: "Completed", symbol: "A", tone: "lavender" }
    ],
    wallets: [
      { name: "Butterfield Vault", network: "Multi-chain", address: "0x84a2…b91c" }
    ],
    frozen: false,
    hiddenBalance: false,
    cardLimit: 5000,
    cardControls: { online: true, contactless: true, international: false },
    preferences: { currency: "USD", appearance: "light", twoFactor: true, securityAlerts: true, transferAlerts: true, cryptoAlerts: true },
    stakedUsd: 785,
    user: { first: "Jordan", last: "Davis", email: "jordan.davis@email.com" }
  };
})();
