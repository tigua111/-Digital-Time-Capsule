// ==========================================
// Supabase 雲端資料庫初始化設定
// ==========================================
const SUPABASE_URL = "https://wrpqyhggkyfhrvoavvbc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_HNYdSruL7nvf5AewCAN-Kg_113wMVaj"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 專案原有變數與全域設定 (已加回 10 秒選項)
// ==========================================
const STORAGE_KEY = "digital-time-capsule";

const durationMap = {
  "10s": { label: "10 秒", ms: 10 * 1000 },
  "1y": { label: "一年", ms: 365 * 24 * 60 * 60 * 1000 },
  "5y": { label: "五年", ms: 5 * 365 * 24 * 60 * 60 * 1000 },
  "10y": { label: "十年", ms: 10 * 365 * 24 * 60 * 60 * 1000 }
};

const views = [...document.querySelectorAll(".view")];
const toast = document.querySelector("#toast");
const profileForm = document.querySelector("#profileForm");
const capsuleForm = document.querySelector("#capsuleForm");
const durationGrid = document.querySelector("#durationGrid");
const previewCard = document.querySelector("#previewCard");
const openedCard = document.querySelector("#openedCard");
const essayCard = document.querySelector("#essayCard");
const archiveBtn = document.querySelector("#archiveBtn");
const countdownText = document.querySelector("#countdownText");
const countdownSign = document.querySelector("#countdownSign");
const envelopeBury = document.querySelector("#envelopeBury");
const digScene = document.querySelector("#digScene");
const openEnvelope = document.querySelector("#openEnvelope");
const musicToggle = document.querySelector("#musicToggle");
const resetLogin = document.querySelector("#resetLogin");
const frontMusic = document.querySelector("#frontMusic");
const openMusic = document.querySelector("#openMusic");
const encouragementLayer = document.querySelector("#encouragementLayer");
const openingLetterText = document.querySelector("#openingLetterText");
const letterIntroText = document.querySelector("#letterIntroText");
const cinematicOverlay = document.querySelector("#cinematicOverlay");
const creditsRoll = document.querySelector("#creditsRoll");
const cinematicFinalLine = document.querySelector("#cinematicFinalLine");
const finalContent = document.querySelector("#finalContent");
const captureArea = document.querySelector("#captureArea");
const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingHint = document.querySelector("#loadingHint");
const shareShot = document.querySelector("#shareShot");
const screenshotModal = document.querySelector("#screenshotModal");
const screenshotPreviewImage = document.querySelector("#screenshotPreviewImage");
const closeScreenshotModal = document.querySelector("#closeScreenshotModal");
const downloadScreenshotBtn = document.querySelector("#downloadScreenshotBtn");
const openScreenshotBtn = document.querySelector("#openScreenshotBtn");
const GOOGLE_CLIENT_ID = "657795306473-v5cjarm5adcajqqskf6vbubpd50mkgi2.apps.googleusercontent.com";

const loadingHintMessages = [
  "免費服務器啟動時間會稍久",
  "為了記錄美好的自己，這點等待是值得的",
  "我們的未來還很長，不差這幾秒的",
  "好酒值得細細品味，我的網站也是",
  "你聽到的音樂都是網站作者原創的!",
  "三角洲不是人玩的遊戲",
  "地瓜愛你!所以你也要愛自己"
];
let loadingHintTimer = null;
let countdownTimer = null;
let currentScreenshotDataUrl = "";
let encouragementTimer = null;
let cinematicTimers = [];
let draft = null;
let activeMusic = frontMusic;
let musicEnabled = false;
let audioContext = null;

const CINEMATIC_FINAL_SHOW = 55000; 
const CINEMATIC_FINAL_DISPLAY = 21000; 
const CINEMATIC_FINAL_FADE_DURATION = 8000; 
const CINEMATIC_FADE_DELAY = CINEMATIC_FINAL_SHOW + CINEMATIC_FINAL_DISPLAY + CINEMATIC_FINAL_FADE_DURATION; 
const CINEMATIC_END_DELAY = CINEMATIC_FADE_DELAY + 5000; 

