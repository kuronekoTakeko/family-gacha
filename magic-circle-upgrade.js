/* TEST-29B: 同心円の4レイヤーを同期回転させて段階昇格する。
   showMagicCircle / summonCardsFromCircle を薄くラップ。
   10枚の飛行処理には手を付けない。 */
(function () {
  "use strict";
  const circle = document.getElementById("magic-circle");
  if (!circle || typeof window.showMagicCircle !== "function" ||
      typeof window.summonCardsFromCircle !== "function") return;

  const layers = {
    blue: circle.querySelector(".layer-blue"),
    purple: circle.querySelector(".layer-purple"),
    gold: circle.querySelector(".layer-gold"),
    rainbow: circle.querySelector(".layer-rainbow")
  };
  if (Object.values(layers).some(function(x) { return !x; })) return;

  const order = ["blue", "purple", "gold", "rainbow"];
  const ROTATION_QUARTER_MS = 2000; // 元の8秒/周の90度
  const REVEAL_MS = 380;
  let generation = 0;
  let showTime = 0;
  let isSummoning = false;
  let planForRun = null;

  function colorLevel(color) { return Math.max(0, order.indexOf(color)); }

  function revealTo(color, token, immediate) {
    if (token !== generation || !circle.classList.contains("show")) return;
    const index = colorLevel(color);
    circle.dataset.familyColor = order[index];
    order.forEach(function(c, i) {
      const layer = layers[c];
      layer.classList.toggle("family-visible", i <= index);
      layer.classList.remove("family-reveal");
    });
    if (!immediate && layers[color]) {
      layers[color].classList.add("family-reveal");
      setTimeout(function() {
        if (token === generation) layers[color].classList.remove("family-reveal");
      }, REVEAL_MS);
    }
  }

  function prepareRun() {
    ++generation;
    isSummoning = false;
    planForRun = window.familyGachaSummonMeta && window.familyGachaSummonMeta.circlePlan;
    const start = planForRun && planForRun.startColor || "blue";
    // 元の表示終了アニメーションのタイマーに干渉しない。
    circle.classList.remove("family-circle-impact");
    circle.dataset.familyColor = start;
    order.forEach(function(c, i) {
      layers[c].classList.toggle("family-visible", i <= colorLevel(start));
      layers[c].classList.remove("family-reveal");
    });
  }

  const nativeShow = window.showMagicCircle;
  window.showMagicCircle = function() {
    prepareRun();
    const result = nativeShow.apply(this, arguments);
    showTime = performance.now();
    const token = generation;
    if (planForRun && planForRun.timingType === "pre") {
      planForRun.pathColors.forEach(function(color, i) {
        setTimeout(function() { revealTo(color, token, false); }, (i + 1) * ROTATION_QUARTER_MS);
      });
    }
    return result;
  };

  const nativeSummon = window.summonCardsFromCircle;
  window.summonCardsFromCircle = function(cardElements) {
    const originalArgs = arguments;
    const thisArg = this;
    const plan = planForRun;
    const token = generation;
    let wait = 0;

    if (plan && plan.timingType === "pre" && plan.pathColors.length) {
      const preDuration = plan.pathColors.length * ROTATION_QUARTER_MS + REVEAL_MS;
      wait = Math.max(0, Math.ceil(showTime + preDuration - performance.now()));
    }

    const startCards = function() {
      if (token !== generation) return Promise.resolve();
      isSummoning = true;
      if (plan && plan.timingType === "mid") {
        const interval = plan.summonIntervalMs || 650;
        plan.pathColors.forEach(function(color, index) {
          const after = plan.stepCardIndices[index] || (2 + index * 2);
          // 2枚目〜7枚目付近。既存のカード移動時間に変更なし。
          setTimeout(function() {
            if (isSummoning) revealTo(color, token, false);
          }, Math.max(450, after * interval));
        });
      }
      return Promise.resolve(nativeSummon.apply(thisArg, originalArgs)).then(function(v) {
        if (token === generation) isSummoning = false;
        return v;
      }, function(e) {
        if (token === generation) isSummoning = false;
        throw e;
      });
    };
    if (!wait) return startCards();
    return new Promise(function(resolve, reject) {
      setTimeout(function() { startCards().then(resolve, reject); }, wait);
    });
  };
})();
