// InkGrade AI — Client Application
let currentWorksheetData = null;
let currentSampleId = null;
let currentSpeechUtterance = null;
let currentAudioElement = null;
let currentSelectedLang = "en"; // "en", "hi", "mr"
let currentSelectedVoiceId = "en-male";
let speechRecognition = null;
let apiKey = localStorage.getItem("GEMINI_API_KEY") || "";

// DOM Elements
const sampleListEl = document.getElementById("sample-list");
const dropZoneEl = document.getElementById("drop-zone");
const fileInputEl = document.getElementById("file-input");
const stageLoadingEl = document.getElementById("stage-loading");
const emptyStateEl = document.getElementById("empty-state");
const sheetWrapperEl = document.getElementById("sheet-wrapper");
const sheetImageEl = document.getElementById("sheet-image");
const annotationOverlayEl = document.getElementById("annotation-overlay");
const scoreCardSectionEl = document.getElementById("score-card-section");
const cardStudentNameEl = document.getElementById("card-student-name");
const cardSubjectEl = document.getElementById("card-subject");
const cardScoreEl = document.getElementById("card-score");
const cardSummaryEl = document.getElementById("card-summary");
const activeSheetNameEl = document.getElementById("active-sheet-name");

// Voice Tutor Elements
const btnPlayVoiceEl = document.getElementById("btn-play-voice");
const btnStopVoiceEl = document.getElementById("btn-stop-voice");
const voiceBtnTextEl = document.getElementById("voice-btn-text");
const voiceBtnIconEl = document.getElementById("voice-btn-icon");
const voiceStatusEl = document.getElementById("voice-status");
const pulseIndicatorEl = document.getElementById("pulse-indicator");
const waveformBoxEl = document.getElementById("waveform-box");
const transcriptBodyEl = document.getElementById("transcript-body");
const voicePersonaSelectEl = document.getElementById("voice-persona-select");
const voiceTypeTagEl = document.getElementById("voice-type-tag");

// Talk-back Elements
const talkBackInputEl = document.getElementById("talk-back-input");
const btnMicEl = document.getElementById("btn-mic");
const btnSendQuestionEl = document.getElementById("btn-send-question");
const micStatusEl = document.getElementById("mic-status");

// API Key Modal Elements
const btnApiKeyEl = document.getElementById("btn-api-key");
const apiKeyLabelEl = document.getElementById("api-key-label");
const apiModalEl = document.getElementById("api-modal");
const btnCloseModalEl = document.getElementById("btn-close-modal");
const inputApiKeyEl = document.getElementById("input-api-key");
const btnSaveKeyEl = document.getElementById("btn-save-key");
const btnClearKeyEl = document.getElementById("btn-clear-key");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateApiKeyDisplay();
  loadSampleSheets();
  setupEventListeners();
  initSpeechRecognition();
});

function updateApiKeyDisplay() {
  if (apiKey) {
    apiKeyLabelEl.textContent = `API Key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
    apiKeyLabelEl.style.color = "#4ade80";
  } else {
    apiKeyLabelEl.textContent = "API Key: Demo Mode";
    apiKeyLabelEl.style.color = "";
  }
}

// Load Pre-generated Sample Sheets
async function loadSampleSheets() {
  try {
    const res = await fetch("/api/samples");
    const samples = await res.json();
    sampleListEl.innerHTML = "";

    samples.forEach((sample, idx) => {
      const card = document.createElement("div");
      card.className = "sample-card";
      card.dataset.id = sample.id;
      card.innerHTML = `
        <div class="sample-card-title">${sample.title}</div>
        <div class="sample-card-subject">${sample.subject}</div>
        <div class="sample-card-desc">${sample.description}</div>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".sample-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        gradeSampleSheet(sample.id, sample.title);
      });
      sampleListEl.appendChild(card);

      // Auto-load first sample on start!
      if (idx === 0) {
        card.classList.add("active");
        gradeSampleSheet(sample.id, sample.title);
      }
    });
  } catch (err) {
    console.error("Failed to load sample sheets", err);
  }
}

// Live Progress and Stepper Engine
let progressTimer = null;
let progressStartTime = 0;
let lastRetryFn = null;

const progressBarFillEl = document.getElementById("progress-bar-fill");
const progressPctEl = document.getElementById("progress-pct");
const loadingElapsedEl = document.getElementById("loading-elapsed");
const errorBannerEl = document.getElementById("error-banner");
const errorTitleEl = document.getElementById("error-title");
const errorMessageEl = document.getElementById("error-message");
const btnErrorRetryEl = document.getElementById("btn-error-retry");
const btnErrorOfflineEl = document.getElementById("btn-error-offline");
const btnErrorDismissEl = document.getElementById("btn-error-dismiss");

const step1El = document.getElementById("step-1");
const step2El = document.getElementById("step-2");
const step3El = document.getElementById("step-3");
const step4El = document.getElementById("step-4");

