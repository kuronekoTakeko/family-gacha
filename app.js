const homeScreen = document.getElementById("home-screen");
const gachaScreen = document.getElementById("gacha-screen");

const tenGachaButton = document.getElementById("ten-gacha");
const backHomeButton = document.getElementById("back-home");

const closedCards = document.querySelectorAll(".closed-card");
const cardOpenSound =
  new Audio("sounds/card-open.mp3");

const bulkOpenSound =
  new Audio("sounds/bulk-open.mp3");
const afterGachaArea =
  document.getElementById(
    "after-gacha-area"
  );

const retryGachaButton =
  document.getElementById(
    "retry-gacha-button"
  );

const gachaAlbumButton =
  document.getElementById(
    "gacha-album-button"
  );

const gachaHomeButton =
  document.getElementById(
    "gacha-home-button"
  );
let openedCount = 0;
let currentNewCardIds = new Set();
const resultScreen =
  document.getElementById("result-screen");

const albumScreen =
  document.getElementById("album-screen");

const resetAlbumButton =
  document.getElementById("reset-album-button");

const resultGrid =
  document.getElementById("result-grid");

const albumGrid =
  document.getElementById("album-grid");

const albumCount =
  document.getElementById("album-count");
  const albumSort =
  document.getElementById("album-sort");

const albumButton =
  document.getElementById("album-button");

const resultAlbumButton =
  document.getElementById("result-album-button");

const resultHomeButton =
  document.getElementById("result-home-button");

const albumBackHome =
  document.getElementById("album-back-home");
  const openAllArea =
  document.getElementById("open-all-area");

const openAllButton =
  document.getElementById("open-all-button");

let isOpeningAll = false;

const STORAGE_KEY = "family-gacha-album";

// STEP 8: カード画像の読み込みを共有して先読みする。
const cardImageLoads = new Map();
function prepareCardImage(cardData) {
  if (!cardData) return Promise.resolve("");
  if (cardImageLoads.has(cardData.id)) return cardImageLoads.get(cardData.id);
  const load = function(src) {
    return new Promise(function(resolve, reject) {
      const image = new Image();
      image.onload = function() {
        if (image.decode) {
          image.decode().then(function(){resolve(src);}, function(){resolve(src);});
        } else { resolve(src); }
      };
      image.onerror = reject;
      image.src = src;
    });
  };
  const fallback = cardData.image.replace(/\.webp$/i, ".png");
  const promise = load(cardData.image).catch(function() {
    return load(fallback).catch(function() {return fallback;});
  });
  cardImageLoads.set(cardData.id, promise);
  return promise;
}


const rarityOrder = {
  UR: 5,
  SSR: 4,
  SR: 3,
  R: 2,
  N: 1
};

const detailScreen =
  document.getElementById("detail-screen");

const detailCardArea =
  document.getElementById("detail-card-area");

const detailBack =
  document.getElementById("detail-back");

function showCardDetail(card) {

  const cardData =
    cardPool.find(function(item) {
      return item.id === card.id;
    });

  const numberText =
    String(card.cardNumber).padStart(3, "0");

  const detailCardArea =
    document.getElementById("detail-card-area");

  detailCardArea.innerHTML = `
    <div class="detail-simple-wrap">

      <img
        src="${cardData.image}"
        alt="${card.name}"
        class="detail-main-card-image"
      >

      <div class="detail-info-block">

        <div class="detail-card-name">
          ${card.name}
        </div>

        <div class="detail-meta-row">
          <span class="detail-meta-label">レア度</span>
          <span class="detail-meta-value">${card.rarity}</span>
        </div>

        <div class="detail-meta-row">
          <span class="detail-meta-label">No.</span>
          <span class="detail-meta-value">${numberText}</span>
        </div>

        <div class="detail-meta-row">
          <span class="detail-meta-label">所持数</span>
          <span class="detail-meta-value">×${card.count}</span>
        </div>

        <div class="detail-future-box">
          ステータスやスキルは今後ここに追加予定
        </div>

      </div>

    </div>
  `;

  showScreen(detailScreen);
}
// =========================
// 初入手カードか確認
// =========================

function isNewCard(cardId) {

  const album =
    loadAlbum();

  return !album[cardId];

}