const encouragements = [
  "恭喜你你已經走到這裡了",
  "希望你沒有過得太委屈",
  "慢慢來也沒有關係的",
  "不需要對自己太嚴格",
  "辛苦了，真的",
  "你的努力是值得的",
  "多多擁抱自己吧",
  "這一路你做得很好"
];

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// 修正拼字錯誤並保持結構不變
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleCredentialResponse(response) {
  if (!response.credential) {
    showToast("Google 登入失敗，請再試一次");
    return;
  }

  const profile = parseJwt(response.credential);
  const state = loadState();

  state.auth = {
    provider: "google",
    signedInAt: Date.now(),
    credential: response.credential,
    profile: {
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      sub: profile.sub
    }
  };

  saveState(state);
  showToast("Google 登入成功");
  
  boot();
}

function initializeGoogleSignIn() {
  if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    cancel_on_tap_outside: true
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignInButton"),
    {
      theme: "filled_blue", 
      size: "large",
      shape: "rectangular",
      text: "signin_with"
    }
  );
} 

function updateDurationWords() {
  const duration = getSelectedDuration();
  if (!duration || !duration.label) return;
  document.querySelectorAll("[data-duration-word]").forEach((item) => {
    item.textContent = duration.label;
  });
}

function getSelectedDuration() {
  if (!capsuleForm || !capsuleForm.elements || !capsuleForm.elements.duration) {
    return durationMap["10s"];
  }
  const selected = capsuleForm.elements.duration.value;
  return durationMap[selected];
}

function updateLoadingHint(index = 0) {
  if (!loadingHint) return;
  loadingHint.textContent = loadingHintMessages[index % loadingHintMessages.length];
  loadingHint.classList.remove("flash");
  void loadingHint.offsetWidth;
  loadingHint.classList.add("flash");
}

function startLoadingHintCycle() {
  if (!loadingHint || loadingHintTimer) return;
  let index = 0;
  updateLoadingHint(index);
  loadingHintTimer = window.setInterval(() => {
    index = (index + 1) % loadingHintMessages.length;
    updateLoadingHint(index);
  }, 3000);
}

function stopLoadingHintCycle() {
  if (loadingHintTimer) {
    window.clearInterval(loadingHintTimer);
    loadingHintTimer = null;
  }
}

function showLoading() {
  if (loadingOverlay) loadingOverlay.classList.add("active");
  startLoadingHintCycle();
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.remove("active");
  stopLoadingHintCycle();
}

// 修正結構
function showView(name) {
  hideLoading();
  views.forEach((view) => view.classList.toggle("active", view.dataset.view === name));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join("")
  );
  return JSON.parse(jsonPayload);
}

