(() => {
  "use strict";

  const storageKey = "butterfield-banco-demo-v1";
  const seed = window.BUTTERFIELD_SEED;
  const params = new URLSearchParams(window.location.search);
  const fxRates = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36 };
  const elements = {
    accountSelect: document.querySelector("#account-select"),
    start: document.querySelector("#period-start"),
    end: document.querySelector("#period-end"),
    form: document.querySelector("#statement-filters"),
    print: document.querySelector("#print-statement"),
    download: document.querySelector("#download-statement"),
    error: document.querySelector("#statement-error"),
    customerName: document.querySelector("#customer-name"),
    accountName: document.querySelector("#account-name"),
    accountNumber: document.querySelector("#account-number"),
    customerContact: document.querySelector("#customer-contact"),
    period: document.querySelector("#statement-period"),
    generated: document.querySelector("#generated-date"),
    opening: document.querySelector("#opening-balance"),
    credits: document.querySelector("#total-credits"),
    debits: document.querySelector("#total-debits"),
    closing: document.querySelector("#closing-balance"),
    count: document.querySelector("#transaction-count"),
    rows: document.querySelector("#transaction-rows")
  };

  function readDemoState() {
    const cloneSeed = () => JSON.parse(JSON.stringify(seed));
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || !Array.isArray(saved.accounts) || !Array.isArray(saved.transactions)) return cloneSeed();
      return {
        ...cloneSeed(),
        ...saved,
        accounts: saved.accounts.filter((account) => account && Number.isFinite(account.balance)),
        transactions: saved.transactions.filter((transaction) => transaction && Number.isFinite(transaction.amount))
      };
    } catch (error) {
      console.warn("Could not read saved demo statement data; showing starter demo data.", error);
      return cloneSeed();
    }
  }

  const state = readDemoState();
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const currentCurrency = () => state.preferences?.currency || "USD";
  const currencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currentCurrency(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const money = (amount) => currencyFormat.format(amount * (fxRates[currentCurrency()] || 1));
  const parseDate = (value) => new Date(`${value}T00:00:00`);
  const dateText = (value, options = { day: "2-digit", month: "short", year: "numeric" }) =>
    new Intl.DateTimeFormat("en-US", options).format(value);
  const userName = [state.user?.first, state.user?.last].filter(Boolean).join(" ") || "Demo customer";
  const downloadLabel = elements.download.querySelector(".download-label");

  function setError(message = "") {
    elements.error.textContent = message;
    elements.error.hidden = !message;
  }

  function setInitialFilters() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    const toISODate = (date) => {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return localDate.toISOString().slice(0, 10);
    };
    elements.start.value = params.get("from") || toISODate(start);
    elements.end.value = params.get("to") || toISODate(today);
  }

  function populateAccounts() {
    elements.accountSelect.innerHTML = state.accounts.map((account) =>
      `<option value="${safe(account.id)}">${safe(account.institution)} · ${safe(account.name)} ···· ${safe(account.mask)}</option>`
    ).join("");
    const requestedId = params.get("account");
    const selected = state.accounts.find((account) => account.id === requestedId) || state.accounts[0];
    if (!selected) {
      setError("No demo bank accounts are available. Add an account in Butterfield Banco and try again.");
      elements.accountSelect.disabled = true;
      elements.print.disabled = true;
      elements.download.disabled = true;
      return;
    }
    elements.accountSelect.value = selected.id;
  }

  function updateStatement() {
    const account = state.accounts.find((item) => item.id === elements.accountSelect.value);
    const start = parseDate(elements.start.value);
    const end = parseDate(elements.end.value);
    if (!account) {
      setError("Choose an available bank account to view its statement.");
      return false;
    }
    if (!elements.start.value || !elements.end.value || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Enter a valid start and end date for this statement.");
      return false;
    }
    if (start > end) {
      setError("The statement start date must be on or before the end date.");
      return false;
    }
    setError();
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    const transactions = state.transactions
      .filter((item) => item.kind === "bank" && item.account === account.id)
      .map((item) => ({ ...item, timestamp: new Date(item.date) }))
      .filter((item) => !Number.isNaN(item.timestamp.getTime()))
      .sort((a, b) => a.timestamp - b.timestamp);
    const periodTransactions = transactions.filter((item) => item.timestamp >= start && item.timestamp <= endOfDay);
    const amountInPeriod = periodTransactions.reduce((sum, item) => sum + item.amount, 0);
    const amountAfterPeriod = transactions
      .filter((item) => item.timestamp > endOfDay)
      .reduce((sum, item) => sum + item.amount, 0);
    const closingBalance = account.balance - amountAfterPeriod;
    const openingBalance = closingBalance - amountInPeriod;
    const credits = periodTransactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const debits = Math.abs(periodTransactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));

    elements.customerName.textContent = userName;
    elements.accountName.textContent = `${account.institution} · ${account.name} · ${account.type}`;
    elements.accountNumber.textContent = `Account number: •••• ${account.mask}`;
    elements.customerContact.textContent = state.user?.email || "Address not provided in demo profile";
    elements.period.textContent = `${dateText(start)} — ${dateText(end)}`;
    elements.generated.textContent = `Generated ${dateText(new Date(), { day: "2-digit", month: "long", year: "numeric" })}`;
    elements.opening.textContent = money(openingBalance);
    elements.credits.textContent = money(credits);
    elements.debits.textContent = money(debits);
    elements.closing.textContent = money(closingBalance);
    elements.count.textContent = `${periodTransactions.length} ${periodTransactions.length === 1 ? "transaction" : "transactions"}`;

    let runningBalance = openingBalance;
    elements.rows.innerHTML = periodTransactions.length
      ? periodTransactions.map((item) => {
        runningBalance += item.amount;
        const debit = item.amount < 0 ? money(Math.abs(item.amount)) : "—";
        const credit = item.amount > 0 ? money(item.amount) : "—";
        return `<tr>
          <td>${safe(dateText(item.timestamp))}</td>
          <td class="description">${safe(item.name)}<small>${safe(item.category || "Account activity")}</small></td>
          <td class="numeric debit">${debit}</td>
          <td class="numeric credit">${credit}</td>
          <td class="numeric">${money(runningBalance)}</td>
        </tr>`;
      }).join("")
      : `<tr class="empty-row"><td colspan="5">No transactions for this account in the selected period.</td></tr>`;

    const nextParams = new URLSearchParams({
      account: account.id,
      from: elements.start.value,
      to: elements.end.value
    });
    history.replaceState(null, "", `${window.location.pathname}?${nextParams.toString()}`);
    document.title = `${account.name} Statement · Butterfield Banco`;
    return true;
  }

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateStatement();
  });
  elements.print.addEventListener("click", () => {
    if (!updateStatement()) return;
    window.requestAnimationFrame(() => window.print());
  });
  elements.download.addEventListener("click", async () => {
    if (!updateStatement()) return;
    if (typeof window.html2pdf !== "function") {
      setError("PDF download is unavailable. Check your internet connection and reload, or use Print and choose Save as PDF.");
      return;
    }

    const accountSlug = elements.accountSelect.value;
    const filename = accountSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "account";
    setError();
    const sheet = document.querySelector("#statement-sheet").cloneNode(true);
    sheet.classList.add("pdf-export");
    const logo = sheet.querySelector(".statement-logo");
    if (logo) {
      if (logo.hidden || !logo.complete || !logo.naturalWidth) {
        logo.remove();
      } else {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = logo.naturalWidth;
          canvas.height = logo.naturalHeight;
          canvas.getContext("2d").drawImage(logo, 0, 0);
          logo.src = canvas.toDataURL("image/png");
        } catch (error) {
          console.warn("Could not embed the statement logo in the PDF.", error);
          logo.remove();
        }
      }
    }
    elements.download.disabled = true;
    elements.download.setAttribute("aria-busy", "true");
    downloadLabel.textContent = "Preparing PDF…";
    try {
      await document.fonts.ready;
      const pdf = await window.html2pdf().set({
        margin: 0,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { backgroundColor: "#ffffff", scale: 2, useCORS: true, windowWidth: 794, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] }
      }).from(sheet).outputPdf("blob");
      if (!(pdf instanceof Blob) || pdf.size < 5 || pdf.type !== "application/pdf") {
        throw new Error("The PDF renderer returned an invalid file.");
      }
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `butterfield-banco-${filename}-statement-${elements.start.value}-to-${elements.end.value}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setError("The PDF could not be created. Please try again, or use Print and choose Save as PDF.");
      console.error("Could not create the account statement PDF.", error);
    } finally {
      downloadLabel.textContent = "Download PDF";
      elements.download.removeAttribute("aria-busy");
      elements.download.disabled = false;
    }
  });
  document.querySelector(".statement-logo").addEventListener("error", (event) => {
    event.currentTarget.hidden = true;
  });
  document.querySelector(".statement-logo").addEventListener("load", (event) => {
    event.currentTarget.hidden = false;
  });
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());

  populateAccounts();
  setInitialFilters();
  updateStatement();
})();
