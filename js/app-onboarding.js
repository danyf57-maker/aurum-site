import { loadSession, saveSession } from "./sessionStore.js";
import { initStatusBar, setStatus } from "./statusBar.js";

initStatusBar("#statusBar");

const steps = Array.from(document.querySelectorAll(".step"));
let currentStep = 0;

const intentInputs = document.querySelectorAll('input[name="intent"]');
const nicknameInput = document.getElementById("nicknameInput");
const stepOneBtn = document.getElementById("stepOneBtn");
const stepTwoBtn = document.getElementById("stepTwoBtn");
const finishBtn = document.getElementById("finishBtn");

const savedSession = loadSession();

if (savedSession.intent) {
  const existing = document.querySelector(
    `input[name="intent"][value="${savedSession.intent}"]`,
  );
  if (existing) {
    existing.checked = true;
    stepTwoBtn.disabled = false;
  }
}

if (savedSession.nickname) {
  nicknameInput.value = savedSession.nickname;
}

function showStep(index) {
  steps.forEach((step, idx) => {
    step.classList.toggle("hidden", idx !== index);
  });
  currentStep = index;
}

showStep(currentStep);

stepOneBtn?.addEventListener("click", () => {
  showStep(1);
});

intentInputs.forEach((input) => {
  input.addEventListener("change", () => {
    stepTwoBtn.disabled = false;
  });
});

stepTwoBtn?.addEventListener("click", () => {
  if (currentStep !== 1) return;
  const chosen = document.querySelector('input[name="intent"]:checked');
  if (!chosen) return;
  setStatus("en_cours");
  saveSession({
    mode: "anonymous",
    intent: chosen.value,
  });
  setStatus("pret");
  showStep(2);
});

finishBtn?.addEventListener("click", () => {
  setStatus("en_cours");
  saveSession({
    nickname: nicknameInput.value.trim(),
    onboardingComplete: true,
  });
  setStatus("pret");
  window.location.href = "./disc.html";
});