function setStep(stepNum, statusText, isDone) {
  const steps = [step1El, step2El, step3El, step4El];
  steps.forEach((el, idx) => {
    if (!el) return;
    if (idx + 1 < stepNum) {
      el.className = "step-item step-done";
      el.querySelector(".step-status").textContent = "Done ✓";
    } else if (idx + 1 === stepNum) {
      el.className = isDone ? "step-item step-done" : "step-item step-active";
      el.querySelector(".step-status").textContent = statusText;
    } else {
      el.className = "step-item";
      el.querySelector(".step-status").textContent = "Pending";
    }
  });
}

function showLoading(show) {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  if (show) {
    if (errorBannerEl) errorBannerEl.style.display = "none";
    emptyStateEl.style.display = "none";
    sheetWrapperEl.style.display = "none";
    const cWrap = document.getElementById("sheet-container-wrapper");
    if (cWrap) cWrap.style.display = "none";
    stageLoadingEl.style.display = "block";

    progressStartTime = Date.now();
    let currentPct = 15;
    if (progressBarFillEl) progressBarFillEl.style.width = "15%";
    if (progressPctEl) progressPctEl.textContent = "15%";
    if (loadingElapsedEl) loadingElapsedEl.textContent = "⏱️ Elapsed: 0.0s";
    setStep(1, "Complete ✓", true);

    progressTimer = setInterval(() => {
      const elapsed = ((Date.now() - progressStartTime) / 1000).toFixed(1);
      if (loadingElapsedEl) loadingElapsedEl.textContent = `⏱️ Elapsed: ${elapsed}s`;

      if (elapsed < 1.5) {
        currentPct = Math.min(35, currentPct + 2);
        setStep(2, "Processing...", false);
      } else if (elapsed < 4.5) {
        currentPct = Math.min(65, currentPct + 1.5);
        setStep(3, "Verifying Math/Logic...", false);
      } else if (elapsed < 9.0) {
        currentPct = Math.min(88, currentPct + 1);
        setStep(4, "Generating Annotations...", false);
      } else {
        // Slow network or large image - gently increment up to 94%
        currentPct = Math.min(94, currentPct + 0.3);
      }

      if (progressBarFillEl) progressBarFillEl.style.width = `${Math.round(currentPct)}%`;
      if (progressPctEl) progressPctEl.textContent = `${Math.round(currentPct)}%`;
    }, 120);

  } else {
    if (progressBarFillEl) progressBarFillEl.style.width = "100%";
    if (progressPctEl) progressPctEl.textContent = "100%";
    setStep(4, "Complete ✓", true);

    setTimeout(() => {
      stageLoadingEl.style.display = "none";
    }, 250);
  }
}

function showError(errMessage, retryFn, fallbackFn) {
  showLoading(false);
  lastRetryFn = retryFn;

  if (errorBannerEl) {
    errorBannerEl.style.display = "flex";
    if (errorMessageEl) errorMessageEl.textContent = errMessage || "An unexpected error occurred while analyzing the worksheet.";
    if (btnErrorOfflineEl) {
      if (fallbackFn) {
        btnErrorOfflineEl.style.display = "inline-flex";
        btnErrorOfflineEl.onclick = () => {
          errorBannerEl.style.display = "none";
          fallbackFn();
        };
      } else {
        btnErrorOfflineEl.style.display = "none";
      }
    }
  } else {
    alert("Grading Error: " + errMessage);
  }
}

if (btnErrorDismissEl) {
  btnErrorDismissEl.addEventListener("click", () => {
    if (errorBannerEl) errorBannerEl.style.display = "none";
  });
}

if (btnErrorRetryEl) {
  btnErrorRetryEl.addEventListener("click", () => {
    if (errorBannerEl) errorBannerEl.style.display = "none";
    if (lastRetryFn) lastRetryFn();
  });
}

// Grade Sample Sheet
async function gradeSampleSheet(sampleId, title) {
  currentSampleId = sampleId;
  showLoading(true);
  stopVoice();
  activeSheetNameEl.textContent = title;

  const formData = new FormData();
  formData.append("sample_id", sampleId);
  if (apiKey) formData.append("api_key", apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  try {
    const res = await fetch("/api/grade", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errJson.detail || "Server error");
    }
    const data = await res.json();
    renderGradedWorksheet(data);
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.name === "AbortError" 
      ? "Grading request timed out after 16s. Click Retry to re-evaluate." 
      : err.message;
    showError(
      msg,
      () => gradeSampleSheet(sampleId, title)
    );
  } finally {
    showLoading(false);
  }
}

let pendingUploadFile = null;

// Grade Uploaded Custom File
async function gradeUploadedFile(file) {
  if (!apiKey) {
    pendingUploadFile = file;
    inputApiKeyEl.placeholder = "AIzaSy... (Paste Gemini API key to grade custom upload)";
    apiModalEl.style.display = "flex";
    return;
  }

  showLoading(true);
  stopVoice();
  activeSheetNameEl.textContent = `Uploaded: ${file.name}`;
  document.querySelectorAll(".sample-card").forEach(c => c.classList.remove("active"));

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  try {
    const res = await fetch("/api/grade", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errJson.detail || "Server error");
    }
    const data = await res.json();
    renderGradedWorksheet(data);
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.name === "AbortError" 
      ? "Grading request timed out after 16s. Google AI servers took longer than expected. Click Retry." 
      : err.message;
    showError(
      msg,
      () => gradeUploadedFile(file),
      () => {
        // Fallback to user photo ground truth if applicable
        const sampleCard = document.querySelector(".sample-card[data-id='user_math_photo.jpg']");
        if (sampleCard) sampleCard.click();
      }
    );
  } finally {
    showLoading(false);
  }
}

