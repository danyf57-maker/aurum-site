// js/app-coaching.js
import { getCurrentUser } from "./supabaseClient.js";
import { setStatus } from "./statusBar.js";

function showAuthMessage(message) {
  const box = document.getElementById("authMessage");
  if (box) {
    box.textContent = message;
    box.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getCurrentUser();

  if (!user) {
    console.info("[Aurum Auth] Aucun utilisateur connecté sur les pistes.");
    setStatus("incident", "Espace personnel inactif");
    showAuthMessage("Veuillez d’abord activer votre espace personnel.");

    setTimeout(() => {
      window.location.href = "/pages/signup.html";
    }, 2500);

    return;
  }

  console.info(
    "[Aurum Auth] Pistes d’exploration accessibles pour :",
    user.email,
  );
  setStatus("connecte", "Espace personnel activé");

  const emailSlots = document.querySelectorAll("[data-user-email]");
  emailSlots.forEach((el) => {
    el.textContent = user.email;
  });
});
