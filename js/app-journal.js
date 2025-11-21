import { supabase, getCurrentUser } from "./supabaseClient.js";
import { setStatus } from "./statusBar.js";

const LOCAL_KEY = "aurum_answers";
const JOURNAL_TYPE = "journal";

/* ---------- Utils localStorage ---------- */

function loadAurumAnswers() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[Journal] aurum_answers illisible :", error);
    return [];
  }
}

function saveAurumAnswers(entries) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("[Journal] impossible d’enregistrer aurum_answers :", error);
  }
}

/* ---------- Rendu timeline ---------- */

function appendEntryToTimeline(container, entry) {
  const block = document.createElement("article");
  block.className =
    "border border-black/5 rounded-2xl p-4 bg-white shadow-sm mb-3";
  const d = new Date(entry.timestamp);

  block.innerHTML = `
    <p class="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
      ${d.toLocaleString("fr-FR")}
    </p>
    <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
      ${escapeHtml(entry.text)}
    </p>
  `;

  // on insère en haut
  container.prepend(block);
}

function renderEntries(timelineEl, entries) {
  timelineEl.innerHTML = "";
  if (!entries.length) {
    timelineEl.innerHTML =
      '<p class="text-sm text-gray-500">Aucune entrée pour le moment. Ton journal t’attend.</p>';
    return;
  }
  entries
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((entry) => appendEntryToTimeline(timelineEl, entry));
}

/* ---------- Lecture depuis Supabase ---------- */

async function fetchJournalEntriesSupabase(user) {
  if (!supabase || !user) return null;

  const { data, error } = await supabase
    .from("aurum_answers")
    .select("questionId, type, text, answer, timestamp")
    .eq("user_id", user.id)
    .eq("type", JOURNAL_TYPE)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("[Journal] Erreur récupération Supabase :", error);
    return null;
  }

  const entries = (data ?? [])
    .map((row) => {
      const text = row.text ?? row.answer ?? "";
      if (!text) return null;
      const ts =
        typeof row.timestamp === "number"
          ? row.timestamp
          : Number(row.timestamp) || Date.now();
      return {
        text,
        answer: row.answer ?? text,
        type: row.type ?? JOURNAL_TYPE,
        questionId: row.questionId ?? JOURNAL_TYPE,
        timestamp: ts,
      };
    })
    .filter(Boolean);

  return entries;
}

/* ---------- Insertion : local + Supabase ---------- */

async function saveJournalEntry(user, text) {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const now = Date.now();

  // 1) Toujours écrire en local pour l’expérience utilisateur
  const localEntries = loadAurumAnswers();
  const localEntry = {
    text: cleanText,
    answer: cleanText,
    type: JOURNAL_TYPE,
    questionId: JOURNAL_TYPE,
    timestamp: now,
  };
  localEntries.push(localEntry);
  saveAurumAnswers(localEntries);

  // 2) Si pas de Supabase configuré : on s’arrête là (mode local-first)
  if (!supabase || !user) {
    console.info("[Journal] Mode local-only, aucune synchro Supabase.");
    return localEntry;
  }

  // 3) Tentative d’insertion dans Supabase
  try {
    const { data, error } = await supabase
      .from("aurum_answers")
      .insert({
        user_id: user.id,
        questionId: JOURNAL_TYPE,
        type: JOURNAL_TYPE,
        text: cleanText,
        answer: cleanText,
        timestamp: now, // BIGINT compatible
      })
      .select()
      .single();

    if (error) {
      console.error("[Journal] Erreur insertion Supabase :", error);
      showHintError(
        error.message ||
          error.hint ||
          "Impossible d’enregistrer sur le serveur pour le moment."
      );
      // On garde malgré tout l’entrée locale pour ne pas casser l’expérience
      return localEntry;
    }

    // On renvoie ce qui vient de la base (si timestamp éventuellement ajusté)
    const ts =
      typeof data.timestamp === "number"
        ? data.timestamp
        : Number(data.timestamp) || now;

    return {
      text: data.text ?? cleanText,
      answer: data.answer ?? cleanText,
      type: data.type ?? JOURNAL_TYPE,
      questionId: data.questionId ?? JOURNAL_TYPE,
      timestamp: ts,
    };
  } catch (error) {
    console.error("[Journal] Exception insertion Supabase :", error);
    showHintError(
      "Une erreur technique empêche la sauvegarde distante. Ton entrée est gardée localement."
    );
    return localEntry;
  }
}

/* ---------- Normalisation & helpers ---------- */

function normalizeLocalJournal(entries) {
  return entries
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const text = e.text ?? e.answer ?? "";
      if (!text) return null;
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : Number(e.timestamp) || Date.now();
      const type = e.type ?? JOURNAL_TYPE;
      const qid = e.questionId ?? JOURNAL_TYPE;
      if (type !== JOURNAL_TYPE && qid !== JOURNAL_TYPE) return null;
      return {
        text,
        answer: e.answer ?? text,
        type: JOURNAL_TYPE,
        questionId: JOURNAL_TYPE,
        timestamp: ts,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Gestion auth / garde d’accès ---------- */

function showAuthMessage(message) {
  const box = document.getElementById("authMessage");
  if (box) {
    box.textContent = message;
    box.classList.remove("hidden");
  }
}

function showHintError(message) {
  const hintEl = document.getElementById("journalHint");
  if (hintEl) {
    hintEl.textContent = message;
    hintEl.classList.remove("text-gray-400");
    hintEl.classList.add("text-red-500");
  }
}

async function guardAccess() {
  const user = await getCurrentUser();
  if (!user) {
    console.info("[Journal] Aucun utilisateur connecté.");
    setStatus("incident", "Espace personnel inactif");
    showAuthMessage("Veuillez d’abord activer votre espace personnel.");
    setTimeout(() => {
      window.location.href = "/pages/signup.html";
    }, 2500);
    return null;
  }
  setStatus("connecte", "Espace personnel activé");
  return user;
}

/* ---------- UX : auto-resize ---------- */

function setupAutoResize(textarea) {
  if (!textarea) return;
  const adjust = () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  textarea.addEventListener("input", adjust);
  adjust();
}

/* ---------- Bootstrap ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("journalInput");
  const submitBtn = document.getElementById("journalSubmit");
  const timelineEl = document.getElementById("journalTimeline");

  setupAutoResize(textarea);

  const user = await guardAccess();
  if (!user || !textarea || !submitBtn || !timelineEl) return;

  // 1) On affiche ce qu’on a déjà en local (si jamais)
  const localJournal = normalizeLocalJournal(loadAurumAnswers());
  renderEntries(timelineEl, localJournal);

  // 2) Si Supabase est dispo, on essaie de charger ce qui est en base
  if (supabase) {
    const remote = await fetchJournalEntriesSupabase(user);
    if (remote && remote.length) {
      renderEntries(timelineEl, remote);
    }
  }

  // 3) Gestion du clic sur "Ajouter à mon journal"
  submitBtn.addEventListener("click", async () => {
    const raw = textarea.value;
    if (!raw || raw.trim().length < 2) {
      showHintError("Dis-moi un peu plus, même une phrase suffit.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-70", "cursor-not-allowed");

    try {
      const entry = await saveJournalEntry(user, raw);
      if (entry) {
        appendEntryToTimeline(timelineEl, entry);
        textarea.value = "";
        textarea.style.height = "auto";
        const hintEl = document.getElementById("journalHint");
        if (hintEl) hintEl.textContent = "";
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  });
});
