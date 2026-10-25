/* STEP 31C: balanced rarity rates & meaningful upgrades; God Ten preserved. */
(function () {
  "use strict";

  const newRates = { N: 62, R: 25, SR: 10, SSR: 2.4, UR: 0.6 };
  const GOD_TEN_CHANCE = 0.01; // 1%
  const SUMMON_INTERVAL_MS = 650;
  const rarityOrder = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
  const colorOrder = ["blue", "purple", "gold", "rainbow"];

  rarityRates.forEach(function (entry) {
    if (Object.prototype.hasOwnProperty.call(newRates, entry.rarity)) {
      entry.rate = newRates[entry.rarity];
    }
  });

  function colorLevel(color) {
    return Math.max(0, colorOrder.indexOf(color));
  }

  function rollPercentTable(table) {
    const roll = Math.random() * 100;
    let sum = 0;
    for (let i = 0; i < table.length; i++) {
      sum += table[i].rate;
      if (roll < sum) return table[i].value;
    }
    return table[table.length - 1].value;
  }

  function getHighestRarity(results) {
    return results.reduce(function (best, card) {
      return rarityOrder[card.rarity] > rarityOrder[best] ? card.rarity : best;
    }, "N");
  }

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


  function buildCirclePlan(results, isGodTen) {
    const highestRarity = getHighestRarity(results);

    if (isGodTen) {
      const finalColor = highestRarity === "UR" ? "rainbow"
        : highestRarity === "SSR" ? "gold"
        : "purple";
      // 神10連のURは二神確定。SR/SSRは男神・女神を独立に50%ずつ選択。
      const guardianVariant = highestRarity === "UR" ? "duo"
        : (Math.random() < 0.5 ? "male" : "female");
      const pathColors = colorOrder.filter(function (color) {
        return colorLevel(color) > colorLevel("blue") &&
               colorLevel(color) <= colorLevel(finalColor);
      });
      return {
        isGodTen: true,
        guardianVariant: guardianVariant,
        highestRarity: highestRarity,
        startColor: "blue",
        finalColor: finalColor,
        pathColors: pathColors,
        timingType: "god-pre",
        stepCardIndices: [],
        summonIntervalMs: SUMMON_INTERVAL_MS,
        plannedAt: Date.now()
      };
    }

    return makePlan(results);
  }

  function drawGodTenCards() {
    const results = [];
    let guard = 0;
    while (results.length < 10 && guard < 7000) {
      const card = drawOneCard();
      if (rarityOrder[card.rarity] >= rarityOrder.SR) {
        results.push(card);
      }
      guard += 1;
    }
    // 例外的な抽選回数超過時でも、神10連のSR以上保証は必ず守る。
    if (results.length < 10) {
      const rareCards = cardPool.filter(function (card) {
        return rarityOrder[card.rarity] >= rarityOrder.SR;
      });
      while (results.length < 10 && rareCards.length) {
        results.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
      }
    }
    return results;
  }

  window.drawTenCards = function () {
    const isGodTen = Math.random() < GOD_TEN_CHANCE;
    const results = isGodTen ? drawGodTenCards() : (function () {
      const normalResults = [];
      for (let i = 0; i < 10; i++) normalResults.push(drawOneCard());
      return normalResults;
    })();

    const meta = {
      version: "31C",
      isGodTen: isGodTen,
      godTenChance: GOD_TEN_CHANCE,
      circlePlan: buildCirclePlan(results, isGodTen)
    };

    window.familyGachaSummonMeta = meta;
    window.dispatchEvent(new CustomEvent("family-gacha:draw-ready", { detail: meta }));
    return results;
  };

  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -31C / JS OK";
})();
