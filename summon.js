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
        summonCardGrid.classList.add(
      "summon-active"
    );

    const cards =
      Array.from(cardElements);


    updateSummonCircleCenter();
    // 召喚終了後に残すレイアウトは、前回正常だった方式を維持。
    summonCardGrid.style.marginTop = "0px";
    summonCardGrid.style.transform = "none";
    const circleRect = magicCircle.getBoundingClientRect();
    const centerX = circleRect.left + circleRect.width / 2;
    const centerY = circleRect.top + circleRect.height / 2;
    const gridRect = summonCardGrid.getBoundingClientRect();
    summonCardGrid.style.marginTop = `${centerY - (gridRect.top + gridRect.height / 2)}px`;

    // 召喚中だけ「カードそのもの」の上下2段の中央と魔法陣中心を一致させる。
    // paddingやボタンの位置は変更せず、終了時にtransformを解除する。
    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();
    const rowsCenterY = ((firstRect.top + firstRect.height / 2) +
                         (lastRect.top + lastRect.height / 2)) / 2;
    const temporaryOffset = centerY - rowsCenterY;
    summonCardGrid.style.transform = `translateY(${temporaryOffset}px)`;

    // 各カードについて、
    // 現在位置から魔法陣中心までの距離を計算
    cards.forEach(function(card) {

      const rect =
        card.getBoundingClientRect();

      const cardCenterX =
        rect.left + rect.width / 2;

      const cardCenterY =
        rect.top + rect.height / 2;


      const startX =
        centerX - cardCenterX;

      const startY =
        centerY - cardCenterY;


      card.style.setProperty(
        "--summon-x",
        `${startX}px`
      );

      card.style.setProperty(
        "--summon-y",
        `${startY}px`
      );


      card.classList.remove(
        "summon-flying",
        "summon-ready"
      );

      card.classList.add(
        "summon-waiting"
      );

    });


    // ブラウザに初期位置を一度描画させる
    requestAnimationFrame(function() {

      requestAnimationFrame(function() {

        cards.forEach(function(card, index) {

          // 少しずつ時間差で飛び出す
          setTimeout(function() {

            card.classList.remove(
              "summon-waiting"
            );

            card.classList.add(
              "summon-flying"
            );

          }, index * 70);

        });

      });

    });


    // 10枚すべて整列したら通常状態に戻す
    const totalTime =
      (cards.length - 1) * 70 + 550;


    setTimeout(function() {

      cards.forEach(function(card) {

        card.classList.remove(
          "summon-waiting",
          "summon-flying"
        );

        card.classList.add(
          "summon-ready"
        );


        card.style.removeProperty(
          "--summon-x"
        );

        card.style.removeProperty(
          "--summon-y"
        );

      });


      resolve();

    }, totalTime);

  });

}
// STEP 7: 新しい summon.js が読み込まれたことを画面で確認する。
(function () {
  const badge = document.getElementById("version-check-badge");
  if (badge) badge.textContent = "TEST -7 / JS OK";
})();
