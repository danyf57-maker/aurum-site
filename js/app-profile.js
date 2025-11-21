// js/app-profile.js
import { getCurrentUser } from "./supabaseClient.js";
import { setStatus } from "./statusBar.js";

function showAuthMessage(message) {
  const box = document.getElementById("authMessage");
  if (box) {
    box.textContent = message;
    box.classList.remove("hidden");
  } else {
    console.warn("[Aurum Auth] authMessage manquant pour afficher :", message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1. On récupère l’utilisateur courant via Supabase
  const user = await getCurrentUser();

  if (!user) {
    console.info("[Aurum Auth] Aucun utilisateur connecté sur le profil.");
    setStatus("incident", "Espace personnel inactif");

    showAuthMessage("Veuillez d’abord activer votre espace personnel.");

    // petite pause pour laisser lire le message, puis redirection
    setTimeout(() => {
      window.location.href = "/pages/signup.html";
    }, 2500);

    return;
  }

  console.info(
    "[Aurum Auth] Profil accessible, utilisateur connecté :",
    user.email,
  );
  setStatus("connecte", "Espace personnel activé");

  // 2. On affiche l’email si un slot existe
  const emailSlots = document.querySelectorAll("[data-user-email]");
  emailSlots.forEach((el) => {
    el.textContent = user.email;
  });
});