// =========================
// アルバム読み込み
// =========================

function loadAlbum() {

  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    return {};
  }

  try {

    return JSON.parse(saved);

  } catch {

    return {};

  }

}


// =========================
// アルバム保存
// =========================

function saveAlbum(album) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(album)
  );

}

// =========================
// 今回の結果をアルバムへ保存
// =========================

function saveCurrentResultsToAlbum() {

  const album =
    loadAlbum();

  const newCardIds =
    new Set();

  currentGachaResults.forEach(function(card, index) {

    if (!album[card.id]) {

      album[card.id] = {
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        count: 1,
        obtainedOrder:
          Date.now() + index
      };

      newCardIds.add(
        card.id
      );

    } else {

      album[card.id].count++;

    }

  });

  saveAlbum(album);

  return newCardIds;

}

// =========================
// リザルト画面表示
// =========================

function showResultScreen() {

  const newCardIds =
    saveCurrentResultsToAlbum();

  resultGrid.innerHTML = "";

  currentGachaResults.forEach(function(card) {

    const cardElement =
      document.createElement("div");

    cardElement.className =
      `result-card rarity-${card.rarity}`;

    const isNew =
      newCardIds.has(card.id);

    cardElement.innerHTML = `
      ${isNew
        ? `<div class="new-badge">NEW</div>`
        : ""
      }

      <div class="result-card-rarity">
        ${card.rarity}
      </div>

      <div class="result-card-name">
        ${card.name}
      </div>
    `;

    resultGrid.appendChild(
      cardElement
    );

  });

  showScreen(
    resultScreen
  );

}

function sortAlbumCards(cards, sortType) {

  const sortedCards =
    [...cards];


  if (sortType === "rarity") {

    sortedCards.sort(function(a, b) {

      const rarityDiff =
        rarityOrder[b.rarity] -
        rarityOrder[a.rarity];

      if (rarityDiff !== 0) {
        return rarityDiff;
      }

      return a.id.localeCompare(
        b.id
      );

    });

  }


  if (sortType === "number") {

    sortedCards.sort(function(a, b) {

      return a.id.localeCompare(
        b.id
      );

    });

  }


  if (sortType === "obtained") {

    sortedCards.sort(function(a, b) {

      return (
        (b.obtainedOrder || 0) -
        (a.obtainedOrder || 0)
      );

    });

  }


  if (sortType === "count") {

    sortedCards.sort(function(a, b) {

      const countDiff =
        b.count - a.count;

      if (countDiff !== 0) {
        return countDiff;
      }

      return (
        rarityOrder[b.rarity] -
        rarityOrder[a.rarity]
      );

    });

  }


  return sortedCards;

}

// =========================
// アルバム表示
// =========================

