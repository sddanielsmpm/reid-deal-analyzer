(function attachDealWorkbench(global) {
  "use strict";

  var calculator = global.DealCalculations;
  var form = document.querySelector("[data-deal-form]");
  var scenarioList = document.querySelector("[data-scenario-list]");
  var comparisonBody = document.querySelector("[data-comparison-body]");
  var reportSummary = document.querySelector("[data-report-summary]");
  var reportMeta = document.querySelector("[data-report-meta]");
  var reportMetrics = document.querySelector("[data-report-metrics]");
  var incomeBreakdown = document.querySelector("[data-income-breakdown]");
  var expenseBreakdown = document.querySelector("[data-expense-breakdown]");
  var debtBreakdown = document.querySelector("[data-debt-breakdown]");
  var keyMetrics = document.querySelector("[data-key-metrics]");
  var gradePanel = document.querySelector("[data-grade-panel]");
  var gradeBar = document.querySelector("[data-grade-bar]");
  var shareOutput = document.querySelector("[data-share-output]");
  var saveStatus = document.querySelector("[data-save-status]");
  var cloneButtons = document.querySelectorAll("[data-clone]");
  var stepButtons = document.querySelectorAll("[data-step-target]");
  var draftKey = "reig:deal-workbench:draft";
  var scenarioCounter = 1;

  var state = {
    tenant: {
      name: "REIG Demo Workspace",
      plan: "Free",
      usedDeals: 1,
      dealLimit: 3
    },
    scenarios: [
      {
        id: "base",
        name: "Base Case",
        locked: true,
        deal: Object.assign({}, calculator.DEFAULT_DEAL)
      }
    ]
  };

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function signedMoney(value) {
    return (value || 0) < 0 ? "-" + money(Math.abs(value)) : money(value || 0);
  }

  function percent(value, digits) {
    return (Number(value || 0)).toFixed(digits == null ? 1 : digits) + "%";
  }

  function metric(value, suffix) {
    return value + (suffix || "");
  }

  function fieldValue(field) {
    if (field.type === "number") {
      return Number(field.value || 0);
    }
    return field.value;
  }

  function getBaseScenario() {
    return state.scenarios[0];
  }

  function loadFormFromDeal(deal) {
    form.querySelectorAll("[data-field]").forEach(function fillField(field) {
      var key = field.getAttribute("data-field");
      if (deal[key] == null) {
        return;
      }
      field.value = deal[key];
    });
  }

  function readFormIntoBase() {
    var base = getBaseScenario();
    var deal = Object.assign({}, base.deal);
    form.querySelectorAll("[data-field]").forEach(function readField(field) {
      var key = field.getAttribute("data-field");
      deal[key] = fieldValue(field);
    });

    if (deal.propertyType === "sfr") {
      deal.unitCount = 1;
      var unitField = form.querySelector("[data-field='unitCount']");
      if (unitField) {
        unitField.value = 1;
      }
    }

    base.deal = calculator.normalizeDeal(deal);
  }

  function setStepActive(targetId) {
    stepButtons.forEach(function updateButton(button) {
      button.classList.toggle("is-active", button.getAttribute("data-step-target") === targetId);
    });
  }

  function bindStepNavigation() {
    stepButtons.forEach(function bindButton(button) {
      button.addEventListener("click", function scrollToSection() {
        var target = document.getElementById(button.getAttribute("data-step-target"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setStepActive(target.id);
        }
      });
    });
  }

  function saveDraft() {
    readFormIntoBase();
    localStorage.setItem(draftKey, JSON.stringify(state));
    saveStatus.textContent = "Draft saved";
    window.setTimeout(function clearStatus() {
      saveStatus.textContent = "";
    }, 2200);
  }

  function loadDraft() {
    var queryDeal = new URLSearchParams(window.location.search).get("deal");

    if (queryDeal) {
      try {
        var decoded = JSON.parse(decodeURIComponent(escape(atob(queryDeal))));
        if (decoded && decoded.scenarios && decoded.scenarios.length) {
          state = decoded;
          return;
        }
      } catch (error) {
        console.warn("Unable to load shared deal", error);
      }
    }

    try {
      var saved = localStorage.getItem(draftKey);
      if (saved) {
        var draft = JSON.parse(saved);
        if (draft && draft.scenarios && draft.scenarios.length) {
          state = draft;
        }
      }
    } catch (error) {
      console.warn("Unable to load saved draft", error);
    }
  }

  function buildShareLink() {
    readFormIntoBase();
    var payload = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    var url = new URL(window.location.href);
    url.searchParams.set("deal", payload);
    window.history.replaceState(null, "", url.toString());
    shareOutput.value = url.toString();
    shareOutput.hidden = false;
    shareOutput.select();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.toString()).catch(function ignoreClipboardFailure() {});
    }
  }

  function removeScenario(id) {
    state.scenarios = state.scenarios.filter(function keepScenario(scenario) {
      return scenario.id === "base" || scenario.id !== id;
    });
    render();
  }

  function cloneScenario(preset) {
    readFormIntoBase();
    var baseDeal = getBaseScenario().deal;
    var clone = calculator.cloneScenario(baseDeal, preset);
    var names = {
      higher_down: "Higher Down",
      lower_price: "Lower Price",
      lower_rate: "Lower Rate",
      custom: "Custom"
    };
    scenarioCounter += 1;
    state.scenarios.push({
      id: "scenario-" + scenarioCounter,
      name: names[preset] || "Scenario",
      locked: false,
      deal: clone
    });
    render();
  }

  function updateScenarioField(id, key, value) {
    var scenario = state.scenarios.find(function findScenario(item) {
      return item.id === id;
    });

    if (!scenario) {
      return;
    }

    scenario.deal[key] = value;
    scenario.deal = calculator.normalizeDeal(scenario.deal);
    render();
  }

  function updateScenarioName(id, value) {
    var scenario = state.scenarios.find(function findScenario(item) {
      return item.id === id;
    });

    if (scenario) {
      scenario.name = value || "Scenario";
      renderReport();
    }
  }

  function metricRows(result) {
    var metrics = result.metrics;
    return [
      ["DSCR", metrics.dscr.toFixed(2) + "x"],
      ["LTV", percent(metrics.ltv, 1)],
      ["LTC", percent(metrics.ltc, 1)],
      ["Cap rate", percent(metrics.capRate, 2)],
      ["Monthly cash flow", signedMoney(metrics.monthlyCashFlow)],
      ["Cash-on-cash", percent(metrics.cashOnCash, 2)]
    ];
  }

  function renderKeyMetrics() {
    var base = calculator.calculateDeal(getBaseScenario().deal);
    var rows = metricRows(base);

    keyMetrics.innerHTML = rows.map(function renderMetric(row) {
      return [
        "<div class='metric-cell'>",
        "<span>" + row[0] + "</span>",
        "<strong>" + row[1] + "</strong>",
        "</div>"
      ].join("");
    }).join("");

    gradePanel.className = "grade-panel is-" + base.grade.tone;
    gradePanel.querySelector("[data-grade-label]").textContent = base.grade.label;
    gradePanel.querySelector("[data-grade-summary]").textContent = base.grade.summary;
    gradeBar.style.width = Math.max(14, Math.min(100, base.metrics.dscr / 1.5 * 100)) + "%";
  }

  function renderScenarioCards() {
    scenarioList.innerHTML = state.scenarios.map(function renderScenario(scenario) {
      var result = calculator.calculateDeal(scenario.deal);
      var metrics = result.metrics;
      var removable = scenario.id !== "base";

      return [
        "<article class='scenario-card' data-testid='scenario-card' data-scenario='" + scenario.id + "'>",
        "<div class='scenario-card-head'>",
        scenario.locked ?
          "<strong>" + scenario.name + "</strong>" :
          "<input class='scenario-name' aria-label='Scenario name' value='" + escapeHtml(scenario.name) + "' data-scenario-name='" + scenario.id + "'>",
        removable ? "<button class='text-button' type='button' data-remove-scenario='" + scenario.id + "'>Remove</button>" : "<span class='base-tag'>Source</span>",
        "</div>",
        "<div class='scenario-inputs'>",
        inputMarkup(scenario.id, "purchasePrice", "Purchase", scenario.deal.purchasePrice),
        inputMarkup(scenario.id, "downPaymentPct", "Down %", scenario.deal.downPaymentPct),
        inputMarkup(scenario.id, "interestRate", "Rate %", scenario.deal.interestRate),
        "</div>",
        "<dl class='scenario-stats'>",
        "<div><dt>DSCR</dt><dd>" + metrics.dscr.toFixed(2) + "x</dd></div>",
        "<div><dt>LTV</dt><dd>" + percent(metrics.ltv, 1) + "</dd></div>",
        "<div><dt>Cash flow</dt><dd>" + signedMoney(metrics.monthlyCashFlow) + "</dd></div>",
        "</dl>",
        "</article>"
      ].join("");
    }).join("");
  }

  function inputMarkup(id, field, label, value) {
    var step = field === "interestRate" || field === "downPaymentPct" ? "0.1" : "1000";
    return [
      "<label>",
      "<span>" + label + "</span>",
      "<input type='number' step='" + step + "' value='" + value + "' data-scenario-field='" + field + "' data-scenario-id='" + id + "'>",
      "</label>"
    ].join("");
  }

  function renderReport() {
    var base = calculator.calculateDeal(getBaseScenario().deal);
    var deal = base.deal;
    var metrics = base.metrics;
    var propertyLabel = calculator.PROPERTY_LABELS[deal.propertyType] || "Rental property";
    var strategyLabel = calculator.STRATEGY_LABELS[deal.strategy] || "Investor strategy";

    reportSummary.textContent = calculator.buildExecutiveSummary(base);
    reportMeta.innerHTML = [
      "<span>" + escapeHtml(deal.dealName) + "</span>",
      "<span>" + propertyLabel + "</span>",
      "<span>" + strategyLabel + "</span>",
      "<span>" + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + "</span>"
    ].join("");

    reportMetrics.innerHTML = metricRows(base).map(function renderRow(row) {
      return "<tr><th>" + row[0] + "</th><td>" + row[1] + "</td></tr>";
    }).join("");

    incomeBreakdown.innerHTML = [
      row("Gross monthly rent", money(deal.grossMonthlyRent)),
      row("Other monthly income", money(deal.otherMonthlyIncome)),
      row("Vacancy loss", "-" + money(metrics.vacancyLossMonthly)),
      row("Effective monthly income", money(metrics.effectiveMonthlyIncome)),
      row("Annual NOI", money(metrics.annualNoi))
    ].join("");

    expenseBreakdown.innerHTML = [
      row("Property taxes", money(metrics.taxesMonthly)),
      row("Insurance", money(metrics.insuranceMonthly)),
      row("Management", money(metrics.managementMonthly)),
      row("Repairs and maintenance", money(deal.repairsMonthly)),
      row("Utilities", money(deal.utilitiesMonthly)),
      row("HOA", money(deal.hoaMonthly)),
      row("Capex reserve", money(deal.capexMonthly)),
      row("Total operating expenses", money(metrics.operatingExpensesMonthly))
    ].join("");

    debtBreakdown.innerHTML = [
      row("Purchase price", money(deal.purchasePrice)),
      row("Current value", money(deal.currentValue)),
      row("Rehab budget", money(deal.rehabBudget)),
      row("Closing costs", money(deal.closingCosts)),
      row("Loan amount", money(metrics.loanAmount)),
      row("Monthly debt service", money(metrics.monthlyDebtService)),
      row("Cash invested", money(metrics.cashInvested))
    ].join("");

    renderComparison();
  }

  function renderComparison() {
    comparisonBody.innerHTML = state.scenarios.map(function renderComparisonRow(scenario) {
      var result = calculator.calculateDeal(scenario.deal);
      var metrics = result.metrics;

      return [
        "<tr>",
        "<th>" + escapeHtml(scenario.name) + "</th>",
        "<td>" + money(result.deal.purchasePrice) + "</td>",
        "<td>" + percent(result.deal.downPaymentPct, 1) + "</td>",
        "<td>" + percent(result.deal.interestRate, 2) + "</td>",
        "<td>" + metrics.dscr.toFixed(2) + "x</td>",
        "<td>" + percent(metrics.ltv, 1) + "</td>",
        "<td>" + signedMoney(metrics.monthlyCashFlow) + "</td>",
        "<td>" + result.grade.label + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function row(label, value) {
    return "<tr><th>" + label + "</th><td>" + value + "</td></tr>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    readFormIntoBase();
    renderKeyMetrics();
    renderScenarioCards();
    renderReport();
  }

  function bindEvents() {
    form.addEventListener("input", render);
    form.addEventListener("change", render);

    cloneButtons.forEach(function bindClone(button) {
      button.addEventListener("click", function onClone() {
        cloneScenario(button.getAttribute("data-clone"));
      });
    });

    scenarioList.addEventListener("input", function onScenarioNameInput(event) {
      var target = event.target;
      var nameId = target.getAttribute("data-scenario-name");

      if (nameId) {
        updateScenarioName(nameId, target.value);
      }
    });

    scenarioList.addEventListener("change", function onScenarioValueChange(event) {
      var target = event.target;
      var field = target.getAttribute("data-scenario-field");
      var id = target.getAttribute("data-scenario-id");

      if (field && id) {
        updateScenarioField(id, field, Number(target.value || 0));
      }
    });

    scenarioList.addEventListener("click", function onScenarioClick(event) {
      var id = event.target.getAttribute("data-remove-scenario");
      if (id) {
        removeScenario(id);
      }
    });

    document.querySelector("[data-save-draft]").addEventListener("click", saveDraft);
    document.querySelector("[data-share-link]").addEventListener("click", buildShareLink);
    document.querySelector("[data-export-pdf]").addEventListener("click", function printReport() {
      render();
      window.print();
    });

    bindStepNavigation();
  }

  function init() {
    loadDraft();
    if (!state.scenarios || !state.scenarios.length) {
      state.scenarios = [
        {
          id: "base",
          name: "Base Case",
          locked: true,
          deal: Object.assign({}, calculator.DEFAULT_DEAL)
        }
      ];
    }
    state.scenarios[0].id = "base";
    state.scenarios[0].name = state.scenarios[0].name || "Base Case";
    state.scenarios[0].locked = true;
    scenarioCounter = Math.max(1, state.scenarios.length);
    loadFormFromDeal(state.scenarios[0].deal);
    bindEvents();
    render();
  }

  global.DealWorkbench = {
    init: init,
    getState: function getState() {
      readFormIntoBase();
      return state;
    },
    calculateBase: function calculateBase() {
      readFormIntoBase();
      return calculator.calculateDeal(getBaseScenario().deal);
    }
  };

  init();
})(window);
