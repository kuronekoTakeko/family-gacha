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
const summonSound =
  new Audio("sounds/summon.mp3");
// =========================
// 通常10連：暗転開始
// =========================

function startSummonBlackout() {

  summonSound.currentTime = 0;

  summonSound.play().catch(function() {});

  summonOverlay.classList.add(
    "active"
  );

}


// =========================
// 通常10連：暗転解除
// =========================

function endSummonBlackout() {

  summonOverlay.classList.remove(
    "active"
  );

}

// =========================
// 魔法陣表示
// =========================

function showMagicCircle() {

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


    // 10枚のカードの2段の中心を、魔法陣の中心（画面中央）に合わせる。
    // 画面幅によってカードの高さが変わるため、実寸から余白を計算する。
    // 毎回ゼロから計算し、連続ガチャで余白が増えないようにする。
    summonCardGrid.style.marginTop = "0px";
    const gridRect = summonCardGrid.getBoundingClientRect();
    const gridCenterY = gridRect.top + gridRect.height / 2;
    const centerOffset = Math.max(0, window.innerHeight / 2 - gridCenterY);
    summonCardGrid.style.marginTop = `${centerOffset}px`;

    // 魔法陣の中心
    const centerX =
      window.innerWidth / 2;

    const centerY =
      window.innerHeight / 2;


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