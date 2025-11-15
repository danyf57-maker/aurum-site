import {
  loadDiscState,
  clearDiscState,
  clearSession,
  clearProfileState,
  clearCoachingState,
  loadSession,
  hasProfileState,
  hasCoachingState,
} from "./sessionStore.js";
import { initStatusBar, setStatus } from "./statusBar.js";

const discStatusEl = document.getElementById("discStatus");
const profileStatusEl = document.getElementById("profileStatus");
const coachingStatusEl = document.getElementById("coachingStatus");
const messageEl = document.getElementById("privacyMessage");
const buttons = document.querySelectorAll("[data-clear]");

initStatusBar("#statusBar");
refreshStatuses();

buttons.forEach((btn) => {
  btn.addEventListener("click", () => handleClear(btn.dataset.clear));
});

function handleClear(scope) {
  const confirmations = {
    disc: "Effacer les réponses enregistrées ?",
    profile: "Effacer le profil local ?",
    coaching: "Effacer les notes de coaching ?",
    all: "Tout effacer (session, test, profil, coaching) ?",
  };
  const message = confirmations[scope] ?? "Effacer ?";
  if (!confirm(message)) return;

  setStatus("en_cours");
  switch (scope) {
    case "disc":
      clearDiscState();
      break;
    case "profile":
      clearProfileState();
      break;
    case "coaching":
      clearCoachingState();
      break;
    case "all":
      clearDiscState();
      clearProfileState();
      clearCoachingState();
      clearSession();
      break;
    default:
      break;
  }
  refreshStatuses();
  messageEl.textContent = "Données mises à jour. Tout reste local.";
  setStatus("pret");
}

function refreshStatuses() {
  const discState = loadDiscState();
  const session = loadSession();
  const answersCount = Object.keys(discState.answers ?? {}).length;
  discStatusEl.textContent =
    answersCount > 0
      ? `${answersCount} réponse${answersCount > 1 ? "s" : ""} gardée localement`
      : "Pas encore de réponses enregistrées.";

  profileStatusEl.textContent = hasProfileState()
    ? "Un profil est présent sur cet appareil."
    : "Pas encore de profil généré.";

  coachingStatusEl.textContent = hasCoachingState()
    ? "Un module de coaching est disponible."
    : "Pas encore de coaching enregistré.";

  if (session.intent) {
    messageEl.textContent = `Mode actuel : ${session.mode}, intention : ${session.intent}.`;
  } else {
    messageEl.textContent =
      "Aucune donnée personnelle n'a quitté ton navigateur.";
  }
}
