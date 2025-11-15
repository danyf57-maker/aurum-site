import {
  loadDiscState,
  saveDiscState,
  upsertDiscAnswer,
  setDiscFreeText,
  clearDiscState,
} from "./sessionStore.js";
import { initStatusBar, setStatus } from "./statusBar.js";

const QUESTIONS_URL = "../assets/data/disc_questions_v1.json";

const questionContainerEl = document.getElementById("questionContainer");
const questionPromptEl = document.getElementById("questionPrompt");
const optionsGridEl = document.getElementById("optionsGrid");
const progressCurrentEl = document.getElementById("progressCurrent");
const progressTotalEl = document.getElementById("progressTotal");
const answersCountEl = document.getElementById("answersCount");
const resumeHintEl = document.getElementById("resumeHint");
const freeTextContainer = document.getElementById("freeTextContainer");
const freeTextPromptEl = freeTextContainer
  ? freeTextContainer.querySelector("p")
  : null;
const freeTextInput = document.getElementById("freeTextInput");
const freeTextSaveBtn = document.getElementById("freeTextSave");
const resetBtn = document.getElementById("resetBtn");

initStatusBar("#statusBar");

let questions = [];
let freeTextConfig = null;
let discState = loadDiscState();
let currentIndex = 0;

async function bootstrap() {
  try {
    setStatus("en_cours");
    const res = await fetch(QUESTIONS_URL);
    const data = await res.json();
    questions = data.questions ?? [];
    freeTextConfig = data.freeText;
    progressTotalEl.textContent = questions.length;
    currentIndex = computeCurrentIndex();
    renderQuestion();
    updateAnswersCount();
    hydrateFreeText();
    setStatus("pret");
  } catch (error) {
    console.error("Impossible de charger les questions", error);
    questionPromptEl.textContent =
      "Impossible de charger les questions hors-ligne. Réessaie plus tard.";
    optionsGridEl.innerHTML = "";
    setStatus("erreur");
  }
}

function computeCurrentIndex() {
  const answeredIds = Object.keys(discState.answers);
  if (answeredIds.length === 0) return 0;
  if (answeredIds.length >= questions.length) return questions.length;
  return answeredIds.length;
}

function renderQuestion() {
  const totalQuestions = questions.length;
  updateAnswersCount();
  if (currentIndex >= totalQuestions) {
    showFreeText();
    return;
  }

  resumeHintEl.textContent =
    currentIndex > 0
      ? "Reprise au point où tu t'étais arrêté."
      : "Tu peux quitter et revenir quand tu veux.";

  const question = questions[currentIndex];
  progressCurrentEl.textContent = currentIndex + 1;
  questionPromptEl.textContent = question.prompt;
  freeTextContainer.classList.add("hidden");
  questionContainerEl.classList.remove("hidden");

  optionsGridEl.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "w-full text-left rounded-xl border border-black/10 px-4 py-3 hover:border-primary focus:ring-0 transition";
    const saved = discState.answers[question.id];
    if (saved?.optionId === option.id) {
      button.classList.add("border-primary", "bg-primary/5");
    }
    button.textContent = option.label;
    button.addEventListener("click", () => handleAnswer(question, option));
    optionsGridEl.appendChild(button);
  });
}

function handleAnswer(question, option) {
  setStatus("en_cours");
  upsertDiscAnswer(question.id, {
    optionId: option.id,
    weights: option.weights,
    savedAt: new Date().toISOString(),
  });
  discState = loadDiscState();
  currentIndex = computeCurrentIndex();
  updateAnswersCount();
  setTimeout(() => {
    renderQuestion();
    setStatus("pret");
  }, 150);
}

function updateAnswersCount() {
  const total = Object.keys(discState.answers).length;
  answersCountEl.textContent =
    total === 1 ? "1 réponse" : `${total} réponses`;
}

function showFreeText() {
  questionContainerEl.classList.add("hidden");
  freeTextContainer.classList.remove("hidden");
  progressCurrentEl.textContent = questions.length;
  resumeHintEl.textContent =
    "Tu peux revenir pour ajuster ou ajouter une phrase libre.";
  if (freeTextConfig && freeTextPromptEl) {
    freeTextPromptEl.textContent = freeTextConfig.prompt;
    freeTextInput.placeholder = freeTextConfig.placeholder ?? "";
  }
}

function hydrateFreeText() {
  if (!discState.freeText) return;
  freeTextInput.value = discState.freeText;
}

freeTextSaveBtn?.addEventListener("click", () => {
  setStatus("en_cours");
  setDiscFreeText(freeTextInput.value.trim());
  saveDiscState({ completedAt: new Date().toISOString() });
  discState = loadDiscState();
  setStatus("pret");
});

resetBtn?.addEventListener("click", () => {
  if (!confirm("Effacer tes réponses et recommencer ?")) return;
  clearDiscState();
  discState = loadDiscState();
  currentIndex = 0;
  freeTextInput.value = "";
  setStatus("pret");
  renderQuestion();
});

bootstrap();
