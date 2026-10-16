const summonOverlay =
  document.getElementById(
    "summon-overlay"
  );
const magicCircle =
  document.getElementById(
    "magic-circle"
  );
const summonCardGrid =
  document.getElementById(
    "card-grid"
  );
// 一括オープンは召喚終了後に表示（配置の余白は維持）
const summonOpenAllArea = document.getElementById("open-all-area");

const summonSound =
  new Audio("sounds/summon.mp3");
// =========================
// 通常10連：暗転開始
// =========================

function startSummonBlackout() {

  summonSound.currentTime = 0;

  summonSound.play().catch(function() {});

  summonOpenAllArea.style.visibility = "hidden";

  summonOverlay.classList.add(
    "active"
  );

}


// =========================
// 通常10連：暗転解除
// =========================

function endSummonBlackout() {

  // 召喚中の一時的な位置補正を戻す（通常レイアウトは維持）。
  summonCardGrid.style.transform = "none";
  summonOpenAllArea.style.visibility = "";

  summonOverlay.classList.remove(
    "active"
  );

}

// 魔法陣は座標計算を他の要素に依存させず、表示画面の中央へ固定する。
function updateSummonCircleCenter() {
  const view = window.visualViewport;
  const cx = view ? view.offsetLeft + view.width / 2 : window.innerWidth / 2;
  const cy = view ? view.offsetTop + view.height / 2 : window.innerHeight / 2;
  magicCircle.style.position = "fixed";
  magicCircle.style.left = `${cx}px`;
  magicCircle.style.top = `${cy}px`;
}
window.addEventListener("resize", updateSummonCircleCenter);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateSummonCircleCenter);
  window.visualViewport.addEventListener("scroll", updateSummonCircleCenter);
}

// =========================
// 魔法陣表示
// =========================

function showMagicCircle() {

  // 実際に見えている画面の中央へ（ブラウザUIの伸縮にも対応）。
  updateSummonCircleCenter();

  magicCircle.classList.add(
    "show"
  );

}


// =========================
// 魔法陣非表示
// =========================

function hideMagicCircle() {

  magicCircle.classList.add(
    "hiding"
  );

  magicCircle.classList.remove(
    "show"
  );


  setTimeout(function() {

    magicCircle.classList.remove(
      "hiding"
    );

  }, 450);

}

// =========================
// 魔法陣からカード10枚を飛ばす
// =========================

