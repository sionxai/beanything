import { CAREERS, JOURNEY_BLUEPRINTS } from "../src/data/sample-data.js";
import { BIG_FIVE_QUESTIONS, RIASEC_QUESTIONS } from "../src/data/questions.js";
import {
  buildJourney,
  composeCheckinFeedback,
  computeBigFiveResult,
  computeRiasecResult,
  generateRecommendations,
  getAgeBand,
  summarizeExploration,
} from "../src/lib/engine.js";

function buildRiasecAnswers(targetByCode) {
  return RIASEC_QUESTIONS.map((question) => targetByCode[question.code] ?? 3);
}

function buildBigFiveAnswers(targetByTrait) {
  return BIG_FIVE_QUESTIONS.map((question) => {
    const target = targetByTrait[question.trait] ?? 3;
    return question.reverse ? 6 - target : target;
  });
}

function hasJourneyQuality(journey) {
  const stageKeys = new Set(journey?.stages?.map((stage) => stage.key));
  const allTasks = journey?.stages?.flatMap((stage) => stage.tasks || []) || [];
  const text = allTasks.map((task) => `${task.title} ${task.description} ${task.deliverable}`).join(" ");

  return {
    hasAllStages: ["seven", "thirty", "ninety", "revenue"].every((key) => stageKeys.has(key)),
    hasFailureCriteria: /실패 기준|접을 기준/.test(text),
    hasInterview: /인터뷰|묻/.test(text),
    hasPublicAction: /공개|게시|업로드/.test(text),
    hasRevenueAction: /유료|수익|제안|모집/.test(text),
    taskCount: allTasks.length,
  };
}

function checkinSignal(checkin) {
  const confidence = Number(checkin.confidenceScore || 0);
  const interest = Number(checkin.interestScore || 0);
  const rated = [confidence, interest].filter((value) => value > 0);
  const statusOnlyScore = checkin.completionStatus === "skipped" ? 30 : checkin.completionStatus === "partial" ? 55 : 80;
  const responseScore = rated.length
    ? Math.round((rated.reduce((sum, value) => sum + value, 0) / rated.length / 5) * 100)
    : statusOnlyScore;
  const statusCap = checkin.completionStatus === "skipped" ? 45 : checkin.completionStatus === "partial" ? 68 : 100;
  const lowSignalCap = rated.length && rated.every((value) => value <= 2) ? 52 : 100;
  const score = Math.max(0, Math.min(responseScore, statusCap, lowSignalCap));

  return {
    score,
    verdict: score < 50 ? "negative" : score < 70 ? "caution" : "support",
  };
}