// Render Results on Screen & Canvas
function renderGradedWorksheet(data) {
  currentWorksheetData = data;
  emptyStateEl.style.display = "none";
  sheetWrapperEl.style.display = "inline-block";
  scoreCardSectionEl.style.display = "block";

  // Score Card
  cardStudentNameEl.textContent = data.student_name || "Student";
  cardSubjectEl.textContent = data.subject || "Worksheet";
  cardScoreEl.textContent = data.overall_score || "";
  cardSummaryEl.textContent = data.summary || "";

  // Populate Handwriting OCR Extraction Console in UI
  const ocrSectionEl = document.getElementById("ocr-section");
  const ocrConsoleCardEl = document.getElementById("ocr-console-card");
  if (ocrSectionEl && ocrConsoleCardEl) {
    ocrSectionEl.style.display = "block";
    ocrConsoleCardEl.innerHTML = "";
    
    data.annotations.forEach(ann => {
      const itemEl = document.createElement("div");
      itemEl.className = "ocr-item";
      const isCorrect = ann.status === "correct";
      const studentAns = ann.student_answer || (isCorrect ? (ann.expected_answer || "Correct") : "N/A");
      itemEl.innerHTML = `
        <div class="ocr-q-header">
          <span class="ocr-q-badge">Question ${ann.question_number}</span>
          <span class="ocr-status-tag ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? `✓ Correct${studentAns && studentAns !== 'Correct' ? ` (${studentAns})` : ''}` : '✗ Incorrect'}
          </span>
        </div>
        <div class="ocr-raw-text">${ann.extracted_text || ann.error_step || 'Extracted step'}</div>
        <div class="ocr-answers">
          <span>Student Answer: <strong>${studentAns}</strong></span>
          ${ann.expected_answer ? `<span>Expected: <strong>${ann.expected_answer}</strong></span>` : ''}
        </div>
      `;
      ocrConsoleCardEl.appendChild(itemEl);
    });
  }

  // Print Structured Handwriting Extraction to Browser Console (F12)
  console.group("%c📝 [InkGrade AI] Handwriting Extraction & OCR Analysis", "background: #1e293b; color: #38bdf8; font-size: 14px; font-weight: bold; padding: 4px;");
  console.log("%cStudent Name:", "font-weight: bold;", data.student_name);
  console.log("%cSubject:", "font-weight: bold;", data.subject);
  console.log("%cOverall Score:", "font-weight: bold; color: #22c55e;", data.overall_score);
  console.log("%cTeacher Summary:", "color: #94a3b8;", data.summary);
  console.table(data.annotations.map(a => ({
    "Q#": a.question_number,
    "Status": a.status.toUpperCase(),
    "Extracted Handwriting": a.extracted_text || a.error_step || "N/A",
    "Student Answer": a.student_answer || (a.status === 'correct' ? (a.expected_answer || 'Correct') : 'N/A'),
    "Expected Answer": a.expected_answer || 'N/A',
    "Teacher Note": a.teacher_note
  })));
  console.groupEnd();

  // Populate AI Model, Cost & Token Telemetry in UI
  if (data.telemetry) {
    const telSec = document.getElementById("telemetry-section");
    if (telSec) telSec.style.display = "block";
    const telModelTag = document.getElementById("telemetry-model-tag");
    if (telModelTag) telModelTag.textContent = data.telemetry.model_used;
    const telModel = document.getElementById("tel-model");
    if (telModel) telModel.textContent = data.telemetry.model_used;
    const telTokens = document.getElementById("tel-tokens");
    if (telTokens) telTokens.textContent = (data.telemetry.total_tokens || 0).toLocaleString();
    const telPrompt = document.getElementById("tel-prompt-tokens");
    if (telPrompt) telPrompt.textContent = `${data.telemetry.prompt_tokens || 0} (Prompt + Image)`;
    const telCand = document.getElementById("tel-candidate-tokens");
    if (telCand) telCand.textContent = `${data.telemetry.candidate_tokens || 0} (JSON Boxes)`;
    const telCost = document.getElementById("tel-cost");
    if (telCost) telCost.textContent = `${data.telemetry.cost_usd || "$0.0002"} (~0.02¢)`;
    const telLat = document.getElementById("tel-latency");
    if (telLat) telLat.textContent = `${data.telemetry.latency_sec || 1.15}s`;

    console.group("%c⚡ [InkGrade AI] Cost, Model & Token Telemetry", "background: #1e1b4b; color: #a855f7; font-size: 14px; font-weight: bold; padding: 4px;");
    console.log("%cModel Used:", "font-weight: bold;", data.telemetry.model_used);
    console.log("%cPrompt Tokens (Image + Rules):", "font-weight: bold;", data.telemetry.prompt_tokens);
    console.log("%cOutput Tokens (JSON Annotations):", "font-weight: bold;", data.telemetry.candidate_tokens);
    console.log("%cTotal Tokens:", "font-weight: bold; color: #38bdf8;", data.telemetry.total_tokens);
    console.log("%cEstimated Cost (USD):", "font-weight: bold; color: #22c55e;", data.telemetry.cost_usd, `(${data.telemetry.cost_note})`);
    console.log("%cLatency:", "font-weight: bold; color: #f59e0b;", `${data.telemetry.latency_sec}s`);
    console.groupEnd();
  }

  // Show Sheet Container and Prominent Telemetry Bar Below Image
  const sheetContainerWrapperEl = document.getElementById("sheet-container-wrapper");
  if (sheetContainerWrapperEl) sheetContainerWrapperEl.style.display = "flex";
  if (sheetWrapperEl) sheetWrapperEl.style.display = "inline-block";

  // Populate Authentic Teacher Rubber Stamp in Header
  const stampContainer = document.getElementById("nav-stamp-container");
  const stampScore = document.getElementById("stamp-score");
  const stampVerdict = document.getElementById("stamp-verdict");
  const rubberStamp = document.getElementById("rubber-stamp");
  if (stampContainer && data.overall_score) {
    stampContainer.style.display = "block";
    if (stampScore) stampScore.textContent = data.overall_score;
    const hasIncorrect = (data.annotations || []).some(a => a.status === "incorrect");
    if (stampVerdict) {
      if (!hasIncorrect) {
        stampVerdict.textContent = "100% PERFECT";
        if (rubberStamp) rubberStamp.className = "rubber-stamp stamp-perfect";
      } else if (data.overall_score.includes("1 /") || data.overall_score.includes("2 /")) {
        stampVerdict.textContent = "NEEDS REVISION";
        if (rubberStamp) rubberStamp.className = "rubber-stamp stamp-revision";
      } else {
        stampVerdict.textContent = "PASSED";
        if (rubberStamp) rubberStamp.className = "rubber-stamp stamp-passed";
      }
    }
  }

  // Populate Prominent Telemetry Bar Directly Below Image & in Top Toolbar
  if (data.telemetry) {
    const barModel = document.getElementById("bar-model");
    if (barModel) barModel.textContent = data.telemetry.model_used;
    const barTokens = document.getElementById("bar-tokens");
    if (barTokens) barTokens.textContent = (data.telemetry.total_tokens || 0).toLocaleString();
    const barTokensDetail = document.getElementById("bar-tokens-detail");
    if (barTokensDetail) barTokensDetail.textContent = `(${data.telemetry.prompt_tokens || 0} prompt / ${data.telemetry.candidate_tokens || 0} candidate)`;
    const barCost = document.getElementById("bar-cost");
    if (barCost) barCost.textContent = `${data.telemetry.cost_usd || "$0.000237"}`;
    const barLatency = document.getElementById("bar-latency");
    if (barLatency) barLatency.textContent = `${data.telemetry.latency_sec || 1.15}s`;

    // Also populate top toolbar pill so cost/tokens are ALWAYS in sight!
    const tbPill = document.getElementById("toolbar-telemetry-pill");
    if (tbPill) tbPill.style.display = "inline-flex";
    const tbModel = document.getElementById("tb-model");
    if (tbModel) tbModel.textContent = data.telemetry.model_used;
    const tbTokens = document.getElementById("tb-tokens");
    if (tbTokens) tbTokens.textContent = (data.telemetry.total_tokens || 0).toLocaleString();
    const tbCost = document.getElementById("tb-cost");
    if (tbCost) tbCost.textContent = `${data.telemetry.cost_usd || "$0.0002"}`;
    const tbLat = document.getElementById("tb-lat");
    if (tbLat) tbLat.textContent = `${data.telemetry.latency_sec || 1.15}s`;
  }

  // Enable Voice & Inputs
  btnPlayVoiceEl.disabled = false;
  talkBackInputEl.disabled = false;
  btnMicEl.disabled = false;
  btnSendQuestionEl.disabled = false;

  // Set Transcript in active language
  updateTranscriptForLanguage();

  // Load Image and Overlay Markings
  sheetImageEl.src = data.image_url;
  const triggerDraw = () => {
    requestAnimationFrame(() => {
      drawAnnotations(data.annotations);
    });
  };

  sheetImageEl.onload = triggerDraw;
  if (sheetImageEl.complete && sheetImageEl.naturalHeight !== 0) {
    triggerDraw();
  }

  // Auto-play voice feedback after 0.6s in active language
  setTimeout(() => {
    let script = data.voice_script || "";
    if (currentSelectedLang === "hi" && data.voice_script_hi) {
      script = data.voice_script_hi;
    } else if (currentSelectedLang === "mr" && data.voice_script_mr) {
      script = data.voice_script_mr;
    }
    speakText(script, currentSelectedLang);
  }, 600);
}

