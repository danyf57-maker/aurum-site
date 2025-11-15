const SESSION_KEY = "aurum_session_v1";
const DISC_KEY = "aurum_disc_v1";
const PROFILE_KEY = "aurum_profile_v1";
const COACHING_KEY = "aurum_coaching_v1";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSession() {
  return (
    readJSON(SESSION_KEY, null) ?? {
      mode: "anonymous",
      intent: null,
      nickname: "",
      onboardingComplete: false,
    }
  );
}

export function saveSession(partial) {
  const current = loadSession();
  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(SESSION_KEY, next);
  return next;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadDiscState() {
  return (
    readJSON(DISC_KEY, null) ?? {
      version: "disc_questions_v1",
      answers: {},
      freeText: "",
      completedAt: null,
    }
  );
}

export function saveDiscState(partial) {
  const current = loadDiscState();
  const next = {
    ...current,
    ...partial,
  };
  writeJSON(DISC_KEY, next);
  return next;
}

export function upsertDiscAnswer(questionId, payload) {
  const current = loadDiscState();
  const answers = { ...current.answers, [questionId]: payload };
  return saveDiscState({ answers });
}

export function setDiscFreeText(text) {
  return saveDiscState({ freeText: text });
}

export function clearDiscState() {
  localStorage.removeItem(DISC_KEY);
}

export function loadProfileState() {
  return (
    readJSON(PROFILE_KEY, null) ?? {
      rawScores: { D: 0, I: 0, S: 0, C: 0 },
      dominant: null,
      secondary: null,
      template: null,
      generatedAt: null,
    }
  );
}

export function saveProfileState(payload) {
  writeJSON(PROFILE_KEY, payload);
  return payload;
}

export function clearProfileState() {
  localStorage.removeItem(PROFILE_KEY);
}

export function hasProfileState() {
  return Boolean(localStorage.getItem(PROFILE_KEY));
}

export function loadCoachingState() {
  return (
    readJSON(COACHING_KEY, null) ?? {
      advice: [],
      weeklyPractice: "",
      generatedAt: null,
      dominant: null,
      secondary: null,
    }
  );
}

export function saveCoachingState(payload) {
  writeJSON(COACHING_KEY, payload);
  return payload;
}

export function clearCoachingState() {
  localStorage.removeItem(COACHING_KEY);
}

export function hasCoachingState() {
  return Boolean(localStorage.getItem(COACHING_KEY));
}
