// js/app-logout.js
import { supabase } from "./supabaseClient.js";
import { setStatus } from "./statusBar.js";

function revealMessage(text) {
  const msg = document.getElementById("authMessage");
  if (!msg) return null;
  msg.textContent = text;
  msg.classList.remove("hidden");
  return msg;
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    logoutBtn.classList.add("opacity-70", "cursor-not-allowed");
    revealMessage("Déconnexion en cours…");
    setStatus("en_cours");

    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("[Aurum Auth] Erreur logout :", error);
          revealMessage("Erreur lors de la déconnexion. Réessayez.");
          setStatus("incident");
          logoutBtn.disabled = false;
          logoutBtn.classList.remove("opacity-70", "cursor-not-allowed");
          return;
        }
      }
    } catch (err) {
      console.error("[Aurum Auth] Exception logout :", err);
      revealMessage("Erreur lors de la déconnexion. Réessayez.");
      setStatus("incident");
      logoutBtn.disabled = false;
      logoutBtn.classList.remove("opacity-70", "cursor-not-allowed");
      return;
    }

    // Nettoyage local pour repartir proprement
    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch (storageError) {
      console.warn("[Aurum Auth] Impossible de vider le stockage :", storageError);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    window.location.href = "/pages/login.html";
  });
});