// Draw Digital Teacher Ink over Image using 100% Pure Relative Coordinates (%)
function drawAnnotations(annotations) {
  annotationOverlayEl.innerHTML = "";
  if (!annotations || !annotations.length) return;

  annotations.forEach((ann, idx) => {
    const [ymin, xmin, ymax, xmax] = ann.box_2d || [100, 100, 200, 400];
    
    // Normalized 0-1000 converted directly to pure percentages (%)
    // This locks boxes physically to the image pixels at ANY zoom level or screen size!
    const topPct = (ymin / 10).toFixed(2);
    const leftPct = (xmin / 10).toFixed(2);
    const widthPct = ((xmax - xmin) / 10).toFixed(2);
    const heightPct = ((ymax - ymin) / 10).toFixed(2);

    const isCorrect = ann.status === "correct";

    // 1. Create Bounding Box
    const boxEl = document.createElement("div");
    boxEl.className = isCorrect ? "correct-box" : "correction-box";
    boxEl.id = `box-ann-${idx}`;
    boxEl.style.top = `${topPct}%`;
    boxEl.style.left = `${leftPct}%`;
    boxEl.style.width = `${widthPct}%`;
    boxEl.style.height = `${heightPct}%`;

    // 2. Create Floating Teacher Badge
    const badgeEl = document.createElement("div");
    badgeEl.className = isCorrect ? "teacher-correct-badge" : "teacher-note-badge";

    if (isCorrect) {
      const answerDisplay = ann.student_answer || ann.expected_answer || "";
      const answerSnippet = answerDisplay ? ` Ans = ${answerDisplay}` : "";
      badgeEl.innerHTML = `✓ <strong>Q${ann.question_number}: Correct!${answerSnippet}</strong>`;
    } else {
      badgeEl.innerHTML = `<span class="note-arrow">←</span> <strong>Q${ann.question_number}:</strong> ${ann.teacher_note}`;
    }

    // 3. Anchor Badge:
    // If xmax <= 680: place in margin to the right (badge-side)
    // If xmax > 680: pin inside the top-right corner of the box (badge-pinned-top) so it never overlaps other questions
    if (xmax <= 680) {
      badgeEl.classList.add("badge-side");
    } else {
      badgeEl.classList.add("badge-pinned-top");
    }

    // Interactive clicks (localized to active language)
    boxEl.addEventListener("click", (e) => {
      e.stopPropagation();
      highlightAnnotation(idx);
      let exp = ann.spoken_explanation;
      if (currentSelectedLang === "hi" && ann.spoken_explanation_hi) {
        exp = ann.spoken_explanation_hi;
      } else if (currentSelectedLang === "mr" && ann.spoken_explanation_mr) {
        exp = ann.spoken_explanation_mr;
      }
      speakText(exp, currentSelectedLang);
    });

    badgeEl.addEventListener("click", (e) => {
      e.stopPropagation();
      highlightAnnotation(idx);
      let exp = ann.spoken_explanation;
      if (currentSelectedLang === "hi" && ann.spoken_explanation_hi) {
        exp = ann.spoken_explanation_hi;
      } else if (currentSelectedLang === "mr" && ann.spoken_explanation_mr) {
        exp = ann.spoken_explanation_mr;
      }
      speakText(exp, currentSelectedLang);
    });

    // Pinned directly inside box so it CAN NEVER drift or desync!
    boxEl.appendChild(badgeEl);
    annotationOverlayEl.appendChild(boxEl);
  });
}

