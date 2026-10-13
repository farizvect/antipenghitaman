const form = document.querySelector("#comment-form");
const input = document.querySelector("#comment-input");
const feed = document.querySelector("#comment-feed");
const sendButton = document.querySelector("#send-button");
const demoButton = document.querySelector("#demo-button");
const stopButton = document.querySelector("#stop-button");
const bulkToggle = document.querySelector("#bulk-toggle");
const bulkPanel = document.querySelector("#bulk-panel");
const bulkInput = document.querySelector("#bulk-input");
const bulkCount = document.querySelector("#bulk-count");
const bulkSubmit = document.querySelector("#bulk-submit");
const bulkCancel = document.querySelector("#bulk-cancel");
const scannedCount = document.querySelector("#scanned-count");
const blockedCount = document.querySelector("#blocked-count");
const toast = document.querySelector("#toast");
const speedButtons = [...document.querySelectorAll("[data-speed]")];
const thresholdInput = document.querySelector("#threshold-input");
const thresholdValue = document.querySelector("#threshold-value");
const progressFill = document.querySelector("#progress-fill");
const progressLabel = document.querySelector("#progress-label");
const feedStatusLabel = document.querySelector("#feed-status-label");
const feedStatus = feedStatusLabel.closest(".feed-status");
const speedSelection = document.querySelector("#speed-selection");

const platformNames = {
  youtube: "YouTube",
  tiktok: "TikTok",
  twitch: "Twitch",
  kick: "Kick",
};
const platformOrder = Object.keys(platformNames);

const platformIcons = {
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path class="logo-cut" d="m10 9 5 3-5 3z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.2a4.3 4.3 0 1 1-3-4.1v3.1a1.5 1.5 0 1 0 .2 1V3z"/><path d="M14 3c.5 2.7 2.2 4.1 5 4.4v3c-2-.1-3.6-.7-5-1.8z"/></svg>',
  twitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h16v11l-5 5h-4l-2.5 2.5V19H5z"/><path class="logo-cut" d="M10 7h2v6h-2zm5 0h2v6h-2z"/></svg>',
  kick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h5v5h2V7h3V4h5v6h-3v4h3v6h-5v-3h-3v-3h-2v6H5z"/></svg>',
};

const negativeDemoSeeds = [
  // English — insults, complaints, mockery, hostility, and dismissal.
  "This is the worst stream I have watched all week.",
  "The creator has no idea what they are talking about.",
  "Please stop uploading this useless garbage.",
  "The audio is awful and the editing is a complete mess.",
  "I am reporting this toxic channel.",
  // Indonesian.
  "Konten ini buruk dan benar-benar membuang waktu.",
  "Pembuatnya tidak paham apa yang sedang dibicarakan.",
  "Berhenti unggah video sampah seperti ini.",
  "Suaranya parah dan editannya sangat berantakan.",
  "Channel ini menyebalkan, lebih baik ditutup saja.",
  // Spanish.
  "Este es el peor directo que he visto esta semana.",
  "El creador no sabe de qué está hablando.",
  "Deja de subir esta basura inútil.",
  "El audio es horrible y la edición es un desastre.",
  "Voy a denunciar este canal tóxico.",
  // French.
  "C'est le pire live que j'ai vu cette semaine.",
  "Le créateur ne sait absolument pas de quoi il parle.",
  "Arrête de publier ce contenu inutile.",
  "Le son est affreux et le montage est catastrophique.",
  "Je vais signaler cette chaîne toxique.",
  // German.
  "Das ist der schlechteste Stream der ganzen Woche.",
  "Der Creator hat überhaupt keine Ahnung vom Thema.",
  "Hör auf, diesen nutzlosen Müll hochzuladen.",
  "Der Ton ist furchtbar und der Schnitt ein Chaos.",
  "Ich werde diesen toxischen Kanal melden.",
  // Portuguese.
  "Esta é a pior transmissão que vi esta semana.",
  "O criador não sabe do que está falando.",
  "Pare de publicar esse lixo inútil.",
  "O áudio está horrível e a edição é um desastre.",
  "Vou denunciar este canal tóxico.",
  // Japanese.
  "今週見た中で最悪の配信です。",
  "この配信者は何も分かっていない。",
  "こんな役に立たない動画は投稿しないで。",
  "音声がひどくて編集もめちゃくちゃです。",
  "この有害なチャンネルを通報します。",
  // Korean.
  "이번 주에 본 방송 중 최악이에요.",
  "이 크리에이터는 무슨 말을 하는지도 모르네요.",
  "이런 쓸모없는 영상은 그만 올리세요.",
  "음질도 끔찍하고 편집도 엉망이에요.",
  "이 유해한 채널을 신고하겠습니다.",
  // Arabic.
  "هذا أسوأ بث شاهدته هذا الأسبوع.",
  "صاحب المحتوى لا يعرف عمّا يتحدث.",
  "توقف عن نشر هذا المحتوى عديم الفائدة.",
  "الصوت سيئ والمونتاج فوضوي للغاية.",
  "سأبلغ عن هذه القناة السامة.",
  // Hindi.
  "यह इस हफ्ते की सबसे खराब स्ट्रीम है।",
  "क्रिएटर को पता ही नहीं कि वह क्या बोल रहा है।",
  "ऐसा बेकार कंटेंट अपलोड करना बंद करो।",
  "ऑडियो बहुत खराब है और एडिटिंग पूरी तरह बिखरी हुई है।",
  "मैं इस जहरीले चैनल की रिपोर्ट करूंगा।",
  // Turkish.
  "Bu hafta izlediğim en kötü yayın.",
  "İçerik üreticisi ne konuştuğunu bilmiyor.",
  "Bu işe yaramaz videoları yüklemeyi bırak.",
  "Ses berbat ve kurgu tam bir karmaşa.",
  "Bu toksik kanalı şikâyet edeceğim.",
  // Russian.
  "Это худший стрим, который я видел за неделю.",
  "Автор вообще не понимает, о чём говорит.",
  "Перестань загружать этот бесполезный мусор.",
  "Звук ужасный, а монтаж — полный хаос.",
  "Я пожалуюсь на этот токсичный канал.",
];