function showAlbum() {

  const album =
    loadAlbum();

  const sortType =
    albumSort.value;


  // =========================
  // 全カードをアルバム用データに変換
  // =========================

  const allCards =
    cardPool.map(function(card) {

      const ownedCard =
        album[card.id];


      if (ownedCard) {

        return {
          ...ownedCard,
          owned: true,
          cardNumber: card.number
        };

      }


      return {
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        count: 0,
        obtainedOrder: 0,
        owned: false,
        cardNumber: card.number
      };

    });


  // =========================
  // 入手済み数
  // =========================

  const ownedCount =
    allCards.filter(function(card) {

      return card.owned;

    }).length;


  albumCount.textContent =
    `${ownedCount} / ${cardPool.length} 種類 入手済み`;


  // =========================
  // 並び替え
  // =========================

  let displayCards = [];



  if (sortType === "number") {

    displayCards =
      [...allCards].sort(function(a, b) {

        return (
          a.cardNumber -
          b.cardNumber
        );

      });

  }



  if (sortType === "rarity") {

  displayCards =
    [...allCards].sort(function(a, b) {

      // 入手済みを先にする
      if (a.owned && !b.owned) {
        return -1;
      }

      if (!a.owned && b.owned) {
        return 1;
      }

      // 入手済み同士はレア度順
      if (a.owned && b.owned) {

        const rarityDiff =
          rarityOrder[b.rarity] -
          rarityOrder[a.rarity];

        if (rarityDiff !== 0) {
          return rarityDiff;
        }

      }

      // 同レア度、または未入手同士は番号順
      return (
        a.cardNumber -
        b.cardNumber
      );

    });

}



  if (sortType === "obtained") {

    displayCards =
      [...allCards].sort(function(a, b) {

        // 入手済みを先にする
        if (a.owned && !b.owned) {
          return -1;
        }

        if (!a.owned && b.owned) {
          return 1;
        }

        // 入手済み同士は新しい順
        if (a.owned && b.owned) {

          return (
            (b.obtainedOrder || 0) -
            (a.obtainedOrder || 0)
          );

        }

        // 未入手同士は番号順
        return (
          a.cardNumber -
          b.cardNumber
        );

      });

  }



  if (sortType === "count") {

    displayCards =
      [...allCards].sort(function(a, b) {

        // 入手済みを先にする
        if (a.owned && !b.owned) {
          return -1;
        }

        if (!a.owned && b.owned) {
          return 1;
        }


        const countDiff =
          b.count -
          a.count;

        if (countDiff !== 0) {
          return countDiff;
        }


        const rarityDiff =
          rarityOrder[b.rarity] -
          rarityOrder[a.rarity];

        if (rarityDiff !== 0) {
          return rarityDiff;
        }


        return (
          a.cardNumber -
          b.cardNumber
        );

      });

  }



  // =========================
  // 表示
  // =========================

  albumGrid.innerHTML = "";


  displayCards.forEach(function(card) {

    const cardElement =
      document.createElement("div");


    // =========================
    // 入手済み
    // =========================

    if (card.owned) {

      cardElement.className =
        `album-card rarity-${card.rarity}`;

      const numberText =
  String(card.cardNumber)
    .padStart(3, "0");

const cardData =
  cardPool.find(function(item) {

    return item.id === card.id;

  });

cardElement.innerHTML = `
  <img
    src="${cardData.image}"
    alt="${card.name}"
    class="album-card-image"
  >

  <div class="album-number">
    No.${numberText}
  </div>

  <div class="album-count-badge">
    ×${card.count}
  </div>
`;

    }


    // =========================
    // 未入手
    // =========================

    else {

      cardElement.className =
        "album-card locked";

      const numberText =
        String(card.cardNumber)
          .padStart(3, "0");

      cardElement.innerHTML = `
        <div class="locked-question">
          ?
        </div>

        <div class="album-name">
          ？？？
        </div>

        <div class="locked-number">
          No.${numberText}
        </div>
      `;

    }
if (card.owned) {

  cardElement.addEventListener(
    "click",
    function() {

      showCardDetail(card);

    }
  );

}

    albumGrid.appendChild(
      cardElement
    );

  });


  showScreen(
    albumScreen
  );

}



// =========================
// レア度ごとの排出率
// =========================

const rarityRates = [
  {
    rarity: "N",
    rate: 60
  },
  {
    rarity: "R",
    rate: 25
  },
  {
    rarity: "SR",
    rate: 10
  },
  {
    rarity: "SSR",
    rate: 4
  },
  {
    rarity: "UR",
    rate: 1
  }
];


// =========================
// 現在の10連結果
// =========================

let currentGachaResults = [];


// =========================
// 画面切り替え
// =========================

function showScreen(screen) {

  const allScreens =
    document.querySelectorAll(".screen");

  allScreens.forEach(function(item) {

    item.classList.remove("active");

  });

  screen.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}

// =========================
// レア度を抽選
// =========================

function drawRarity() {

  const random = Math.random() * 100;

  let total = 0;

  for (const rarityData of rarityRates) {

    total += rarityData.rate;

    if (random < total) {
      return rarityData.rarity;
    }

  }

  return "N";

}


// =========================
// 指定レア度からカードを1枚選ぶ
// =========================

function drawCardByRarity(rarity) {

  const candidates = cardPool.filter(function(card) {
    return card.rarity === rarity;
  });

  const randomIndex = Math.floor(
    Math.random() * candidates.length
  );

  return candidates[randomIndex];

}


// =========================
// 1枚抽選
// =========================

function drawOneCard() {

  const rarity = drawRarity();

  const card = drawCardByRarity(rarity);

  return {
    ...card
  };

}