function highlightAnnotation(index) {
  document.querySelectorAll(".correction-box, .correct-box").forEach(b => b.classList.remove("active"));
  const target = document.getElementById(`box-ann-${index}`);
  if (target) {
    target.classList.add("active");
  }
}

// Re-draw on window resize so coordinates scale with image
window.addEventListener("resize", () => {
  if (currentWorksheetData) {
    drawAnnotations(currentWorksheetData.annotations);
  }
});

// Update live transcript panel for current selected language
function updateTranscriptForLanguage() {
  if (!currentWorksheetData) return;
  let script = currentWorksheetData.voice_script || "";
  if (currentSelectedLang === "hi" && currentWorksheetData.voice_script_hi) {
    script = currentWorksheetData.voice_script_hi;
  } else if (currentSelectedLang === "mr" && currentWorksheetData.voice_script_mr) {
    script = currentWorksheetData.voice_script_mr;
  }
  transcriptBodyEl.innerHTML = `<p>${script}</p>`;
}

// Intelligent Neural & Natural Voice Selection (English Female/Male, Hindi Male, Marathi Female)
function getBestVoiceForSelection(personaId, langCode) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;

  const isRobotic = (v) => /desktop|george|susan|hazel|hedda/i.test(v.name);

  if (langCode === "hi") {
    // Hindi - शिक्षक Male (Madhur / Hemant / Male Hindi)
    const maleHindi = voices.find(v => (v.lang.startsWith("hi") || /hindi/i.test(v.name)) && (/madhur/i.test(v.name) || /male/i.test(v.name) || /man/i.test(v.name) || /hemant/i.test(v.name)));
    if (maleHindi) return maleHindi;

    const anyHindi = voices.find(v => v.lang.startsWith("hi") || /hindi/i.test(v.name));
    if (anyHindi) return anyHindi;

    const indianVoice = voices.find(v => (v.lang.includes("IN") || /india/i.test(v.name)) && !isRobotic(v));
    if (indianVoice) return indianVoice;
  }

  if (langCode === "mr") {
    // Marathi - शिक्षिका Female
    const femaleMarathi = voices.find(v => (v.lang.startsWith("mr") || /marathi/i.test(v.name)) && (/aarohi/i.test(v.name) || /female/i.test(v.name) || /woman/i.test(v.name) || /natural/i.test(v.name)));
    if (femaleMarathi) return femaleMarathi;

    const anyMarathi = voices.find(v => v.lang.startsWith("mr") || /marathi/i.test(v.name));
    if (anyMarathi) return anyMarathi;

    // Devanagari Hindi female fallback (Swara / Google Hindi)
    const devanagariFemale = voices.find(v => (v.lang.startsWith("hi") || /hindi/i.test(v.name)) && (/swara/i.test(v.name) || /female/i.test(v.name) || /google/i.test(v.name) || /natural/i.test(v.name)));
    if (devanagariFemale) return devanagariFemale;

    const anyHindi = voices.find(v => v.lang.startsWith("hi") || /hindi/i.test(v.name));
    if (anyHindi) return anyHindi;
  }

  // English - Male
  if (personaId === "en-male") {
    const naturalMaleEn = voices.find(v => v.lang.startsWith("en") && (/guy/i.test(v.name) || /male/i.test(v.name) || /man/i.test(v.name) || /ravi/i.test(v.name) || /mark/i.test(v.name) || /david/i.test(v.name)));
    if (naturalMaleEn) return naturalMaleEn;
  }

  // English - Female (Jenny / Aria / Google US / Samantha)
  const naturalFemaleEn = voices.find(v => v.lang.startsWith("en") && (/jenny/i.test(v.name) || /aria/i.test(v.name) || /samantha/i.test(v.name) || /female/i.test(v.name) || /zira/i.test(v.name)));
  if (naturalFemaleEn) return naturalFemaleEn;

  const anyEn = voices.find(v => v.lang.startsWith("en") && !isRobotic(v));
  if (anyEn) return anyEn;

  return voices.find(v => v.lang.startsWith("en")) || voices[0];
}

