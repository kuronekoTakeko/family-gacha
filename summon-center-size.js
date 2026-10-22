/* TEST-29D2: 召喚途中カードの中央拡大と「？」の円の中心合わせ。
   760msの7キーフレームに限定。既存の移動ルート・集合位置・開封処理は維持。 */
(function () {
  "use strict";
  if (!Element.prototype.animate || Element.prototype.__family29BSizePatch) return;
  const nativeAnimate = Element.prototype.animate;
  const transformRE = /^translate\((-?[0-9.eE+]+)px,\s*(-?[0-9.eE+]+)px\) scale\((-?[0-9.eE+]+)\) rotate\((-?[0-9.eE+]+)deg\)$/;
  Element.prototype.animate = function(frames, options) {
    if (this.classList && this.classList.contains("closed-card") &&
        options && options.duration === 760 && Array.isArray(frames) &&
        frames.length === 7 && frames.every(function(f) { return typeof f.transform === "string"; })) {
      const circle = document.getElementById("magic-circle");
      const ringDiameter = circle ? circle.offsetWidth : 320;
      const naturalCardHeight = this.offsetHeight;
      if (naturalCardHeight > 0) {
        // カードの縦幅を青い太い円の内側に収める。最大1.70倍（29D2：前回より約10%大きく）。
        const centerScale = Math.min(1.70, Math.max(.84, ringDiameter * .86 / naturalCardHeight));
        const scales = [null, null, centerScale, centerScale, Math.max(.84, centerScale * .75), .84, .84];
        // summon.js の停止位置は circle center - 18px。中央で「？」が合うよう補正。
        // 左上へ飛行している間は補正を自然にゼロへ戻し、集合位置は従来どおり。
        const centerOffsetsY = [18, 18, 18, 18, 9, 3, 0];
        const patched = frames.map(function(frame, i) {
          const match = transformRE.exec(frame.transform);
          if (!match) return frame;
          const before = Number(match[3]);
          const after = scales[i] == null ? before : scales[i];
          if (!Number.isFinite(before) || !Number.isFinite(after)) return frame;
          const newY = Number(match[2]) + (after - before) * naturalCardHeight / 2 + centerOffsetsY[i];
          return Object.assign({}, frame, {
            transform: "translate(" + match[1] + "px, " + newY + "px) scale(" + after + ") rotate(" + match[4] + "deg)"
          });
        });
        return nativeAnimate.call(this, patched, options);
      }
    }
    return nativeAnimate.call(this, frames, options);
  };
  Element.prototype.__family29BSizePatch = true;
})();
