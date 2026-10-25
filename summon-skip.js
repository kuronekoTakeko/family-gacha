/* STEP 32A: Only skip the summon ceremony. Do not redraw cards or change storage.
   Track timers scheduled while summoning, so old God Ten / upgrade callbacks cannot
   resume after a skip. Normal completion restores native timing immediately. */
(function () {
  'use strict';
  if (window.__family32ASkipInstalled) return;
  if (typeof window.startSummonBlackout !== 'function' ||
      typeof window.endSummonBlackout !== 'function') return;
  window.__family32ASkipInstalled = true;

  const nativeStart = window.startSummonBlackout;
  const nativeEnd = window.endSummonBlackout;
  const nativeTimeout = window.setTimeout;
  const nativeAnimationFrame = window.requestAnimationFrame;
  const pendingFrames = new Set();
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'summon-skip-button';
  button.setAttribute('aria-label', '召喚演出をスキップして裏向き10枚を表示');
  button.textContent = '» スキップ';
  button.hidden = true;
  document.body.appendChild(button);

  let active = false;
  let restoring = false;
  const timers = new Set();

  function beginTracking() {
    if (active) return;
    active = true;
    button.hidden = false;
    window.setTimeout = function (callback, delay) {
      // Record callbacks actually scheduled during the current ceremony.
      const args = Array.prototype.slice.call(arguments, 2);
      let id;
      const wrapped = function () {
        timers.delete(id);
        if (typeof callback === 'function') return callback.apply(this, arguments);
        // The game does not use string callbacks; preserve native behavior if encountered.
      };
      id = nativeTimeout.call(window, function () { wrapped.apply(this, args); }, delay);
      timers.add(id);
      return id;
    };
    if (typeof nativeAnimationFrame === 'function') {
      window.requestAnimationFrame = function (callback) {
        let id;
        id = nativeAnimationFrame.call(window, function (stamp) {
          pendingFrames.delete(id);
          callback(stamp);
        });
        pendingFrames.add(id);
        return id;
      };
    }
  }

  function endTracking(cancelPending) {
    if (restoring) return;
    restoring = true;
    window.setTimeout = nativeTimeout;
    if (typeof nativeAnimationFrame === 'function') window.requestAnimationFrame = nativeAnimationFrame;
    if (cancelPending && typeof window.cancelAnimationFrame === 'function') {
      pendingFrames.forEach(function (id) { window.cancelAnimationFrame(id); });
    }
    pendingFrames.clear();
    if (cancelPending) timers.forEach(function (id) { window.clearTimeout(id); });
    timers.clear();
    active = false;
    button.hidden = true;
    restoring = false;
  }

  window.startSummonBlackout = function () {
    // The original start function remains responsible for sound and overlay.
    beginTracking();
    return nativeStart.apply(this, arguments);
  };
  window.endSummonBlackout = function () {
    const answer = nativeEnd.apply(this, arguments);
    endTracking(false);
    return answer;
  };

  function resetEffects() {
    const overlay = document.getElementById('summon-overlay');
    const circle = document.getElementById('magic-circle');
    if (overlay) {
      overlay.classList.remove('active','family-god-kanji-active', 'family-god-shadow',
        'family-god-white', 'family-god-rainbow', 'family-god-reveal',
        'family-god-summon', 'family-god-exit');
      overlay.querySelectorAll('.family-god-kanji .show, .family-god-kanji-show').forEach(function (e) {
        e.classList.remove('show', 'family-god-kanji-show');
      });
    }
    if (circle) {
      circle.classList.remove('show','hiding','family-paused');
      const rotor = circle.querySelector('.magic-circle-rotor');
      if (rotor) rotor.style.animationPlayState = 'running';
      circle.querySelectorAll('.family-visible,.family-reveal').forEach(function (layer) {
        layer.classList.remove('family-visible','family-reveal');
      });
    }
  }

  function showClosedGrid() {
    const cards = document.querySelectorAll('#card-grid .closed-card');
    cards.forEach(function (card) {
      if (typeof card.getAnimations === 'function') {
        card.getAnimations().forEach(function (animation) { try { animation.cancel(); } catch (_) {} });
      }
      card.classList.remove('summon-waiting','summon-flying','opening', 'summon-ready');
      card.classList.add('summon-ready');
      card.style.removeProperty('visibility');
      card.style.removeProperty('opacity');
      card.style.removeProperty('transform');
      card.style.removeProperty('animation');
    });
    const grid = document.getElementById('card-grid');
    if (grid) {
      grid.style.marginTop = '';
      grid.style.transform = '';
      grid.classList.remove('summon-active');
    }
    const openAll = document.getElementById('open-all-area');
    if (openAll) openAll.style.visibility = '';
    const openAllButton = document.getElementById('open-all-button');
    if (openAllButton) openAllButton.disabled = false;
  }

  button.addEventListener('click', function () {
    if (!active) return;
    // Restore scheduling before any cleanup to avoid tracking unrelated UI tasks.
    endTracking(true);
    resetEffects();
    // The normal end function restores the blackout and leaves opening logic untouched.
    nativeEnd.call(window);
    const targetScreen = document.getElementById('gacha-screen');
    if (targetScreen && typeof window.showScreen === 'function') window.showScreen(targetScreen);
    showClosedGrid();
    try {
      const audio = document.querySelector('audio');
      if (audio && typeof audio.pause === 'function') audio.pause();
    } catch (_) {}
  });
})();
