/* STEP 31B: prevent a waiting card from flashing at its original grid position.
   Does not change rarity, routes, scale or animation durations. */
(function () {
  "use strict";
  if (!Element.prototype.animate || Element.prototype.__family31BWaitingGuard) return;

  const originalAnimate = Element.prototype.animate;
  const cardSelector = "#card-grid .closed-card";
  const nativeBlackout = window.startSummonBlackout;

  // Called at the start of a NEW ten-pull, before the summon overlay appears.
  // Cancel only leftover Web Animations on closed-card elements.
  if (typeof nativeBlackout === "function") {
    window.startSummonBlackout = function () {
      document.querySelectorAll(cardSelector).forEach(function (card) {
        if (typeof card.getAnimations === "function") {
          card.getAnimations().forEach(function (animation) {
            try { animation.cancel(); } catch (_) { /* already finished */ }
          });
        }
        card.style.removeProperty("transform");
        card.style.removeProperty("opacity");
        card.classList.remove("summon-flying", "summon-ready", "summon-waiting");
      });
      return nativeBlackout.apply(this, arguments);
    };
  }

  // summon.js uses seven keyframes and 760ms for each center-to-stack arc.
  // Only at the actual start of that arc do we make the particular card visible.
  Element.prototype.animate = function (frames, options) {
    const isSummonArc = this.matches && this.matches(cardSelector) &&
      Array.isArray(frames) && frames.length === 7 &&
      options && options.duration === 760;
    if (isSummonArc && this.classList.contains("summon-waiting")) {
      this.classList.remove("summon-waiting");
      this.classList.add("summon-flying");
    }
    return originalAnimate.apply(this, arguments);
  };
  Element.prototype.__family31BWaitingGuard = true;
})();