const safeDemoSeeds = [
  "Great explanation, I learned something new today.",
  "Could you cover the second part in your next video?",
  "Penjelasannya bagus dan mudah dipahami.",
  "Kapan bagian berikutnya akan diunggah?",
  "La explicación fue clara y muy útil.",
  "¿Puedes hablar de la segunda parte después?",
  "L'explication était claire et très utile.",
  "Peux-tu aborder la deuxième partie bientôt ?",
  "Die Erklärung war klar und sehr hilfreich.",
  "Kannst du im nächsten Video Teil zwei erklären?",
  "A explicação foi clara e muito útil.",
  "Pode falar sobre a segunda parte no próximo vídeo?",
  "説明が分かりやすくて、とても参考になりました。",
  "次の動画で続きを説明してもらえますか？",
  "설명이 명확하고 정말 도움이 됐어요.",
  "다음 영상에서 두 번째 부분도 다뤄 주세요.",
  "الشرح واضح ومفيد جدًا، شكرًا لك.",
  "هل يمكنك شرح الجزء الثاني في الفيديو القادم؟",
  "समझाना बहुत स्पष्ट और उपयोगी था।",
  "क्या अगली वीडियो में दूसरा भाग समझा सकते हैं?",
  "Anlatım çok açık ve gerçekten faydalıydı.",
  "Sonraki videoda ikinci bölümü anlatır mısın?",
  "Объяснение было понятным и очень полезным.",
  "Можешь разобрать вторую часть в следующем видео?",
];

const viewerNames = [
  "NovaPulse", "Mika_88", "LunaLive", "DiegoR", "SoraTV", "Amira", "KaiZen", "RafaGG",
  "NinaK", "OmarLive", "Hana", "TheoCast", "Zeynep", "Arjun", "Camille", "Viktor",
];

const demoComments = buildDemoComments(100);

let scanned = 0;
let blocked = 0;
let toastTimer;
let batchRunning = false;
let batchSpeed = 3;
let platformIndex = 2;
let scrollFrame;
let metricsFrame;
let activeBatchController;

speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    batchSpeed = Number(button.dataset.speed);
    speedSelection.textContent = `${batchSpeed}× SELECTED`;
    speedButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    showToast(`Batch speed set to ${batchSpeed}×`);
  });
});

