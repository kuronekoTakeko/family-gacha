/* STEP 33B: card-only pinch zoom for individual reveals. No card draws or storage changes. */
(function () {
  'use strict';
  if (window.__familyIndividualZoom33B) return;
  const overlay = document.getElementById('individual-reveal');
  const card = document.getElementById('individual-reveal-card');
  if (!overlay || !card) return;
  window.__familyIndividualZoom33B = true;

  const resetButton = document.createElement('button');
  resetButton.id = 'individual-card-zoom-reset';
  resetButton.type = 'button';
  resetButton.textContent = '元に戻す';
  resetButton.setAttribute('aria-label', 'カードの拡大を元に戻す');
  overlay.appendChild(resetButton);

  const pointers = new Map();
  let scale = 1, x = 0, y = 0, start = null;
  let gestureWasPinch = false, suppressNextClick = false;
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function isReady() { return overlay.classList.contains('active') && card.classList.contains('revealed'); }
  function measure() {
    const pts = Array.from(pointers.values());
    if (!pts.length) return null;
    if (pts.length === 1) return { x: pts[0].x, y: pts[0].y, d: 0 };
    return { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2,
      d:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y) };
  }
  function origin() {
    const m = measure();
    start = m ? {x:m.x,y:m.y,d:m.d,scale:scale,panX:x,panY:y} : null;
  }
  function keepInView() {
    // Stay within the visible screen with enough card remaining in view to grab.
    const w = card.offsetWidth * scale, h = card.offsetHeight * scale;
    const maxX = Math.max(0, (w - window.innerWidth) / 2 + Math.min(80, card.offsetWidth/3));
    const maxY = Math.max(0, (h - window.innerHeight) / 2 + Math.min(80, card.offsetHeight/3));
    x = clamp(x, -maxX, maxX); y = clamp(y, -maxY, maxY);
  }
  function render() {
    if (!overlay.classList.contains('active')) return;
    card.style.animation = 'none';
    card.style.transform = 'translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
    overlay.classList.toggle('is-card-zoomed', scale > 1.005);
  }
  function reset() {
    pointers.clear(); start = null; scale = 1; x = 0; y = 0;
    overlay.classList.remove('is-card-zoomed');
    card.style.removeProperty('transform');
    // Keep the original revealed state and its animation. Do not affect unopened cards.
    card.style.removeProperty('animation');
  }
  function resetForNewCard() { reset(); gestureWasPinch = false; suppressNextClick = false; }
  const observer = new MutationObserver(function () {
    if (!overlay.classList.contains('active') || !card.classList.contains('revealed')) resetForNewCard();
  });
  observer.observe(overlay, { attributes:true, attributeFilter:['class'] });
  observer.observe(card, { attributes:true, attributeFilter:['class'] });
  observer.observe(card, { childList:true });

  card.addEventListener('pointerdown', function (e) {
    if (!isReady() || e.pointerType !== 'touch') return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (pointers.size >= 2) { gestureWasPinch = true; suppressNextClick = true; }
    try {card.setPointerCapture(e.pointerId);} catch (_) {}
    origin();
  });
  card.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId) || !start || !isReady()) return;
    e.preventDefault();
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const now = measure(); if (!now) return;
    if (pointers.size >= 2 && start.d > 0) {
      gestureWasPinch = true; suppressNextClick = true;
      scale = clamp(start.scale * now.d/start.d,1,4);
      const factor = scale/start.scale;
      const r = overlay.getBoundingClientRect();
      const fx = start.x-(r.left+r.width/2), fy = start.y-(r.top+r.height/2);
      x = start.panX*factor + fx*(1-factor)+(now.x-start.x);
      y = start.panY*factor + fy*(1-factor)+(now.y-start.y);
      keepInView(); render();
    } else if (scale > 1.005) {
      x = start.panX + (now.x-start.x);
      y = start.panY + (now.y-start.y);
      keepInView(); render();
      if (Math.hypot(now.x-start.x, now.y-start.y)>5) suppressNextClick = true;
    }
  }, { passive:false });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId); origin();
  }
  card.addEventListener('pointerup',endPointer);
  card.addEventListener('pointercancel',endPointer);
  card.addEventListener('lostpointercapture',endPointer);

  // Capture before app.js's existing bubble-phase click-to-close handler.
  overlay.addEventListener('click',function (e) {
    if (!overlay.classList.contains('active')) return;
    if (e.target === resetButton || resetButton.contains(e.target)) return;
    if (scale > 1.005 || suppressNextClick) {
      e.preventDefault(); e.stopImmediatePropagation();
      suppressNextClick = false;
    }
  },true);
  resetButton.addEventListener('click',function (e) {
    e.stopPropagation(); e.preventDefault();
    reset(); suppressNextClick = false;
  });
  // Never transform a background layer; only the card receives an inline transform.
  window.addEventListener('resize',function () { if (isReady() && scale > 1) {keepInView();render();} });
})();