// Universal Voice Synthesis Engine (Server Native MP3 Streaming + Local Fallback)
async function speakText(text, targetLang, targetVoice) {
  stopVoice();
  if (!text) return;

  const lang = targetLang || currentSelectedLang || "en";
  const voiceId = targetVoice || currentSelectedVoiceId || "en-female";

  // Visual state
  pulseIndicatorEl.classList.add("active");
  waveformBoxEl.classList.add("playing");
  btnPlayVoiceEl.style.display = "none";
  btnStopVoiceEl.style.display = "flex";
  voiceStatusEl.textContent = "Speaking...";

  // 1. Try High-Quality Server Native Speech (guarantees authentic Hindi, Marathi, and English voice without OS dependency)
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        language: lang,
        voice_name: voiceId,
        api_key: apiKey
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audio_base64) {
        if (currentAudioElement) {
          try {
            currentAudioElement.pause();
            currentAudioElement.currentTime = 0;
          } catch (_) {}
        }
        currentAudioElement = new Audio(`data:${data.mime_type || "audio/mp3"};base64,${data.audio_base64}`);
        currentAudioElement.onended = () => resetVoiceUI();
        currentAudioElement.onerror = () => resetVoiceUI();
        await currentAudioElement.play();
        return;
      }
    }
  } catch (err) {
    console.warn("Server TTS fetch failed, checking browser speech synthesis fallback:", err);
  }

  // 2. Client-side SpeechSynthesis Fallback
  if (!window.speechSynthesis) {
    resetVoiceUI();
    return;
  }

  currentSpeechUtterance = new SpeechSynthesisUtterance(text);
  currentSpeechUtterance.rate = (lang === "hi" || lang === "mr") ? 0.94 : (voiceId === "en-male" ? 1.0 : 0.98);
  currentSpeechUtterance.pitch = (voiceId === "en-male" || voiceId === "hi-male") ? 0.95 : 1.05;

  const voice = getBestVoiceForSelection(voiceId, lang);
  if (voice) {
    currentSpeechUtterance.voice = voice;
    currentSpeechUtterance.lang = voice.lang;
  } else {
    currentSpeechUtterance.lang = lang === "hi" ? "hi-IN" : (lang === "mr" ? "mr-IN" : "en-US");
  }

  currentSpeechUtterance.onend = () => resetVoiceUI();
  currentSpeechUtterance.onerror = (e) => {
    console.warn("Speech synthesis error event:", e);
    resetVoiceUI();
  };

  setTimeout(() => {
    try {
      window.speechSynthesis.speak(currentSpeechUtterance);
    } catch (_) {
      resetVoiceUI();
    }
  }, 40);
}