thresholdInput.addEventListener("input", updateThreshold);
updateThreshold();

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 92)}px`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";
  await submitComment(text);
});

demoButton.addEventListener("click", async () => {
  activeBatchController = new AbortController();
  setBatchBusy(true);
  demoButton.textContent = `Running 0 / ${demoComments.length}`;
  updateProgress(0, demoComments.length);
  const finished = await runBatch(demoComments, (finished, total) => {
    demoButton.textContent = `Running ${finished} / ${total}`;
    updateProgress(finished, total);
  }, activeBatchController.signal);
  const stopped = activeBatchController.signal.aborted;
  demoButton.innerHTML = '<span class="play-symbol" aria-hidden="true">▶</span> Run 100 demo <span class="button-arrow" aria-hidden="true">↗</span>';
  setBatchBusy(false);
  activeBatchController = undefined;
  progressLabel.textContent = stopped ? `Stopped at ${finished} / ${demoComments.length}` : "Demo complete";
  showToast(stopped
    ? `Demo stopped after ${finished} comments`
    : `${demoComments.length} multilingual comments processed at ${batchSpeed}×`);
});

stopButton.addEventListener("click", () => {
  stopButton.disabled = true;
  stopButton.textContent = "Stopping…";
  activeBatchController?.abort();
});

bulkToggle.addEventListener("click", () => setBulkPanel(bulkPanel.hidden));
bulkCancel.addEventListener("click", () => setBulkPanel(false));

bulkInput.addEventListener("input", updateBulkCount);

bulkPanel.addEventListener("submit", async (event) => {
  event.preventDefault();
  const comments = getBulkComments();
  if (comments.length === 0) return;

  bulkSubmit.disabled = true;
  bulkInput.disabled = true;
  activeBatchController = new AbortController();
  setBatchBusy(true);
  bulkPanel.setAttribute("aria-busy", "true");
  bulkSubmit.textContent = `Processing 0/${comments.length}`;
  updateProgress(0, comments.length);

  const finished = await runBatch(comments, (finished, total) => {
    bulkSubmit.textContent = `Processing ${finished}/${total}`;
    updateProgress(finished, total);
  }, activeBatchController.signal);
  const stopped = activeBatchController.signal.aborted;

  bulkInput.value = "";
  bulkInput.disabled = false;
  setBatchBusy(false);
  activeBatchController = undefined;
  bulkPanel.removeAttribute("aria-busy");
  bulkSubmit.textContent = "Test comments";
  updateBulkCount();
  setBulkPanel(false);
  progressLabel.textContent = stopped ? `Stopped at ${finished} / ${comments.length}` : "Batch complete";
  showToast(stopped ? `Batch stopped after ${finished} comments` : `${comments.length} comments processed`);
});

async function submitComment(text, { focusAfter = true, speedFactor = 1, author = "You", signal } = {}) {
  const platform = nextPlatform();
  const comment = createComment(text, platform, author);
  feed.append(comment);
  scheduleFeedScroll();
  sendButton.disabled = true;
  let classified = false;

  try {
    const response = await fetch("/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, threshold: Number(thresholdInput.value) }),
      signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Classification failed");

    scanned += 1;
    classified = true;
    if (result.negative) {
      blocked += 1;
      scheduleMetricsUpdate();
      await destroyComment(comment, result.score, speedFactor, signal);
    } else {
      markSafe(comment, result.score);
    }
    scheduleMetricsUpdate();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      comment.remove();
      return classified;
    }
    const badge = comment.querySelector(".result-badge");
    badge.className = "result-badge flag-badge";
    badge.innerHTML = "<span></span>Failed";
    showToast(error.message || "Could not reach the server", true);
  } finally {
    sendButton.disabled = batchRunning;
    if (focusAfter) input.focus();
  }
  return true;
}

async function runBatch(comments, onProgress = () => {}, signal) {
  let nextIndex = 0;
  let finished = 0;
  const workerCount = Math.min(batchSpeed, comments.length);

  async function worker() {
    while (nextIndex < comments.length && !signal?.aborted) {
      const index = nextIndex;
      nextIndex += 1;
      const completed = await submitComment(comments[index], {
        focusAfter: false,
        speedFactor: batchSpeed,
        author: viewerNames[index % viewerNames.length],
        signal,
      });
      if (completed) {
        finished += 1;
        onProgress(finished, comments.length);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return finished;
}

function setBatchBusy(busy) {
  batchRunning = busy;
  demoButton.disabled = busy;
  bulkToggle.disabled = busy;
  sendButton.disabled = busy;
  stopButton.hidden = !busy;
  stopButton.disabled = false;
  stopButton.innerHTML = '<span aria-hidden="true"></span>Stop';
  speedButtons.forEach((button) => { button.disabled = busy; });
  thresholdInput.disabled = busy;
  feedStatus.classList.toggle("running", busy);
  feedStatusLabel.textContent = busy ? "PROCESSING" : "MONITORING";
}

function updateProgress(finished, total) {
  progressFill.style.width = `${Math.round((finished / total) * 100)}%`;
  progressLabel.textContent = `${finished} / ${total}`;
}

function updateThreshold() {
  const value = Number(thresholdInput.value);
  const min = Number(thresholdInput.min);
  const max = Number(thresholdInput.max);
  const position = ((value - min) / (max - min)) * 100;
  thresholdValue.textContent = `${Math.round(value * 100)}%`;
  thresholdInput.style.setProperty("--threshold-position", `${position}%`);
}

function buildDemoComments(total) {
  const negativeSuffixes = ["", "!", "!!", " 👎", " 😡", " 🙄", "...", " 💢", " — unacceptable.", " #fail"];
  const safeSuffixes = ["", "!", " ✨", " 👍", " ❤️", " 🙂", " 🎉", " Thanks!", " #helpful", " 🙌"];

  return Array.from({ length: total }, (_, index) => {
    const isNegative = index % 5 < 3;
    const pool = isNegative ? negativeDemoSeeds : safeDemoSeeds;
    const suffixes = isNegative ? negativeSuffixes : safeSuffixes;
    const seed = pool[(index * 7) % pool.length];
    const suffix = suffixes[Math.floor(index / pool.length) % suffixes.length];
    return `${seed}${suffix}`;
  });
}

function getBulkComments() {
  return bulkInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function updateBulkCount() {
  const count = getBulkComments().length;
  const totalNonEmpty = bulkInput.value.split(/\r?\n/).filter((line) => line.trim()).length;
  bulkCount.textContent = totalNonEmpty > 20
    ? `${count} comments ready · ${totalNonEmpty - 20} ignored`
    : `${count} comments ready`;
  bulkSubmit.disabled = count === 0;
}

function setBulkPanel(open) {
  bulkPanel.hidden = !open;
  bulkToggle.setAttribute("aria-expanded", String(open));
  bulkToggle.classList.toggle("active", open);
  if (open) bulkInput.focus();
}

function createComment(text, platform, author = "You") {
  const item = document.createElement("article");
  item.className = "comment entering";
  const palette = Math.random() > 0.5 ? "avatar-coral" : "avatar-mint";
  item.innerHTML = `
    <div class="avatar ${palette}"></div>
    <div class="comment-content">
      <div class="comment-meta">
        <strong></strong><span>just now</span>
        <span class="source-logo ${platform}" title="${platformNames[platform]}" aria-label="${platformNames[platform]}">${platformIcons[platform]}</span>
      </div>
      <p></p>
    </div>
    <span class="result-badge scan-badge"><span></span>Scanning</span>`;
  item.querySelector("strong").textContent = author;
  item.querySelector(".avatar").textContent = author.slice(0, 1).toUpperCase();
  item.querySelector("p").textContent = text;
  return item;
}

function nextPlatform() {
  const platform = platformOrder[platformIndex % platformOrder.length];
  platformIndex += 1;
  return platform;
}

function markSafe(comment, score) {
  const badge = comment.querySelector(".result-badge");
  badge.className = "result-badge safe-badge";
  badge.innerHTML = `<span></span>Safe · ${Math.round((1 - score) * 100)}%`;
  comment.classList.add("safe");
  trimSafeComments();
  if (!batchRunning) showToast("Comment is safe and has been published");
}

async function destroyComment(comment, score, speedFactor = 1, signal) {
  const badge = comment.querySelector(".result-badge");
  badge.className = "result-badge flag-badge";
  badge.innerHTML = `<span></span>Flag · ${Math.round(score * 100)}%`;
  comment.classList.add("flagged");
  await wait(720 / speedFactor, signal);

  createShards(comment);
  comment.classList.add("destroying");
  if (!batchRunning) showToast("Negative comment detected and destroyed");
  await wait(800 / speedFactor, signal);
  comment.remove();
}

function trimSafeComments() {
  const safeComments = feed.querySelectorAll(".comment.safe");
  const overflow = safeComments.length - 60;
  for (let index = 0; index < overflow; index += 1) safeComments[index].remove();
}

function scheduleFeedScroll() {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    feed.scrollTop = feed.scrollHeight;
  });
}

function scheduleMetricsUpdate() {
  if (!batchRunning) {
    animateNumber(scannedCount, scanned);
    animateNumber(blockedCount, blocked);
    return;
  }
  if (metricsFrame) return;
  metricsFrame = requestAnimationFrame(() => {
    scannedCount.textContent = scanned;
    blockedCount.textContent = blocked;
    metricsFrame = undefined;
  });
}

function createShards(comment) {
  for (let index = 0; index < 14; index += 1) {
    const shard = document.createElement("i");
    shard.className = "shard";
    shard.style.setProperty("--x", `${18 + Math.random() * 74}%`);
    shard.style.setProperty("--y", `${25 + Math.random() * 50}%`);
    shard.style.setProperty("--s", `${3 + Math.random() * 4}px`);
    shard.style.setProperty("--tx", `${-70 + Math.random() * 140}px`);
    shard.style.setProperty("--ty", `${-45 + Math.random() * 90}px`);
    shard.style.setProperty("--r", `${-180 + Math.random() * 360}deg`);
    comment.append(shard);
  }
}

function animateNumber(element, value) {
  element.textContent = value;
  element.animate(
    [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-5px)", opacity: .2 }, { transform: "translateY(0)", opacity: 1 }],
    { duration: 280, easing: "ease-out" },
  );
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Batch stopped", "AbortError"));
      return;
    }
    const handleAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Batch stopped", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}
