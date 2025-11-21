// js/app-signup.js
import { isSupabaseConfigured, signInWithEmail } from "./supabaseClient.js";

function getStatusApi() {
  // On essaye d’utiliser la barre d’état si elle existe déjà en global
  if (window.statusBar && typeof window.statusBar.set === "function") {
    return window.statusBar;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const statusApi = getStatusApi();

  const form = document.querySelector("#signup-form");
  const emailInput = document.querySelector("#signup-email");
  const messageBox = document.querySelector("#signup-message");
  const submitButton = document.querySelector("#signup-submit");

  if (!form || !emailInput || !submitButton) {
    console.warn("[Aurum] Formulaire d’inscription introuvable.");
    return;
  }

  const supabaseReady = isSupabaseConfigured();

  // Si Supabase n’est pas configuré, on reste en mode local-only
  if (!supabaseReady) {
    if (messageBox) {
      messageBox.textContent =
        "Sur cet appareil, l’espace personnel n’est pas encore activé. Vous pouvez tout de même utiliser Aurum en mode local.";
      messageBox.classList.remove("hidden");
    }
    submitButton.disabled = true;
    submitButton.classList.add("opacity-60", "cursor-not-allowed");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      if (messageBox) {
        messageBox.textContent =
          "Indiquez une adresse e-mail pour que je puisse vous envoyer le lien sécurisé.";
        messageBox.classList.remove("hidden");
      }
      return;
    }

    try {
      if (statusApi) statusApi.set("en cours");

      submitButton.disabled = true;
      submitButton.classList.add("opacity-60", "cursor-wait");

      await signInWithEmail(email);

      if (messageBox) {
        messageBox.textContent =
          "Un lien sécurisé vient d’être envoyé. Vous pourrez ouvrir votre espace Aurum depuis cet e-mail.";
        messageBox.classList.remove("hidden");
      }

      if (statusApi) statusApi.set("prêt");
    } catch (error) {
      console.error("[Aurum] Erreur envoi lien sécurisé :", error);
      if (messageBox) {
        messageBox.textContent =
          "Je n’ai pas pu envoyer le lien pour le moment. Vérifiez votre connexion ou réessayez un peu plus tard.";
        messageBox.classList.remove("hidden");
      }
      if (statusApi) statusApi.set("erreur");
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("cursor-wait");
      submitButton.classList.remove("opacity-60");
    }
  });
});
