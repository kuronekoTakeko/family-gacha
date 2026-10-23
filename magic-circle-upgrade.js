/* TEST-29D5: 4層魔法陣・90度昇格・神10連の守護神降臨（神→降→臨 演出対応） */
(function () {
  "use strict";
  const overlay = document.getElementById("summon-overlay");
  const circle = document.getElementById("magic-circle");
  if (!overlay || !circle || typeof window.showMagicCircle !== "function" ||
      typeof window.summonCardsFromCircle !== "function") return;

  const rotor = circle.querySelector(".magic-circle-rotor");
  const guardian = document.getElementById("god-ten-guardian");
  if (!guardian) return;

  const guardianShadow = guardian.querySelector(".god-ten-guardian__shadow");
  const guardianFigure = guardian.querySelector(".god-ten-guardian__figure");
  const guardianTitle = guardian.querySelector(".god-ten-guardian__title");

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
  const GOD_REVEAL_MS = 1100;
  const GOD_HOLD_MS = 180;
  const KANJI_SHOW_MS = 240;
  const KANJI_GAP_MS = 110;
  const KANJI_FULL_HOLD_MS = 540;
  const KANJI_CLEAR_MS = 160;
  const UPGRADE_STEP_MS = 620;
  const UPGRADE_HOLD_MS = 260;
  const GUARDIAN_EXIT_MS = 520;

  const GUARDIAN_ASSETS = {
    male: "images/summon/guardian-god-male.webp",
    female: "images/summon/guardian-god-female.webp",
    duo: "images/summon/guardian-god-duo.webp"
  };
  const KANJI_ASSETS = {
    shin: "images/summon/god-kanji-shin.webp",
    kou: "images/summon/god-kanji-kou.webp",
    rin: "images/summon/god-kanji-rin.webp"
  };

  let generation = 0;
  let showTime = 0;
  let isSummoning = false;
  let planForRun = null;

  function colorLevel(color) { return Math.max(0, order.indexOf(color)); }

  function getSequentialColors(startColor, finalColor) {
    const startLevel = colorLevel(startColor);
    const finalLevel = colorLevel(finalColor);
    return order.filter(function (color) {
      const level = colorLevel(color);
      return level > startLevel && level <= finalLevel;
    });
  }

  function ensureKanjiContainer() {
    let container = overlay.querySelector("#god-ten-kanji");
    if (container) return container;

    container = document.createElement("div");
    container.id = "god-ten-kanji";
    container.setAttribute("aria-hidden", "true");

    [
      { key: "shin", alt: "神" },
      { key: "kou", alt: "降" },
      { key: "rin", alt: "臨" }
    ].forEach(function (item) {
      const img = document.createElement("img");
      img.className = "god-ten-kanji__char god-ten-kanji__char--" + item.key;
      img.dataset.kanji = item.key;
      img.alt = "";
      img.decoding = "async";
      img.src = KANJI_ASSETS[item.key];
      container.appendChild(img);
    });

    overlay.appendChild(container);
    return container;
  }

  const kanjiContainer = ensureKanjiContainer();

  function clearGuardianClasses() {
    overlay.classList.remove(
      "family-god-shadow",
      "family-god-white",
      "family-god-rainbow",
      "family-god-reveal",
      "family-god-summon",
      "family-god-exit",
      "family-god-kanji-active"
    );
  }

  function clearKanjiClasses() {
    if (!kanjiContainer) return;
    kanjiContainer.querySelectorAll(".god-ten-kanji__char").forEach(function (node) {
      node.classList.remove("show");
    });
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

  function setGuardianVariant(variant) {
    const src = GUARDIAN_ASSETS[variant] || GUARDIAN_ASSETS.male;
    if (guardianShadow) guardianShadow.src = src;
    if (guardianFigure) guardianFigure.src = src;
    guardian.dataset.variant = variant || "male";
  }

  function prepareRun() {
    ++generation;
    isSummoning = false;
    planForRun = window.familyGachaSummonMeta && window.familyGachaSummonMeta.circlePlan;
    const start = planForRun && planForRun.startColor || "blue";
    clearGuardianClasses();
    clearKanjiClasses();
    setRotationPaused(false);
    setGuardianVariant(planForRun && planForRun.guardianVariant || "male");
    if (guardianTitle) guardianTitle.style.display = "none";
    circle.dataset.familyColor = start;
    order.forEach(function (c, i) {
      layers[c].classList.toggle("family-visible", i <= colorLevel(start));
      layers[c].classList.remove("family-reveal");
    });
  }

  function scheduleKanjiBurst(token, startAt) {
    const sequence = ["shin", "kou", "rin"];
    sequence.forEach(function (key, index) {
      const node = kanjiContainer.querySelector('[data-kanji="' + key + '"]');
      const onAt = startAt + index * (KANJI_SHOW_MS + KANJI_GAP_MS);
      setTimeout(function () {
        if (token !== generation || !circle.classList.contains("show")) return;
        overlay.classList.add("family-god-kanji-active");
        if (node) node.classList.add("show");
      }, onAt);
    });
    const totalReveal = sequence.length * KANJI_SHOW_MS + (sequence.length - 1) * KANJI_GAP_MS;
    const clearAt = startAt + totalReveal + KANJI_FULL_HOLD_MS;
    setTimeout(function () {
      if (token !== generation) return;
      overlay.classList.remove("family-god-kanji-active");
      clearKanjiClasses();
    }, clearAt + KANJI_CLEAR_MS);
    return totalReveal + KANJI_FULL_HOLD_MS + KANJI_CLEAR_MS;
  }

  function scheduleGodUpgrades(token, startAt) {
    const path = planForRun && planForRun.pathColors || [];
    path.forEach(function (color, index) {
      setTimeout(function () {
        if (token !== generation || !circle.classList.contains("show")) return;
        revealTo(color, token, false);
      }, startAt + index * UPGRADE_STEP_MS);
    });
    return path.length ? path.length * UPGRADE_STEP_MS + UPGRADE_HOLD_MS : 0;
  }

  function playGuardianEntrance(token) {
    if (!planForRun || !planForRun.isGodTen) return 0;

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

    let cursor = GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS + GOD_WHITE_MS + GOD_REVEAL_MS + GOD_HOLD_MS;
    cursor += scheduleKanjiBurst(token, cursor);
    cursor += scheduleGodUpgrades(token, cursor);

    setTimeout(function () {
      if (token !== generation || !circle.classList.contains("show")) return;
      setRotationPaused(false);
      overlay.classList.add("family-god-summon");
    }, cursor);

    return cursor;
  }

  function exitGuardianAfterSummon(token) {
    if (!planForRun || !planForRun.isGodTen) return;
    overlay.classList.add("family-god-exit");
    overlay.classList.remove("family-god-summon");
    setTimeout(function () {
      if (token !== generation) return;
      clearGuardianClasses();
      clearKanjiClasses();
    }, GUARDIAN_EXIT_MS + 50);
  }

  const nativeShow = window.showMagicCircle;
  window.showMagicCircle = function () {
    prepareRun();
    const result = nativeShow.apply(this, arguments);
    showTime = performance.now();
    const token = generation;
    const baseDelay = planForRun && planForRun.isGodTen ? playGuardianEntrance(token) : 0;

    if (planForRun && !planForRun.isGodTen && planForRun.timingType === "pre") {
      planForRun.pathColors.forEach(function (color, i) {
        setTimeout(function () { revealTo(color, token, false); }, baseDelay + (i + 1) * ROTATION_QUARTER_MS);
      });
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
      const pathLen = plan.pathColors ? plan.pathColors.length : 0;
      readyAfterShow = GOD_FREEZE_DELAY_MS + GOD_SHADOW_MS + GOD_WHITE_MS + GOD_REVEAL_MS + GOD_HOLD_MS +
        (3 * KANJI_SHOW_MS + 2 * KANJI_GAP_MS + KANJI_CLEAR_MS) +
        (pathLen ? pathLen * UPGRADE_STEP_MS + UPGRADE_HOLD_MS : 0);
    } else if (plan && plan.timingType === "pre" && plan.pathColors.length) {
      readyAfterShow += plan.pathColors.length * ROTATION_QUARTER_MS + REVEAL_MS;
    }
    const elapsed = Math.max(0, performance.now() - showTime);
    const wait = Math.max(0, Math.ceil(readyAfterShow - elapsed));

    const startCards = function () {
      if (token !== generation) return Promise.resolve();
      isSummoning = true;
      if (plan && !plan.isGodTen && plan.timingType === "mid") {
        const interval = plan.summonIntervalMs || 650;
        plan.pathColors.forEach(function (color, index) {
          const after = plan.stepCardIndices[index] || (2 + index * 2);
          setTimeout(function () {
            if (isSummoning) revealTo(color, token, false);
          }, Math.max(450, after * interval));
        });
      }
      return Promise.resolve(nativeSummon.apply(thisArg, originalArgs)).then(function (v) {
        if (token === generation) {
          isSummoning = false;
          exitGuardianAfterSummon(token);
        }
        return v;
      }, function (e) {
        if (token === generation) {
          isSummoning = false;
          exitGuardianAfterSummon(token);
        }
        throw e;
      });
    };
    if (!wait) return startCards();
    return new Promise(function (resolve, reject) {
      setTimeout(function () { startCards().then(resolve, reject); }, Math.max(0, Math.ceil(wait)));
    });
  };
})();
