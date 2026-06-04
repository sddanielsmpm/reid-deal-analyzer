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
  var estimateButton = document.querySelector("[data-estimate-assumptions]");
  var estimateSummary = document.querySelector("[data-estimate-summary]");
  var estimateSource = document.querySelector("[data-estimate-source]");
  var steadilyStatus = document.querySelector("[data-steadily-status]");
  var steadilyWidget = document.querySelector("[data-steadily-widget]");
  var cloneButtons = document.querySelectorAll("[data-clone]");
  var stepButtons = document.querySelectorAll("[data-step-target]");
  var draftKey = "reig:deal-workbench:draft";
  var scenarioCounter = 1;
  var steadilySignature = "";
  var steadilyPremiumSignature = "";
  var steadilyObserver = null;

  var DEFAULT_MARKET_PROFILE = {
    label: "National rental baseline",
    rentPerUnit: 1550,
    rentToValueAnnualPct: 7.2,
    taxRatePct: 1.05,
    insuranceBase: 1200,
    insuranceValuePct: 0.18,
    insurancePerExtraUnit: 175,
    managementRate: 8,
    vacancyRate: 6,
    repairsPerUnit: 175,
    capexPerUnit: 150,
    ownerUtilitiesPerUnit: 0,
    hoaMonthly: 0
  };

  var STATE_MARKET_PROFILES = {
    AZ: { label: "Arizona rental baseline", rentPerUnit: 1725, rentToValueAnnualPct: 7.0, taxRatePct: 0.65, insuranceBase: 1350, insuranceValuePct: 0.14, managementRate: 8, vacancyRate: 5.5, repairsPerUnit: 175, capexPerUnit: 150 },
    CA: { label: "California rental baseline", rentPerUnit: 2550, rentToValueAnnualPct: 5.4, taxRatePct: 0.85, insuranceBase: 1650, insuranceValuePct: 0.16, managementRate: 7.5, vacancyRate: 4.5, repairsPerUnit: 220, capexPerUnit: 180 },
    CO: { label: "Colorado rental baseline", rentPerUnit: 2100, rentToValueAnnualPct: 6.2, taxRatePct: 0.58, insuranceBase: 1450, insuranceValuePct: 0.15, managementRate: 8, vacancyRate: 5, repairsPerUnit: 190, capexPerUnit: 165 },
    FL: { label: "Florida rental baseline", rentPerUnit: 2050, rentToValueAnnualPct: 7.0, taxRatePct: 0.95, insuranceBase: 2850, insuranceValuePct: 0.34, managementRate: 9, vacancyRate: 6.5, repairsPerUnit: 210, capexPerUnit: 170 },
    GA: { label: "Georgia rental baseline", rentPerUnit: 1650, rentToValueAnnualPct: 7.5, taxRatePct: 0.95, insuranceBase: 1450, insuranceValuePct: 0.18, managementRate: 8.5, vacancyRate: 6, repairsPerUnit: 180, capexPerUnit: 150 },
    IL: { label: "Illinois rental baseline", rentPerUnit: 1700, rentToValueAnnualPct: 7.2, taxRatePct: 2.0, insuranceBase: 1400, insuranceValuePct: 0.17, managementRate: 8, vacancyRate: 6, repairsPerUnit: 190, capexPerUnit: 165 },
    MI: { label: "Michigan rental baseline", rentPerUnit: 1300, rentToValueAnnualPct: 8.5, taxRatePct: 1.55, insuranceBase: 1500, insuranceValuePct: 0.19, managementRate: 8, vacancyRate: 7, repairsPerUnit: 185, capexPerUnit: 160, ownerUtilitiesPerUnit: 25 },
    NC: { label: "North Carolina rental baseline", rentPerUnit: 1700, rentToValueAnnualPct: 7.0, taxRatePct: 0.85, insuranceBase: 1350, insuranceValuePct: 0.17, managementRate: 8.5, vacancyRate: 5.5, repairsPerUnit: 175, capexPerUnit: 150 },
    NV: { label: "Nevada rental baseline", rentPerUnit: 1850, rentToValueAnnualPct: 6.6, taxRatePct: 0.7, insuranceBase: 1300, insuranceValuePct: 0.15, managementRate: 8, vacancyRate: 5.5, repairsPerUnit: 175, capexPerUnit: 150 },
    OH: { label: "Ohio rental baseline", rentPerUnit: 1250, rentToValueAnnualPct: 8.2, taxRatePct: 1.55, insuranceBase: 1350, insuranceValuePct: 0.18, managementRate: 8, vacancyRate: 6.5, repairsPerUnit: 175, capexPerUnit: 155, ownerUtilitiesPerUnit: 20 },
    PA: { label: "Pennsylvania rental baseline", rentPerUnit: 1550, rentToValueAnnualPct: 7.1, taxRatePct: 1.45, insuranceBase: 1400, insuranceValuePct: 0.18, managementRate: 8, vacancyRate: 6, repairsPerUnit: 185, capexPerUnit: 160 },
    TN: { label: "Tennessee rental baseline", rentPerUnit: 1600, rentToValueAnnualPct: 7.5, taxRatePct: 0.75, insuranceBase: 1350, insuranceValuePct: 0.17, managementRate: 8.5, vacancyRate: 6, repairsPerUnit: 175, capexPerUnit: 150 },
    TX: { label: "Texas rental baseline", rentPerUnit: 1750, rentToValueAnnualPct: 7.5, taxRatePct: 1.85, insuranceBase: 1650, insuranceValuePct: 0.18, managementRate: 8.5, vacancyRate: 6, repairsPerUnit: 190, capexPerUnit: 160 }
  };

  var ZIP_MARKET_PROFILES = {
    "303": { label: "Atlanta, GA rental band", rentPerUnit: 1750, rentToValueAnnualPct: 7.4, taxRatePct: 0.9, insuranceBase: 1500 },
    "331": { label: "Miami, FL rental band", rentPerUnit: 2650, rentToValueAnnualPct: 6.5, taxRatePct: 0.98, insuranceBase: 3600, insuranceValuePct: 0.42 },
    "372": { label: "Nashville, TN rental band", rentPerUnit: 1900, rentToValueAnnualPct: 7.1, taxRatePct: 0.75, insuranceBase: 1450 },
    "432": { label: "Columbus, OH rental band", rentPerUnit: 1450, rentToValueAnnualPct: 8.0, taxRatePct: 1.7, insuranceBase: 1350 },
    "482": { label: "Detroit, MI rental band", rentPerUnit: 1450, rentToValueAnnualPct: 8.8, taxRatePct: 1.6, insuranceBase: 1550, repairsPerUnit: 195 },
    "606": { label: "Chicago, IL rental band", rentPerUnit: 1950, rentToValueAnnualPct: 6.7, taxRatePct: 2.05, insuranceBase: 1500 },
    "752": { label: "Dallas, TX rental band", rentPerUnit: 1850, rentToValueAnnualPct: 7.4, taxRatePct: 1.9, insuranceBase: 1700 },
    "802": { label: "Denver, CO rental band", rentPerUnit: 2250, rentToValueAnnualPct: 6.1, taxRatePct: 0.6, insuranceBase: 1500 },
    "850": { label: "Phoenix, AZ rental band", rentPerUnit: 1850, rentToValueAnnualPct: 6.9, taxRatePct: 0.63, insuranceBase: 1450 },
    "851": { label: "Southeast Phoenix, AZ rental band", rentPerUnit: 1800, rentToValueAnnualPct: 6.9, taxRatePct: 0.63, insuranceBase: 1450 },
    "852": { label: "East Valley, AZ rental band", rentPerUnit: 2050, rentToValueAnnualPct: 6.4, taxRatePct: 0.63, insuranceBase: 1500 },
    "853": { label: "West Phoenix, AZ rental band", rentPerUnit: 1850, rentToValueAnnualPct: 7.0, taxRatePct: 0.63, insuranceBase: 1450, repairsPerUnit: 180 },
    "891": { label: "Las Vegas, NV rental band", rentPerUnit: 1850, rentToValueAnnualPct: 6.8, taxRatePct: 0.72, insuranceBase: 1350 }
  };

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

  function roundTo(value, increment) {
    var step = increment || 1;
    return Math.round((Number(value || 0)) / step) * step;
  }

  function postalPrefix(value) {
    var match = String(value || "").match(/\d{5}/);
    return match ? match[0].slice(0, 3) : "";
  }

  function normalizeStateCode(value) {
    return String(value || "").trim().toUpperCase().slice(0, 2);
  }

  function normalizedPostalCode(value) {
    return String(value || "").trim().slice(0, 10);
  }

  function unitCountFor(deal) {
    if (deal.propertyType === "sfr") {
      return 1;
    }
    return Math.max(1, Math.min(4, Math.round(Number(deal.unitCount || 1))));
  }

  function composeAddress(deal) {
    var cityStateZip = [
      deal.city,
      [deal.state, deal.postalCode].filter(Boolean).join(" ")
    ].filter(Boolean).join(", ");
    return [deal.streetAddress, deal.streetAddress2, cityStateZip].filter(Boolean).join(", ");
  }

  function hydrateAddressComponents(deal) {
    var hydrated = Object.assign({}, deal || {});
    var address = hydrated.address || "";
    var zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
    var stateMatch = address.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/i);

    if (!hydrated.postalCode && zipMatch) {
      hydrated.postalCode = zipMatch[0];
    }

    if (!hydrated.state && stateMatch) {
      hydrated.state = normalizeStateCode(stateMatch[1]);
    }

    if (!hydrated.streetAddress && address && !/sample deal/i.test(address)) {
      hydrated.streetAddress = address.replace(/\s*,?\s*[A-Z]{2}\s+\d{5}.*$/i, "").trim();
    }

    return hydrated;
  }

  function marketProfileFor(deal) {
    var stateCode = normalizeStateCode(deal.state);
    var prefix = postalPrefix(deal.postalCode || deal.address);
    return Object.assign(
      {},
      DEFAULT_MARKET_PROFILE,
      STATE_MARKET_PROFILES[stateCode] || {},
      ZIP_MARKET_PROFILES[prefix] || {}
    );
  }

  function buildLocalEstimates(rawDeal) {
    var deal = calculator.normalizeDeal(rawDeal);
    var profile = marketProfileFor(deal);
    var units = unitCountFor(deal);
    var valueBasis = Math.max(deal.purchasePrice || 0, deal.currentValue || 0, 225000);
    var perUnitAdjustment = units > 1 ? 0.9 : 1;
    var profileRent = profile.rentPerUnit * units * perUnitAdjustment;
    var valueRent = valueBasis * (profile.rentToValueAnnualPct / 100) / 12;
    var blendedRent = valueBasis > 0 ? (profileRent * 0.65) + (valueRent * 0.35) : profileRent;
    var repairsMonthly = (profile.repairsPerUnit * units) + (valueBasis * 0.0015 / 12);
    var capexMonthly = (profile.capexPerUnit * units) + (valueBasis * 0.001 / 12);
    var utilitiesMonthly = deal.propertyType === "small_multifamily" ? (profile.ownerUtilitiesPerUnit || 0) * units : 0;
    var insuranceAnnual = profile.insuranceBase +
      (Math.max(0, units - 1) * profile.insurancePerExtraUnit) +
      (valueBasis * profile.insuranceValuePct / 100);

    return {
      profile: profile,
      units: units,
      fields: {
        unitCount: units,
        grossMonthlyRent: roundTo(blendedRent, 25),
        vacancyRate: profile.vacancyRate,
        propertyTaxesAnnual: roundTo(valueBasis * profile.taxRatePct / 100, 50),
        insuranceAnnual: roundTo(insuranceAnnual, 25),
        managementRate: profile.managementRate,
        repairsMonthly: roundTo(repairsMonthly, 25),
        utilitiesMonthly: roundTo(utilitiesMonthly, 25),
        hoaMonthly: profile.hoaMonthly || deal.hoaMonthly || 0,
        capexMonthly: roundTo(capexMonthly, 25)
      }
    };
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
    deal = hydrateAddressComponents(deal);
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

    deal.state = normalizeStateCode(deal.state);
    deal.postalCode = normalizedPostalCode(deal.postalCode);
    deal.address = composeAddress(deal) || deal.address;

    if (deal.propertyType === "sfr") {
      deal.unitCount = 1;
      var unitField = form.querySelector("[data-field='unitCount']");
      if (unitField) {
        unitField.value = 1;
      }
    }

    base.deal = calculator.normalizeDeal(deal);
  }

  function setFormField(key, value) {
    var field = form.querySelector("[data-field='" + key + "']");
    if (field) {
      field.value = value;
    }
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

  function renderEstimateSummary() {
    if (!estimateSummary) {
      return;
    }

    var baseDeal = getBaseScenario().deal;
    var estimates = buildLocalEstimates(baseDeal);
    var fields = estimates.fields;
    estimateSummary.innerHTML = [
      estimateCell("Rent", money(fields.grossMonthlyRent) + "/mo"),
      estimateCell("Taxes", money(fields.propertyTaxesAnnual) + "/yr"),
      estimateCell("Insurance", money(fields.insuranceAnnual) + "/yr"),
      estimateCell("Management", percent(fields.managementRate, 1)),
      estimateCell("Repairs", money(fields.repairsMonthly) + "/mo"),
      estimateCell("Capex", money(fields.capexMonthly) + "/mo")
    ].join("");

    if (estimateSource) {
      estimateSource.textContent = "Source: " + estimates.profile.label + " plus REIG operating expense model.";
    }

    if (steadilyStatus && !steadilyStatus.textContent) {
      steadilyStatus.textContent = "Insurance source: Steadily widget when address data is complete.";
    }
  }

  function estimateCell(label, value) {
    return [
      "<div class='estimate-cell'>",
      "<span>" + label + "</span>",
      "<strong>" + value + "</strong>",
      "</div>"
    ].join("");
  }

  function applyLocalEstimates() {
    readFormIntoBase();
    var estimates = buildLocalEstimates(getBaseScenario().deal);

    Object.keys(estimates.fields).forEach(function applyField(key) {
      setFormField(key, estimates.fields[key]);
    });

    readFormIntoBase();
    steadilyPremiumSignature = "";
    render();
    updateSteadilyWidget(true);
    saveStatus.textContent = "Estimates applied";
    window.setTimeout(function clearStatus() {
      if (saveStatus.textContent === "Estimates applied") {
        saveStatus.textContent = "";
      }
    }, 2200);
  }

  function steadilyPropertyType(deal) {
    var units = unitCountFor(deal);
    if (units === 2) {
      return "DUPLEX";
    }
    if (units === 3) {
      return "TRIPLEX";
    }
    if (units === 4) {
      return "QUADPLEX";
    }
    return "SINGLE_FAMILY";
  }

  function updateSteadilyWidget(force) {
    if (!steadilyWidget) {
      return;
    }

    readFormIntoBase();
    var deal = getBaseScenario().deal;
    var hasAddress = deal.streetAddress && deal.city && deal.state && deal.postalCode;

    if (!hasAddress) {
      steadilyWidget.innerHTML = "<div class='steadily-empty'>Complete property address needed for live insurance.</div>";
      if (steadilyStatus) {
        steadilyStatus.textContent = "Insurance source: local model until Steadily has a complete address.";
      }
      steadilySignature = "";
      return;
    }

    var signature = [
      deal.streetAddress,
      deal.streetAddress2,
      deal.city,
      deal.state,
      deal.postalCode,
      deal.propertyType,
      deal.unitCount,
      deal.grossMonthlyRent,
      deal.currentValue || deal.purchasePrice
    ].join("|");

    if (!force && signature === steadilySignature) {
      return;
    }

    steadilySignature = signature;
    steadilyWidget.innerHTML = "";

    var widget = document.createElement("div");
    widget.className = "steadily-instant-estimate";
    widget.setAttribute("data-product", "landlord-insurance");
    widget.setAttribute("data-street_address", deal.streetAddress);
    widget.setAttribute("data-street_address_2", deal.streetAddress2 || "");
    widget.setAttribute("data-city", deal.city);
    widget.setAttribute("data-state", deal.state);
    widget.setAttribute("data-postal_code", deal.postalCode);
    widget.setAttribute("data-property_type", steadilyPropertyType(deal));
    widget.setAttribute("data-number_of_units", String(unitCountFor(deal)));
    widget.setAttribute("data-monthly_rent", String(Math.round(deal.grossMonthlyRent || 0)));
    widget.setAttribute("data-replacement_cost_estimate", String(Math.round(deal.currentValue || deal.purchasePrice || 0)));
    widget.setAttribute("data-policy_type", "dp_3");
    widget.setAttribute("data-button-text", "Add Insurance");
    widget.setAttribute("style-primary-color", "#1973ce");
    steadilyWidget.appendChild(widget);

    if (steadilyStatus) {
      steadilyStatus.textContent = "Insurance source: waiting for Steadily live estimate.";
    }

    if (global.SteadilyWidget) {
      try {
        global.SteadilyWidget.destroy();
        global.SteadilyWidget.init();
      } catch (error) {
        console.warn("Unable to refresh Steadily widget", error);
      }
    }

    observeSteadilyPremium();
  }

  function observeSteadilyPremium() {
    if (!steadilyWidget || typeof MutationObserver === "undefined") {
      return;
    }

    if (steadilyObserver) {
      steadilyObserver.disconnect();
    }

    var readPremium = function readPremium() {
      var premiumEl = steadilyWidget.querySelector(".steadily-estimate-premium-value");
      var monthlyPremium = premiumEl ? parseMoneyText(premiumEl.textContent) : 0;
      if (monthlyPremium > 0) {
        applySteadilyPremium(monthlyPremium);
      }
    };

    steadilyObserver = new MutationObserver(readPremium);
    steadilyObserver.observe(steadilyWidget, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.setTimeout(readPremium, 900);
    window.setTimeout(readPremium, 2400);
  }

  function parseMoneyText(value) {
    var match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function applySteadilyPremium(monthlyPremium) {
    var annualPremium = roundTo(monthlyPremium * 12, 25);
    var signature = steadilySignature + "|" + annualPremium;
    var insuranceField = form.querySelector("[data-field='insuranceAnnual']");

    if (!insuranceField || steadilyPremiumSignature === signature) {
      return;
    }

    steadilyPremiumSignature = signature;
    insuranceField.value = annualPremium;
    readFormIntoBase();
    render();

    if (steadilyStatus) {
      steadilyStatus.textContent = "Insurance source: Steadily live estimate " + money(annualPremium) + "/yr.";
    }
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
    renderEstimateSummary();
    renderKeyMetrics();
    renderScenarioCards();
    renderReport();
  }

  function bindEvents() {
    form.addEventListener("input", render);
    form.addEventListener("change", function onFormChange(event) {
      render();
      if (shouldRefreshSteadily(event.target)) {
        updateSteadilyWidget(true);
      }
    });

    if (estimateButton) {
      estimateButton.addEventListener("click", applyLocalEstimates);
    }

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

  function shouldRefreshSteadily(target) {
    var field = target && target.getAttribute ? target.getAttribute("data-field") : "";
    return [
      "streetAddress",
      "streetAddress2",
      "city",
      "state",
      "postalCode",
      "propertyType",
      "unitCount",
      "grossMonthlyRent",
      "purchasePrice",
      "currentValue"
    ].indexOf(field) !== -1;
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
    updateSteadilyWidget(true);
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
    },
    estimateBase: function estimateBase() {
      readFormIntoBase();
      return buildLocalEstimates(getBaseScenario().deal);
    }
  };

  init();
})(window);
