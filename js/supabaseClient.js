/**
 * Aurum — Milestone 2
 * Supabase Client (initialisation + mode local-first par défaut)
 *
 * Ce module ne casse aucune fonctionnalité existante.
 * Il prépare uniquement :
 * - la future connexion compte utilisateur
 * - la sauvegarde en ligne optionnelle
 * - l'enregistrement du consentement
 *
 * Tout continue à fonctionner 100% local tant que les clés ne sont pas définies.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOG_PREFIX = "[Aurum Auth]";

const SUPABASE_URL = window.__AURUM_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.__AURUM_SUPABASE_ANON_KEY || "";

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  console.log(`${LOG_PREFIX} Supabase initialisé.`);
} else {
  console.warn(`${LOG_PREFIX} Mode local-first : Supabase non configuré.`);
}

/**
 * Client Supabase unique utilisé par tout Aurum dès M2.
 * PersistSession + localStorage = compatible Safari / iOS / PWA.
 */
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      })
    : null;

/**
 * Vérification rapide si l'utilisateur est connecté.
 * Nous l'utiliserons dans :
 *  - privacyPanel.js (gestion du consentement)
 *  - signup/login pages (M2)
 *  - sauvegardes optionnelles portrait + coaching (M3)
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/**
 * Déconnexion
 */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Enregistrement du consentement (sera appelé dans privacyPanel.js)
 */
export async function saveConsent(consent) {
  if (!supabase) return false;
  const user = await getCurrentUser();
  if (!user) return false;

  return await supabase.from("aurum_consent").upsert(
    {
      user_id: user.id,
      consent: consent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export function isSupabaseConfigured() {
  return !!supabase;
}

export async function signInWithEmail(email) {
  if (!supabase) {
    throw new Error("Supabase non configuré sur cet appareil.");
  }

  const redirectTo = `${window.location.origin}/pages/onboarding.html`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error(`${LOG_PREFIX} Erreur lors de l’envoi du lien magique :`, error);
    throw error;
  }

  return true;
}