const PERSONAS = [
  {
    id: "P1_HIGH_DRIVE_AI_BRAND",
    label: "의욕 높음 · AI 이미지 브랜드 창업",
    dream: {
      title: "AI 이미지로 작은 브랜드 스튜디오를 운영하는 사람",
      description: "브랜드 콘셉트, SNS 이미지, 프롬프트를 묶어 소상공인에게 팔고 싶다.",
      whyThisMatters: "내 이름으로 결과물을 만들고 빠르게 시장 반응을 보고 싶다.",
      visualNote: "브랜드 무드보드, AI 이미지 보드, 결제 링크가 떠오른다.",
      inspirationSlug: "storefront",
      modes: ["visual", "business", "expert"],
      blockers: ["visibility"],
    },
    profile: {
      displayName: "강민",
      birthYear: 1991,
      ageBand: getAgeBand(1991),
      currentStatus: "employee",
      weeklyTimeBudget: "6_plus",
      incomeUrgency: "within_3_months",
      primaryGoal: "income",
      peoplePreference: "medium",
      remotePreference: "remote",
      physicalDemandLimit: "low",
    },
    riasec: { R: 2, I: 4, A: 5, S: 3, E: 5, C: 3 },
    bigFive: { O: 5, C: 4, E: 4, A: 3, N: 2 },
    answers: {
      dreamShift: "내가 만든 이미지 보드가 실제 판매 페이지에 쓰이는 장면을 보고 싶다.",
      fearPoint: "포트폴리오를 공개했는데 반응이 없을까 봐 걱정된다.",
      stuckPoint: "첫 상품을 프롬프트로 팔지, 이미지 패키지로 팔지 결정하지 못했다.",
      nonNegotiable: "싸구려 자동생성 납품처럼 보이는 방식은 싫다.",
      proofNeed: "소상공인 2명에게 피드백을 받고 1명이 유료 테스트를 물어보면 계속한다.",
    },
    checkin: { completionStatus: "done", confidenceScore: 5, interestScore: 5, note: "반응이 좋아서 더 해보고 싶다." },
    expected: {
      topAny: ["ai-image-prompt-designer", "brand-visual-designer", "sns-template-designer", "local-brand-launch-advisor"],
      minScore: 75,
      checkinVerdict: "support",
    },
  },
  {
    id: "P2_NO_DREAM_LOW_WILL",
    label: "꿈도 의지도 거의 없음 · 전부 낮은 응답",
    dream: {
      title: "아직 되고 싶은 게 없음",
      description: "딱히 하고 싶은 일이 없고, 뭘 해도 자신이 없다. 지금은 아무것도 끌리지 않는다.",
      whyThisMatters: "수입 걱정은 있지만 에너지가 거의 없다.",
      visualNote: "비어 있는 책상, 미뤄둔 메모장.",
      inspirationSlug: "",
      modes: [],
      blockers: ["confidence", "time", "money"],
    },
    profile: {
      displayName: "무기력",
      birthYear: 1988,
      ageBand: getAgeBand(1988),
      currentStatus: "job_seeker",
      weeklyTimeBudget: "1_2",
      incomeUrgency: "explore_first",
      primaryGoal: "",
      peoplePreference: "low",
      remotePreference: "remote",
      physicalDemandLimit: "low",
    },
    riasec: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 },
    bigFive: { O: 1, C: 1, E: 1, A: 1, N: 1 },
    answers: {
      dreamShift: "잘 모르겠다. 달라질 장면이 떠오르지 않는다.",
      fearPoint: "시작해도 또 못 할 것 같다.",
      stuckPoint: "하고 싶은 것도 없고 계속 미루게 된다.",
      nonNegotiable: "사람을 많이 만나거나 빨리 돈 벌라는 압박은 싫다.",
      proofNeed: "10분이라도 해보고 덜 싫으면 다음을 생각할 수 있다.",
    },
    checkin: { completionStatus: "skipped", confidenceScore: 1, interestScore: 1, note: "하기 싫고 못 했다." },
    expected: {
      maxScore: 66,
      maxInterest: 34,
      maxWorkStyle: 46,
      checkinVerdict: "negative",
    },
  },
  {
    id: "P3_STABLE_OFFICE_RESTART",
    label: "현실형 재시작 · 안정 사무/정리 선호",
    dream: {
      title: "원격으로 차분히 자료를 정리하는 사무 실무자",
      description: "엑셀, 문서, 일정 정리처럼 기준이 분명한 일을 다시 시작하고 싶다.",
      whyThisMatters: "수입이 필요하지만 영업이나 사람 많은 일은 피하고 싶다.",
      visualNote: "정리된 스프레드시트와 체크리스트.",
      inspirationSlug: "expert",
      modes: ["organize", "expert"],
      blockers: ["confidence", "money"],
    },
    profile: {
      displayName: "정리형",
      birthYear: 1976,
      ageBand: getAgeBand(1976),
      currentStatus: "career_break",
      weeklyTimeBudget: "3_5",
      incomeUrgency: "immediate",
      primaryGoal: "income",
      peoplePreference: "low",
      remotePreference: "remote",
      physicalDemandLimit: "low",
    },
    riasec: { R: 2, I: 3, A: 1, S: 2, E: 1, C: 5 },
    bigFive: { O: 2, C: 5, E: 1, A: 4, N: 3 },
    answers: {
      dreamShift: "작은 일을 맡아 정확히 끝내고 다시 일 감각을 회복하고 싶다.",
      fearPoint: "공백이 길어서 최신 도구를 못 따라갈까 봐 걱정된다.",
      stuckPoint: "포트폴리오로 보여줄 사무 결과물이 없다.",
      nonNegotiable: "강한 영업이나 장시간 응대는 피하고 싶다.",
      proofNeed: "정리 샘플을 보여주고 작은 의뢰 문의가 오면 계속한다.",
    },
    checkin: { completionStatus: "partial", confidenceScore: 3, interestScore: 3, note: "조금은 할 수 있을 것 같다." },
    expected: {
      topAny: ["data-cleanup-assistant", "virtual-assistant", "tax-prep-support-partner", "newsletter-operations-assistant"],
      minScore: 70,
      checkinVerdict: "caution",
    },
  },
  {
    id: "P4_STUDENT_EXPLORER",
    label: "학생 · 관심은 높지만 수익보다 프로젝트",
    dream: {
      title: "AI 이미지와 발표자료를 만드는 학생 크리에이터",
      description: "학교 발표와 동아리 홍보물을 더 멋지게 만들고, 포트폴리오로 남기고 싶다.",
      whyThisMatters: "아직 직업은 모르지만 내가 만든 결과물을 보여주고 싶다.",
      visualNote: "발표 슬라이드, AI 이미지 콘셉트, 동아리 포스터.",
      inspirationSlug: "studio",
      modes: ["visual", "write", "teach"],
      blockers: ["skill-gap", "confidence"],
    },
    profile: {
      displayName: "학생",
      birthYear: 2009,
      ageBand: getAgeBand(2009),
      currentStatus: "high_school_student",
      weeklyTimeBudget: "3_5",
      incomeUrgency: "explore_first",
      primaryGoal: "learning",
      peoplePreference: "medium",
      remotePreference: "hybrid",
      physicalDemandLimit: "low",
    },
    riasec: { R: 2, I: 4, A: 5, S: 3, E: 3, C: 3 },
    bigFive: { O: 5, C: 3, E: 3, A: 4, N: 3 },
    answers: {
      dreamShift: "내 결과물을 모아 진로 포트폴리오로 보여주고 싶다.",
      fearPoint: "실력이 부족해서 공개하기 부끄럽다.",
      stuckPoint: "어떤 샘플을 먼저 만들지 모르겠다.",
      nonNegotiable: "위험한 거래나 무리한 수익화는 하지 않는다.",
      proofNeed: "선생님이나 친구 3명에게 피드백을 받으면 계속한다.",
    },
    checkin: { completionStatus: "done", confidenceScore: 4, interestScore: 5, note: "샘플 만드는 게 재미있다." },
    expected: {
      topAny: ["ai-image-prompt-designer", "ai-content-editor", "presentation-visual-editor", "sns-template-designer", "career-portfolio-mentor"],
      requiresStudentMode: true,
      checkinVerdict: "support",
    },
  },
  {
    id: "P5_BURNED_OUT_HELPER",
    label: "의지는 있으나 소진 · 돌봄/상담 계열 보류",
    dream: {
      title: "사람의 마음을 돕는 상담형 가이드",
      description: "상담사처럼 깊이 듣고 돕고 싶지만, 지금은 에너지가 낮고 부담이 크다.",
      whyThisMatters: "주변 사람을 도울 때 의미를 느낀다.",
      visualNote: "조용한 대화 공간과 질문 카드.",
      inspirationSlug: "care",
      modes: ["care", "guide", "write"],
      blockers: ["confidence", "time"],
    },
    profile: {
      displayName: "소진형",
      birthYear: 1984,
      ageBand: getAgeBand(1984),
      currentStatus: "employee",
      weeklyTimeBudget: "1_2",
      incomeUrgency: "explore_first",
      primaryGoal: "meaning",
      peoplePreference: "medium",
      remotePreference: "hybrid",
      physicalDemandLimit: "low",
    },
    riasec: { R: 1, I: 4, A: 3, S: 5, E: 1, C: 3 },
    bigFive: { O: 4, C: 3, E: 1, A: 5, N: 5 },
    answers: {
      dreamShift: "누군가가 자기 마음을 정리하고 다음 행동을 고르는 걸 돕고 싶다.",
      fearPoint: "내가 감당하지 못할 이야기를 들을까 봐 무섭다.",
      stuckPoint: "상담과 비의료적 도움의 경계를 모르겠다.",
      nonNegotiable: "자격 없는 상담처럼 보이는 일은 하지 않는다.",
      proofNeed: "비의료적 저널링 질문지에 좋은 반응이 있으면 계속한다.",
    },
    checkin: { completionStatus: "partial", confidenceScore: 2, interestScore: 3, note: "의미는 있지만 부담스럽다." },
    expected: {
      topAny: ["mindful-journaling-guide", "grief-journaling-guide", "caregiver-support-group-host", "memorial-writing-guide"],
      maxDisplayScore: 68,
      checkinVerdict: "caution",
    },
  },
];

