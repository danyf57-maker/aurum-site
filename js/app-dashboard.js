function normalizeTimestamp(value) {
  if (typeof value === "number") return value;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Date.now();
}

function normalizeAnswers(raw) {
  if (!raw) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          text: entry,
          answer: entry,
          type: "legacy",
          questionId: null,
          timestamp: Date.now(),
        };
      }
      if (!entry || typeof entry !== "object") return null;
      const text =
        entry.text ??
        entry.answer ??
        (Array.isArray(entry) ? entry.join(" ") : "");
      if (!text) return null;
      return {
        text,
        answer: entry.answer ?? text,
        type: entry.type ?? "choice",
        questionId: entry.questionId ?? null,
        timestamp: normalizeTimestamp(entry.timestamp),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function loadAnswers() {
  try {
    const raw = localStorage.getItem("aurum_answers");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeAnswers(parsed);
  } catch (error) {
    console.warn("[dashboard] aurum_answers illisible :", error);
    return [];
  }
}

function detectTone(entries) {
  if (!entries.length) return "neutre";
  const lower = entries.map((e) => e.text).join(" ").toLowerCase();
  const positive = (lower.match(/motivé|envie|joie|calme|projet|clarté|confiance/g) || []).length;
  const negative = (lower.match(/peur|stress|fatigue|doute|triste|colère|confus/g) || []).length;
  if (positive > negative) return "positive";
  if (negative > positive) return "fragile";
  return "neutre";
}

function detectThemeFromText(text) {
  const lower = text.toLowerCase();
  if (/travail|carrière|job|mission/.test(lower)) return "Travail";
  if (/relation|ami|famille|couple/.test(lower)) return "Relations";
  if (/confiance|peur|doute|timide/.test(lower)) return "Confiance";
  if (/avenir|objectif|ambition|projet/.test(lower)) return "Ambition";
  if (/émotion|ressenti|intérieur|moi/.test(lower)) return "Identité";
  return "Exploration";
}

function buildTimeline(entries) {
  const slice = entries.slice(-10);
  return slice.map((entry, index) => ({
    value: Math.max(entry.text.length % 8, 1),
    label: `J-${slice.length - index}`,
    isJournal: entry.type === "journal" || entry.questionId === "journal",
  }));
}

function computeStats(entries) {
  if (!entries.length) {
    return {
      tone: "neutre",
      theme: "Exploration",
      lastActivity: "–",
      variation: "stable",
    };
  }
  const tone = detectTone(entries);
  const themesCount = {};
  entries.forEach((entry) => {
    const theme = detectThemeFromText(entry.text);
    themesCount[theme] = (themesCount[theme] || 0) + 1;
  });
  const theme = Object.entries(themesCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Exploration";

  const recent = entries
    .slice(-7)
    .map((entry) => entry.text.length)
    .reduce((acc, len) => acc + len, 0);
  const previous =
    entries
      .slice(-14, -7)
      .map((entry) => entry.text.length)
      .reduce((acc, len) => acc + len, 0) || 1;
  const ratio = recent / previous;
  const variation = ratio > 1.2 ? "en progression" : ratio < 0.8 ? "en repli" : "stable";

  return {
    tone,
    theme,
    lastActivity: new Date().toLocaleDateString(),
    variation,
  };
}

function renderGlobalStats(stats) {
  const container = document.getElementById("globalStats");
  if (!container) return;
  const cards = [
    {
      label: "Tonalité dominante",
      value: stats.tone,
      description:
        stats.tone === "neutre"
          ? "Une stabilité intérieure. Ta tonalité actuelle ne montre ni tension ni impulsion excessive. Tu avances avec calme, sans excès d’émotion. C’est un espace idéal pour observer et clarifier la suite."
          : stats.tone === "positive"
          ? "Une tonalité lumineuse. Ton énergie est constructive et disponible. Tu es prêt à faire de la place à ce qui veut émerger."
          : "Une tonalité plus tendue. Ce n’est pas un recul, mais un rappel à la douceur : tu peux t’offrir un rythme plus apaisé avant d’avancer.",
    },
    {
      label: "Thème principal",
      value: stats.theme,
      description:
        stats.theme === "Exploration"
          ? "Tu es dans une phase d’ouverture. Ton esprit cherche à comprendre, à tester, à sentir ce qui résonne vraiment pour toi. C’est une période propice aux ajustements et aux découvertes."
          : `Le thème actuel reflète ta priorité du moment : ${stats.theme}. Tu affines ce domaine, pas à pas, avec la sagesse accumulée jusque-là.`,
    },
    {
      label: "Indice d’évolution",
      value: stats.variation,
      description:
        stats.variation === "en repli"
          ? "Un léger recentrage. Tu sembles temporairement moins expansif. Cela ne signale pas un recul, mais un moment d’intégration : tu prends le temps de digérer, de comprendre, d’assimiler ce que tu vis."
          : stats.variation === "en progression"
          ? "Une expansion en marche. Ton rythme intérieur gagne en intensité, progressivement et sans précipitation."
          : "Un tempo stable. Tu continues sur une base solide, sans accélération ni ralentissement marqué.",
    },
  ];
  container.innerHTML = cards
    .map(
      (card) => `
    <div class="p-6 bg-white rounded-2xl shadow border border-gray-100">
      <p class="text-sm text-gray-500 mb-1">${card.label}</p>
      <p class="text-2xl font-semibold mb-2">${card.value}</p>
      <p class="text-sm text-gray-600">${card.description}</p>
    </div>
  `
    )
    .join("");
}

function renderMiniTimeline(data) {
  const container = document.getElementById("miniTimeline");
  if (!container) return;
  if (!data.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Réponds à quelques situations pour voir ton évolution.</p>';
    return;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  container.innerHTML =
    data
      .map(
        (item) => `
    <div class="flex flex-col items-center flex-1">
      <div class="w-3 rounded-t bg-indigo-600" style="height:${(item.value / max) * 100}%"></div>
      <span class="text-[10px] mt-1 text-gray-500">${item.label}</span>
      ${item.isJournal ? '<span class="text-[10px] text-indigo-700 mt-0.5">📝</span>' : ""}
    </div>
  `
      )
      .join("") +
    `<p class="text-xs text-gray-500 mt-4">Chaque point représente une réponse récente et la place qu’elle prend dans ton paysage intérieur.</p>`;
}

function renderInnerState(entries) {
  const container = document.getElementById("innerState");
  if (!container) return;
  if (!entries.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Commence par déposer quelques réponses pour voir ton état intérieur.</p>';
    return;
  }
  const joined = entries.map((entry) => entry.text).join(" ").toLowerCase();
  const confidence = (joined.match(/confiance|sûr|capable/g) || []).length;
  const clarity = (joined.match(/clarité|lumière|comprends/g) || []).length;
  const confusion = (joined.match(/confus|perdu|flou/g) || []).length;
  const emotion = detectTone(entries);

  const cards = [
    {
      title: "Emotion dominante",
      value: emotion,
      detail:
        emotion === "positive"
          ? "Une émotion nourrissante. Tes réponses indiquent un courant positif, prêt à soutenir ton prochain pas."
          : emotion === "fragile"
          ? "Une émotion à apaiser. Tu peux t’offrir davantage de lenteur et de douceur pour laisser la tension retomber."
          : "Une émotion posée. Tes réponses signalent une présence intérieure stable. Rien ne déborde, rien ne presse : tu observes le moment tel qu’il est.",
    },
    {
      title: "Sensation de clarté",
      value: clarity > confusion ? "en hausse" : "à clarifier",
      detail:
        clarity > confusion
          ? `Ta vision gagne en précision (indices de clarté : ${clarity}). Continue à écouter ce qui s’illumine.`
          : `Un besoin de direction. Une partie de toi aimerait plus de focus (zones floues : ${confusion}). Tu peux prendre un temps pour clarifier le fil.`,
    },
    {
      title: "Niveau de confiance",
      value: confidence > 2 ? "solide" : confidence > 0 ? "en construction" : "à cultiver",
      detail:
        confidence > 0
          ? "Des ressources prêtes à mûrir. Certaines forces sont actives mais discrètes : elles deviendront des leviers si tu les nourris."
          : "Des ressources prêtes à mûrir. Elles se mettent en place doucement : offre-leur un peu d’attention pour les ancrer.",
    },
    {
      title: "Engagement actif",
      value: `${entries.slice(-5).length} réponses récentes`,
      detail:
        "Tu restes en mouvement. Tes dernières réponses montrent une progression continue. Chaque prise de recul nourrit ton évolution.",
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
    <div class="p-6 bg-white rounded-2xl shadow border border-gray-100">
      <p class="text-sm text-gray-500 mb-1">${card.title}</p>
      <p class="text-2xl font-semibold mb-2">${card.value}</p>
      <p class="text-gray-600">${card.detail}</p>
    </div>
  `
    )
    .join("");
}

function renderAnalysis(entries) {
  const container = document.getElementById("analysisGrid");
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = "";
    return;
  }
  const recent = entries
    .slice(-5)
    .map((entry) => entry.text)
    .join(" ")
    .toLowerCase();
  const previous = entries
    .slice(-10, -5)
    .map((entry) => entry.text)
    .join(" ")
    .toLowerCase();

  const strengths =
    (recent.match(/persévérance|confiance|progressé|fière/g) || []).length > 0
      ? "Tu construis solidement. Ce qui t’a aidé par le passé continue de se structurer. Tes appuis deviennent plus fiables, plus stables, plus conscients."
      : "Tu construis solidement. Même si rien n’est spectaculaire, tout se dépose pas à pas. Reconnais ce socle en train de se former.";

  const vulnerabilities =
    (recent.match(/fatigue|doute|stress|épuisé/g) || []).length > 0
      ? "Une zone à surveiller. Une partie de toi pourrait avoir besoin de repos ou de recentrage. Rien d’inquiétant, mais une invitation douce à prendre soin de ton équilibre."
      : "Une zone à surveiller. Pour l’instant tout est stable — continue simplement à rester à l’écoute de tes limites.";

  const progression =
    recent.length > previous.length
      ? "Un temps d’intégration. Ton rythme n’est pas en baisse : il devient plus intelligent. Tu assimiles, tu relies, tu clarifies — avant une prochaine montée."
      : "Un temps d’intégration. Tu ralentis légèrement pour consolider ce que tu viens de traverser.";

  const opportunities =
    (recent.match(/envie|curieuse|ouvrir|nouveau/g) || []).length > 0
      ? "Une ouverture en préparation. Tes réponses montrent un terrain fertile pour une nouvelle avancée personnelle. Quelque chose se prépare — doucement mais sûrement."
      : "Une ouverture en préparation. Même si elle n’est pas encore visible, elle se tisse à bas bruit : continue à rester présent.";

  const cards = [
    { title: "Vos forces actuelles", text: strengths },
    { title: "Vos vulnérabilités du moment", text: vulnerabilities },
    { title: "Vos évolutions récentes", text: progression },
    { title: "Vos opportunités intérieures", text: opportunities },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
    <div class="p-6 bg-white rounded-2xl shadow border border-gray-100">
      <h3 class="text-lg font-semibold mb-2">${card.title}</h3>
      <p class="text-gray-700">${card.text}</p>
    </div>
  `
    )
    .join("");
}

function getLastJournalEntry(entries) {
  const journalEntries = entries.filter(
    (entry) =>
      (entry.type === "journal" || entry.questionId === "journal") &&
      entry.text,
  );
  if (!journalEntries.length) return null;
  return journalEntries.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
}

function ensureJournalHighlightBody() {
  let section = document.getElementById("journalHighlight");
  if (!section) {
    const timelineSection = document.getElementById("miniTimeline")?.parentElement;
    if (!timelineSection || !timelineSection.parentNode) return null;
    section = document.createElement("section");
    section.id = "journalHighlight";
    section.className = "mb-10";
    const title = document.createElement("h2");
    title.className = "text-2xl font-semibold mb-3";
    title.textContent = "📝 Dernière entrée de ton journal";
    const body = document.createElement("div");
    body.dataset.journalBody = "true";
    body.className = "journal-highlight-body";
    section.appendChild(title);
    section.appendChild(body);
    timelineSection.parentNode.insertBefore(section, timelineSection.nextSibling);
  }
  let body = section.querySelector("[data-journal-body]");
  if (!body) {
    body = document.createElement("div");
    body.dataset.journalBody = "true";
    body.className = "journal-highlight-body";
    section.appendChild(body);
  }
  return body;
}

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatJournalTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const label = sameDay
    ? "Aujourd’hui"
    : isYesterday
    ? "Hier"
    : date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${label} — ${formattedTime}`;
}

function renderJournalHighlight(entry) {
  const body = ensureJournalHighlightBody();
  if (!body) {
    console.warn(
      "[dashboard] Impossible d'afficher le journal (section #journalHighlight absente).",
    );
    return;
  }
  if (!entry) {
    body.innerHTML = `
      <div class="p-6 bg-white rounded-2xl shadow border border-gray-100 text-sm text-gray-600">
        Tu n’as pas encore écrit dans ton journal. Commence par une phrase simple pour que je puisse t’accompagner.
      </div>
    `;
    return;
  }
  body.innerHTML = `
    <div class="p-6 bg-white rounded-2xl shadow border border-gray-100">
      <p class="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">${formatJournalTimestamp(
        entry.timestamp,
      )}</p>
      <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">${escapeHTML(
        entry.text,
      )}</p>
    </div>
  `;
}

const AI_INSIGHT_CACHE_KEY = "aurum_ai_insight";

function readAiInsightCache() {
  try {
    const raw = localStorage.getItem(AI_INSIGHT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.last_entry_ts === "number" &&
      typeof parsed.summary === "string" &&
      typeof parsed.micro_action === "string"
    ) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn("[dashboard] cache IA illisible :", error);
    return null;
  }
}

function writeAiInsightCache(payload) {
  try {
    localStorage.setItem(AI_INSIGHT_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[dashboard] impossible d’écrire le cache IA :", error);
  }
}

let supabaseClientPromise = null;

function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("./supabaseClient.js")
      .then((module) => module?.supabase ?? null)
      .catch((error) => {
        console.warn("[dashboard] Impossible de charger supabaseClient :", error);
        return null;
      });
  }
  return supabaseClientPromise;
}

async function fetchAiInsightForDashboard(lastEntryTs) {
  if (!Number.isFinite(lastEntryTs)) return null;
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke("aurum-insight", {
      body: { last_entry_ts: lastEntryTs },
    });
    if (error) {
      console.warn("[dashboard] aurum-insight a renvoyé une erreur :", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("[dashboard] Erreur lors de l’appel aurum-insight :", error);
    return null;
  }
}

function renderAiInsightBlock(insight, { loading = false } = {}) {
  const container = document.getElementById("aiInsight");
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="p-6 bg-white rounded-2xl shadow border border-gray-100 text-sm text-gray-500">
        🧠 Lecture d’Aurum aujourd’hui — Chargement en cours…
      </div>
    `;
    return;
  }

  if (!insight) {
    container.innerHTML = `
      <div class="p-6 bg-white rounded-2xl shadow border border-gray-100 text-sm text-gray-600">
        🧠 Lecture d’Aurum aujourd’hui<br />
        Tu n’as pas encore déposé de journal suffisant pour générer une lecture. Ajoute quelques phrases et je te proposerai une micro-action dédiée.
      </div>
    `;
    return;
  }

  const summary = insight.summary
    ? escapeHTML(insight.summary)
    : "Je suis encore en train d’analyser ton journal.";
  const microAction = insight.micro_action
    ? escapeHTML(insight.micro_action)
    : "Prends un instant pour écrire ce qui t’habite, puis relance la lecture.";

  container.innerHTML = `
    <div class="p-6 bg-white rounded-2xl shadow border border-gray-100 space-y-4">
      <div>
        <p class="text-sm font-semibold text-indigo-900 mb-1">🧠 Lecture d’Aurum aujourd’hui</p>
        <p class="text-sm text-gray-700 leading-relaxed">${summary}</p>
      </div>
      <div class="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-indigo-500 mb-1">Micro-action proposée</p>
        <p class="text-sm text-indigo-900 leading-relaxed">${microAction}</p>
      </div>
    </div>
  `;
}

