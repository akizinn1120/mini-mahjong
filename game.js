let isGameLocked = false;   // ★ アガリ中は true にして操作停止
const HONOR_LIST = ["east", "south", "west", "north", "white", "green", "red"];
let wall = [];
let hand = [];
let river = [];
let selectedIndex = null;

/* -----------------------------
   手牌を整理する関数
----------------------------- */
function sortHand(hand) {
  const order = {
    "m": 1,
    "p": 2,
    "s": 3,
    "east": 4,
    "south": 5,
    "west": 6,
    "north": 7,
    "white": 8,
    "green": 9,
    "red": 10
  };

  return hand.sort((a, b) => {
    const am = a.match(/^(\d+)([mps])$/);
    const bm = b.match(/^(\d+)([mps])$/);

    if (am && bm) {
      if (am[2] !== bm[2]) return order[am[2]] - order[bm[2]];
      return parseInt(am[1]) - parseInt(bm[1]);
    }

    if (!am && !bm) return order[a] - order[b];

    return am ? -1 : 1;
  });
}

/* -----------------------------
   山を作る
----------------------------- */
function createSmallWall() {
  const tiles = [];

  for (let num = 1; num <= 9; num++) {
    for (let i = 0; i < 4; i++) tiles.push(`${num}m`);
  }

  for (const honor of HONOR_LIST) {
    for (let i = 0; i < 4; i++) tiles.push(honor);
  }

  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

/* -----------------------------
   初期化
----------------------------- */
function initGame() {
  isGameLocked = false;   // ★ 次のゲームで操作再開
  wall = createSmallWall();
  hand = [];
  river = [];
  selectedIndex = null;

  for (let i = 0; i < 4; i++) {
    hand.push(wall.pop());
  }

  hand = sortHand(hand);
  render();
}

/* -----------------------------
   桜吹雪演出
----------------------------- */
function startConfetti() {
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";

    const colors = ["#ffb7c5", "#ffcce0", "#ffe6f2"];
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    confetti.style.left = Math.random() * 100 + "vw";

    const size = Math.random() * 12 + 8;
    confetti.style.width = size + "px";
    confetti.style.height = size * 0.6 + "px";

    const fallTime = Math.random() * 4 + 5;
    confetti.style.animationDuration = fallTime + "s";

    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), fallTime * 1000 + 500);
  }
}
function render() {
  document.getElementById("wallCount").textContent = wall.length;

  /* -----------------------------
     捨て牌：6枚ごとに新しい段を作る
  ----------------------------- */
  const riverDiv = document.getElementById("river");
  riverDiv.innerHTML = "";

  // 6枚ずつに分割
  for (let i = 0; i < river.length; i += 6) {
    const row = document.createElement("div");
    row.className = "river-row";

    river.slice(i, i + 6).forEach(tile => {
      const img = document.createElement("img");
      img.src = `tiles/${tile}.png`;
      img.className = "tile-img";
      row.appendChild(img);
    });

    riverDiv.appendChild(row);
  }

  /* -----------------------------
     手牌表示
  ----------------------------- */
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";

  hand.forEach((tile, index) => {
    const img = document.createElement("img");
    img.src = `tiles/${tile}.png`;
    img.className = "tile-img";

    img.onclick = () => {
      selectedIndex = index;
      handDiv.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    };

    handDiv.appendChild(img);
  });
}

/* -----------------------------
   ツモ（引く）
----------------------------- */
function drawTile() {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = "";

  if (wall.length === 0) {
    messageDiv.textContent = "山が尽きました。ゲーム終了。";
    return;
  }
  if (hand.length !== 4) {
    messageDiv.textContent = "手牌が4枚のときだけ引けます。";
    return;
  }

  hand.push(wall.pop());
  hand = sortHand(hand);

  render();

  /* 和了判定 */
  if (isWin(hand)) {

    isGameLocked = true;   // ★ ボタン操作を停止
    messageDiv.textContent = "アガリ！ 1面子＋1雀頭成立！おめでとう！";
    messageDiv.classList.add("win-message");

    const handDiv = document.getElementById("hand");
    handDiv.querySelectorAll("img").forEach(img => img.classList.add("tile-win"));

    /* 光エフェクト */
    const effect = document.createElement("div");
    effect.className = "win-effect";
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1200);

    /* 桜吹雪 */
    startConfetti();

    /* 枠付け（雀頭＋面子） */
    const winStruct = getWinningStructure(hand);
    if (winStruct) {
      const imgs = handDiv.querySelectorAll("img");

      imgs.forEach(img => {
        const tileName = img.src.split("/").pop().replace(".png", "");

        if (winStruct.pair.includes(tileName)) {
          img.classList.add("pair-highlight");
        }
        if (winStruct.set.includes(tileName)) {
          img.classList.add("set-highlight");
        }
      });
    }

    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.classList.remove("win-message");
      initGame();
    }, 10000);

    return;
  }

  messageDiv.textContent = "アガリではありません。捨て牌を選んでください。";
}

/* -----------------------------
   捨てる
----------------------------- */
function discardSelected() {
  const messageDiv = document.getElementById("message");

  if (selectedIndex === null) {
    messageDiv.textContent = "捨てる牌をクリックで選んでください。";
    return;
  }

  river.push(hand.splice(selectedIndex, 1)[0]);
  selectedIndex = null;

  hand = sortHand(hand);
  messageDiv.textContent = "";

  render();
}

/* -----------------------------
   和了判定
----------------------------- */
function isWin(tiles) {
  if (tiles.length !== 5) return false;

  const sorted = sortHand([...tiles]);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i] !== sorted[j]) continue;

      const remaining = sorted.filter((_, idx) => idx !== i && idx !== j);
      if (isSet(remaining)) return true;
    }
  }
  return false;
}

function isSet(tiles3) {
  if (tiles3.length !== 3) return false;

  if (tiles3[0] === tiles3[1] && tiles3[1] === tiles3[2]) return true;

  const parseTile = (t) => {
    const m = t.match(/^(\d+)([mps])$/);
    if (!m) return null;
    return { num: parseInt(m[1], 10), suit: m[2] };
  };

  const a = parseTile(tiles3[0]);
  const b = parseTile(tiles3[1]);
  const c = parseTile(tiles3[2]);
  if (!a || !b || !c) return false;

  const nums = [a.num, b.num, c.num].sort((x, y) => x - y);
  return a.suit === b.suit &&
         nums[0] + 1 === nums[1] &&
         nums[1] + 1 === nums[2];
}

/* -----------------------------
   アガリ形の構造（雀頭＋面子）
----------------------------- */
function getWinningStructure(tiles) {
  const sorted = sortHand([...tiles]);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {

      if (sorted[i] !== sorted[j]) continue;

      const pair = [sorted[i], sorted[j]];
      const remaining = sorted.filter((_, idx) => idx !== i && idx !== j);

      if (isSet(remaining)) {
        return { pair: pair, set: remaining };
      }
    }
  }
  return null;
}

/* -----------------------------
   ボタン動作
----------------------------- */
window.onload = () => {
  initGame();
  document.getElementById("drawButton").onclick = () => {

    // ★ アガリ中はボタン無効
    if (isGameLocked) return;

    if (hand.length === 4) {
      drawTile();
    } else if (hand.length === 5) {
      discardSelected();
    }
  };
};