function summonCardsFromCircle(cardElements) {
  return new Promise(function(resolve) {
    summonCardGrid.classList.add("summon-active");
    const cards = Array.from(cardElements);
    if (!cards.length) { resolve(); return; }

    updateSummonCircleCenter();
    // 完成済みの開封待ち画面の配置は維持する。
    summonCardGrid.style.marginTop = "0px";
    summonCardGrid.style.transform = "none";
    const circleRect = magicCircle.getBoundingClientRect();
    const centerX = circleRect.left + circleRect.width / 2;
    const centerY = circleRect.top + circleRect.height / 2;
    const gridRect = summonCardGrid.getBoundingClientRect();
    summonCardGrid.style.marginTop = `${centerY - (gridRect.top + gridRect.height / 2)}px`;

    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();
    const rowsCenterY = ((firstRect.top + firstRect.height / 2) +
                         (lastRect.top + lastRect.height / 2)) / 2;
    summonCardGrid.style.transform = `translateY(${centerY - rowsCenterY}px)`;

    // 実際の表示領域の左上寄りに、カード全体が収まる集結位置を設定。
    const viewport = window.visualViewport;
    const vLeft = viewport ? viewport.offsetLeft : 0;
    const vTop = viewport ? viewport.offsetTop : 0;
    const vWidth = viewport ? viewport.width : window.innerWidth;
    const vHeight = viewport ? viewport.height : window.innerHeight;
    const baseRect = cards[0].getBoundingClientRect();
    const margin = 14;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const stackX = clamp(vLeft + vWidth * 0.19, vLeft + margin + baseRect.width / 2,
                         vLeft + vWidth - margin - baseRect.width / 2);
    const stackY = clamp(vTop + vHeight * 0.20, vTop + margin + baseRect.height / 2,
                         vTop + vHeight - margin - baseRect.height / 2);
    // 1枚目が中央を離れるまで次のカードを出さない。
    // STEP 13の450msでは中央演出(約660ms)が重なり、2枚目以降の拡大が見えにくかった。
    const intervals = 800;
    const arcDuration = 900; // 出現0.12秒 + 中央拡大0.18秒 + 停止0.35秒 + 飛行0.25秒
    const fanDuration = 440;
    const stackPause = 750; // 10枚集結後に約0.75秒静止
    const activeAnimations = [];

    // キーフレームの座標は各カードの通常位置に対する相対移動量。
    // 下端を軸にscaleする。yは「カードの見た目の中心」の移動量。
    // transform-origin: bottom による中心のずれを打ち消し、飛行中も位置がずれないようにする。
    const makeTransform = (x, y, scale, deg, height) =>
      `translate(${x}px, ${y + (scale - 1) * height / 2}px) scale(${scale}) rotate(${deg}deg)`;

    const rects = cards.map(card => card.getBoundingClientRect());
    const stacks = rects.map((rect, index) => ({
      x: stackX - (rect.left + rect.width / 2) + (index % 3) * 2,
      y: stackY - (rect.top + rect.height / 2) + (index % 3) * 2,
      angle: (index % 5 - 2) * 1.4
    }));

    cards.forEach(card => {
      card.classList.remove("summon-flying", "summon-ready");
      card.classList.add("summon-waiting");
    });

    function animateArc(card, index) {
      const end = stacks[index];
      // 魔法陣から浮き上がり、左側を回り込んで集結するカーブ。
      // 途中地点を複数設けて、直線移動ではなく弧を描かせる。
      const midpointY = (centerY + stackY) / 2;
      const controlX = Math.min(centerX, stackX) - Math.min(62, vWidth * 0.10);
      const controlY = midpointY + Math.min(42, vHeight * 0.055);
      // STEP 14: 全10枚が同じ「小さく出現→下から上へ拡大→じゃーんと停止→飛行」。
      // カードの下端を動かさず拡大するため、上へせり上がるように見える。
      const appearEnd = 120 / arcDuration;
      const growEnd = 300 / arcDuration;
      const holdEnd = 650 / arcDuration;
      const timeline = [0, appearEnd, growEnd, holdEnd, 0.84, 0.93, 1];
      const rect = rects[index];
      const hoverX = centerX;
      const hoverY = centerY - 18;
      const fullScale = 0.84; // 左上の集結サイズと同じ
      // フルサイズ時のカード下端を固定点にする。
      const bottomAnchorY = hoverY + fullScale * rect.height / 2;
      const points = timeline.map(t => {
        let x, y, scale, angle;
        if (t <= appearEnd) {
          const u = t / appearEnd;
          scale = 0.16 + 0.30 * u;
          x = hoverX;
          y = bottomAnchorY - scale * rect.height / 2;
          angle = 0;
        } else if (t <= growEnd) {
          const u = (t - appearEnd) / (growEnd - appearEnd);
          scale = 0.46 + (fullScale - 0.46) * u;
          x = hoverX;
          y = bottomAnchorY - scale * rect.height / 2;
          angle = 0;
        } else if (t <= holdEnd) {
          x = hoverX;
          y = hoverY;
          scale = fullScale;
          angle = 0;
        } else {
          const u = (t - holdEnd) / (1 - holdEnd);
          x = (1-u)*(1-u)*hoverX + 2*(1-u)*u*controlX + u*u*stackX;
          y = (1-u)*(1-u)*hoverY + 2*(1-u)*u*controlY + u*u*stackY;
          scale = fullScale;
          angle = u * end.angle;
        }
        const landed = t === 1 ? (index % 3) * 2 : 0;
        return {
          offset: t,
          transformOrigin: "50% 100%",
          transform: makeTransform(x - (rect.left + rect.width / 2) + landed,
                                   y - (rect.top + rect.height / 2) + landed,
                                   scale, angle, rect.height),
          opacity: t === 0 ? 0 : 1
        };
      });
      const animation = card.animate(points, {
        duration: arcDuration, easing: "ease-in-out", fill: "forwards"
      });
      activeAnimations[index] = animation;
      // 最終地点は fill:forwards によって集結するまで保持される。
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      cards.forEach((card, index) => {
        setTimeout(() => animateArc(card, index), index * intervals);
      });
    }));

    // 最後のカードが束に着地し、約0.75秒とどまってから一斉展開。
    const stackCompleteAt = (cards.length - 1) * intervals + arcDuration + 50;
    setTimeout(() => {
      cards.forEach((card, index) => {
        if (activeAnimations[index]) activeAnimations[index].cancel();
        const end = stacks[index];
        const height = rects[index].height;
        const animation = card.animate([
          { transformOrigin: "50% 100%", transform: makeTransform(end.x, end.y, 0.84, end.angle, height), opacity: 1 },
          { transformOrigin: "50% 100%", transform: makeTransform(end.x * 0.35, end.y * 0.35, 1.04, 0, height), opacity: 1, offset: 0.7 },
          { transformOrigin: "50% 100%", transform: makeTransform(0, 0, 1, 0, height), opacity: 1 }
        ], { duration: fanDuration, easing: "cubic-bezier(0.2,0.8,0.2,1)", fill: "forwards" });
        activeAnimations[index] = animation;
      });
      setTimeout(() => {
        cards.forEach((card, index) => {
          card.classList.remove("summon-waiting", "summon-flying");
          card.classList.add("summon-ready");
          if (activeAnimations[index]) activeAnimations[index].cancel();
        });
        resolve();
      }, fanDuration + 40);
    }, stackCompleteAt + stackPause);
  });
}
// STEP 14: 新しい summon.js が読み込まれたことを画面で確認する。
(function () {
  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -14 / JS OK";
})();
