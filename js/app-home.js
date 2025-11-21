// js/app-home.js
import { getCurrentUser } from "./supabaseClient.js";
import { loadDiscState } from "./sessionStore.js";
import { initStatusBar } from "./statusBar.js";

initStatusBar("#statusBar");

function readAnswers() {
  try {
    const raw = window.localStorage.getItem("aurum_answers");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "object" && parsed !== null) {
      return Object.values(parsed);
    }
    return [];
  } catch (error) {
    console.warn("[Aurum Home] Impossible de lire aurum_answers :", error);
    return [];
  }
}

function textContentOrFallback(id, value) {
  const el = document.getElementById(id);
  if (!el) return null;
  el.textContent = value;
  return el;
}

document.addEventListener("DOMContentLoaded", async () => {
  const answers = readAnswers();
  const discState = loadDiscState();
  const answeredCount = Object.keys(discState.answers ?? {}).length;
  const totalCount = 24;

  // Avancement
  textContentOrFallback("completedCount", answeredCount.toString());
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    const percent = Math.min((answeredCount / totalCount) * 100, 100);
    progressBar.style.width = `${percent}%`;
  }

  // Dernière visite
  const lastVisitEl = document.getElementById("lastVisit");
  if (lastVisitEl) {
    const lastVisitTimestamp = window.localStorage.getItem("aurum_last_visit");
    if (lastVisitTimestamp) {
      const diff = Date.now() - parseInt(lastVisitTimestamp, 10);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      lastVisitEl.textContent =
        days === 0
          ? "Dernière visite : aujourd'hui"
          : `Dernière visite : il y a ${days} jour${days > 1 ? "s" : ""}`;
    } else {
      lastVisitEl.textContent = "Bienvenue pour cette première visite.";
    }
  }

  // Portrait Preview
  const lastEntry = answers[answers.length - 1];
  let snippetSource = "";
  if (typeof lastEntry === "string") {
    snippetSource = lastEntry;
  } else if (lastEntry && typeof lastEntry === "object") {
    snippetSource = lastEntry.answer ?? lastEntry.text ?? "";
  }
  const snippet =
    snippetSource && snippetSource.length > 150
      ? `${snippetSource.slice(0, 150)}…`
      : snippetSource || "Ton portrait se construira au fil de tes réponses.";
  textContentOrFallback("portraitPreview", snippet);

  // Actions navigation
  const resumeBtn = document.getElementById("resumeBtn");
  resumeBtn?.addEventListener("click", () => {
    window.location.href = "/pages/disc.html";
  });

  const newJourneyBtn = document.getElementById("newJourneyBtn");
  newJourneyBtn?.addEventListener("click", () => {
    window.localStorage.removeItem("aurum_answers");
    window.location.href = "/pages/disc.html";
  });

  const seeAnswersBtn = document.getElementById("seeAnswersBtn");
  seeAnswersBtn?.addEventListener("click", () => {
    window.location.href = "/pages/dialogue.html";
  });

  const fullPortraitBtn = document.getElementById("fullPortraitBtn");
  fullPortraitBtn?.addEventListener("click", () => {
    window.location.href = "/pages/profile.html";
  });

  // Sauvegarde la visite du jour
  window.localStorage.setItem("aurum_last_visit", Date.now().toString());

  // Affichage du user (si disponible)
  const user = await getCurrentUser();
  const nameSlot = document.getElementById("userName");
  if (nameSlot) {
    nameSlot.textContent = user?.email ?? "toi";
  }
});
