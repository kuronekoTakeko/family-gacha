/* TEST-29A: 10連排出バランス調整＋神10連1%＋召喚魔法陣昇格プラン作成
   app.js自体は変更せず、抽選結果と演出用メタ情報だけを上書きする。 */
(function () {
  "use strict";

  const newRates = { N: 65, R: 25, SR: 8, SSR: 1.5, UR: 0.5 };
  const GOD_TEN_CHANCE = 0.01; // 1%
  const SUMMON_INTERVAL_MS = 650;
  const rarityOrder = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };

  rarityRates.forEach(function (entry) {
    if (Object.prototype.hasOwnProperty.call(newRates, entry.rarity)) {
      entry.rate = newRates[entry.rarity];
    }
  });

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
    const finalColor = chooseFinalCircle(highestRarity);
    // 特別な初期色。15%は暫定値（最終色の確率はそのまま）。
    // ここでは最終色までしか選ばないため、期待外れの色は絶対に出ない。
    const colorLevel = { blue: 0, purple: 1, gold: 2, rainbow: 3 };
    const startCandidates = ["purple", "gold", "rainbow"].filter(function(color) {
      return colorLevel[color] <= colorLevel[finalColor];
    });
    const startColor = startCandidates.length && Math.random() < 0.15
      ? startCandidates[Math.floor(Math.random() * startCandidates.length)]
      : "blue";

    // 途中昇格は通常／飛び級を混ぜる（元の選択率を保持）。
    const roughPath = chooseUpgradePath(finalColor).filter(function(color) {
      return colorLevel[color] > colorLevel[startColor];
    });
    // 最終色まで必ず到達させる。
    const pathColors = roughPath.length || startColor === finalColor
      ? roughPath : [finalColor];
    const timing = chooseTiming(pathColors.length);
    // 召喚前は90度ごとの段階演出を優先し、飛び級しない。
    const sequentialColors = ["purple", "gold", "rainbow"].filter(function(color) {
      return colorLevel[color] > colorLevel[startColor] &&
             colorLevel[color] <= colorLevel[finalColor];
    });
    const actualPath = timing.type === "pre" ? sequentialColors : pathColors;
    return {
      isGodTen: isGodTen,
      highestRarity: highestRarity,
      finalColor: finalColor,
      startColor: startColor,
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
    while (results.length < 10 && guard < 5000) {
      const card = drawOneCard();
      if (rarityOrder[card.rarity] >= rarityOrder.SR) {
        results.push(card);
      }
      guard += 1;
    }
    if (results.length < 10) {
      // 念のための保険。通常抽選で埋めるが、この分岐には通常入りません。
      while (results.length < 10) results.push(drawOneCard());
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
      version: "29B",
      isGodTen: isGodTen,
      godTenChance: GOD_TEN_CHANCE,
      circlePlan: buildCirclePlan(results, isGodTen)
    };

    window.familyGachaSummonMeta = meta;
    window.dispatchEvent(new CustomEvent("family-gacha:draw-ready", { detail: meta }));
    return results;
  };

  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -29B / JS OK";
})();
