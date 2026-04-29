import { CAREERS } from "../src/data/sample-data.js";
import {
  createInsightHooks,
  generateRecommendations,
  summarizeExploration,
} from "../src/lib/engine.js";

const hooks = createInsightHooks();
const incomeUrgencyByCareerMode = {
  immediate: "immediate",
  short_term: "within_3_months",
  mixed: "within_3_months",
  long_term: "no_rush",
};
const selectableModes = [
  "visual",
  "write",
  "teach",
  "business",
  "maker",
  "care",
  "guide",
  "expert",
  "organize",
  "community",
];

function modesForCareer(career) {
  const signals = new Set(career.dreamSignals || []);
  const modes = selectableModes.filter((mode) => signals.has(mode));
  return modes.length ? modes : ["expert"];
}

function personaForCareer(career) {
  const keywords = (career.keywords || []).join(" ");
  const signals = (career.dreamSignals || []).join(" ");

  return {
    dream: {
      title: `${career.name}가 되고 싶다`,
      description: `${career.shortDescription} ${career.name} ${keywords} ${signals}`,
      whyThisMatters: `${career.proofOfWork}를 만들어 보고 싶다.`,
      visualNote: `${career.name} ${keywords}`,
      modes: modesForCareer(career),
      blockers: career.incomeMode === "immediate" ? ["money"] : ["confidence"],
    },
    profile: {
      weeklyTimeBudget: career.trainingTimeCategory === "high" ? "6_plus" : "3_5",
      incomeUrgency: incomeUrgencyByCareerMode[career.incomeMode] || "within_3_months",
      primaryGoal: career.incomeMode === "immediate" ? "income" : "meaning",
      remotePreference: career.remoteOption,
      physicalDemandLimit: career.physicalDemand,
      experienceSummary: `${career.name} ${career.shortDescription} ${keywords} 경험을 쌓고 싶다.`,
    },
    riasec: career.riasecWeights,
    bigFive: career.personalityPreferences,
    answers: {
      dreamShift: `${career.name} ${keywords}`,
      fearPoint: "처음이라 걱정된다.",
      stuckPoint: `${career.proofOfWork}가 필요하다.`,
      nonNegotiable: career.remoteOption === "remote" ? "원격이 중요하다." : "무리한 방식은 싫다.",
      proofNeed: career.firstRevenueOffer,
    },
  };
}

function recommendForCareer(career) {
  const persona = personaForCareer(career);
  const summary = summarizeExploration({
    dream: persona.dream,
    profile: persona.profile,
    answers: persona.answers,
    hooks,
  });

  return generateRecommendations({
    dream: persona.dream,
    profile: persona.profile,
    riasecResult: { normalized: persona.riasec },
    bigFiveResult: { normalized: persona.bigFive },
    summary,
    careers: CAREERS,
    hooks,
  });
}

const results = CAREERS.map((career) => {
  const recommendations = recommendForCareer(career);
  const rank = recommendations.findIndex((item) => item.slug === career.slug) + 1;

  return {
    slug: career.slug,
    name: career.name,
    rank,
    top5: recommendations.map((item) => item.slug),
  };
});

const missingTop5 = results.filter((item) => item.rank < 1 || item.rank > 5);

console.log(JSON.stringify({
  total: CAREERS.length,
  top5Reachable: CAREERS.length - missingTop5.length,
  missingTop5: missingTop5.length,
  missing: missingTop5,
}, null, 2));

if (missingTop5.length) {
  process.exitCode = 1;
}
