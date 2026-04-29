const STORAGE_KEY = "beanything-state-v2";

export function createInitialState() {
  return {
    currentView: "welcome",
    dream: {
      title: "",
      description: "",
      whyThisMatters: "",
      visualNote: "",
      referenceImageUrl: "",
      inspirationSlug: "",
      modes: [],
      blockers: [],
    },
    user: {
      displayName: "",
      birthYear: "",
      ageBand: "other",
      currentStatus: "",
      weeklyTimeBudget: "",
      incomeUrgency: "",
      primaryGoal: "",
      peoplePreference: "",
      remotePreference: "any",
      physicalDemandLimit: "unknown",
      city: "",
      experienceSummary: "",
    },
    assessments: {
      interestAnswers: Array(30).fill(null),
      interestResult: null,
      interestPage: 0,
      styleAnswers: Array(20).fill(null),
      styleResult: null,
      stylePage: 0,
    },
    exploration: {
      answers: {
        dreamShift: "",
        fearPoint: "",
        stuckPoint: "",
        nonNegotiable: "",
        proofNeed: "",
      },
      summary: null,
    },
    recommendations: [],
    selectedCareerSlug: null,
    savedCareerSlugs: [],
    activeJourney: null,
    reflections: [],
    settings: {
      remindersEnabled: false,
      reminderTime: "20:00",
      permission: "default",
    },
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSavedAt: null,
    },
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);
    const initial = createInitialState();
    return {
      ...initial,
      ...parsed,
      dream: { ...initial.dream, ...(parsed.dream || {}) },
      user: { ...initial.user, ...(parsed.user || {}) },
      assessments: { ...initial.assessments, ...(parsed.assessments || {}) },
      exploration: {
        ...initial.exploration,
        ...(parsed.exploration || {}),
        answers: { ...initial.exploration.answers, ...(parsed.exploration?.answers || {}) },
      },
      settings: { ...initial.settings, ...(parsed.settings || {}) },
      meta: { ...initial.meta, ...(parsed.meta || {}) },
    };
  } catch (error) {
    console.error("Failed to load state", error);
    return createInitialState();
  }
}

export function saveState(state) {
  const nextState = {
    ...state,
    meta: {
      ...state.meta,
      updatedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

export function clearState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