// =========================
// SR以上かどうか
// =========================

function isSrOrHigher(card) {

  return (
    card.rarity === "SR" ||
    card.rarity === "SSR" ||
    card.rarity === "UR"
  );

}


// =========================
// 10連抽選
// SR以上1枚確定
// =========================

function drawTenCards() {

  const results = [];

  for (let i = 0; i < 10; i++) {

    results.push(
      drawOneCard()
    );

  }


  // SR以上が1枚もなければ
  // 10枚目をSR以上に差し替える
  const hasSrOrHigher = results.some(
    isSrOrHigher
  );

  if (!hasSrOrHigher) {

    const guaranteedPool = cardPool.filter(function(card) {

      return (
        card.rarity === "SR" ||
        card.rarity === "SSR" ||
        card.rarity === "UR"
      );

    });

    const randomIndex = Math.floor(
      Math.random() * guaranteedPool.length
    );

    results[9] = {
      ...guaranteedPool[randomIndex]
    };

  }

  return results;

}


// =========================
// 黒カードに結果を仕込む
// =========================

function prepareClosedCards() {

  closedCards.forEach(function(cardElement, index) {

    const result = currentGachaResults[index];


    // 前回の開封状態をリセット
    cardElement.classList.remove(
      "opened",
      "rarity-N",
      "rarity-R",
      "rarity-SR",
      "rarity-SSR",
      "rarity-UR"
    );


    // 前回の表示内容を削除
    const oldResult =
      cardElement.querySelector(
        ".card-result"
      );

    if (oldResult) {
      oldResult.remove();
    }


    // 新しい抽選結果を保存
    cardElement.dataset.cardId = result.id;
    cardElement.dataset.cardName = result.name;
    cardElement.dataset.rarity = result.rarity;

  });

  openedCount = 0;

currentNewCardIds = new Set();

isOpeningAll = false;

openAllArea.classList.remove("hidden");

openAllButton.disabled = false;

afterGachaArea.classList.remove("show");
}

// =========================
// 10連ガチャ共通処理
// =========================

function startTenGacha() {

  // 10連結果を抽選
  currentGachaResults =
    drawTenCards();

  // 召喚演出中に画像を先読みする（抽選結果は変更しない）。
  [...new Set(currentGachaResults.map(function(card){return card.id;}))]
    .forEach(function(id) {
      prepareCardImage(cardPool.find(function(card){return card.id === id;}));
    });

  // 黒カードを初期状態に戻す
  prepareClosedCards();


  // ① 暗転開始
  startSummonBlackout();


  // ② 暗転した状態で10連画面へ
  setTimeout(function() {

    showScreen(
      gachaScreen
    );

  }, 450);


  // ③ 魔法陣出現
  setTimeout(function() {

    showMagicCircle();

  }, 550);


  // ④ 魔法陣からカード10枚出現
  setTimeout(async function() {

    await summonCardsFromCircle(
      closedCards
    );


    // STEP 15: 魔法陣は最後のカードの集結時にsummon.js側で消し始める。
    // カード展開が完了したので、暗転だけ解除する。
    setTimeout(function() {

      endSummonBlackout();

      summonCardGrid.classList.remove(
        "summon-active"
      );

    }, 130);

  }, 1950); // STEP 15: 魔法陣出現(550ms)から約1.4秒ためて召喚

}

// =========================
// 10連ボタン
// =========================

tenGachaButton.addEventListener(
  "click",
  function() {

    startTenGacha();

  }
);


// =========================
// ホームに戻る
// =========================

backHomeButton.addEventListener("click", function() {

  showScreen(homeScreen);

});
// =========================
// カードを1枚開封
// =========================

closedCards.forEach(function(cardElement) {

  cardElement.addEventListener(
    "click",
    function() {

      if (isOpeningAll) {
        return;
      }

      showIndividualCardReveal(cardElement);

    }
  );

});

albumButton.addEventListener(
  "click",
  function() {

    showAlbum();

  }
);


resultAlbumButton.addEventListener(
  "click",
  function() {

    showAlbum();

  }
);


resultHomeButton.addEventListener(
  "click",
  function() {

    showScreen(
      homeScreen
    );

  }
);


