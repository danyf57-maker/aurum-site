import {
  hasProfileState,
  loadProfileState,
  hasCoachingState,
  loadCoachingState,
  saveCoachingState,
} from "./sessionStore.js";
import { initStatusBar, setStatus } from "./statusBar.js";

const TEMPLATE_URL = "../assets/data/coaching_templates_v1.json";

const tracksEl = document.getElementById("coachingTracks");
const practiceEl = document.getElementById("weeklyPractice");
const metaEl = document.getElementById("coachingMeta");

initStatusBar("#statusBar");

const profile = hasProfileState() ? loadProfileState() : null;

if (!profile?.dominant) {
  tracksEl.innerHTML =
    '<p class="text-sm text-center text-red-700/80">Portrait introuvable. Revenez sur les questions ou sur la synthèse pour relancer l’analyse.</p>';
  practiceEl.textContent = "";
  setStatus("erreur");
} else {
  const stored = hasCoachingState() ? loadCoachingState() : null;
  if (
    stored &&
    stored.dominant === profile.dominant &&
    stored.secondary === profile.secondary
  ) {
    renderCoaching(stored);
    setStatus("pret");
  } else {
    runCoaching(profile);
  }
}

async function runCoaching(profileState) {
  setStatus("en_cours");

  try {
    const data = await fetchTemplates();
    const template = pickTemplate(
      data,
      profileState.dominant,
      profileState.secondary,
    );
    if (!template) throw new Error("Template coaching manquant");

    const payload = {
      dominant: profileState.dominant,
      secondary: profileState.secondary,
      advice: template.conseils ?? [],
      weeklyPractice: template.pratique ?? "",
      generatedAt: new Date().toISOString(),
    };
    saveCoachingState(payload);
    renderCoaching(payload);
    setStatus("pret");
  } catch (error) {
    console.error("Erreur coaching", error);
    tracksEl.innerHTML =
      '<p class="text-sm text-center text-red-700/80">Impossible de charger les pistes hors connexion initiale. Vous pourrez réessayer plus tard.</p>';
    practiceEl.textContent = "";
    setStatus("erreur");
  }
}

async function fetchTemplates() {
  const res = await fetch(TEMPLATE_URL);
  return res.json();
}

function pickTemplate(data, dominant, secondary) {
  if (!data?.modules) return null;
  const key = `${dominant}_${secondary}`;
  const fallback = `${dominant}_${dominant}`;
  return data.modules[key] ?? data.modules[fallback] ?? null;
}

function renderCoaching(coaching) {
  tracksEl.innerHTML = "";
  (coaching.advice ?? []).forEach((text, index) => {
    const article = document.createElement("article");
    article.className =
      "rounded-2xl bg-white shadow-soft border border-black/5 p-5 space-y-2";
    const heading = document.createElement("h2");
    heading.className = "font-semibold text-lg";
    heading.textContent = `Piste ${index + 1}`;
    const body = document.createElement("p");
    body.className = "text-sm leading-relaxed";
    body.textContent = text;
    article.appendChild(heading);
    article.appendChild(body);
    tracksEl.appendChild(article);
  });
  practiceEl.textContent = coaching.weeklyPractice ?? "";
  metaEl.textContent = coaching.generatedAt
    ? `Créé le ${new Date(coaching.generatedAt).toLocaleString(
        "fr-FR",
      )}. Vous pouvez laisser ces pistes de côté, les modifier ou les supprimer.`
    : "";
}
