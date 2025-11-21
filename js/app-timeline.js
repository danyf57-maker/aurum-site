function loadTimelineAnswers() {
  try {
    const raw = localStorage.getItem("aurum_answers");
    if (!raw) return [];

    const arr = JSON.parse(raw);

    return arr.map((text, i) => ({
      text,
      date: new Date(Date.now() - (arr.length - i) * 86400000), // 1 réponse/jour
    }));
  } catch {
    return [];
  }
}

function groupByDay(list) {
  const map = {};

  list.forEach((item) => {
    const d = item.date.toISOString().slice(0, 10);
    if (!map[d]) map[d] = 0;
    map[d]++;
  });

  return map;
}

function renderChart(data) {
  const values = Object.values(data);
  const max = Math.max(...values, 1);
  const container = document.getElementById("timelineChart");
  if (!container) return;

  container.innerHTML = Object.entries(data)
    .map(([day, count]) => {
      const h = (count / max) * 100;
      return `
      <div class="flex flex-col items-center flex-1 min-w-[30px]">
        <div class="bg-indigo-700 rounded-t w-4 transition-all" style="height:${h}%;"></div>
        <span class="text-[10px] mt-1 text-slate-500">${day.slice(5)}</span>
      </div>
    `;
    })
    .join("");
}

function detectTheme(text) {
  const t = text.toLowerCase();
  if (/travail/.test(t)) return "Travail";
  if (/ami|famille|couple/.test(t)) return "Relations";
  if (/moi|identité/.test(t)) return "Identité";
  if (/confiance|doute|peur/.test(t)) return "Confiance";
  if (/objectif|avenir|projet/.test(t)) return "Ambition";
  return "Autre";
}

function buildThemesEvolution(list) {
  const result = {};
  list.forEach((a) => {
    const theme = detectTheme(a.text);
    if (!result[theme]) result[theme] = 0;
    result[theme]++;
  });
  return result;
}

function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/peur|stress|triste|fatigue/.test(t)) return "négative";
  if (/motivé|heureux|envie|positif/.test(t)) return "positive";
  return "neutre";
}

function buildEmotionStats(list) {
  const stats = { positive: 0, neutre: 0, négative: 0 };
  list.forEach((a) => {
    stats[detectEmotion(a.text)]++;
  });
  return stats;
}

document.addEventListener("DOMContentLoaded", () => {
  const arr = loadTimelineAnswers();
  if (!arr.length) return;

  const grouped = groupByDay(arr);
  const themes = buildThemesEvolution(arr);
  const emotions = buildEmotionStats(arr);

  const overview = document.getElementById("overview");
  if (overview) {
    overview.innerHTML = `
      <h2 class="text-xl font-semibold mb-3">Résumé global</h2>
      <p>Total de réponses : <strong>${arr.length}</strong></p>
      <p>Jours couverts : <strong>${Object.keys(grouped).length}</strong></p>
    `;
  }

  renderChart(grouped);

  const themesEl = document.getElementById("themesEvolution");
  if (themesEl) {
    themesEl.innerHTML = `
      <h2 class="text-xl font-semibold mb-3">Thèmes dominants</h2>
      <ul class="ml-6 list-disc space-y-1">
        ${Object.entries(themes)
          .map(([t, c]) => `<li>${t} : ${c}</li>`)
          .join("")}
      </ul>
    `;
  }

  const emoEl = document.getElementById("emotionEvolution");
  if (emoEl) {
    emoEl.innerHTML = `
      <h2 class="text-xl font-semibold mb-3">Émotions détectées</h2>
      <ul class="ml-6 list-disc space-y-1">
        <li>Positives : ${emotions.positive}</li>
        <li>Neutres : ${emotions.neutre}</li>
        <li>Négatives : ${emotions.négative}</li>
      </ul>
    `;
  }
});
