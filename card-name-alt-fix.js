/* STEP 29F: カード画像の代替テキストに引用符を含む場合の修正。
   DOMで設定し、HTML文字列の属性引用符に影響されないようにする。
   ガチャ抽選・開封・SRエフェクト・アルバム保存には触れない。 */
(function () {
  "use strict";
  if (typeof cardPool === "undefined" || !Array.isArray(cardPool)) return;

  const namesByImage = new Map();
  cardPool.forEach(function (card) {
    const file = (card.image || "").split("/").pop();
    if (file) namesByImage.set(file, card.name);
  });

  function fixImageAlt(root) {
    if (!root || !root.querySelectorAll) return;
    const images = root.querySelectorAll(
      "img.gacha-card-image, img.album-card-image, img.detail-main-card-image"
    );
    images.forEach(function (img) {
      const file = (img.getAttribute("src") || "").split("/").pop().split("?")[0];
      const correctName = namesByImage.get(file);
      if (correctName && img.alt !== correctName) {
        img.alt = correctName;
      }
    });
  }

  fixImageAlt(document);
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches("img.gacha-card-image, img.album-card-image, img.detail-main-card-image")) {
          const file = (node.getAttribute("src") || "").split("/").pop().split("?")[0];
          const correctName = namesByImage.get(file);
          if (correctName && node.alt !== correctName) node.alt = correctName;
        }
        fixImageAlt(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
