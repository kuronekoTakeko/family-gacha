/* STEP 31A TEST ONLY — normal ten-pull balance candidate.
   Load AFTER gacha-balance.js, and only in the STEP31A test iframe.
   This script intentionally does not modify the game's regular page. */
(function () {
  "use strict";
  if (typeof rarityRates === "undefined" || typeof window.drawTenCards !== "function") return;

  const rates = { N: 62, R: 25, SR: 10, SSR: 2.4, UR: 0.6 };
  rarityRates.forEach(function (row) {
    if (Object.prototype.hasOwnProperty.call(rates, row.rarity)) row.rate = rates[row.rarity];
  });

  const normalDraw = window.drawTenCards;
  const level = { blue: 0, purple: 1, gold: 2, rainbow: 3 };

  function choosePath(color) {
    if (color === "purple") return ["purple"];
    if (color === "gold") return Math.random() < .65 ? ["purple", "gold"] : ["gold"];
    if (color === "rainbow") {
      const roll = Math.random();
      return roll < .55 ? ["purple", "gold", "rainbow"]
        : roll < .80 ? ["gold", "rainbow"] : ["rainbow"];
    }
    return [];
  }

  function chooseTiming(pathLength) {
    if (!pathLength) return { type: "none", indices: [] };
    if (Math.random() < .35) return { type: "pre", indices: [] };
    const patterns = pathLength === 1 ? [[2], [3], [5], [7]]
      : pathLength === 2 ? [[2, 5], [3, 6], [2, 7]]
      : [[2, 4, 6], [3, 5, 7]];
    return { type: "mid", indices: patterns[Math.floor(Math.random() * patterns.length)] };
  }

  function chooseSpecialStart(hasUR, hasSSR, rareCount) {
    // Occasional rare-color opening, rather than a mid-summon upgrade.
    // Only good result groups qualify; a single SR remains blue.
    const roll = Math.random();
    if (hasUR) return roll < .01 ? "rainbow" : roll < .05 ? "gold" : roll < .10 ? "purple" : "blue";
    if (hasSSR) return roll < .02 ? "gold" : roll < .09 ? "purple" : "blue";
    if (rareCount >= 2) return roll < .05 ? "purple" : "blue";
    return "blue";
  }

  function makePlan(cards) {
    const rareCount = cards.filter(function (c) { return ["SR", "SSR", "UR"].includes(c.rarity); }).length;
    const hasUR = cards.some(function (c) { return c.rarity === "UR"; });
    const hasSSR = cards.some(function (c) { return c.rarity === "SSR"; });
    const highestRarity = hasUR ? "UR" : hasSSR ? "SSR" : rareCount ? "SR"
      : cards.some(function (c) { return c.rarity === "R"; }) ? "R" : "N";
    // Independent roll for every ten-pull, conditional on the ACTUAL result.
    const upgradeChance = hasUR ? .80 : hasSSR ? .50 : rareCount >= 2 ? .30 : 0;
    const doUpgrade = Math.random() < upgradeChance;
    let startColor = "blue";
    let finalColor = "blue";
    let pathColors = [];
    let timing = { type: "none", indices: [] };
    if (doUpgrade) {
      if (hasUR) finalColor = Math.random() < .70 ? "rainbow" : "gold";
      else if (hasSSR) finalColor = Math.random() < .40 ? "gold" : "purple";
      else finalColor = "purple";
      const chosenPath = choosePath(finalColor);
      timing = chooseTiming(chosenPath.length);
      // Pre-appearance color upgrades keep the current step-by-step display.
      pathColors = timing.type === "pre"
        ? ["purple", "gold", "rainbow"].filter(function (c) { return level[c] <= level[finalColor]; })
        : chosenPath;
    } else {
      startColor = chooseSpecialStart(hasUR, hasSSR, rareCount);
      finalColor = startColor;
    }
    return {
      isGodTen: false, guardianVariant: null, highestRarity: highestRarity,
      startColor: startColor, finalColor: finalColor, pathColors: pathColors,
      timingType: timing.type, stepCardIndices: timing.indices,
      summonIntervalMs: 650, plannedAt: Date.now()
    };
  }

  window.drawTenCards = function () {
    const cards = normalDraw.apply(this, arguments);
    const meta = window.familyGachaSummonMeta;
    if (meta && !meta.isGodTen) {
      meta.circlePlan = makePlan(cards);
      meta.version = "31A-test";
      window.familyGachaSummonMeta = meta;
      window.dispatchEvent(new CustomEvent("family-gacha:draw-ready", { detail: meta }));
    }
    return cards;
  };
  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -31A / JS OK";
})();
