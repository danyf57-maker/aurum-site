const LABELS = {
  pret: "État : disponible",
  en_cours: "État : en chemin",
  erreur: "État : à reprendre doucement",
  hors_ligne: "État : hors connexion",
};

let target = null;

function applyState(nextState) {
  if (!target) return;
  target.dataset.state = nextState;
  target.textContent = LABELS[nextState] ?? LABELS.pret;
}

export function initStatusBar(selector) {
  target =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!target) {
    console.warn("[statusBar] element not found", selector);
    return;
  }
  target.classList.add("transition-colors", "duration-200");
  applyState("pret");
}

export function setStatus(state) {
  if (!target) return;
  requestAnimationFrame(() => applyState(state));
}

window.addEventListener("offline", () => {
  setStatus("hors_ligne");
});

window.addEventListener("online", () => {
  setStatus("pret");
});