function evaluate(persona) {
  const riasecResult = computeRiasecResult(RIASEC_QUESTIONS, buildRiasecAnswers(persona.riasec));
  const bigFiveResult = computeBigFiveResult(BIG_FIVE_QUESTIONS, buildBigFiveAnswers(persona.bigFive));
  const summary = summarizeExploration({
    dream: persona.dream,
    profile: persona.profile,
    answers: persona.answers,
  });
  const recommendations = generateRecommendations({
    dream: persona.dream,
    profile: persona.profile,
    riasecResult,
    bigFiveResult,
    summary,
    careers: CAREERS,
  });
  const top = recommendations[0];
  const journey = buildJourney(top, JOURNEY_BLUEPRINTS);
  const feedback = composeCheckinFeedback({ journey, checkin: persona.checkin });
  const signal = checkinSignal(persona.checkin);
  const displayScore = signal.verdict === "negative"
    ? Math.min(top.finalScore, 48)
    : signal.verdict === "caution"
      ? Math.min(top.finalScore, 68)
      : top.finalScore;
  const journeyQuality = hasJourneyQuality(journey);
  const failures = [];

  if (persona.expected.topAny && !recommendations.slice(0, 5).some((item) => persona.expected.topAny.includes(item.slug))) {
    failures.push(`expected one of [${persona.expected.topAny.join(", ")}] in top5`);
  }
  if (persona.expected.minScore && top.finalScore < persona.expected.minScore) {
    failures.push(`expected score >= ${persona.expected.minScore}, got ${top.finalScore}`);
  }
  if (persona.expected.maxScore && top.finalScore > persona.expected.maxScore) {
    failures.push(`expected score <= ${persona.expected.maxScore}, got ${top.finalScore}`);
  }
  if (persona.expected.maxDisplayScore && displayScore > persona.expected.maxDisplayScore) {
    failures.push(`expected display score <= ${persona.expected.maxDisplayScore}, got ${displayScore}`);
  }
  if (persona.expected.maxInterest && top.breakdown.interestMatch > persona.expected.maxInterest) {
    failures.push(`expected interest <= ${persona.expected.maxInterest}, got ${top.breakdown.interestMatch}`);
  }
  if (persona.expected.maxWorkStyle && top.breakdown.workStyleMatch > persona.expected.maxWorkStyle) {
    failures.push(`expected workStyle <= ${persona.expected.maxWorkStyle}, got ${top.breakdown.workStyleMatch}`);
  }
  if (persona.expected.requiresStudentMode && !recommendations.slice(0, 5).some((item) => item.studentMode)) {
    failures.push("expected student-mode recommendation in top5");
  }
  if (persona.expected.checkinVerdict && signal.verdict !== persona.expected.checkinVerdict) {
    failures.push(`expected checkin verdict ${persona.expected.checkinVerdict}, got ${signal.verdict}`);
  }
  if (!journeyQuality.hasAllStages || journeyQuality.taskCount < 12) {
    failures.push("journey is missing required stages/tasks");
  }
  if (!journeyQuality.hasFailureCriteria || !journeyQuality.hasInterview || !journeyQuality.hasPublicAction || !journeyQuality.hasRevenueAction) {
    failures.push("journey is missing result/interview/public/revenue quality gates");
  }

  return {
    persona,
    riasecResult,
    bigFiveResult,
    recommendations,
    top,
    journey,
    feedback,
    signal,
    displayScore,
    journeyQuality,
    failures,
  };
}

const results = PERSONAS.map(evaluate);
const failed = results.filter((result) => result.failures.length);

console.log(JSON.stringify({
  careerCount: CAREERS.length,
  personas: results.map((result) => ({
    id: result.persona.id,
    label: result.persona.label,
    top: {
      slug: result.top.slug,
      name: result.top.name,
      score: result.top.finalScore,
      displayScore: result.displayScore,
      fitLabel: result.top.fitLabel,
      interest: result.top.breakdown.interestMatch,
      workStyle: result.top.breakdown.workStyleMatch,
      dreamCloseness: result.top.breakdown.dreamCloseness,
      reality: result.top.breakdown.realityFit,
      proof: result.top.breakdown.proofFit,
      studentMode: Boolean(result.top.studentMode),
    },
    top5: result.recommendations.slice(0, 5).map((item) => ({
      slug: item.slug,
      name: item.name,
      score: item.finalScore,
    })),
    checkin: result.signal,
    journeyQuality: result.journeyQuality,
    feedback: result.feedback,
    failures: result.failures,
  })),
  failedCount: failed.length,
}, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