albumBackHome.addEventListener(
  "click",
  function() {

    showScreen(
      homeScreen
    );

  }
);
albumSort.addEventListener(
  "change",
  function() {

    showAlbum();

  }
);
detailBack.addEventListener(
  "click",
  function() {

    showAlbum();

  }
);

// =========================
// 一括オープン後 NEW 強調
// =========================

function highlightNewCards() {

  const newCards =
    Array.from(closedCards).filter(function(cardElement) {

      return cardElement.querySelector(
        ".gacha-new-badge"
      );

    });


  newCards.forEach(function(cardElement) {

    cardElement.classList.add(
      "new-highlight"
    );

  });


  setTimeout(function() {

    newCards.forEach(function(cardElement) {

      cardElement.classList.remove(
        "new-highlight"
      );

    });

  }, 700);

}

function openCard(cardElement, isBulk = false) {

  return new Promise(function(resolve) {

    if (
      cardElement.classList.contains("opened") ||
      cardElement.classList.contains("opening") ||
      cardElement.classList.contains("bulk-opening") ||
      cardElement.classList.contains("image-preparing")
    ) {

      resolve();
      return;

    }


    const cardName =
      cardElement.dataset.cardName;

    const rarity =
      cardElement.dataset.rarity;
      
    const cardId =
  cardElement.dataset.cardId;
  const cardData =
  cardPool.find(function(card) {

    return card.id === cardId;

  });

      // 個別開封と一括開封で時間を変える
    const revealDelay =
      isBulk ? 230 : 430;

    const finishDelay =
      isBulk ? 420 : 720;

// アルバム未登録かどうか
const album =
  loadAlbum();


// この10連ですでにNEW表示したカードか
const alreadyNewInThisGacha =
  currentNewCardIds.has(cardId);


// 初入手か判定
const isNew =
  !album[cardId] &&
  !alreadyNewInThisGacha;


// NEWになったカードは
// この10連内では登録済みにする
if (isNew) {

  currentNewCardIds.add(cardId);

}


// 同一カードの二重タップを防ぎ、画像準備完了後に開封する。
cardElement.classList.add("image-preparing");
prepareCardImage(cardData).then(function(readyImageSrc) {
cardElement.classList.remove("image-preparing");
// 開封アニメーション開始
if (isBulk) {

  cardElement.classList.add(
    "bulk-opening"
  );

} else {

  cardOpenSound.currentTime = 0;

  cardOpenSound.play().catch(function() {});

  cardElement.classList.add(
    "opening"
  );

}


    setTimeout(function() {

      cardElement.classList.add("opened");

      cardElement.classList.add(
        `rarity-${rarity}`
      );


      const resultElement =
        document.createElement("div");

      resultElement.className =
        "card-result";

      resultElement.innerHTML = `
  ${isNew
    ? `<div class="gacha-new-badge">NEW!</div>`
    : ""
  }

  <img
    src="${readyImageSrc}"
    alt="${cardName}"
    class="gacha-card-image"
  >
`;


      cardElement.appendChild(
        resultElement
      );

    }, revealDelay);


    setTimeout(function() {

      cardElement.classList.remove(
        "opening",
        "bulk-opening"
      );

      openedCount++;


      if (openedCount === 10) {

  // 10枚すべて開いた時点でアルバムへ保存
  saveCurrentResultsToAlbum();

  afterGachaArea.classList.add(
    "show"
  );

  openAllArea.classList.add(
    "hidden"
  );

}


      resolve();

    }, finishDelay);
  }); // prepareCardImage

  });
}

// =========================
// STEP 9: 個別カード拡大開封
// 一括オープンの既存処理は変更しない。
// =========================
const individualReveal = document.getElementById("individual-reveal");
const individualRevealCard = document.getElementById("individual-reveal-card");
const individualRevealHint = document.getElementById("individual-reveal-hint");
let individualRevealBusy = false;
let individualRevealCanClose = false;
let individualRevealPreviousFocus = null;

