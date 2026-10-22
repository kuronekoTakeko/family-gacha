/* TEST-29A: 召喚魔法陣の昇格演出（青→紫→金→虹）
   drawTenCards() で作られた familyGachaSummonMeta.circlePlan を読み取り、
   魔法陣の画像・光・サイズだけを切り替える。カード移動処理は変更しない。 */
(function () {
  "use strict";

  const COLOR_SRC = {
    blue: "images/summon/magic-circle-blue.png",
    purple: "images/summon/magic-circle-purple.png",
    gold: "images/summon/magic-circle-gold.png",
    rainbow: "images/summon/magic-circle-rainbow.png"
  };
  const SCALE_MAP = { blue: 1, purple: 1.05, gold: 1.10, rainbow: 1.15 };
  let lastStartedAt = 0;

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity || "1") > 0 && el.getBoundingClientRect().width > 0;
  }

  function getParts() {
    return {
      overlay: document.getElementById("summon-overlay"),
      circle: document.getElementById("magic-circle"),
      image: document.querySelector("#magic-circle .magic-circle-image")
    };
  }

  function setRotationPaused(parts, paused) {
    [parts.circle, parts.image].forEach(function (el) {
      if (el) el.style.animationPlayState = paused ? "paused" : "running";
    });
  }

  function setCircleColor(parts, color) {
    if (!parts.circle || !parts.image) return;
    parts.circle.dataset.familyColor = color;
    parts.circle.style.setProperty("--family-circle-scale", String(SCALE_MAP[color] || 1));
    if (parts.image.getAttribute("src") !== COLOR_SRC[color]) {
      parts.image.setAttribute("src", COLOR_SRC[color]);
    }
  }

  function resetCircle(parts) {
    if (!parts.circle || !parts.image) return;
    parts.circle.classList.remove("family-circle-impact");
    parts.circle.dataset.familyColor = "blue";
    parts.circle.style.setProperty("--family-circle-scale", "1");
    parts.image.setAttribute("src", COLOR_SRC.blue);
    setRotationPaused(parts, false);
  }

  function upgradeStep(parts, color) {
    if (!parts.circle || !parts.image) return;
    setRotationPaused(parts, true);
    parts.circle.classList.add("family-circle-impact");
    window.setTimeout(function () { setCircleColor(parts, color); }, 130);
    window.setTimeout(function () {
      parts.circle.classList.remove("family-circle-impact");
      setRotationPaused(parts, false);
    }, 560);
  }

  function startPlan(meta) {
    const parts = getParts();
    if (!parts.overlay || !parts.circle || !parts.image) return;
    resetCircle(parts);
    const plan = meta && meta.circlePlan;
    if (!plan || !Array.isArray(plan.pathColors) || plan.pathColors.length === 0) return;

    if (plan.timingType === "pre") {
      plan.pathColors.forEach(function (color, index) {
        window.setTimeout(function () { if (isVisible(parts.overlay)) upgradeStep(parts, color); }, 200 + (index * 820));
      });
      return;
    }

    const interval = plan.summonIntervalMs || 650;
    plan.pathColors.forEach(function (color, index) {
      const afterCard = plan.stepCardIndices[index] || (2 + index * 2);
      const delay = Math.max(450, (afterCard * interval) + 130);
      window.setTimeout(function () { if (isVisible(parts.overlay)) upgradeStep(parts, color); }, delay);
    });
  }

  function tick() {
    const meta = window.familyGachaSummonMeta;
    const parts = getParts();
    if (!meta || !parts.overlay || !parts.circle || !parts.image) return;
    const plan = meta.circlePlan;
    if (!plan) return;

    if (!isVisible(parts.overlay)) {
      if (plan.started) {
        plan.started = false;
        plan.finishedAt = Date.now();
      }
      return;
    }

    if (plan.started) return;
    const token = plan.plannedAt || Date.now();
    if (token === lastStartedAt) return;
    plan.started = true;
    lastStartedAt = token;
    startPlan(meta);
  }

  window.setInterval(tick, 120);
})();
