(function attachDealCalculations(global) {
  "use strict";

  var DEFAULT_DEAL = {
    dealName: "Detroit duplex acquisition",
    propertyType: "small_multifamily",
    address: "48226 sample deal",
    unitCount: 2,
    strategy: "buy_hold",
    purchasePrice: 325000,
    currentValue: 340000,
    rehabBudget: 18000,
    closingCosts: 8500,
    grossMonthlyRent: 3150,
    otherMonthlyIncome: 80,
    vacancyRate: 5,
    propertyTaxesAnnual: 4200,
    insuranceAnnual: 1800,
    managementRate: 8,
    repairsMonthly: 220,
    utilitiesMonthly: 0,
    hoaMonthly: 0,
    capexMonthly: 180,
    downPaymentPct: 25,
    interestRate: 7.25,
    loanTermYears: 30,
    lenderPointsPct: 1,
    notes: "Stabilized 2-unit rental with light turn budget and conventional DSCR loan sizing."
  };

  var STRATEGY_LABELS = {
    buy_hold: "Buy and hold rental",
    light_rehab: "Light rehab rental",
    stabilize_refi: "Stabilize and refinance",
    house_hack: "Owner-occupied house hack"
  };

  var PROPERTY_LABELS = {
    sfr: "Single-family rental",
    small_multifamily: "Small multifamily (2-4 units)"
  };

  function toNumber(value, fallback) {
    var parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return fallback || 0;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function round(value, places) {
    var power = Math.pow(10, places || 0);
    return Math.round((value + Number.EPSILON) * power) / power;
  }

  function normalizeDeal(rawDeal) {
    var deal = Object.assign({}, DEFAULT_DEAL, rawDeal || {});

    [
      "unitCount",
      "purchasePrice",
      "currentValue",
      "rehabBudget",
      "closingCosts",
      "grossMonthlyRent",
      "otherMonthlyIncome",
      "vacancyRate",
      "propertyTaxesAnnual",
      "insuranceAnnual",
      "managementRate",
      "repairsMonthly",
      "utilitiesMonthly",
      "hoaMonthly",
      "capexMonthly",
      "downPaymentPct",
      "interestRate",
      "loanTermYears",
      "lenderPointsPct"
    ].forEach(function normalizeNumber(field) {
      deal[field] = toNumber(deal[field], DEFAULT_DEAL[field]);
    });

    deal.unitCount = clamp(Math.round(deal.unitCount || 1), 1, 4);
    deal.vacancyRate = clamp(deal.vacancyRate, 0, 100);
    deal.managementRate = clamp(deal.managementRate, 0, 100);
    deal.downPaymentPct = clamp(deal.downPaymentPct, 0, 100);
    deal.interestRate = clamp(deal.interestRate, 0, 25);
    deal.loanTermYears = clamp(deal.loanTermYears, 1, 40);
    deal.lenderPointsPct = clamp(deal.lenderPointsPct, 0, 10);
    deal.purchasePrice = Math.max(deal.purchasePrice, 0);
    deal.currentValue = Math.max(deal.currentValue || deal.purchasePrice, 0);
    deal.rehabBudget = Math.max(deal.rehabBudget, 0);
    deal.closingCosts = Math.max(deal.closingCosts, 0);
    deal.grossMonthlyRent = Math.max(deal.grossMonthlyRent, 0);
    deal.otherMonthlyIncome = Math.max(deal.otherMonthlyIncome, 0);

    if (deal.propertyType === "sfr") {
      deal.unitCount = 1;
    }

    return deal;
  }

  function monthlyPayment(principal, annualRate, termYears) {
    if (principal <= 0) {
      return 0;
    }

    var periods = termYears * 12;
    var monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return principal / periods;
    }

    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods));
  }

  function lenderGrade(metrics) {
    if (metrics.dscr >= 1.35 && metrics.ltv <= 75 && metrics.monthlyCashFlow > 0) {
      return {
        label: "Strong",
        tone: "strong",
        summary: "Likely to clear common DSCR and leverage screens."
      };
    }

    if (metrics.dscr >= 1.2 && metrics.ltv <= 80 && metrics.monthlyCashFlow >= 0) {
      return {
        label: "Workable",
        tone: "workable",
        summary: "Close to lender targets; structure and reserves matter."
      };
    }

    return {
      label: "Needs work",
      tone: "watch",
      summary: "Review leverage, price, rent, or expense assumptions before lender submission."
    };
  }

  function calculateDeal(rawDeal) {
    var deal = normalizeDeal(rawDeal);
    var monthlyGrossIncome = deal.grossMonthlyRent + deal.otherMonthlyIncome;
    var vacancyLossMonthly = monthlyGrossIncome * deal.vacancyRate / 100;
    var effectiveMonthlyIncome = monthlyGrossIncome - vacancyLossMonthly;
    var taxesMonthly = deal.propertyTaxesAnnual / 12;
    var insuranceMonthly = deal.insuranceAnnual / 12;
    var managementMonthly = effectiveMonthlyIncome * deal.managementRate / 100;
    var operatingExpensesMonthly = taxesMonthly +
      insuranceMonthly +
      managementMonthly +
      deal.repairsMonthly +
      deal.utilitiesMonthly +
      deal.hoaMonthly +
      deal.capexMonthly;
    var noiMonthly = effectiveMonthlyIncome - operatingExpensesMonthly;
    var annualNoi = noiMonthly * 12;
    var loanAmount = deal.purchasePrice * (1 - deal.downPaymentPct / 100);
    var downPayment = deal.purchasePrice - loanAmount;
    var totalProjectCost = deal.purchasePrice + deal.rehabBudget + deal.closingCosts;
    var lenderPointsCost = loanAmount * deal.lenderPointsPct / 100;
    var cashInvested = downPayment + deal.rehabBudget + deal.closingCosts + lenderPointsCost;
    var monthlyDebtService = monthlyPayment(loanAmount, deal.interestRate, deal.loanTermYears);
    var annualDebtService = monthlyDebtService * 12;
    var annualCashFlow = annualNoi - annualDebtService;
    var monthlyCashFlow = annualCashFlow / 12;
    var valueBasis = deal.currentValue || deal.purchasePrice;
    var metrics = {
      monthlyGrossIncome: round(monthlyGrossIncome, 2),
      vacancyLossMonthly: round(vacancyLossMonthly, 2),
      effectiveMonthlyIncome: round(effectiveMonthlyIncome, 2),
      taxesMonthly: round(taxesMonthly, 2),
      insuranceMonthly: round(insuranceMonthly, 2),
      managementMonthly: round(managementMonthly, 2),
      operatingExpensesMonthly: round(operatingExpensesMonthly, 2),
      noiMonthly: round(noiMonthly, 2),
      annualNoi: round(annualNoi, 2),
      loanAmount: round(loanAmount, 2),
      downPayment: round(downPayment, 2),
      totalProjectCost: round(totalProjectCost, 2),
      lenderPointsCost: round(lenderPointsCost, 2),
      cashInvested: round(cashInvested, 2),
      monthlyDebtService: round(monthlyDebtService, 2),
      annualDebtService: round(annualDebtService, 2),
      monthlyCashFlow: round(monthlyCashFlow, 2),
      annualCashFlow: round(annualCashFlow, 2),
      dscr: annualDebtService > 0 ? round(annualNoi / annualDebtService, 2) : 0,
      ltv: valueBasis > 0 ? round(loanAmount / valueBasis * 100, 1) : 0,
      ltc: totalProjectCost > 0 ? round(loanAmount / totalProjectCost * 100, 1) : 0,
      capRate: valueBasis > 0 ? round(annualNoi / valueBasis * 100, 2) : 0,
      cashOnCash: cashInvested > 0 ? round(annualCashFlow / cashInvested * 100, 2) : 0,
      breakEvenOccupancy: monthlyGrossIncome > 0 ? round((operatingExpensesMonthly + monthlyDebtService) / monthlyGrossIncome * 100, 1) : 0,
      rentPerUnit: deal.unitCount > 0 ? round(deal.grossMonthlyRent / deal.unitCount, 2) : 0
    };

    return {
      deal: deal,
      metrics: metrics,
      grade: lenderGrade(metrics)
    };
  }

  function cloneScenario(baseDeal, preset) {
    var deal = normalizeDeal(baseDeal);
    var clone = Object.assign({}, deal);

    if (preset === "higher_down") {
      clone.downPaymentPct = clamp(deal.downPaymentPct + 5, 0, 100);
      clone.notes = "Tests whether more borrower equity improves DSCR and leverage screens.";
    }

    if (preset === "lower_price") {
      clone.purchasePrice = Math.max(0, Math.round(deal.purchasePrice * 0.97));
      clone.currentValue = Math.max(clone.purchasePrice, deal.currentValue);
      clone.notes = "Models a negotiated purchase price while keeping rent and operating assumptions stable.";
    }

    if (preset === "lower_rate") {
      clone.interestRate = Math.max(0, round(deal.interestRate - 0.5, 2));
      clone.notes = "Tests rate sensitivity under a better lender quote or buydown.";
    }

    if (preset === "custom") {
      clone.notes = "Custom scenario cloned from the base case.";
    }

    return clone;
  }

  function buildExecutiveSummary(result) {
    var deal = result.deal;
    var metrics = result.metrics;
    var propertyLabel = PROPERTY_LABELS[deal.propertyType] || "Rental property";
    var strategyLabel = STRATEGY_LABELS[deal.strategy] || "Investor rental strategy";

    return propertyLabel + " structured as " + strategyLabel.toLowerCase() +
      " with " + metrics.dscr.toFixed(2) + "x DSCR, " +
      metrics.ltv.toFixed(1) + "% LTV, " +
      metrics.capRate.toFixed(2) + "% cap rate, and " +
      formatSignedMoney(metrics.monthlyCashFlow) + " monthly cash flow.";
  }

  function formatSignedMoney(value) {
    var absolute = Math.abs(value);
    var formatted = "$" + Math.round(absolute).toLocaleString("en-US");
    return value < 0 ? "-" + formatted : formatted;
  }

  global.DealCalculations = {
    DEFAULT_DEAL: DEFAULT_DEAL,
    PROPERTY_LABELS: PROPERTY_LABELS,
    STRATEGY_LABELS: STRATEGY_LABELS,
    calculateDeal: calculateDeal,
    cloneScenario: cloneScenario,
    buildExecutiveSummary: buildExecutiveSummary,
    monthlyPayment: monthlyPayment,
    normalizeDeal: normalizeDeal
  };
})(window);