async function showIndividualCardReveal(cardElement) {
  if (individualRevealBusy || isOpeningAll ||
      !cardElement || cardElement.classList.contains("opening") ||
      cardElement.classList.contains("image-preparing")) return;

  const isRevisit = cardElement.classList.contains("opened");

  individualRevealBusy = true;
  individualRevealCanClose = false;
  individualRevealPreviousFocus = document.activeElement;
  const rarity = cardElement.dataset.rarity || "N";
  individualReveal.className = "individual-reveal active rarity-" + rarity;
  individualReveal.setAttribute("aria-hidden", "false");
  individualRevealCard.innerHTML = '<span class="individual-card-question">?</span>';
  individualRevealCard.classList.remove("revealed");
  individualRevealCard.style.removeProperty("animation");
  individualRevealCard.style.removeProperty("transform");
  individualRevealHint.textContent = isRevisit ? "タップして戻る" : "カードを召喚中…";
  document.body.classList.add("individual-reveal-active");
  individualReveal.focus();

  // 開封済みは鑑賞だけ。抽選結果・NEW判定・所持数・アルバムを変更しない。
  // 再表示時はめくる演出を繰り返さず、すぐに大きく見せる。
  if (isRevisit) {
    const existingResult = cardElement.querySelector(".card-result");
    individualRevealCard.innerHTML = existingResult
      ? existingResult.innerHTML
      : "カードを表示できませんでした";
    individualRevealCard.classList.add("revealed");
    individualRevealCard.style.animation = "none";
    individualRevealCard.style.transform = "scale(1)";
    individualRevealCanClose = true;
    return;
  }

  // 未開封カードは今までの開封処理を使用し、NEW・保存仕様を変えない。
  try {
    await openCard(cardElement, true);
    const result = cardElement.querySelector(".card-result");
    if (result) {
      individualRevealCard.innerHTML = result.innerHTML;
    } else {
      individualRevealCard.textContent = "カードを表示できませんでした";
    }
    individualRevealCard.classList.add("revealed");
    individualRevealHint.textContent = "タップして戻る";
  } catch (error) {
    console.error("Individual reveal failed", error);
    individualRevealHint.textContent = "タップして戻る";
  }
  individualRevealCanClose = true;
}

function closeIndividualCardReveal() {
  if (!individualRevealBusy || !individualRevealCanClose) return;
  individualReveal.className = "individual-reveal";
  individualReveal.setAttribute("aria-hidden", "true");
  individualRevealCard.style.removeProperty("animation");
  individualRevealCard.style.removeProperty("transform");
  document.body.classList.remove("individual-reveal-active");
  individualRevealBusy = false;
  individualRevealCanClose = false;
  if (individualRevealPreviousFocus && individualRevealPreviousFocus.focus) {
    individualRevealPreviousFocus.focus();
  }
}
individualReveal.addEventListener("click", closeIndividualCardReveal);
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeIndividualCardReveal();
});

openAllButton.addEventListener(
  "click",
  function() {

    if (isOpeningAll) {
      return;
    }

    isOpeningAll = true;

    openAllButton.disabled = true;

    bulkOpenSound.currentTime = 0;

bulkOpenSound.play().catch(function() {});


    const unopenedCards =
      Array.from(closedCards).filter(function(cardElement) {

        return (
          !cardElement.classList.contains("opened") &&
          !cardElement.classList.contains("opening") &&
          !cardElement.classList.contains("image-preparing")
        );

      });


    // 全カードを同時に開く
Promise.all(unopenedCards.map(function(cardElement) {
  return openCard(cardElement, true);
})).then(function() {
  isOpeningAll = false;
  highlightNewCards();
});

  }
);
resetAlbumButton.addEventListener(
  "click",
  function() {

    const ok = confirm(
      "アルバムをリセットしますか？"
    );

    if (!ok) {
      return;
    }

    localStorage.removeItem(
      STORAGE_KEY
    );

    alert(
      "アルバムをリセットしました！"
    );

  }
);
retryGachaButton.addEventListener(
  "click",
  function() {

    startTenGacha();

  }
);


gachaAlbumButton.addEventListener(
  "click",
  function() {

    showAlbum();

  }
);


gachaHomeButton.addEventListener(
  "click",
  function() {

    showScreen(
      homeScreen
    );

  }
);
// STEP 8の読み込み確認（画像最適化＋先読み）
(function(){const b=document.getElementById("version-check-badge");if(b)b.textContent="TEST -16 / JS OK";})();
