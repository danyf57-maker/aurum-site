const POSITIVE_WORDS = [
  "envie",
  "motivé",
  "joie",
  "calme",
  "clarté",
  "confiance",
  "liberté",
  "apaisé",
];
const NEGATIVE_WORDS = [
  "fatigue",
  "peur",
  "stress",
  "doute",
  "lassitude",
  "triste",
  "confus",
  "lourd",
];
const CLARITY_WORDS = ["clarité", "lucide", "comprends", "net", "aligné"];
const CONFUSION_WORDS = ["confus", "flou", "brouillard", "perdu"];

const THEME_KEYWORDS = {
  "Clarté & direction": ["clarité", "choix", "direction", "cap"],
  "Relations & présence": ["relation", "famille", "ami", "couple"],
  "Confiance & posture": ["confiance", "peur", "doute", "légitime"],
  "Sens & ambition": ["avenir", "projet", "ambition", "mission"],
  "Rythme & énergie": ["fatigue", "repos", "rythme", "respirer"],
  "Émotions & ressenti": ["émotion", "ressens", "intérieur", "coeur"],
};

function normalizeAnswers() {
  try {
    const raw = window.localStorage.getItem("aurum_answers");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (typeof entry === "string") {
          return { text: entry, timestamp: Date.now() };
        }
        if (entry && typeof entry === "object") {
          const text =
            entry.answer ??
            entry.text ??
            entry.value ??
            (Array.isArray(entry) ? entry.join(" ") : JSON.stringify(entry));
          return {
            ...entry,
            text: text ?? "",
            timestamp: entry.timestamp ?? Date.now(),
          };
        }
        return null;
      })
      .filter((entry) => entry && entry.text && entry.text.trim().length > 0);
  } catch (error) {
    console.warn("[Aurum] Impossible de lire aurum_answers :", error);
    return [];
  }
}

function countKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce(
    (acc, word) => acc + (lower.includes(word) ? 1 : 0),
    0,
  );
}

function computeTone(text) {
  const positive = countKeywords(text, POSITIVE_WORDS);
  const negative = countKeywords(text, NEGATIVE_WORDS);
  if (positive > negative) return "lumineuse";
  if (negative > positive) return "tendue";
  return "neutre";
}

function computeEnergy(entries) {
  if (!entries.length) return "douce";
  const avgLength =
    entries.reduce((sum, entry) => sum + entry.text.length, 0) /
    entries.length;
  if (avgLength > 250) return "vive";
  if (avgLength > 120) return "modérée";
  return "douce";
}

function computeClarity(text) {
  const clarity = countKeywords(text, CLARITY_WORDS);
  const confusion = countKeywords(text, CONFUSION_WORDS);
  if (clarity - confusion >= 2) return "précise";
  if (clarity >= confusion) return "en progression";
  return "en recherche";
}

function computeVariation(entries) {
  if (entries.length < 4) return "stable";
  const recent = entries.slice(-4).reduce((sum, e) => sum + e.text.length, 0);
  const previous = entries
    .slice(-8, -4)
    .reduce((sum, e) => sum + e.text.length, 0);
  if (!previous) return "naissante";
  const ratio = recent / previous;
  if (ratio > 1.2) return "en amplification";
  if (ratio < 0.8) return "en apaisement";
  return "stable";
}

function pickSummary(tone, variation) {
  const templates = {
    lumineuse: [
      "Une énergie calme, tournée vers la clarté.",
      "Une respiration nouvelle, disponible pour l’élan.",
      "Un terrain propice aux décisions paisibles.",
    ],
    neutre: [
      "Une période d’ajustement intérieur.",
      "Un temps de décantation et de lucidité douce.",
      "Une transition qui s’organise avec patience.",
    ],
    tendue: [
      "Un besoin de douceur et de ralentissement.",
      "Une densité émotionnelle qui cherche un sens.",
      "Une envie de déposer ce qui pèse pour respirer.",
    ],
  };
  const pool = templates[tone] ?? templates.neutre;
  const index = variation === "en amplification" ? 0 : variation === "en apaisement" ? 1 : 2;
  return pool[index % pool.length];
}

function buildSignatureTexts(tone, variation, energy, clarity, topTheme) {
  const traverses =
    tone === "tendue"
      ? "Tu traverses un passage dense, mais tu restes relié à ce qui compte."
      : tone === "lumineuse"
      ? "Tu avances avec douceur, en consolidant ce qui se met en place."
      : "Tu observes, tu ajustes, tu prends la mesure de ce qui se joue.";
  const emergence =
    variation === "en amplification"
      ? "Une parole plus affirmée veut prendre sa place."
      : variation === "en apaisement"
      ? "Le besoin de ralentir ouvre un espace neuf."
      : `Un mouvement discret autour de ${topTheme.toLowerCase()} se précise.`;
  const ressources =
    energy === "vive"
      ? "Ton élan créatif est ta force du moment."
      : energy === "modérée"
      ? "Ta lucidité tranquille reste ton axe."
      : "Ta douceur et ta capacité d’écoute sont ton ancrage.";
  return { traverses, emergence, ressources };
}

