// Persona simulation — runs 5 distinct personas through the new dream-aware engine
// and prints recommendations + journey to evaluate appropriateness.

import { CAREERS, JOURNEY_BLUEPRINTS } from "../src/data/sample-data.js";
import {
  BIG_FIVE_QUESTIONS,
  RIASEC_QUESTIONS,
} from "../src/data/questions.js";
import {
  buildJourney,
  composeCheckinFeedback,
  computeBigFiveResult,
  computeRiasecResult,
  generateRecommendations,
  getAgeBand,
  summarizeExploration,
  summarizeJourneyMetrics,
} from "../src/lib/engine.js";

function buildRiasecAnswers(targetByCode) {
  return RIASEC_QUESTIONS.map((q) => targetByCode[q.code] ?? 3);
}
function buildBigFiveAnswers(targetByTrait) {
  return BIG_FIVE_QUESTIONS.map((q) => {
    const target = targetByTrait[q.trait] ?? 3;
    return q.reverse ? 6 - target : target;
  });
}

const PERSONAS = [
  {
    id: "P1",
    label: "도예가 꿈 (이전 시스템에서 추천 불가했던 케이스)",
    dream: {
      title: "내 작업실에서 도자기를 만드는 도예가",
      description: "흙을 만지고 가마에서 굽는 손작업의 흐름이 좋다. 작은 공방을 차려서 사람들에게 내 그릇과 잔을 팔고 싶다.",
      whyThisMatters: "사무직을 오래 하면서 손에 남는 결과물이 없는 게 답답했다.",
      visualNote: "물레 위 흙, 가마 옆 작업대, 진열장에 놓인 그릇들이 떠오른다.",
      inspirationSlug: "studio",
      modes: ["maker", "visual", "business"],
      blockers: ["money", "skill-gap"],
      referenceImageUrl: "",
    },
    profile: {
      displayName: "이준호",
      birthYear: 1978,
      ageBand: getAgeBand(1978),
      currentStatus: "self_employed",
      weeklyTimeBudget: "6_plus",
      incomeUrgency: "explore_first",
      primaryGoal: "meaning",
      peoplePreference: "medium",
      remotePreference: "onsite",
      physicalDemandLimit: "high",
      city: "춘천",
      experienceSummary: "사무직 15년, 주말마다 도예 클래스를 다니며 손작업에 빠져있다.",
    },
    riasec: { R: 5, I: 3, A: 5, S: 2, E: 3, C: 2 },
    bigFive: { O: 5, C: 4, E: 3, A: 4, N: 3 },
    answers: {
      dreamShift: "내 손으로 만든 그릇이 누군가의 식탁에 놓이는 장면을 보고 싶다.",
      fearPoint: "재료비와 가마비가 계속 나가는데 팔리지 않을까 봐 두렵다.",
      stuckPoint: "어떤 작품을 대표 시그니처로 잡아야 할지 모르겠다.",
      nonNegotiable: "남의 디자인을 그대로 따라 찍는 양산형 작업은 하기 싫다.",
      proofNeed: "한 달 안에 작은 마켓에서 5점 정도 팔리면 계속 갈 수 있을 것 같다.",
    },
  },
  {
    id: "P2",
    label: "심리상담사 꿈 (이전 시스템에서 추천 불가했던 케이스)",
    dream: {
      title: "차분히 사람의 마음을 듣고 도와주는 상담사",
      description: "심리상담 자격을 따고 1:1 세션 중심의 작은 상담실을 열고 싶다.",
      whyThisMatters: "주변 사람들의 고민을 들어주는 게 자연스럽고 보람 있었다.",
      visualNote: "조용한 방, 두 의자, 차 한 잔, 노트와 펜이 떠오른다.",
      inspirationSlug: "classroom",
      modes: ["guide", "care", "expert"],
      blockers: ["confidence", "money"],
      referenceImageUrl: "",
    },
    profile: {
      displayName: "한지수",
      birthYear: 1980,
      ageBand: getAgeBand(1980),
      currentStatus: "job_seeker",
      weeklyTimeBudget: "6_plus",
      incomeUrgency: "within_3_months",
      primaryGoal: "meaning",
      peoplePreference: "high",
      remotePreference: "hybrid",
      physicalDemandLimit: "low",
      city: "대전",
      experienceSummary: "교육 운영 10년, 사람의 변화 과정을 가까이 본 경험이 많다.",
    },
    riasec: { R: 1, I: 5, A: 3, S: 5, E: 2, C: 3 },
    bigFive: { O: 5, C: 5, E: 3, A: 5, N: 4 },
    answers: {
      dreamShift: "한 사람과 깊이 대화해서 그가 다음 한 걸음을 결정할 수 있게 도와주고 싶다.",
      fearPoint: "내가 누군가의 마음을 다룰 자격이 있는지 확신이 서지 않는다.",
      stuckPoint: "자격증, 슈퍼비전, 첫 내담자 사이의 순서를 모르겠다.",
      nonNegotiable: "성과 압박으로 사람을 빠르게 처리하는 방식은 거부한다.",
      proofNeed: "체험 세션 3건에서 진심 어린 후기 1개가 나오면 계속할 동력이 생긴다.",
    },
  },
  {
    id: "P3",
    label: "안정 사무직 (기존 시스템 적합 케이스)",
    dream: {
      title: "다시 차근히 시작하는 사무·행정 실무자",
      description: "오래 일을 쉬었지만 차분한 사무 일로 다시 시작하고 싶다.",
      whyThisMatters: "생계가 급하다. 너무 새로운 분야는 무리고 익숙한 일이 좋다.",
      visualNote: "정리된 책상, 분류된 폴더, 일정표가 붙은 화이트보드.",
      inspirationSlug: "classroom",
      modes: ["organize", "expert"],
      blockers: ["money", "confidence"],
      referenceImageUrl: "",
    },
    profile: {
      displayName: "김영자",
      birthYear: 1972,
      ageBand: getAgeBand(1972),
      currentStatus: "career_break",
      weeklyTimeBudget: "3_5",
      incomeUrgency: "immediate",
      primaryGoal: "income",
      peoplePreference: "low",
      remotePreference: "hybrid",
      physicalDemandLimit: "low",
      city: "서울",
      experienceSummary: "10년 전 행정 사무 경력. 출산 후 경력 단절. 이전엔 문서 정리·일정 관리가 강점.",
    },
    riasec: { R: 2, I: 3, A: 2, S: 2, E: 2, C: 5 },
    bigFive: { O: 3, C: 5, E: 2, A: 4, N: 3 },
    answers: {
      dreamShift: "다시 일에 익숙해져서 안정적으로 월급 받는 흐름을 만들고 싶다.",
      fearPoint: "10년 공백 동안 도구나 방식이 다 바뀌었을까 봐 두렵다.",
      stuckPoint: "어디서부터 다시 배워야 할지 모르겠고, 면접에서 공백을 어떻게 설명할지 막막하다.",
      nonNegotiable: "강한 영업이나 감정 노동이 큰 일은 못 한다.",
      proofNeed: "3개월 안에 작은 회사라도 한 곳 들어가서 적응하면 충분하다.",
    },
  },
  {
    id: "P4",
    label: "1인 교육 창업 꿈 (이전 시스템에서 추천 불가했던 케이스)",
    dream: {
      title: "내 강의로 먹고사는 1인 교육 사업가",
      description: "내 전문 영역의 강의·코칭·뉴스레터를 묶어 1인 교육 사업을 운영하고 싶다.",
      whyThisMatters: "회사 안에서 만든 결과물은 회사가 가져가지만, 내 이름으로 강의하면 내가 남는다.",
      visualNote: "랜딩 페이지, 결제 링크, 줌 화면, 수강생 후기가 떠오른다.",
      inspirationSlug: "storefront",
      modes: ["teach", "business", "expert"],
      blockers: ["time", "visibility"],
      referenceImageUrl: "",
    },
    profile: {
      displayName: "박지훈",
      birthYear: 1983,
      ageBand: getAgeBand(1983),
      currentStatus: "employee",
      weeklyTimeBudget: "3_5",
      incomeUrgency: "explore_first",
      primaryGoal: "learning",
      peoplePreference: "high",
      remotePreference: "remote",
      physicalDemandLimit: "low",
      city: "서울",
      experienceSummary: "데이터 분석 직무 8년, 사내 교육 운영 경험 있음.",
    },
    riasec: { R: 2, I: 4, A: 3, S: 4, E: 5, C: 3 },
    bigFive: { O: 5, C: 4, E: 5, A: 3, N: 2 },
    answers: {
      dreamShift: "내 강의를 듣고 누군가의 일하는 방식이 바뀌는 후기를 받고 싶다.",
      fearPoint: "강의를 만들었는데 신청자가 한 명도 없을까 봐 무섭다.",
      stuckPoint: "첫 유료 강의의 가격과 분량을 어떻게 잡아야 할지 모른다.",
      nonNegotiable: "허세 가득한 동기부여형 강의는 절대 하기 싫다.",
      proofNeed: "유료 수강생 5명을 모집하면 다음 시즌으로 갈 동력이 생긴다.",
    },
  },
  {
    id: "P5",
    label: "지역 시니어 커뮤니티 꿈 (사회 공헌 케이스)",
    dream: {
      title: "지역 시니어를 잇는 모임 운영자",
      description: "은퇴 후 동네 단위로 시니어들을 모아 정기 모임과 활동을 운영하고 싶다.",
      whyThisMatters: "혼자 늙어가는 사람을 보면서 사람을 잇는 역할이 필요하다고 느꼈다.",
      visualNote: "동네 카페에서 둘러앉은 모임, 공지문, 후기 메모장이 떠오른다.",
      inspirationSlug: "classroom",
      modes: ["community", "guide", "care"],
      blockers: ["confidence", "skill-gap"],
      referenceImageUrl: "",
    },
    profile: {
      displayName: "최수정",
      birthYear: 1962,
      ageBand: getAgeBand(1962),
      currentStatus: "retired",
      weeklyTimeBudget: "6_plus",
      incomeUrgency: "explore_first",
      primaryGoal: "social_contribution",
      peoplePreference: "high",
      remotePreference: "onsite",
      physicalDemandLimit: "medium",
      city: "부산",
      experienceSummary: "교사 30년, 학부모 모임 운영 경험 다수.",
    },
    riasec: { R: 2, I: 3, A: 2, S: 5, E: 4, C: 3 },
    bigFive: { O: 4, C: 4, E: 5, A: 5, N: 2 },
    answers: {
      dreamShift: "혼자 있는 시니어 1명이 우리 모임에 와서 다른 친구를 만드는 장면을 보고 싶다.",
      fearPoint: "내가 모임을 시작했는데 사람이 모이지 않을까 봐 망설여진다.",
      stuckPoint: "어떤 주제로 모임을 시작할지, 회비는 받을지 결정이 안 된다.",
      nonNegotiable: "정치색이나 종교색이 들어간 모임은 만들지 않겠다.",
      proofNeed: "첫 모임에 5명 이상 오면 정기 모임으로 키울 자신이 생긴다.",
    },
  },
];

