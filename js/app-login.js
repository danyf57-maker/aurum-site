// js/app-login.js
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailInput");
  const btn = document.getElementById("sendMagicLinkBtn");
  const msg = document.getElementById("authMessage");

  if (!emailInput || !btn || !msg) {
    console.warn("[Aurum Auth] Login page missing elements.");
    return;
  }

  if (!supabase) {
    msg.textContent =
      "Le service de connexion n’est pas disponible sur cet appareil.";
    msg.style.display = "block";
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-not-allowed");
    return;
  }

  btn.addEventListener("click", async () => {
    // Vérification âge
    const selected = document.querySelector('input[name="ageCheck"]:checked');
    const ageError = document.getElementById("ageError");

    if (!selected || selected.value !== "yes") {
      ageError?.classList.remove("hidden");
      return;
    } else {
      ageError?.classList.add("hidden");
    }

    const email = emailInput.value.trim();
    if (!email) {
      msg.textContent = "Veuillez saisir un email valide.";
      msg.style.display = "block";
      return;
    }

    msg.textContent = "Envoi du lien en cours…";
    msg.style.display = "block";
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-not-allowed");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      msg.textContent = "Erreur : " + error.message;
      btn.disabled = false;
      btn.classList.remove("opacity-70", "cursor-not-allowed");
      return;
    }

    msg.textContent = "Lien envoyé ! Vérifiez votre boîte email.";
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove("opacity-70", "cursor-not-allowed");
    }, 3000);
  });

  // Si déjà connecté → redirige
  supabase.auth
    .getSession()
    .then(({ data }) => {
      if (data.session) {
        window.location.href = "/pages/home.html";
      }
    })
    .catch((error) => {
      console.warn("[Aurum Auth] Impossible de vérifier la session :", error);
    });
});
