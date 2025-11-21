function loadAnswers() {
  try {
    const raw = localStorage.getItem("aurum_answers");
    if (!raw) return [];
    const answers = JSON.parse(raw);
    return answers.map((text, index) => ({
      id: index + 1,
      text,
      date: new Date().toLocaleDateString(),
    }));
  } catch {
    return [];
  }
}

function detectCategory(text) {
  const t = text.toLowerCase();

  if (/travail|carrière|job/.test(t)) return "travail";
  if (/ami|famille|couple/.test(t)) return "relations";
  if (/moi|identité|personnel/.test(t)) return "identite";
  if (/confiance|doute|peur/.test(t)) return "confiance";
  if (/objectif|avenir|ambition/.test(t)) return "ambition";
  if (/joie|colère|tristesse|peur/.test(t)) return "emotions";

  return "autre";
}

function renderAnswers(list) {
  const container = document.getElementById("answersList");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="text-gray-500">Aucune réponse trouvée.</p>`;
    return;
  }

  container.innerHTML = list
    .map(
      (a) => `
    <div class="border p-4 rounded bg-white shadow-sm">
      <div class="flex justify-between mb-2 text-xs text-gray-500">
        <span>#${a.id}</span>
        <span>${a.date}</span>
      </div>
      <p>${a.text}</p>
      <div class="mt-2 text-xs text-indigo-700">
        Catégorie : <strong>${a.category}</strong>
      </div>
    </div>
  `
    )
    .join("");
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterSelect").value;

  const filtered = window.allAnswers.filter((a) => {
    const matchText = a.text.toLowerCase().includes(search);
    const matchCategory = filter === "all" || a.category === filter;
    return matchText && matchCategory;
  });

  renderAnswers(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  const answers = loadAnswers();
  answers.forEach((a) => (a.category = detectCategory(a.text)));
  window.allAnswers = answers;

  renderAnswers(answers);

  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");
  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (filterSelect) filterSelect.addEventListener("change", applyFilters);
});