function evaluatePersona(persona) {
  const riasecAnswers = buildRiasecAnswers(persona.riasec);
  const bigFiveAnswers = buildBigFiveAnswers(persona.bigFive);

  const riasecResult = computeRiasecResult(RIASEC_QUESTIONS, riasecAnswers);
  const bigFiveResult = computeBigFiveResult(BIG_FIVE_QUESTIONS, bigFiveAnswers);
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
  const journey = top ? buildJourney(top, JOURNEY_BLUEPRINTS) : null;

  // Test composeCheckinFeedback by simulating Day 1 checkin
  const sampleCheckin = {
    completionStatus: "partial",
    confidenceScore: 2,
    interestScore: 4,
    note: persona.answers.stuckPoint,
  };
  const feedback = journey ? composeCheckinFeedback({ journey, checkin: sampleCheckin }) : "";

  return { persona, riasecResult, summary, recommendations, journey, feedback };
}

function fmtPct(n) {
  return `${Math.round(n * 100)}`.padStart(3) + "%";
}

function dreamMatchVerdict(persona, top, journey) {
  const dreamWords = {
    P1: ["도예", "도자", "공방", "마커", "maker", "만드는", "공예", "비주얼", "수제"],
    P2: ["상담", "코치", "심리", "세션", "마음", "변화", "퍼실리테이", "케어", "웰니스"],
    P3: ["행정", "사무", "문서", "정리", "운영", "어시스턴트"],
    P4: ["강의", "교육", "코치", "강사", "수업", "튜터", "워크샵", "워크숍"],
    P5: ["커뮤니티", "모임", "지역", "운영", "퍼실리테이", "리더", "공동체"],
  };
  const keys = dreamWords[persona.id] || [];
  const recName = top?.name || "";
  const recDesc = top?.shortDescription || "";
  const sprintText = (journey?.stages?.[0]?.tasks || []).map((t) => `${t.title} ${t.description} ${t.deliverable}`).join(" ");
  const recHits = keys.filter((k) => recName.includes(k) || recDesc.includes(k));
  const sprintHits = keys.filter((k) => sprintText.includes(k));

  const top3Names = (top ? [top, ...((persona._otherTop || []))] : []).map((r) => r?.name || "").join(" ");

  const verdict =
    recHits.length >= 1
      ? "✅ 추천 직무명/설명에 꿈 키워드 매칭됨"
      : sprintHits.length >= 1
      ? "⚠ 직무명은 안 맞지만 스프린트 본문은 일부 닿음"
      : "❌ 추천도 스프린트도 꿈 영역과 무관";

  return { verdict, recHits, sprintHits, keys };
}

