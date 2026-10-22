/* TEST-28G: 10連排出バランス調整（STEP29の魔法陣昇格とは独立）
   元のapp.jsはそのまま保持し、抽選の挙動だけを置き換える。
   17枚カードデータ／所持記録／召喚・開封演出には触れない。
   将来app.jsに統合する場合はこの追加scriptを取り除くこと。
*/
(function () {
  "use strict";

  // 1枚あたりの排出率：合計100%。
  const newRates = {
    N: 65,
    R: 25,
    SR: 8,
    SSR: 1.5,
    UR: 0.5
  };

  // app.jsに登録済みの抽選テーブルの値だけを更新する。
  rarityRates.forEach(function (entry) {
    if (Object.prototype.hasOwnProperty.call(newRates, entry.rarity)) {
      entry.rate = newRates[entry.rarity];
    }
  });

  // 2つめの抽選・結果への介入はしない。従来のdrawOneCard()を10回呼ぶ。
  // 元app.jsにある「SR以上が無ければ10枚目を差し替える」保証処理を使わない。
  window.drawTenCards = function () {
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(drawOneCard());
    }
    return results;
  };

  const badge = document.getElementById("version-check-badge");
  if (badge) {
    badge.textContent = "TEST -28G / JS OK";
  }
})();
