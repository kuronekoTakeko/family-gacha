/* STEP 30C: 所持カードをJSONに書き出すだけ。復元、初期化、保存値の変更はしない。 */
(function () {
  "use strict";
  const button = document.getElementById("album-backup-download");
  const message = document.getElementById("album-backup-message");
  if (!button || !message) return;
  const STORAGE_KEY = "family-gacha-album";

  function notify(text) { message.textContent = text; }
  function isPlainObject(value) {
    return value !== null && typeof value === "object" &&
      !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
  }

  button.addEventListener("click", function () {
    let url = null;
    try {
      // 保存済みのJSONをそのまま読み取る。localStorageへの書き込みは行わない。
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        notify("まだ所持カードの保存データがありません。カードを集めてから保存してください。");
        return;
      }
      const album = JSON.parse(raw);
      if (!isPlainObject(album)) throw new Error("アルバムの形式が不正です");
      const entries = Object.entries(album);
      if (!entries.every(function (entry) {
        const card = entry[1];
        return /^card\d{3}$/.test(entry[0]) && isPlainObject(card) &&
          Number.isSafeInteger(card.count) && card.count >= 1;
      })) throw new Error("カード情報を確認できません");
      if (entries.length === 0) {
        notify("現在アルバムは0枚です。カードを集めてから保存してください。");
        return;
      }
      const total = entries.reduce(function (sum, entry) { return sum + entry[1].count; }, 0);
      const backup = {
        format: "family-gacha-album-backup",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        storageKey: STORAGE_KEY,
        cards: album
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "family-gacha-album-" + backup.exportedAt.slice(0, 10) + ".json";
      link.style.display = "none";
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      notify("バックアップを作成しました（" + entries.length + "種類・" + total + "枚）。端末のダウンロード先を確認してください。");
    } catch (error) {
      console.error("[Family Gacha] アルバムの書き出しに失敗:", error);
      notify("保存できませんでした。アルバムのデータは変更していません。");
    } finally {
      if (url !== null) setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }
  });
})();