function printResult(result) {
  const { persona, riasecResult, summary, recommendations, journey, feedback } = result;
  const top = recommendations[0];
  console.log("\n" + "=".repeat(96));
  console.log(`${persona.id}  ${persona.label}`);
  console.log(`꿈: "${persona.dream.title}"`);
  console.log(`프로필: ${persona.profile.displayName} / ${persona.profile.ageBand} / ${persona.profile.currentStatus} / 시간 ${persona.profile.weeklyTimeBudget} / 목표 ${persona.profile.primaryGoal}`);
  console.log(`Dream modes: [${persona.dream.modes.join(", ")}]  Blockers: [${persona.dream.blockers.join(", ")}]`);
  console.log("=".repeat(96));

  console.log("\n[RIASEC]");
  console.log(`  R:${fmtPct(riasecResult.normalized.R)} I:${fmtPct(riasecResult.normalized.I)} A:${fmtPct(riasecResult.normalized.A)} S:${fmtPct(riasecResult.normalized.S)} E:${fmtPct(riasecResult.normalized.E)} C:${fmtPct(riasecResult.normalized.C)}  Top: ${riasecResult.topCodes.join("-")}`);

  console.log("\n[탐색 요약]");
  console.log(`  hookSource: ${summary.hookSource}`);
  console.log(`  dreamCore : ${summary.dreamCore}`);
  console.log(`  motivator : ${summary.motivator}`);
  console.log(`  fear      : ${summary.fearPoint}`);
  console.log(`  stuck     : ${summary.stuckPoint}`);
  console.log(`  riskLevel : ${summary.riskLevel}`);

  console.log("\n[추천 Top 5]");
  recommendations.slice(0, 5).forEach((r) => {
    console.log(`  ${r.rank}. ${r.name.padEnd(28)} ${String(r.finalScore).padStart(3)}점 (${r.fitLabel}) cluster=${r.cluster} dream${r.breakdown.dreamCloseness}/reality${r.breakdown.realityFit}/proof${r.breakdown.proofFit}`);
  });

  console.log(`\n[1순위: ${top?.name}]`);
  console.log(`  paceLabel: ${top?.paceLabel}`);
  console.log(`  reasonShort: ${top?.reasonShort}`);
  top?.reasons?.forEach((r) => console.log(`    • ${r}`));
  console.log(`  주의: ${top?.cautionText}`);
  console.log(`  첫 행동:`);
  top?.firstActions?.forEach((a) => console.log(`    - ${a}`));

  console.log(`\n[여정 — 7일 단계 (${journey?.stages?.[0]?.label})]`);
  console.log(`  요약: ${journey?.stages?.[0]?.summary}`);
  journey?.stages?.[0]?.tasks?.forEach((t) => {
    console.log(`  Day ${t.day}: ${t.title}`);
    console.log(`           ${t.description}`);
    console.log(`           산출물: ${t.deliverable}`);
  });

  console.log(`\n[전체 단계 구조]`);
  journey?.stages?.forEach((s) => {
    console.log(`  ${s.label} (${s.key}, ${s.tasks?.length || 0} tasks): ${s.summary}`);
  });

  console.log(`\n[체크인 피드백 시뮬 — partial/conf=2/interest=4 + 메모="${persona.answers.stuckPoint.slice(0, 30)}…"]`);
  console.log(`  ${feedback}`);

  console.log(`\n[적절성 평가]`);
  const v = dreamMatchVerdict(persona, top, journey);
  console.log(`  꿈 키워드: [${v.keys.join(", ")}]`);
  console.log(`  추천 매칭: [${v.recHits.join(", ") || "없음"}]   스프린트 매칭: [${v.sprintHits.join(", ") || "없음"}]`);
  console.log(`  → ${v.verdict}`);
}

console.log("Be Anything — 5 페르소나 시뮬레이션");
console.log(`실행: ${new Date().toISOString()}  /  CAREERS: ${CAREERS.length}개  /  JOURNEY tracks: ${Object.keys(JOURNEY_BLUEPRINTS).length}개`);

const results = PERSONAS.map(evaluatePersona);
results.forEach(printResult);

console.log("\n" + "=".repeat(96));
console.log("종합 요약");
console.log("=".repeat(96));
results.forEach((r) => {
  const top = r.recommendations[0];
  const v = dreamMatchVerdict(r.persona, top, r.journey);
  console.log(`${r.persona.id} | "${r.persona.dream.title.slice(0, 30)}" → ${top?.name} (${top?.finalScore}점, ${top?.fitLabel}) ${v.verdict.slice(0, 2)}`);
});