function formToObject(form) {
  if (!form) return {};
  return Object.fromEntries(new FormData(form).entries());
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCard(data) {
  const profile = data.profile;
  const letter = data.letter;
  const duration = durationMap[letter.duration];
  const writtenDate = new Date(data.createdAt || Date.now()).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const rows = [
    ["今年の你想對他說", letter.message],
    ["未來的你是否成為想成為的人", letter.futureSelf],
    ["介紹現在的自己", letter.aboutNow],
    [`希望 ${duration.label} 後的樣子`, letter.wishLook],
    ["給沒有抵達理想的自己", letter.comfort],
    ["其他想說的話", letter.extra || "謝謝你走到了打開這封信的今天。"]
  ];

  return `
    <h3>寫給未來的自己</h3>
    <div class="card-meta">
      <span>${escapeHtml(duration.label)} 後開啟</span>
      <span>${escapeHtml(profile.name)}</span>
      <span>${escapeHtml(profile.nickname)}</span>
      <span>${escapeHtml(profile.birthday)}</span>
      <span>${escapeHtml(profile.gender)}</span>
      <span>${writtenDate}</span>
    </div>
    <div class="answer-list">
      ${rows.map(([title, body]) => `
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(body)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderEssay(data) {
  const essay = buildEssay(data);
  return renderEssayText(essay);
}

function buildEssay(data) {
  const profile = data.profile;
  const letter = data.letter;
  const duration = durationMap[letter.duration];
  const name = profile.nickname || profile.name || "你";
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const clean = (text, fallback) => (text || fallback).trim().replace(/\s+/g, " ");
  const message = clean(letter.message, "希望你還記得以前的自己。");
  const futureSelf = clean(letter.futureSelf, "我不知道你後來有沒有變成想像中的樣子。");
  const aboutNow = clean(letter.aboutNow, "那時候的我還在慢慢摸索生活。");
  const wishLook = clean(letter.wishLook, "希望你過得比以前更安穩一點。");
  const comfort = clean(letter.comfort, "沒關係，真的，慢慢來就好。");
  const extra = clean(letter.extra, "我還是想對你說，辛苦了.");

  const openings = [
    `${name}，你現在看到的，是可能有些幼稚，或有些青澀的你，在 ${duration.label} 前想跟你說的話，他真的很認真地留了一個禮物給你。`,
    `${name}，這封信被放了很久。久到當時那些煩惱也許已經消散，但那個寫下它的人，應該還是值得你回頭看一眼。`,
    `${duration.label} 前的你大概沒有想太多，只是把那一刻的心情存了起來，想看看今天的你会不會剛好需要它。`,
    `等等!這不是廣告，是多年前的你，在可能很糟的心情、或是很快樂的情況下寫下的信`
  ];

  const middles = [
    `那時候的你是這樣介紹自己的：「${aboutNow}」現在讀起來可能有點陌生，也可能有點荒唐，但那就是你過去，最真實的一部分。`,
    `他曾經跟你說過這樣一段話:「${message}」這句話現在看起來，可能不像答案，比較像一個還沒說完的願望。可是願望被保存下來，本身就很珍貴。希望你有完成他的願望`,
    `以前的你曾幻想過，你会成為怎麼樣的人，他是這樣想:「${futureSelf}」眼許今天的你已經有答案了；眼許還沒有。都可以，人生本來就沒有標準答案，只希望你有朝著目標持續努力。`,
    `他也曾好奇現在你長甚麼樣子，生活環境如何?：「${wishLook}」如果你真的靠近了，請替以前的自己開心一下；如果還沒有，也別急著判你自己不及格，未來的路還很漫長，我知道你一定會完成你的夢想，所以不要著急!。`
  ];

  const turns = [
    `但如果他知道現在的你過的並沒有很好，你會難過嗎?他告訴你:「${comfort}」所以你看，他沒有只期待你成功，他也想到你可能累了，他肯定不希望你對自己如此不好。`,
    `如果這些年你走得不太順，請看看這句話：「${comfort}」這是以前的你，在還不知道未來會怎樣時，就已經先選擇站在你這邊，永遠支持你鼓勵你。他只想告訴你:開不開心、過得如何，他都會與你並肩作戰!`,
    `你也許已經忘了當初為什麼這樣寫，但「${comfort}」這句話留到現在，剛好像是在說：就算沒有變成完美的大人，也不用把自己丟掉。`,
    `有些話放久了會變淡，但這句沒有：「${comfort}」它像是以前的你拍拍你的肩，沒有逼問你成績，只是問你這一路是不是很辛苦。`
  ];

  const endings = [
    `最後，這是他想跟你說的一些話：「${extra}」所以今天打開這份禮物的你，請不要只是看完。請停下腳步，想想曾經那個相信你、支持你、為你加油的他，然後帶他的夢想大步往前走吧!`,
    `還有一句話被留在最後：「${extra}」它不華麗，他就是你。在某個晚上突然感性起來，把不好意思說出口的溫柔全部塞進信封裡，因為這些話，似乎只有你能夠懂。`,
    `如果一定要替這封信做個定義，我會說：不管現在的你過得如何，看完這封信，你會知道；其實一路上孤單的你，有個人默默地跟著你，陪伴你，陪你度過了無數個黑夜寒冬，無數難熬的日子。不是你最親近的家人，也不是你最要好的朋友，而是你:你就是你最堅強的後盾`,
    `所以截個圖吧!紀念過去那個青澀的自己，紀念那個曾無比相信你可以做到的自己，紀念現在正在讀這封信的自己，謝謝你沒有忘記過去的自己。`
  ];

  return [
    pick(openings),
    `${duration.label} 前，你寫下了這些話:「${extra}」。那時候的你不知道自己會經歷什麼，也不知道今天的你會適用著什麼心情讀到它。可是那些句子還是被留下來了，像一張很小的車票，證明你曾經從那一天出發，真的走到了現在，恭喜你!`,
    pick(middles),
    `他曾無比期待現在的你的性格與長相是否跟當初的他有著顯著的差別:「${wishLook}」這句話裡有期待，也有一點小心翼翼。他想知道現在的你，是不是滿意這樣的你，是不是有成為當初他想成為的大人呢?。`,
    pick(turns),
    `也許你這些年有些事做到了，有些事沒有。有些人還在，有些人已經離開；有些夢變得更清楚，有些夢像這封信一樣被埋藏了很久很久。一路上的坎坷，是否都有雨過天晴了呢?`,
    pick(endings)
  ].join("\n\n");
}

function renderEssayText(essay) {
  return `
    <h3>過去的你，把這些話整理成了一封信</h3>
    <p>${escapeHtml(essay)}</p>
  `;
}

function fadeAudio(audio, targetVolume, duration = 900) {
  const startVolume = audio.volume;
  const startTime = performance.now();

  return new Promise((resolve) => {
    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = startVolume + (targetVolume - startVolume) * eased;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        audio.volume = targetVolume;
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

async function playMusic(track = activeMusic, fadeDuration = 1300) {
  const previous = activeMusic;
  activeMusic = track;
  musicEnabled = true;
  if (musicToggle) musicToggle.setAttribute("aria-pressed", "true");

  if (previous !== activeMusic && !previous.paused) {
    fadeAudio(previous, 0, Math.min(1400, fadeDuration)).then(() => {
      previous.pause();
      previous.currentTime = 0;
      previous.volume = 1;
    });
  }

  try {
    if (activeMusic.paused) {
      activeMusic.volume = previous === activeMusic ? activeMusic.volume : 0;
    }
    await activeMusic.play();
    await fadeAudio(activeMusic, 1, previous === activeMusic ? 280 : fadeDuration);
  } catch {
    musicEnabled = false;
    if (musicToggle) musicToggle.setAttribute("aria-pressed", "false");
    showToast("瀏覽器需要你先點一下音樂按鈕才能播放");
  }
}

function fadeOutCurrentMusic(duration = 8000) {
  return fadeAudio(activeMusic, 0, duration).then(() => {
    activeMusic.pause();
    activeMusic.volume = 1;
    musicEnabled = false;
    if (musicToggle) musicToggle.setAttribute("aria-pressed", "false");
  });
}

function pauseMusic() {
  if (frontMusic) frontMusic.pause();
  if (openMusic) openMusic.pause();
  musicEnabled = false;
  if (musicToggle) musicToggle.setAttribute("aria-pressed", "false");
}

function toggleMusic() {
  if (musicEnabled) {
    pauseMusic();
  } else {
    playMusic(activeMusic);
  }
}

function playRecordCloseSound() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;

  audioContext = audioContext || new AudioEngine();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const bufferSize = audioContext.sampleRate * 1.4;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
  }

  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const click = audioContext.createOscillator();
  const clickGain = audioContext.createGain();

  noise.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(220, now + 1.35);
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

  click.type = "square";
  click.frequency.setValueAtTime(120, now);
  click.frequency.exponentialRampToValueAtTime(38, now + 0.22);
  clickGain.gain.setValueAtTime(0.22, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  click.connect(clickGain);
  clickGain.connect(audioContext.destination);

  noise.start(now);
  noise.stop(now + 1.45);
  click.start(now);
  click.stop(now + 0.28);
}

function spawnEncouragement() {
  if (!encouragementLayer) return;

  const item = document.createElement("span");
  item.className = "floating-encouragement";
  item.textContent = encouragements[Math.floor(Math.random() * encouragements.length)];

  if (Math.random() > 0.5) {
    item.style.left = `${4 + Math.random() * 16}%`;
  } else {
    item.style.left = `${82 + Math.random() * 14}%`;
  }

  item.style.bottom = `${30 + Math.random() * 40}%`;
  item.style.setProperty("--drift", `${Math.random() > 0.5 ? "" : "-"}${12 + Math.random() * 36}px`);
  encouragementLayer.append(item);

  window.setTimeout(() => item.remove(), 9600);
}

function startEncouragements() {
  window.clearInterval(encouragementTimer);
  if (encouragementLayer) encouragementLayer.innerHTML = "";
  spawnEncouragement();
  window.setTimeout(spawnEncouragement, 900);
  window.setTimeout(spawnEncouragement, 1900);
  encouragementTimer = window.setInterval(spawnEncouragement, 1800);
}

// 修正結構
function stopEncouragements() {
  window.clearInterval(encouragementTimer);
  encouragementTimer = null;
  window.setTimeout(() => {
    if (encouragementLayer) encouragementLayer.innerHTML = "";
  }, 6500);
}

function clearCinematicTimers() {
  cinematicTimers.forEach((timer) => window.clearTimeout(timer));
  cinematicTimers = [];
}

function scheduleCinematic(delay, callback) {
  const timer = window.setTimeout(callback, delay);
  cinematicTimers.push(timer);
  return timer;
}

function renderCreditsText(essay) {
  const paragraphs = essay.split("\n\n").map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  return `<h3>給未來的你</h3>${paragraphs}`;
}

function beginCinematicReveal(state) {
  const essay = buildEssay(state);
  const duration = durationMap[state.letter.duration];
  clearCinematicTimers();
  if (essayCard) essayCard.innerHTML = renderEssayText(essay);
  if (openedCard) openedCard.innerHTML = renderCard(state);
  if (finalContent) finalContent.classList.remove("show");
  if (creditsRoll) {
    creditsRoll.innerHTML = renderCreditsText(essay);
    creditsRoll.style.display = "";
    creditsRoll.style.animation = "none";
    void creditsRoll.offsetWidth;
    creditsRoll.style.animation = "";
  }
  if (cinematicFinalLine) cinematicFinalLine.classList.remove("show", "fade-out");
  if (cinematicOverlay) {
    cinematicOverlay.classList.remove("fade-away");
    cinematicOverlay.classList.add("active");
  }
  document.body.classList.add("cinematic-lock");
  showView("open");

  playRecordCloseSound();
  
  if (letterIntroText) letterIntroText.textContent = `這是一封來自${duration.label}前的信`;
  if (openingLetterText) openingLetterText.removeAttribute("aria-hidden");
  
  scheduleCinematic(1400, () => playMusic(openMusic, 6000));
  scheduleCinematic(2400, startEncouragements);
  scheduleCinematic(15000, () => {
    if (openingLetterText) openingLetterText.setAttribute("aria-hidden", "true");
  });
  scheduleCinematic(CINEMATIC_FINAL_SHOW, () => {
    stopEncouragements();
    if (creditsRoll) creditsRoll.style.display = "none";
    if (cinematicFinalLine) cinematicFinalLine.classList.add("show");
  });
  scheduleCinematic(CINEMATIC_FINAL_SHOW + CINEMATIC_FINAL_DISPLAY, () => {
    if (cinematicFinalLine) cinematicFinalLine.classList.add("fade-out");
  });
  scheduleCinematic(CINEMATIC_FADE_DELAY, () => {
    if (cinematicOverlay) cinematicOverlay.classList.add("fade-away");
  });
  scheduleCinematic(CINEMATIC_END_DELAY, () => {
    if (cinematicOverlay) cinematicOverlay.classList.remove("active", "fade-away");
    document.body.classList.remove("cinematic-lock");
    if (creditsRoll) creditsRoll.style.display = "";
    if (finalContent) finalContent.classList.add("show");
  });
}

async function generateShareScreenshotDataUrl(state) {
  if (!state.letter || !state.profile) {
    throw new Error("找不到膠囊資料，無法生成圖片");
  }

  const template = document.querySelector("#shareShotTemplate");
  const shareDurationLabel = document.querySelector("#shareDurationLabel");
  const shareEssayBody = document.querySelector("#shareEssayBody");
  const shareFirstMessage = document.querySelector("#shareFirstMessage");
  const shareCreatedDate = document.querySelector("#shareCreatedDate");

  if (!template) {
    throw new Error("找不到 #shareShotTemplate 模板");
  }

  const duration = durationMap[state.letter.duration] || { label: "某個時刻" };
  if (shareDurationLabel) {
    shareDurationLabel.textContent = `${duration.label} 後開啟`;
  }
  
  if (shareEssayBody) {
    shareEssayBody.textContent = buildEssay(state);
  }
  
  if (shareFirstMessage) {
    shareFirstMessage.textContent = `「${state.letter.message || "希望你還記得以前的自己。"}」`;
  }
  
  const dateSource = state.createdAt || state.archivedAt || Date.now();
  if (shareCreatedDate) {
    shareCreatedDate.textContent = new Date(dateSource).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  try {
    if (!window.html2canvas) {
      throw new Error("html2canvas 尚未加載");
    }
    
    console.log("開始進行 9:16 高規格圖形繪製...");
    const canvas = await html2canvas(template, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      foreignObjectRendering: false, 
      allowTaint: false
    });
    
    if (!canvas) {
      throw new Error("html2canvas 返回空 canvas");
    }
    
    const dataUrl = canvas.toDataURL("image/png");
    console.log("9:16 高規截圖生成成功！");
    
    return dataUrl;
  } catch (error) {
    console.error("html2canvas 渲染 9:16 分享卡片失敗:", error.message);
    throw error;
  }
}

function openScreenshotPreview(dataUrl) {
  currentScreenshotDataUrl = dataUrl;
  if (screenshotPreviewImage) screenshotPreviewImage.src = dataUrl;
  if (screenshotModal) {
    screenshotModal.classList.add("active");
    screenshotModal.removeAttribute("aria-hidden");
  }
}

function closeScreenshotPreview() {
  if (screenshotModal) {
    screenshotModal.classList.remove("active");
    screenshotModal.setAttribute("aria-hidden", "true");
  }
  if (screenshotPreviewImage) screenshotPreviewImage.src = "";
  currentScreenshotDataUrl = "";
}

function downloadScreenshotDataUrl(dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `time-capsule-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openScreenshotDataUrl(dataUrl) {
  window.open(dataUrl, "_blank", "noopener,noreferrer");
}

if (shareShot) {
  shareShot.addEventListener("click", async () => {
    try {
      if (!window.html2canvas) {
        showToast("圖片工具載入中，請稍候再試");
        return;
      }
      
      const state = loadState();
      if (!state.letter) {
        showToast("無法取得信件內容");
        return;
      }
      
      showToast("正在繪製 9:16 精美分享圖片...");
      const imageUrl = await generateShareScreenshotDataUrl(state);
      console.log("截圖生成成功:", imageUrl.slice(0, 50));
      openScreenshotPreview(imageUrl);
    } catch (error) {
      console.error("截圖預覽失敗:", error);
      showToast("截圖失敗，請改用系統截圖");
    }
  });
}

if (closeScreenshotModal) {
  closeScreenshotModal.addEventListener("click", closeScreenshotPreview);
}

if (screenshotModal) {
  screenshotModal.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") {
      closeScreenshotPreview();
    }
  });
}

if (downloadScreenshotBtn) {
  downloadScreenshotBtn.addEventListener("click", () => {
    if (currentScreenshotDataUrl) {
      downloadScreenshotDataUrl(currentScreenshotDataUrl);
      showToast("截圖已下載");
    }
  });
}

if (openScreenshotBtn) {
  openScreenshotBtn.addEventListener("click", () => {
    if (currentScreenshotDataUrl) {
      openScreenshotDataUrl(currentScreenshotDataUrl);
    }
  });
}

function hydrateProfile(profile = {}) {
  Object.entries(profile).forEach(([key, value]) => {
    if (profileForm && profileForm.elements[key]) {
      profileForm.elements[key].value = value;
    }
  });
}

function hydrateLetter(letter = {}) {
  Object.entries(letter).forEach(([key, value]) => {
    if (capsuleForm && capsuleForm.elements[key]) {
      capsuleForm.elements[key].value = value;
    }
  });
  updateDurationWords();
}

function formatRemaining(ms) {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, "0");
  if (days > 0) {
    return `${days} 天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function startCountdown(state) {
  window.clearInterval(countdownTimer);

  const tick = () => {
    const remaining = state.opensAt - Date.now();
    if (countdownText) countdownText.textContent = formatRemaining(remaining);

    if (remaining <= 0) {
      window.clearInterval(countdownTimer);
      showView("ready");
    }
  };

  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function showBuried(state, animate = false) {
  showView("buried");
  if (envelopeBury) envelopeBury.classList.toggle("burying", animate);
  if (countdownSign) countdownSign.classList.toggle("show", !animate);

  if (animate && countdownSign) {
    window.setTimeout(() => countdownSign.classList.add("show"), 1800);
  }

  startCountdown(state);
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleMusic);
}

if (resetLogin) {
  resetLogin.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    draft = null;
    if (profileForm) profileForm.reset();
    if (capsuleForm) capsuleForm.reset();
    updateDurationWords();
    window.clearInterval(countdownTimer);
    window.clearInterval(encouragementTimer);
    clearCinematicTimers();
    showToast("已重置資料並登出");
    showView("login");
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = loadState();
    state.profile = formToObject(profileForm);
    saveState(state);
    showView("write");
  });
}

if (durationGrid) {
  durationGrid.addEventListener("change", updateDurationWords);
}

if (capsuleForm) {
  capsuleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = loadState();
    state.letter = formToObject(capsuleForm);
    saveState(state);

    draft = {
      auth: state.auth,
      profile: state.profile,
      letter: state.letter,
      createdAt: Date.now()
    };

    if (previewCard) {
      previewCard.innerHTML = renderCard(draft);
      previewCard.classList.remove("pop-in");
      void previewCard.offsetWidth;
      previewCard.classList.add("pop-in");
    }
    showView("preview");
  });
}

if (archiveBtn) {
  archiveBtn.addEventListener("click", async () => {
    if (!draft) return;

    const duration = durationMap[draft.letter.duration];
    const opensAtTime = Date.now() + duration.ms;
    
    const state = {
      ...draft,
      status: "buried",
      opensAt: opensAtTime,
      archivedAt: Date.now()
    };

    showToast("雲端同步儲存中...");

    try {
      const { error } = await supabaseClient
        .from('capsules')
        .insert([
          {
            user_id: draft.auth.profile.sub, 
            user_email: draft.auth.profile.email, 
            profile_data: draft.profile,
            letter_data: draft.letter,
            opens_at: opensAtTime,
            status: "buried"
          }
        ]);

      if (error) throw error;

      saveState(state);
      showBuried(state, true);
      showToast("雲端封存成功！");
    } catch (err) {
      console.error("Supabase 寫入失敗:", err);
      showToast("雲端連線失敗，已將資料安全備份於本機");
      saveState(state);
      showBuried(state, true);
    }
  });
}

const digBtnElement = document.querySelector("#digBtn");
if (digBtnElement) {
  digBtnElement.addEventListener("click", () => {
    if (digScene) digScene.classList.add("active");
    showToast("正在挖出膠囊...");
    window.setTimeout(() => {
      showView("envelope");
      if (digScene) digScene.classList.remove("active");
    }, 3300);
  });
}

if (openEnvelope) {
  openEnvelope.addEventListener("click", () => {
    const state = loadState();
    openEnvelope.classList.add("opening");
    window.setTimeout(() => {
      beginCinematicReveal(state);
      openEnvelope.classList.remove("opening");
    }, 850);
  });
}

const newCapsuleElement = document.querySelector("#newCapsule");
if (newCapsuleElement) {
  newCapsuleElement.addEventListener("click", async () => {
    const oldState = loadState();
    
    showToast("正在清理舊膠囊狀態...");
    
    try {
      await supabaseClient
        .from('capsules')
        .update({ status: 'completed' })
        .eq('user_id', oldState.auth.profile.sub);
    } catch (e) {
      console.log("雲端重置忽略:", e);
    }

    const nextState = {
      auth: oldState.auth,
      profile: oldState.profile
    };
    saveState(nextState);
    if (capsuleForm) capsuleForm.reset();
    updateDurationWords();
    showView("write");
  });
}

async function boot() {
  showLoading();
  initializeGoogleSignIn();
  playMusic(frontMusic);
  const state = loadState();
  const isInitialOpen = !sessionStorage.getItem("hasVisited");
  if (isInitialOpen) {
    sessionStorage.setItem("hasVisited", "true");
  }

  if (!state.auth || isInitialOpen) {
    showView("login");
    return;
  }

  showToast("同步雲端膠囊中...");

  try {
    const { data, error } = await supabaseClient
      .from('capsules')
      .select('*')
      .eq('user_id', state.auth.profile.sub)
      .eq('status', 'buried')
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const syncedState = {
        auth: state.auth,
        profile: data.profile_data,
        letter: data.letter_data,
        opensAt: data.opens_at,
        status: data.status,
        createdAt: new Date(data.created_at).getTime()
      };
      
      saveState(syncedState);
      hydrateProfile(syncedState.profile);
      hydrateLetter(syncedState.letter);

      if (Date.now() >= syncedState.opensAt) {
        showView("ready");
        return;
      }
      showBuried(syncedState, false);
      return;
    }
  } catch (err) {
    console.error("雲端同步異常，切換至本機離線模式:", err);
  }

  hydrateProfile(state.profile);
  hydrateLetter(state.letter);

  if (!state.profile) {
    showView("profile");
    return;
  }

  if (state.status === "buried" && state.opensAt) {
    if (Date.now() >= state.opensAt) {
      showView("ready");
      return;
    }
    showBuried(state, false);
    return;
  }

  showView("write");
}

window.addEventListener('load', () => {
  boot();
});