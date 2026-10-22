/* TEST-29D2: 4層魔法陣・90度昇格・神10連の守護神降臨 */
(function () {
  "use strict";
  const overlay = document.getElementById("summon-overlay");
  const circle = document.getElementById("magic-circle");
  if (!overlay || !circle || typeof window.showMagicCircle !== "function" ||
      typeof window.summonCardsFromCircle !== "function") return;

  const rotor = circle.querySelector(".magic-circle-rotor");
  const guardian = document.getElementById("god-ten-guardian");
  const layers = {
    blue: circle.querySelector(".layer-blue"),
    purple: circle.querySelector(".layer-purple"),
    gold: circle.querySelector(".layer-gold"),
    rainbow: circle.querySelector(".layer-rainbow")
  };
  if (Object.values(layers).some(function (x) { return !x; })) return;

  const order = ["blue", "purple", "gold", "rainbow"];
  const ROTATION_QUARTER_MS = 2000;
  const REVEAL_MS = 380;
  const GOD_FREEZE_DELAY_MS = 850;
  const GOD_SHADOW_MS = 480;
  const GOD_WHITE_MS = 620;
  const GOD_REVEAL_MS = 1240;
  const GOD_HOLD_MS = 780;
  const GOD_FADE_MS = 520;
  const GOD_TOTAL_MS = GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS + GOD_WHITE_MS + GOD_REVEAL_MS + GOD_HOLD_MS + GOD_FADE_MS;

  let generation = 0;
  let showTime = 0;
  let isSummoning = false;
  let planForRun = null;

  function colorLevel(color) { return Math.max(0, order.indexOf(color)); }

  function clearGuardianClasses() {
    overlay.classList.remove(
      "family-god-shadow",
      "family-god-white",
      "family-god-rainbow",
      "family-god-reveal",
      "family-god-exit"
    );
  }

  function setRotationPaused(paused) {
    circle.classList.toggle("family-paused", !!paused);
    if (rotor) rotor.style.animationPlayState = paused ? "paused" : "running";
  }

  function revealTo(color, token, immediate) {
    if (token !== generation || !circle.classList.contains("show")) return;
    const index = colorLevel(color);
    circle.dataset.familyColor = order[index];
    order.forEach(function (c, i) {
      const layer = layers[c];
      layer.classList.toggle("family-visible", i <= index);
      layer.classList.remove("family-reveal");
    });
    if (!immediate && layers[color]) {
      layers[color].classList.add("family-reveal");
      setTimeout(function () {
        if (token === generation) layers[color].classList.remove("family-reveal");
      }, REVEAL_MS);
    }
  }

  function prepareRun() {
    ++generation;
    isSummoning = false;
    planForRun = window.familyGachaSummonMeta && window.familyGachaSummonMeta.circlePlan;
    const start = planForRun && planForRun.startColor || "blue";
    clearGuardianClasses();
    setRotationPaused(false);
    circle.dataset.familyColor = start;
    order.forEach(function (c, i) {
      layers[c].classList.toggle("family-visible", i <= colorLevel(start));
      layers[c].classList.remove("family-reveal");
    });
  }

  function playGuardianSequence(token) {
    if (!planForRun || !planForRun.isGodTen) return;
    setTimeout(function () {
      if (token !== generation || !circle.classList.contains("show")) return;
      setRotationPaused(true);
      overlay.classList.add("family-god-shadow");
    }, GOD_FREEZE_DELAY_MS);
    setTimeout(function () {
      if (token !== generation || !circle.classList.contains("show")) return;
      overlay.classList.add("family-god-white");
    }, GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS);
    setTimeout(function () {
      if (token !== generation || !circle.classList.contains("show")) return;
      overlay.classList.add("family-god-rainbow", "family-god-reveal");
    }, GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS + GOD_WHITE_MS);
    setTimeout(function () {
      if (token !== generation || !circle.classList.contains("show")) return;
      overlay.classList.add("family-god-exit");
      setRotationPaused(false);
    }, GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS + GOD_WHITE_MS + GOD_REVEAL_MS + GOD_HOLD_MS);
    setTimeout(function () {
      if (token !== generation) return;
      clearGuardianClasses();
    }, GOD_TOTAL_MS + 50);
  }

  const nativeShow = window.showMagicCircle;
  window.showMagicCircle = function () {
    prepareRun();
    const result = nativeShow.apply(this, arguments);
    showTime = performance.now();
    const token = generation;
    const baseDelay = planForRun && planForRun.isGodTen ? GOD_TOTAL_MS : 0;

    if (planForRun && planForRun.timingType === "pre") {
      planForRun.pathColors.forEach(function (color, i) {
        setTimeout(function () { revealTo(color, token, false); }, baseDelay + (i + 1) * ROTATION_QUARTER_MS);
      });
    }
    if (planForRun && planForRun.isGodTen) {
      playGuardianSequence(token);
    }
    return result;
  };

  const nativeSummon = window.summonCardsFromCircle;
  window.summonCardsFromCircle = function (cardElements) {
    const originalArgs = arguments;
    const thisArg = this;
    const plan = planForRun;
    const token = generation;
    let readyAfterShow = 0;
    if (plan && plan.isGodTen) {
      readyAfterShow += GOD_TOTAL_MS;
    }
    if (plan && plan.timingType === "pre" && plan.pathColors.length) {
      readyAfterShow += plan.pathColors.length * ROTATION_QUARTER_MS + REVEAL_MS;
    }
    const elapsed = Math.max(0, performance.now() - showTime);
    const wait = Math.max(0, Math.ceil(readyAfterShow - elapsed));

    const startCards = function () {
      if (token !== generation) return Promise.resolve();
      isSummoning = true;
      if (plan && plan.timingType === "mid") {
        const interval = plan.summonIntervalMs || 650;
        plan.pathColors.forEach(function (color, index) {
          const after = plan.stepCardIndices[index] || (2 + index * 2);
          setTimeout(function () {
            if (isSummoning) revealTo(color, token, false);
          }, Math.max(450, after * interval));
        });
      }
      return Promise.resolve(nativeSummon.apply(thisArg, originalArgs)).then(function (v) {
        if (token === generation) isSummoning = false;
        return v;
      }, function (e) {
        if (token === generation) isSummoning = false;
        throw e;
      });
    };
    if (!wait) return startCards();
    return new Promise(function (resolve, reject) {
      setTimeout(function () { startCards().then(resolve, reject); }, Math.max(0, Math.ceil(wait)));
    });
  };
})();