function stopVoice() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (_) {}
    currentAudioElement = null;
  }
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  resetVoiceUI();
}

function resetVoiceUI() {
  voiceStatusEl.textContent = "Ready";
  pulseIndicatorEl.classList.remove("active");
  waveformBoxEl.classList.remove("playing");
  btnPlayVoiceEl.style.display = "inline-flex";
  btnStopVoiceEl.style.display = "none";
}

// Two-way Voice: Student Asks Teacher Follow-up
async function askTeacherFollowUp(questionText) {
  if (!questionText.trim() || !currentWorksheetData) return;

  transcriptBodyEl.innerHTML += `
    <div style="margin-top: 14px; padding: 10px; background: rgba(59, 130, 246, 0.15); border-left: 3px solid #3b82f6; border-radius: 4px;">
      <strong>You asked:</strong> "${questionText}"
    </div>
  `;
  talkBackInputEl.value = "";
  micStatusEl.textContent = "Teacher is thinking...";

  try {
    const res = await fetch("/api/ask-teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_query: questionText,
        worksheet_context: currentWorksheetData,
        api_key: apiKey,
        language: currentSelectedLang
      })
    });
    const result = await res.json();
    
    const teacherName = currentSelectedLang === "hi" ? "श्रीमती शर्मा" : (currentSelectedLang === "mr" ? "सौ. कुलकर्णी" : "Mrs. Davis");
    transcriptBodyEl.innerHTML += `
      <div style="margin-top: 10px; padding: 10px; background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; border-radius: 4px;">
        <strong>${teacherName}:</strong> "${result.reply}"
      </div>
    `;
    transcriptBodyEl.scrollTop = transcriptBodyEl.scrollHeight;
    speakText(result.reply, currentSelectedLang);
  } catch (err) {
    console.error("Ask teacher error:", err);
  } finally {
    micStatusEl.textContent = "Press 🎙️ or type to ask follow-up questions";
  }
}

// Speech Recognition for Mic Button
function initSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    btnMicEl.title = "Microphone not supported in this browser. Use text box!";
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.lang = "en-US";

  speechRecognition.onstart = () => {
    btnMicEl.classList.add("recording");
    micStatusEl.textContent = "Listening... Speak your question now!";
  };

  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    talkBackInputEl.value = transcript;
    askTeacherFollowUp(transcript);
  };

  speechRecognition.onerror = (e) => {
    console.warn("Speech recognition error:", e);
    btnMicEl.classList.remove("recording");
    micStatusEl.textContent = "Speech recognition stopped.";
  };

  speechRecognition.onend = () => {
    btnMicEl.classList.remove("recording");
    micStatusEl.textContent = "Press 🎙️ or type to ask follow-up questions";
  };
}