function extractThemes(entries) {
  const results = Object.entries(THEME_KEYWORDS).map(([label, keywords]) => {
    const score = entries.reduce((acc, entry) => {
      const lower = entry.text.toLowerCase();
      return acc + (keywords.some((word) => lower.includes(word)) ? 1 : 0);
    }, 0);
    return {
      label,
      score,
      description:
        score > 0
          ? `Présent dans ${score} moment(s) récent(s).`
          : "Une piste encore discrète, à garder en arrière-plan.",
    };
  });
  return results
    .filter((theme) => theme.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function extractQuotes(entries) {
  const quotes = entries
    .map((entry) => entry.text.trim())
    .filter((text) => text.split(" ").length > 5)
    .slice(-5);
  return quotes.slice(-3).map((quote) => {
    const formatted =
      quote.charAt(0).toUpperCase() + quote.slice(1).replace(/\s+/g, " ");
    return formatted.endsWith(".") ? formatted : `${formatted}.`;
  });
}

function buildInsights(tone, variation, clarity, topTheme) {
  return [
    tone === "lumineuse"
      ? "Tu progresses par touches subtiles, avec confiance."
      : tone === "tendue"
      ? "Tu prends soin de ce qui demande de l’attention."
      : "Tu observes chaque nuance avant d’agir.",
    variation === "en amplification"
      ? "Ton mouvement intérieur gagne en intensité."
      : variation === "en apaisement"
      ? "Tu t’autorises un rythme plus doux."
      : "Tu restes fidèle à ton tempo.",
    clarity === "précise"
      ? "Tu sais nommer ce qui se joue."
      : clarity === "en progression"
      ? "La lumière arrive petit à petit."
      : "Tu restes à l’écoute de tes signaux internes.",
    `Tu explores le thème de ${topTheme.toLowerCase()} avec finesse.`,
    "Tu apprends à faire confiance à ce que tu ressens réellement.",
  ];
}

function renderThemes(themes) {
  const container = document.getElementById("portraitThemes");
  if (!container) return;
  if (!themes.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Les thèmes émergeront au fil de tes réponses.</p>';
    return;
  }
  container.innerHTML = themes
    .map(
      (theme) => `
    <div class="theme-card p-5 rounded-xl bg-neutral-50 border border-black/5 shadow-sm">
      <h3 class="font-medium text-primary mb-1">${theme.label}</h3>
      <p class="text-sm opacity-80">${theme.description}</p>
    </div>
  `,
    )
    .join("");
}

function renderQuotes(quotes) {
  const container = document.getElementById("portraitQuotes");
  if (!container) return;
  if (!quotes.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Ajoute une réponse libre pour retrouver tes mots ici.</p>';
    return;
  }
  container.innerHTML = quotes
    .map(
      (quote) => `
    <blockquote class="p-4 bg-white rounded-xl shadow border border-gray-100 text-sm italic">
      “${quote}”
    </blockquote>
  `,
    )
    .join("");
}

function renderInsights(insights) {
  const container = document.getElementById("portraitInsights");
  if (!container) return;
  container.innerHTML = insights
    .map((insight) => `<li class="p-3 bg-white rounded-xl shadow">${insight}</li>`)
    .join("");
}

function renderSignatures(signatures) {
  const traverses = document.getElementById("sigTraversesText");
  const emergence = document.getElementById("sigEmergenceText");
  const ressource = document.getElementById("sigRessourceText");
  if (traverses) traverses.textContent = signatures.traverses;
  if (emergence) emergence.textContent = signatures.emergence;
  if (ressource) ressource.textContent = signatures.ressources;
}

function renderHero(summary, essences) {
  const summaryEl = document.getElementById("portraitSummary");
  const essencesEl = document.getElementById("portraitEssences");
  if (summaryEl) summaryEl.textContent = summary;
  if (essencesEl) essencesEl.textContent = essences;
}

function renderPortrait() {
  const entries = normalizeAnswers();
  const hasData = entries.length > 0;
  if (!hasData) {
    renderHero(
      "Commence par déposer quelques réponses pour activer ton portrait.",
      "Énergie : douce • Clarté : en devenir • Stabilité : naissante",
    );
    renderSignatures({
      traverses: "Tu es au seuil de ton exploration.",
      emergence: "Un espace neuf s’ouvre à toi.",
      ressources: "Ta curiosité est ta première force.",
    });
    renderThemes([]);
    renderQuotes([]);
    renderInsights([]);
    return;
  }

  const combinedText = entries.map((e) => e.text).join(" ").toLowerCase();
  const tone = computeTone(combinedText);
  const energy = computeEnergy(entries);
  const clarity = computeClarity(combinedText);
  const variation = computeVariation(entries);
  const themes = extractThemes(entries);
  const topTheme = themes[0]?.label ?? "ton intériorité";
  const signatures = buildSignatureTexts(
    tone,
    variation,
    energy,
    clarity,
    topTheme,
  );
  const summary = pickSummary(tone, variation);
  const essences = `Énergie : ${energy} • Clarté : ${clarity} • Stabilité : ${variation}`;
  const quotes = extractQuotes(entries);
  const insights = buildInsights(tone, variation, clarity, topTheme);

  renderHero(summary, essences);
  renderSignatures(signatures);
  renderThemes(themes);
  renderQuotes(quotes);
  renderInsights(insights);
}

document.addEventListener("DOMContentLoaded", () => {
  renderPortrait();
  document.getElementById("refreshBtn")?.addEventListener("click", renderPortrait);
});
