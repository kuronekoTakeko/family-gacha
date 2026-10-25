/* STEP 33A: Album detail image -> full-screen zoom. Does not touch draw, album, or reveal state. */
(function () {
  'use strict';
  if (window.__familyAlbumZoom33A) return;
  window.__familyAlbumZoom33A = true;

  const area = document.getElementById('detail-card-area');
  const screen = document.getElementById('detail-screen');
  if (!area || !screen) return;

  const viewer = document.createElement('div');
  viewer.className = 'album-zoom-open';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'カード拡大鑑賞');
  viewer.innerHTML = '<div class="album-zoom-header"><span id="album-zoom-title">カードを鑑賞</span><button type="button" class="album-zoom-button" id="album-zoom-close">閉じる ×</button></div>' +
    '<div class="album-zoom-stage" id="album-zoom-stage"><img id="album-zoom-img" alt="" draggable="false"></div>' +
    '<div class="album-zoom-footer"><small>2本指で拡大・1本指で移動</small><button type="button" class="album-zoom-button" id="album-zoom-reset">元に戻す</button></div>';
  document.body.appendChild(viewer);
  const stage = viewer.querySelector('#album-zoom-stage');
  const image = viewer.querySelector('#album-zoom-img');
  const title = viewer.querySelector('#album-zoom-title');
  const close = viewer.querySelector('#album-zoom-close');
  const resetButton = viewer.querySelector('#album-zoom-reset');
  const pointers = new Map();
  let scale = 1, panX = 0, panY = 0, gesture = null, previousFocus = null;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function limitPan() {
    // At 1x, the entire card stays centered. Pan only when the magnified image extends outside the stage.
    const rect = image.getBoundingClientRect();
    const naturalWidth = rect.width / scale;
    const naturalHeight = rect.height / scale;
    const maxX = Math.max(0, (naturalWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (naturalHeight * scale - stage.clientHeight) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  }
  function render() {
    image.style.transform = 'translate3d(' + panX + 'px,' + panY + 'px,0) scale(' + scale + ')';
  }
  function reset() { scale = 1; panX = 0; panY = 0; gesture = null; render(); }
  function point(event) { return { x: event.clientX, y: event.clientY }; }
  function measure() {
    const pts = Array.from(pointers.values());
    if (pts.length > 1) {
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2,
        distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) };
    }
    return pts.length ? { x: pts[0].x, y: pts[0].y, distance: 0 } : null;
  }
  function startGesture() { const m = measure(); gesture = m && { x: m.x, y: m.y, distance: m.distance, scale, panX, panY }; }
  function open(source) {
    if (!source.currentSrc && !source.src) return;
    previousFocus = document.activeElement;
    image.src = source.currentSrc || source.src;
    image.alt = source.alt || 'カード';
    title.textContent = source.alt || 'カードを鑑賞';
    viewer.hidden = false;
    pointers.clear(); reset();
    close.focus({ preventScroll: true });
  }
  function dismiss() {
    if (viewer.hidden) return;
    viewer.hidden = true;
    pointers.clear(); gesture = null;
    image.removeAttribute('src');
    if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
  }
  area.addEventListener('click', function (event) {
    const source = event.target.closest('.detail-main-card-image');
    if (source && screen.classList.contains('active')) open(source);
  });
  close.addEventListener('click', dismiss);
  resetButton.addEventListener('click', reset);
  document.addEventListener('keydown', function (event) {
    if (viewer.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
    if (event.key === 'Tab') {
      // Keep focus on the dialog's two action buttons.
      const first = close, last = resetButton;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  stage.addEventListener('pointerdown', function (event) {
    if (viewer.hidden) return;
    event.preventDefault();
    pointers.set(event.pointerId, point(event));
    try { stage.setPointerCapture(event.pointerId); } catch (_) {}
    startGesture();
  });
  stage.addEventListener('pointermove', function (event) {
    if (!pointers.has(event.pointerId) || !gesture) return;
    event.preventDefault(); pointers.set(event.pointerId, point(event));
    const now = measure(); if (!now) return;
    if (pointers.size >= 2 && gesture.distance > 0) {
      scale = clamp(gesture.scale * now.distance / gesture.distance, 1, 4);
      // Anchor scaling near the pinch midpoint.
      const r = stage.getBoundingClientRect();
      const fx = gesture.x - (r.left + r.width / 2);
      const fy = gesture.y - (r.top + r.height / 2);
      const ratio = scale / gesture.scale;
      panX = gesture.panX * ratio + fx * (1 - ratio) + (now.x - gesture.x);
      panY = gesture.panY * ratio + fy * (1 - ratio) + (now.y - gesture.y);
    } else if (scale > 1) {
      panX = gesture.panX + now.x - gesture.x;
      panY = gesture.panY + now.y - gesture.y;
    }
    limitPan(); render();
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId); startGesture();
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', endPointer);
  stage.addEventListener('wheel', function (event) {
    if (viewer.hidden) return;
    event.preventDefault();
    const old = scale;
    scale = clamp(scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 4);
    if (scale === 1) { reset(); return; }
    const r = stage.getBoundingClientRect();
    const fx = event.clientX - (r.left + r.width / 2);
    const fy = event.clientY - (r.top + r.height / 2);
    panX = panX * scale / old + fx * (1 - scale / old);
    panY = panY * scale / old + fy * (1 - scale / old);
    limitPan(); render();
  }, { passive: false });
  window.addEventListener('resize', function () { if (!viewer.hidden) { limitPan(); render(); } });
  // If another control navigates away while open, don't leave the viewer floating over it.
  const observer = new MutationObserver(function () { if (!screen.classList.contains('active')) dismiss(); });
  observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
})();
