/* TEST-29D5: 神10連1%＋守護神降臨＋特殊スタート確率調整 */
(function () {
  "use strict";

  const newRates = { N: 65, R: 25, SR: 8, SSR: 1.5, UR: 0.5 };
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

  function chooseFinalCircle(highestRarity) {
    if (highestRarity === "N" || highestRarity === "R") return "blue";
    if (highestRarity === "SR") {
      return rollPercentTable([
        { value: "blue", rate: 80 },
        { value: "purple", rate: 20 }
      ]);
    }
    if (highestRarity === "SSR") {
      return rollPercentTable([
        { value: "blue", rate: 65 },
        { value: "purple", rate: 25 },
        { value: "gold", rate: 10 }
      ]);
    }
    if (highestRarity === "UR") {
      return rollPercentTable([
        { value: "blue", rate: 50 },
        { value: "purple", rate: 25 },
        { value: "gold", rate: 20 },
        { value: "rainbow", rate: 5 }
      ]);
    }
    return "blue";
  }

  // 10連全体で紫約5% / 金約1% / 虹約0.1%。
  // まず元の最終色を決め、その範囲内で開始色を抽選する。
  // 神10連1%を含む理論上の最終色分布から条件付き確率を計算。
  // 最終色（および元の昇格抽選確率）には手を加えない。
  const START_CHANCE = {
    purple: 0.319841694265,
    gold: 0.386630948963,
    rainbow: 0.381580342660
  };

  function chooseSpecialStart(finalColor) {
    const maxLevel = colorLevel(finalColor);
    if (maxLevel >= 3 && Math.random() < START_CHANCE.rainbow) return "rainbow";
    if (maxLevel >= 2 && Math.random() < START_CHANCE.gold) return "gold";
    if (maxLevel >= 1 && Math.random() < START_CHANCE.purple) return "purple";
    return "blue";
  }

  function chooseUpgradePath(finalColor) {
    if (finalColor === "blue") return [];
    if (finalColor === "purple") return ["purple"];
    if (finalColor === "gold") {
      return Math.random() < 0.70 ? ["purple", "gold"] : ["gold"];
    }
    if (finalColor === "rainbow") {
      const roll = Math.random();
      if (roll < 0.60) return ["purple", "gold", "rainbow"];
      if (roll < 0.85) return ["gold", "rainbow"];
      return ["rainbow"];
    }
    return [];
  }

  function chooseTiming(pathLength) {
    if (pathLength <= 0) return { type: "none", cardIndices: [] };
    if (Math.random() < 0.30) return { type: "pre", cardIndices: [] };
    if (pathLength === 1) {
      const patterns = [[2], [3], [5], [7]];
      return { type: "mid", cardIndices: patterns[Math.floor(Math.random() * patterns.length)] };
    }
    if (pathLength === 2) {
      const patterns = [[2, 5], [3, 6], [2, 7]];
      return { type: "mid", cardIndices: patterns[Math.floor(Math.random() * patterns.length)] };
    }
    const patterns = [[2, 4, 6], [3, 5, 7]];
    return { type: "mid", cardIndices: patterns[Math.floor(Math.random() * patterns.length)] };
  }

  function buildCirclePlan(results, isGodTen) {
    const highestRarity = getHighestRarity(results);

    if (isGodTen) {
      const finalColor = highestRarity === "UR" ? "rainbow"
        : highestRarity === "SSR" ? "gold"
        : "purple";
      const guardianVariant = highestRarity === "UR" ? "duo"
        : highestRarity === "SSR" ? "male"
        : "female";
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

    const finalColor = chooseFinalCircle(highestRarity);
    const startColor = chooseSpecialStart(finalColor);

    const roughPath = chooseUpgradePath(finalColor).filter(function (color) {
      return colorLevel(color) > colorLevel(startColor);
    });
    const pathColors = roughPath.length || startColor === finalColor ? roughPath : [finalColor];
    const timing = chooseTiming(pathColors.length);
    const sequentialColors = ["purple", "gold", "rainbow"].filter(function (color) {
      return colorLevel(color) > colorLevel(startColor) &&
             colorLevel(color) <= colorLevel(finalColor);
    });
    const actualPath = timing.type === "pre" ? sequentialColors : pathColors;

    return {
      isGodTen: false,
      guardianVariant: null,
      highestRarity: highestRarity,
      startColor: startColor,
      finalColor: finalColor,
      pathColors: actualPath,
      timingType: timing.type,
      stepCardIndices: timing.cardIndices,
      summonIntervalMs: SUMMON_INTERVAL_MS,
      plannedAt: Date.now()
    };
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
      version: "29D5",
      isGodTen: isGodTen,
      godTenChance: GOD_TEN_CHANCE,
      circlePlan: buildCirclePlan(results, isGodTen)
    };

    window.familyGachaSummonMeta = meta;
    window.dispatchEvent(new CustomEvent("family-gacha:draw-ready", { detail: meta }));
    return results;
  };

  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -29D5 / JS OK";
})();