async function renderAiInsightSection(lastJournalTs) {
  const container = document.getElementById("aiInsight");
  if (!container) return;
  renderAiInsightBlock(null, { loading: true });
  if (!Number.isFinite(lastJournalTs)) {
    renderAiInsightBlock(null);
    return;
  }
  const cached = readAiInsightCache();
  if (cached && cached.last_entry_ts === lastJournalTs) {
    renderAiInsightBlock(cached);
    return;
  }
  const insight = await fetchAiInsightForDashboard(lastJournalTs);
  if (insight?.summary && insight?.micro_action) {
    writeAiInsightCache({
      ...insight,
      last_entry_ts: lastJournalTs,
    });
    renderAiInsightBlock(insight);
  } else {
    renderAiInsightBlock(null);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const answers = loadAnswers();
  const stats = computeStats(answers);
  const timelineData = buildTimeline(answers);
  const lastJournalEntry = getLastJournalEntry(answers);

  const summary = document.getElementById("dashboardSummary");
  if (summary) {
    summary.innerText = `Votre évolution récente révèle une tonalité ${stats.tone}, dominée par le thème ${stats.theme}.`;
  }

  renderGlobalStats(stats);
  renderMiniTimeline(timelineData);
  renderInnerState(answers);
  renderAnalysis(answers);
  renderJournalHighlight(lastJournalEntry);
  console.log("[dashboard] IA bootstrap – réponses:", answers.length);
  const lastJournalTs = lastJournalEntry?.timestamp ?? null;
  renderAiInsightSection(lastJournalTs);
});
