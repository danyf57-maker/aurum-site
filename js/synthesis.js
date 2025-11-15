import {
  loadDiscState,
  loadProfileState,
  saveProfileState,
  hasProfileState,
} from "./sessionStore.js";
import { initStatusBar, setStatus } from "./statusBar.js";

const TEMPLATE_URL = "../assets/data/profile_templates_v1.json";

const sectionsContainer = document.getElementById("profileSections");
const subtitleEl = document.getElementById("profileSubtitle");
const titleEl = document.getElementById("profileTitle");
const pairEl = document.getElementById("profilePair");
const generatedEl = document.getElementById("profileGenerated");

initStatusBar("#statusBar");

const existingProfile = hasProfileState() ? loadProfileState() : null;

if (existingProfile?.template && existingProfile.dominant) {
  renderProfile(existingProfile, {
    message: "Portrait restauré depuis cet appareil.",
  });
  setStatus("pret");
} else {
  runSynthesis();
}

async function runSynthesis() {
  const discState = loadDiscState();
  const answerCount = Object.keys(discState.answers ?? {}).length;
  if (answerCount === 0) {
    subtitleEl.textContent =
      "Aucune réponse enregistrée pour l’instant. Revenez aux questions si vous souhaitez poursuivre.";
    sectionsContainer.innerHTML = "";
    setStatus("erreur");
    return;
  }

  setStatus("en_cours");
  subtitleEl.textContent = "Analyse en cours…";

  const scores = computeScores(discState.answers);
  const [dominant, secondary] = pickDominant(scores);

  try {
    const templateData = await fetchTemplates();
    const template = pickTemplate(templateData, dominant, secondary);
    if (!template) {
      throw new Error("Template manquant");
    }
    const payload = {
      rawScores: scores,
      dominant,
      secondary,
      template,
      generatedAt: new Date().toISOString(),
    };
    saveProfileState(payload);
    renderProfile(payload, {
      message: "Portrait calculé localement après le questionnaire.",
    });
    setStatus("pret");
  } catch (error) {
    console.error("Erreur synthèse", error);
    subtitleEl.textContent =
      "Impossible de charger les portraits hors connexion initiale. Vous pourrez réessayer plus tard.";
    sectionsContainer.innerHTML = "";
    setStatus("erreur");
  }
}

function computeScores(answers) {
  const totals = { D: 0, I: 0, S: 0, C: 0 };
  Object.values(answers).forEach((entry) => {
    const weights = entry.weights ?? {};
    totals.D += weights.D ?? 0;
    totals.I += weights.I ?? 0;
    totals.S += weights.S ?? 0;
    totals.C += weights.C ?? 0;
  });
  return totals;
}

function pickDominant(scores) {
  const pairs = Object.entries(scores);
  pairs.sort((a, b) => b[1] - a[1]);
  const dominant = pairs[0]?.[0] ?? "D";
  const secondary = pairs[1]?.[0] ?? dominant;
  return [dominant, secondary];
}

async function fetchTemplates() {
  const res = await fetch(TEMPLATE_URL);
  return res.json();
}

function pickTemplate(data, dominant, secondary) {
  if (!data?.profiles) return null;
  const directKey = `${dominant}_${secondary}`;
  const fallbackKey = `${dominant}_${dominant}`;
  return data.profiles[directKey] ?? data.profiles[fallbackKey] ?? null;
}

function renderProfile(profile, { message }) {
  const { template, dominant, secondary, generatedAt } = profile;
  if (!template) {
    subtitleEl.textContent =
      "Portrait introuvable. Reprenez les questions si nécessaire.";
    sectionsContainer.innerHTML = "";
    setStatus("erreur");
    return;
  }
  subtitleEl.textContent = message;
  titleEl.textContent = template.title ?? "";
  pairEl.textContent = `Dominante ${dominant} • Nuance ${secondary}`;
  generatedEl.textContent = generatedAt
    ? `Mis à jour le ${new Date(generatedAt).toLocaleString("fr-FR")}`
    : "";

  sectionsContainer.innerHTML = "";
  const sections = [
    { title: "Votre élan le plus visible", items: template.strengths ?? [] },
    {
      title: "Une couleur qui nuance votre façon d’être",
      items: template.limits ?? [],
    },
    {
      title: "L’effet possible sur votre environnement",
      items: template.behaviors?.environment ?? [],
    },
    {
      title: "À garder en arrière-plan",
      items: template.behaviors?.backdrop ?? [],
    },
  ];
  sections.forEach((section) => {
    sectionsContainer.appendChild(renderSection(section.title, section.items));
  });
}

function renderSection(title, items) {
  const article = document.createElement("article");
  article.className =
    "rounded-2xl bg-white shadow-soft border border-black/5 p-5 space-y-3";
  const heading = document.createElement("h3");
  heading.className = "font-semibold text-lg";
  heading.textContent = title;
  const list = document.createElement("ul");
  list.className = "space-y-2 text-sm leading-relaxed";
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
  article.appendChild(heading);
  article.appendChild(list);
  return article;
}
