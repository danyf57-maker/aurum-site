// js/app-auth-bootstrap.js
import {
  supabase,
  getCurrentUser,
  isSupabaseConfigured,
} from "./supabaseClient.js";
import { setStatus } from "./statusBar.js";

const LOG_PREFIX = "[Aurum Auth]";

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

function errorLog(...args) {
  console.error(LOG_PREFIX, ...args);
}

function parseHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.substring(1)
    : window.location.hash;

  return Object.fromEntries(new URLSearchParams(hash));
}

function clearAuthHash() {
  if (!window.location.hash) return;
  history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

function showAuthMessage(message) {
  const el = document.getElementById("authMessage");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function handleHashError(params) {
  const description =
    params.error_code === "otp_expired"
      ? "Ce lien a expiré — demandez un nouveau lien depuis la page précédente."
      : "Impossible d’ouvrir cet espace avec ce lien — vous pouvez réessayer.";

  warn("Erreur de lien magique :", params.error, params.error_description);
  showAuthMessage(description);
  setStatus("incident");
  clearAuthHash();
}

async function bootstrapAuth() {
  if (!isSupabaseConfigured() || !supabase) {
    log("Supabase non configuré. Mode local-first conservé.");
    return;
  }

  const params = parseHashParams();
  const shouldClearHash =
    "access_token" in params ||
    "refresh_token" in params ||
    "type" in params ||
    "expires_at" in params;

  if (params.error) {
    handleHashError(params);
    return;
  }

  const hasAccessToken = Boolean(params.access_token);
  if (hasAccessToken) {
    log("Hash détecté avec access_token, tentative d’échange de session…");
  }

  try {
    const user = await getCurrentUser();

    if (shouldClearHash && window.location.hash) {
      clearAuthHash();
    }

    if (user) {
      log("Session créée, utilisateur connecté.", user.email);
      setStatus("connecte");
    } else {
      log("Aucun utilisateur connecté. Mode local en cours.");
      setStatus("mode_local");
    }
  } catch (err) {
    errorLog("Erreur au démarrage auth :", err);
    showAuthMessage(
      "Un incident est survenu — vous pouvez continuer en mode local."
    );
    setStatus("incident");
  }
}

document.addEventListener("DOMContentLoaded", bootstrapAuth);
