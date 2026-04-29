import { CAREERS } from "../src/data/sample-data.js";
import { BIG_FIVE_QUESTIONS, RIASEC_QUESTIONS } from "../src/data/questions.js";
import {
  computeBigFiveResult,
  computeRiasecResult,
  createInsightHooks,
  generateRecommendations,
  summarizeExploration,
} from "../src/lib/engine.js";

const hooks = createInsightHooks();
const lowInterest = computeRiasecResult(RIASEC_QUESTIONS, Array(RIASEC_QUESTIONS.length).fill(1));
const straightLineStyle = computeBigFiveResult(BIG_FIVE_QUESTIONS, Array(BIG_FIVE_QUESTIONS.length).fill(1));
const semanticLowStyle = computeBigFiveResult(
  BIG_FIVE_QUESTIONS,
  BIG_FIVE_QUESTIONS.map((question) => (question.reverse ? 5 : 1))
);
const dream = {
  title: "사업가",
  description: "작게 돈을 벌어보고 싶다.",
  whyThisMatters: "수입 확인이 필요하다.",
  visualNote: "작은 판매 화면",
  inspirationSlug: "storefront",
  modes: ["business"],
  blockers: ["money", "time", "confidence"],
};
const profile = {
  weeklyTimeBudget: "1_2",
  incomeUrgency: "immediate",
  primaryGoal: "income",
  remotePreference: "remote",
  physicalDemandLimit: "low",
};
const answers = {
  dreamShift: "작게 돈을 벌고 싶다.",
  fearPoint: "대부분 자신 없다.",
  stuckPoint: "무엇부터 해야 할지 모르겠다.",
  nonNegotiable: "무리한 방식은 싫다.",
  proofNeed: "작은 수입 신호가 필요하다.",
};
const summary = summarizeExploration({ dream, profile, answers, hooks });
const [top] = generateRecommendations({
  dream,
  profile,
  riasecResult: lowInterest,
  bigFiveResult: straightLineStyle,
  summary,
  careers: CAREERS,
  hooks,
});
const [semanticLowTop] = generateRecommendations({
  dream,
  profile,
  riasecResult: lowInterest,
  bigFiveResult: semanticLowStyle,
  summary,
  careers: CAREERS,
  hooks,
});
const failures = [];

if (top.breakdown.interestMatch > 34) {
  failures.push({ check: "all_low_interest_cap", actual: top.breakdown.interestMatch, expectedMax: 34 });
}

if (top.breakdown.workStyleMatch > 42) {
  failures.push({ check: "straight_line_workstyle_cap", actual: top.breakdown.workStyleMatch, expectedMax: 42 });
}

if (semanticLowTop.breakdown.workStyleMatch > 46) {
  failures.push({
    check: "semantic_low_workstyle_cap",
    actual: semanticLowTop.breakdown.workStyleMatch,
    expectedMax: 46,
  });
}

if (top.finalScore > 66) {
  failures.push({ check: "low_assessment_final_score_guard", actual: top.finalScore, expectedMax: 66 });
}

const report = {
  top: {
    slug: top.slug,
    score: top.finalScore,
    interestMatch: top.breakdown.interestMatch,
    workStyleMatch: top.breakdown.workStyleMatch,
    dreamCloseness: top.breakdown.dreamCloseness,
    realityFit: top.breakdown.realityFit,
  },
  semanticLowTop: {
    slug: semanticLowTop.slug,
    score: semanticLowTop.finalScore,
    interestMatch: semanticLowTop.breakdown.interestMatch,
    workStyleMatch: semanticLowTop.breakdown.workStyleMatch,
  },
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  process.exitCode = 1;
}
