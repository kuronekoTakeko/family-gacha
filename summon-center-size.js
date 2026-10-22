/* TEST-29B: 中央で止まる10枚召喚カードだけを少し拡大。
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
        // カードの縦幅を青い太い円の内側に収める。最大1.55倍。
        const centerScale = Math.min(1.55, Math.max(.84, ringDiameter * .78 / naturalCardHeight));
        const scales = [null, null, centerScale, centerScale, Math.max(.84, centerScale * .75), .84, .84];
        const patched = frames.map(function(frame, i) {
          const match = transformRE.exec(frame.transform);
          if (!match || scales[i] == null) return frame;
          const before = Number(match[3]);
          const after = scales[i];
          if (!Number.isFinite(before) || !Number.isFinite(after)) return frame;
          const newY = Number(match[2]) + (after - before) * naturalCardHeight / 2;
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