// Setup Event Listeners
function setupEventListeners() {
  // Voice Controls
  btnPlayVoiceEl.addEventListener("click", () => {
    if (currentWorksheetData) {
      let script = currentWorksheetData.voice_script || "";
      if (currentSelectedLang === "hi" && currentWorksheetData.voice_script_hi) {
        script = currentWorksheetData.voice_script_hi;
      } else if (currentSelectedLang === "mr" && currentWorksheetData.voice_script_mr) {
        script = currentWorksheetData.voice_script_mr;
      }
      speakText(script, currentSelectedLang);
    }
  });

  btnStopVoiceEl.addEventListener("click", stopVoice);

  // Voice Persona and Language Selector Dropdown (English Female/Male, Hindi Shikshak, Marathi Shikshika)
  if (voicePersonaSelectEl) {
    voicePersonaSelectEl.addEventListener("change", (e) => {
      const selectedVal = e.target.value;
      currentSelectedVoiceId = selectedVal;
      const avatarEl = document.getElementById("tutor-avatar");
      const nameEl = document.getElementById("tutor-name");

      let greeting = "";
      if (selectedVal === "en-male") {
        currentSelectedLang = "en";
        if (voiceTypeTagEl) voiceTypeTagEl.textContent = "English Coach (Male)";
        if (avatarEl) avatarEl.textContent = "🧑‍🏫";
        if (nameEl) nameEl.textContent = "English Coach (Guy)";
        greeting = "Hey there! Coach Guy here. Let's look over your answers and sharpen your skills.";
      } else if (selectedVal === "en-female") {
        currentSelectedLang = "en";
        if (voiceTypeTagEl) voiceTypeTagEl.textContent = "English (Female)";
        if (avatarEl) avatarEl.textContent = "👩‍🏫";
        if (nameEl) nameEl.textContent = "Teacher Mrs. Davis";
        greeting = "Hello! I am Mrs. Davis, your English teacher. Let's review your worksheet together.";
      } else if (selectedVal === "hi-male") {
        currentSelectedLang = "hi";
        if (voiceTypeTagEl) voiceTypeTagEl.textContent = "हिन्दी (शिक्षक)";
        if (avatarEl) avatarEl.textContent = "👨‍🏫";
        if (nameEl) nameEl.textContent = "श्री वर्मा (Hindi Teacher)";
        greeting = "नमस्ते! मैं आपका शिक्षक वर्मा हूँ। आइए गलतियों को सुधारें और सही नियम सीखें।";
      } else if (selectedVal === "mr-female") {
        currentSelectedLang = "mr";
        if (voiceTypeTagEl) voiceTypeTagEl.textContent = "मराठी (शिक्षिका)";
        if (avatarEl) avatarEl.textContent = "👩‍🏫";
        if (nameEl) nameEl.textContent = "सौ. कुलकर्णी (Marathi Teacher)";
        greeting = "नमस्कार! मी तुमची शिक्षिका सौ. कुलकर्णी. चला तुमची वर्कशीट काळजीपूर्वक पाहूया.";
      }

      // Update Speech Recognition language
      if (speechRecognition) {
        speechRecognition.lang = currentSelectedLang === "hi" ? "hi-IN" : (currentSelectedLang === "mr" ? "mr-IN" : "en-US");
      }

      // Update live transcript panel to the selected language
      updateTranscriptForLanguage();

      // Speak greeting in the newly selected language and voice immediately
      speakText(greeting, currentSelectedLang, selectedVal);
    });
  }

  // Talk-Back Q&A
  btnSendQuestionEl.addEventListener("click", () => {
    askTeacherFollowUp(talkBackInputEl.value);
  });

  talkBackInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      askTeacherFollowUp(talkBackInputEl.value);
    }
  });

  btnMicEl.addEventListener("click", () => {
    if (!speechRecognition) {
      alert("Microphone recognition is not supported in this browser. Please type your question in the text box.");
      return;
    }
    stopVoice();
    speechRecognition.start();
  });

  // Header and Empty State Upload Buttons
  const btnHeaderUpload = document.getElementById("btn-header-upload");
  if (btnHeaderUpload) btnHeaderUpload.addEventListener("click", () => fileInputEl.click());

  const btnEmptyUpload = document.getElementById("btn-empty-upload");
  if (btnEmptyUpload) btnEmptyUpload.addEventListener("click", () => fileInputEl.click());

  // Dropzone File Upload
  dropZoneEl.addEventListener("click", () => fileInputEl.click());

  fileInputEl.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      gradeUploadedFile(e.target.files[0]);
    }
  });

  dropZoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneEl.classList.add("dragover");
  });

  dropZoneEl.addEventListener("dragleave", () => {
    dropZoneEl.classList.remove("dragover");
  });

  dropZoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZoneEl.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      gradeUploadedFile(e.dataTransfer.files[0]);
    }
  });

  // Zoom Fit Button - Toggles comfortable fit to screen so entire sheet & telemetry are visible
  const btnZoomFitEl = document.getElementById("btn-zoom-fit");
  let isFitMode = false;
  if (btnZoomFitEl) {
    btnZoomFitEl.addEventListener("click", () => {
      isFitMode = !isFitMode;
      const imgEl = document.getElementById("sheet-image");
      if (isFitMode) {
        btnZoomFitEl.textContent = "100%";
        btnZoomFitEl.title = "View Full Resolution";
        if (imgEl) {
          imgEl.style.maxHeight = "68vh";
          imgEl.style.width = "auto";
        }
      } else {
        btnZoomFitEl.textContent = "Fit";
        btnZoomFitEl.title = "Fit to Screen";
        if (imgEl) {
          imgEl.style.maxHeight = "";
          imgEl.style.width = "";
        }
      }
    });
  }

  // API Key Modal
  btnApiKeyEl.addEventListener("click", () => {
    inputApiKeyEl.value = apiKey;
    apiModalEl.style.display = "flex";
  });

  btnCloseModalEl.addEventListener("click", () => {
    apiModalEl.style.display = "none";
    pendingUploadFile = null;
  });

  btnSaveKeyEl.addEventListener("click", () => {
    apiKey = inputApiKeyEl.value.trim();
    if (apiKey) {
      localStorage.setItem("GEMINI_API_KEY", apiKey);
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
    }
    updateApiKeyDisplay();
    apiModalEl.style.display = "none";

    // If an upload was waiting on API key, grade it immediately!
    if (pendingUploadFile) {
      const fileToGrade = pendingUploadFile;
      pendingUploadFile = null;
      gradeUploadedFile(fileToGrade);
    } else if (currentSampleId) {
      gradeSampleSheet(currentSampleId, activeSheetNameEl.textContent);
    }
  });

  btnClearKeyEl.addEventListener("click", () => {
    apiKey = "";
    localStorage.removeItem("GEMINI_API_KEY");
    updateApiKeyDisplay();
    apiModalEl.style.display = "none";
    pendingUploadFile = null;
  });
}

// Eagerly pre-load browser voices for instant Natural Speech response
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    if (window.speechSynthesis.getVoices) {
      window.speechSynthesis.getVoices();
    }
  };
}
