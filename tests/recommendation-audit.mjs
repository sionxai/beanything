import { CAREERS, JOURNEY_BLUEPRINTS } from "../src/data/sample-data.js";
import {
  buildJourney,
  createInsightHooks,
  generateRecommendations,
  summarizeExploration,
} from "../src/lib/engine.js";

const EXPECTED_TOTAL = 180;
const EXPECTED_CATEGORY_COUNT = 18;
const REQUIRED_STAGES = ["seven", "thirty", "ninety", "revenue"];
const VALID_REMOTE = new Set(["onsite", "hybrid", "remote", "mixed"]);
const VALID_PHYSICAL = new Set(["low", "medium", "high"]);
const VALID_TRAINING = new Set(["low", "medium", "high"]);
const VALID_INCOME = new Set(["immediate", "short_term", "mixed", "long_term"]);
const STUDENT_STATUSES = new Set([
  "elementary_student",
  "middle_school_student",
  "high_school_student",
  "university_student",
]);
const hooks = createInsightHooks();

function fail(message, detail = null) {
  return { ok: false, message, detail };
}

function pass(message, detail = null) {
  return { ok: true, message, detail };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function auditCatalog() {
  const checks = [];
  const slugs = new Set();
  const categoryCounts = countBy(CAREERS, "category");

  checks.push(CAREERS.length === EXPECTED_TOTAL
    ? pass("career_count", CAREERS.length)
    : fail("career_count", { expected: EXPECTED_TOTAL, actual: CAREERS.length }));

  Object.entries(categoryCounts).forEach(([category, count]) => {
    checks.push(count === EXPECTED_CATEGORY_COUNT
      ? pass(`category_count:${category}`, count)
      : fail(`category_count:${category}`, { expected: EXPECTED_CATEGORY_COUNT, actual: count }));
  });

  CAREERS.forEach((career) => {
    if (slugs.has(career.slug)) checks.push(fail("duplicate_slug", career.slug));
    slugs.add(career.slug);

    ["slug", "name", "category", "cluster", "roadmapTrack", "shortDescription", "proofOfWork", "publishAction", "interviewTarget", "firstRevenueOffer", "realityNote"].forEach((field) => {
      if (!career[field]) checks.push(fail(`missing_field:${field}`, career.slug));
    });

    if (!JOURNEY_BLUEPRINTS[career.roadmapTrack]) checks.push(fail("missing_roadmap", { slug: career.slug, roadmapTrack: career.roadmapTrack }));
    if (!VALID_REMOTE.has(career.remoteOption)) checks.push(fail("invalid_remote", { slug: career.slug, remoteOption: career.remoteOption }));
    if (!VALID_PHYSICAL.has(career.physicalDemand)) checks.push(fail("invalid_physical", { slug: career.slug, physicalDemand: career.physicalDemand }));
    if (!VALID_TRAINING.has(career.trainingTimeCategory)) checks.push(fail("invalid_training", { slug: career.slug, trainingTimeCategory: career.trainingTimeCategory }));
    if (!VALID_INCOME.has(career.incomeMode)) checks.push(fail("invalid_income", { slug: career.slug, incomeMode: career.incomeMode }));
  });

  const keywordCareers = CAREERS.filter((career) => career.keywords?.length);
  checks.push(keywordCareers.length >= 120
    ? pass("keyword_coverage", keywordCareers.length)
    : fail("keyword_coverage", { expectedAtLeast: 120, actual: keywordCareers.length }));

  return { categoryCounts, checks };
}

function auditJourney(recommendation) {
  const journey = buildJourney(recommendation, JOURNEY_BLUEPRINTS);
  const stageKeys = new Set(journey.stages.map((stage) => stage.key));
  const tasks = journey.stages.flatMap((stage) => stage.tasks);
  const stageText = journey.stages.map((stage) => `${stage.label} ${stage.summary}`).join(" ");
  const joined = `${stageText} ${tasks.map((task) => `${task.title} ${task.description} ${task.deliverable}`).join(" ")}`;
  const hasAdultRevenueTerms = /유료|수익|결제|가격/.test(joined);

  return {
    hasAllStages: REQUIRED_STAGES.every((stage) => stageKeys.has(stage)),
    taskCount: tasks.length,
    hasFailureCriteria: /실패|기준|접을/.test(joined),
    hasInterview: /인터뷰|묻습니다|만나기/.test(joined),
    hasPublicAction: /공개|게시|발행|링크/.test(joined),
    hasRevenueAction: recommendation.studentMode
      ? /피드백|외부 반응|멘토|선생님|보호자|반응/.test(joined) && !hasAdultRevenueTerms
      : /유료|수익|제안|결제|모집/.test(joined),
  };
}

function recommend(persona) {
  const summary = summarizeExploration({
    dream: persona.dream,
    profile: persona.user,
    answers: persona.answers,
    hooks,
  });

  return generateRecommendations({
    dream: persona.dream,
    profile: persona.user,
    riasecResult: { normalized: persona.riasec },
    bigFiveResult: { normalized: persona.bigFive },
    summary,
    careers: CAREERS,
    hooks,
  });
}

function auditScenario(persona) {
  const recommendations = recommend(persona);
  const top = recommendations[0];
  const top3 = recommendations.slice(0, 3);
  const top5 = recommendations.slice(0, 5);
  const checks = [];

  if (persona.expectedTop1) {
    checks.push(top.slug === persona.expectedTop1
      ? pass("expected_top1", top.slug)
      : fail("expected_top1", { expected: persona.expectedTop1, actual: top.slug, top3: top3.map((item) => item.slug) }));
  }

  if (persona.expectedAnyTop3) {
    const hit = top3.some((item) => persona.expectedAnyTop3.includes(item.slug));
    checks.push(hit
      ? pass("expected_any_top3", top3.map((item) => item.slug))
      : fail("expected_any_top3", { expected: persona.expectedAnyTop3, actual: top3.map((item) => item.slug) }));
  }

  if (persona.expectedAnyTop5) {
    const hit = top5.some((item) => persona.expectedAnyTop5.includes(item.slug));
    checks.push(hit
      ? pass("expected_any_top5", top5.map((item) => item.slug))
      : fail("expected_any_top5", { expected: persona.expectedAnyTop5, actual: top5.map((item) => item.slug) }));
  }

  if (persona.forbiddenTop3) {
    const blocked = top3.filter((item) => persona.forbiddenTop3.includes(item.slug));
    checks.push(!blocked.length
      ? pass("forbidden_top3", top3.map((item) => item.slug))
      : fail("forbidden_top3", { blocked: blocked.map((item) => item.slug), top3: top3.map((item) => item.slug) }));
  }

  const dreamOrderingIssue = top5.find((item, index) =>
    top5.slice(index + 1).some(
      (later) =>
        later.breakdown.dreamCloseness - item.breakdown.dreamCloseness >= 30 &&
        item.breakdown.directMentionFit <= 0 &&
        later.finalScore >= item.finalScore - 20
    )
  );
  checks.push(!dreamOrderingIssue
    ? pass("dream_closeness_order", top5.map((item) => `${item.slug}:${item.breakdown.dreamCloseness}`))
    : fail("dream_closeness_order", {
      top5: top5.map((item) => ({
        slug: item.slug,
        score: item.finalScore,
        dreamCloseness: item.breakdown.dreamCloseness,
        directMentionFit: item.breakdown.directMentionFit,
      })),
    }));

  if (persona.user.remotePreference === "remote") {
    checks.push(top.remoteOption !== "onsite"
      ? pass("remote_fit", top.remoteOption)
      : fail("remote_fit", { slug: top.slug, remoteOption: top.remoteOption }));
  }

  if (persona.user.physicalDemandLimit === "low") {
    checks.push(top.physicalDemand !== "high"
      ? pass("physical_fit", top.physicalDemand)
      : fail("physical_fit", { slug: top.slug, physicalDemand: top.physicalDemand }));
  }

  if (STUDENT_STATUSES.has(persona.user.currentStatus)) {
    checks.push(top.studentMode
      ? pass("student_mode", top.name)
      : fail("student_mode", { slug: top.slug, name: top.name }));

    checks.push(/프로젝트|포트폴리오|학생|피드백/.test(`${top.name} ${top.shortDescription} ${top.reason}`)
      ? pass("student_facing_copy", top.name)
      : fail("student_facing_copy", { slug: top.slug, name: top.name, description: top.shortDescription }));
  }

  const journey = auditJourney(top);
  checks.push(Object.values(journey).every(Boolean)
    ? pass("journey_quality", journey)
    : fail("journey_quality", { top: top.slug, journey }));

  return {
    id: persona.id,
    name: persona.name,
    top5: top5.map((item) => ({
      slug: item.slug,
      name: item.name,
      score: item.finalScore,
      dreamCloseness: item.breakdown.dreamCloseness,
      keywordFit: item.breakdown.keywordFit,
      specificityFit: item.breakdown.specificityFit,
      directMentionFit: item.breakdown.directMentionFit,
      studentFit: item.breakdown.studentFit,
      preferenceAdjustment: item.breakdown.preferenceAdjustment,
    })),
    checks,
  };
}

const personas = [
  {
    id: "ELEMENTARY_CREATOR",
    name: "초등 캐릭터 이야기",
    expectedAnyTop3: ["children-story-creator", "kids-craft-kit-maker", "digital-collage-artist", "illustration-commission-artist"],
    forbiddenTop3: ["paralegal-assistant", "tax-prep-support-partner", "senior-travel-host"],
    dream: { title: "캐릭터와 그림책을 만드는 사람", description: "내가 만든 캐릭터로 짧은 이야기를 그리고 싶다.", whyThisMatters: "그림과 이야기를 같이 만드는 시간이 좋다.", visualNote: "스케치북, 캐릭터, 짧은 이야기", inspirationSlug: "studio", modes: ["visual", "write", "maker"], blockers: ["confidence"] },
    user: { currentStatus: "elementary_student", weeklyTimeBudget: "3_5", incomeUrgency: "no_rush", primaryGoal: "meaning", remotePreference: "mixed", physicalDemandLimit: "low", experienceSummary: "그림 그리기와 이야기 만들기를 좋아한다." },
    riasec: { R: 0.25, I: 0.45, A: 0.9, S: 0.55, E: 0.25, C: 0.4 },
    bigFive: { O: 0.85, C: 0.55, E: 0.35, A: 0.75, N: 0.45 },
    answers: { dreamShift: "캐릭터 이야기를 만들고 싶다.", fearPoint: "잘 못 그릴까 걱정된다.", stuckPoint: "어디에 보여줄지 모르겠다.", nonNegotiable: "위험한 활동은 싫다.", proofNeed: "선생님이나 보호자 반응이 필요하다." },
  },
  {
    id: "MIDDLE_AI_CREATOR",
    name: "중학생 AI 콘텐츠",
    expectedAnyTop3: ["ai-image-prompt-designer", "ai-content-editor", "notion-template-seller", "canva-template-creator", "children-story-creator"],
    forbiddenTop3: ["tax-prep-support-partner", "real-estate-field-agent", "grant-proposal-partner"],
    dream: { title: "AI 그림과 영상으로 콘텐츠 만드는 사람", description: "AI 이미지와 짧은 영상을 만들어 채널에 올려보고 싶다.", whyThisMatters: "상상한 장면을 빠르게 보여주고 싶다.", visualNote: "AI 이미지 화면과 편집 앱", inspirationSlug: "studio", modes: ["visual", "tech", "creator"], blockers: ["confidence"] },
    user: { currentStatus: "middle_school_student", weeklyTimeBudget: "3_5", incomeUrgency: "no_rush", primaryGoal: "meaning", remotePreference: "remote", physicalDemandLimit: "low", experienceSummary: "AI 이미지 만들기와 편집 앱을 만져봤다." },
    riasec: { R: 0.25, I: 0.65, A: 0.82, S: 0.35, E: 0.45, C: 0.45 },
    bigFive: { O: 0.88, C: 0.58, E: 0.45, A: 0.55, N: 0.42 },
    answers: { dreamShift: "AI 콘텐츠를 만들고 싶다.", fearPoint: "다 비슷해 보일까 걱정된다.", stuckPoint: "주제 선정이 어렵다.", nonNegotiable: "얼굴 공개는 싫다.", proofNeed: "게시 후 반응이 필요하다." },
  },
  {
    id: "HIGH_PORTFOLIO",
    name: "고등학생 진로 포트폴리오",
    expectedAnyTop3: ["career-portfolio-mentor", "presentation-visual-editor", "notion-template-seller", "education-program-planner", "ai-content-editor"],
    forbiddenTop3: ["pet-treat-maker", "senior-travel-host", "plant-care-service-owner"],
    dream: { title: "포트폴리오로 진로를 보여주는 학생", description: "입시와 동아리 활동을 포트폴리오로 정리하고 싶다.", whyThisMatters: "진로 선택이 막막해서 내 활동의 방향을 보고 싶다.", visualNote: "포트폴리오 보드와 발표자료", inspirationSlug: "classroom", modes: ["organize", "teach", "expert"], blockers: ["time"] },
    user: { currentStatus: "high_school_student", weeklyTimeBudget: "1_2", incomeUrgency: "no_rush", primaryGoal: "meaning", remotePreference: "remote", physicalDemandLimit: "low", experienceSummary: "동아리 발표와 보고서를 자주 만든다." },
    riasec: { R: 0.2, I: 0.68, A: 0.55, S: 0.62, E: 0.45, C: 0.8 },
    bigFive: { O: 0.7, C: 0.86, E: 0.42, A: 0.68, N: 0.5 },
    answers: { dreamShift: "진로 포트폴리오를 만들고 싶다.", fearPoint: "스펙만 쌓는 느낌이 걱정된다.", stuckPoint: "정리 방법이 없다.", nonNegotiable: "시간을 너무 많이 쓰는 것은 어렵다.", proofNeed: "멘토 피드백이 필요하다." },
  },
  {
    id: "UNIVERSITY_DESIGN",
    name: "대학생 디자인 첫 실무",
    expectedAnyTop3: ["sns-template-designer", "brand-visual-designer", "copywriter-for-small-brands", "social-media-manager", "notion-template-seller", "recipe-content-writer"],
    forbiddenTop3: ["pet-care-studio-owner", "senior-travel-host", "paralegal-assistant"],
    dream: { title: "디자인으로 첫 외주를 받는 대학생", description: "SNS 카드뉴스와 브랜드 이미지를 만들어 포트폴리오를 쌓고 싶다.", whyThisMatters: "전공과 동아리 경험을 실무로 연결하고 싶다.", visualNote: "디자인 포트폴리오와 카드뉴스", inspirationSlug: "studio", modes: ["visual", "business", "creator"], blockers: ["money"] },
    user: { currentStatus: "university_student", weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "income", remotePreference: "remote", physicalDemandLimit: "low", experienceSummary: "동아리 카드뉴스와 과제 발표 디자인 경험이 있다." },
    riasec: { R: 0.25, I: 0.55, A: 0.88, S: 0.48, E: 0.62, C: 0.62 },
    bigFive: { O: 0.82, C: 0.72, E: 0.55, A: 0.62, N: 0.4 },
    answers: { dreamShift: "디자인 외주를 해보고 싶다.", fearPoint: "실력이 부족할까 걱정된다.", stuckPoint: "포트폴리오가 부족하다.", nonNegotiable: "무리한 야근은 싫다.", proofNeed: "첫 의뢰 반응이 필요하다." },
  },
  {
    id: "AI_ADULT_TUTOR",
    name: "중장년 AI 도구 수업",
    expectedTop1: "ai-tools-tutor-for-adults",
    dream: { title: "중장년에게 챗GPT와 AI 이미지 도구를 가르치는 사람", description: "스마트폰과 AI를 어려워하는 사람에게 쉽게 알려주고 싶다.", whyThisMatters: "내가 배운 디지털 도구를 생활에 바로 쓰게 돕고 싶다.", visualNote: "작은 교실, 실습지, 챗GPT 화면", inspirationSlug: "classroom", modes: ["teach", "expert", "guide"], blockers: ["confidence"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "meaning", remotePreference: "hybrid", physicalDemandLimit: "low", experienceSummary: "교육 운영 경험과 디지털 도구 학습 경험이 있다." },
    riasec: { R: 0.2, I: 0.65, A: 0.45, S: 0.8, E: 0.45, C: 0.7 },
    bigFive: { O: 0.75, C: 0.75, E: 0.5, A: 0.8, N: 0.4 },
    answers: { dreamShift: "AI 도구 수업을 해보고 싶다.", fearPoint: "너무 기술적일까 걱정된다.", stuckPoint: "수업안을 모르겠다.", nonNegotiable: "어려운 말만 하는 수업은 싫다.", proofNeed: "첫 수강생 반응이 필요하다." },
  },
  {
    id: "PET_TREAT",
    name: "반려동물 수제간식",
    expectedTop1: "pet-treat-maker",
    dream: { title: "반려동물 수제간식 브랜드를 작게 시작하는 사람", description: "강아지 간식과 선물세트를 만들어 선주문으로 팔아보고 싶다.", whyThisMatters: "반려동물 돌봄과 만들기를 같이 하고 싶다.", visualNote: "강아지 간식, 포장, 선물박스", inspirationSlug: "storefront", modes: ["business", "maker", "care"], blockers: ["money"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "income", remotePreference: "mixed", physicalDemandLimit: "medium", experienceSummary: "베이킹을 오래 했고 반려견을 키운다." },
    riasec: { R: 0.65, I: 0.4, A: 0.55, S: 0.5, E: 0.7, C: 0.55 },
    bigFive: { O: 0.62, C: 0.7, E: 0.55, A: 0.65, N: 0.4 },
    answers: { dreamShift: "펫 간식을 팔아보고 싶다.", fearPoint: "위생과 원가가 걱정된다.", stuckPoint: "상품 구성을 모르겠다.", nonNegotiable: "대량 재고는 싫다.", proofNeed: "선주문 반응이 필요하다." },
  },
  {
    id: "SENIOR_TRAVEL",
    name: "시니어 느린 여행",
    expectedTop1: "senior-travel-host",
    dream: { title: "시니어를 위한 느린 여행 호스트", description: "중장년과 어르신이 무리 없이 다녀오는 여행 코스를 운영하고 싶다.", whyThisMatters: "사람을 챙기고 여행 동선을 짜는 일을 좋아한다.", visualNote: "느린 여행 일정표와 동행 안내", inspirationSlug: "storefront", modes: ["business", "guide", "community"], blockers: ["time"] },
    user: { weeklyTimeBudget: "6_plus", incomeUrgency: "within_3_months", primaryGoal: "meaning", remotePreference: "onsite", physicalDemandLimit: "medium", experienceSummary: "여행 모임을 오래 운영했고 어르신 안내 경험이 있다." },
    riasec: { R: 0.45, I: 0.5, A: 0.5, S: 0.85, E: 0.7, C: 0.65 },
    bigFive: { O: 0.65, C: 0.75, E: 0.75, A: 0.8, N: 0.35 },
    answers: { dreamShift: "시니어 여행을 만들고 싶다.", fearPoint: "안전이 걱정된다.", stuckPoint: "첫 코스가 막힌다.", nonNegotiable: "무리한 일정은 싫다.", proofNeed: "파일럿 신청이 필요하다." },
  },
  {
    id: "TAX_REMOTE",
    name: "세무 자료 정리",
    expectedTop1: "tax-prep-support-partner",
    dream: { title: "세무 자료와 장부를 정리해주는 파트너", description: "세금 신고 전 자료와 장부를 꼼꼼히 정리하고 싶다.", whyThisMatters: "자료 정리로 빠르게 수입을 만들고 싶다.", visualNote: "장부와 체크리스트", inspirationSlug: "classroom", modes: ["expert", "organize"], blockers: ["money"] },
    user: { weeklyTimeBudget: "1_2", incomeUrgency: "immediate", primaryGoal: "income", remotePreference: "remote", physicalDemandLimit: "low", experienceSummary: "회계팀 보조와 세무 자료 정리 경험이 있다." },
    riasec: { R: 0.2, I: 0.66, A: 0.3, S: 0.42, E: 0.34, C: 0.92 },
    bigFive: { O: 0.46, C: 0.9, E: 0.3, A: 0.58, N: 0.34 },
    answers: { dreamShift: "세무 준비를 돕고 싶다.", fearPoint: "실수가 걱정된다.", stuckPoint: "체크리스트가 없다.", nonNegotiable: "외근은 어렵다.", proofNeed: "유료 제안이 필요하다." },
  },
  {
    id: "PLANT_CARE",
    name: "식물 돌봄 서비스",
    expectedTop1: "plant-care-service-owner",
    dream: { title: "식물 돌봄과 분갈이 서비스를 운영하는 사람", description: "화분 관리와 플랜테리어를 도와주는 작은 서비스를 해보고 싶다.", whyThisMatters: "식물을 돌보고 공간을 바꾸는 일이 좋다.", visualNote: "화분, 분갈이, 식물 관리 카드", inspirationSlug: "storefront", modes: ["business", "care", "visual"], blockers: ["money"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "meaning", remotePreference: "onsite", physicalDemandLimit: "medium", experienceSummary: "식물 키우기와 매장 꾸미기를 오래 해왔다." },
    riasec: { R: 0.55, I: 0.45, A: 0.65, S: 0.55, E: 0.6, C: 0.55 },
    bigFive: { O: 0.7, C: 0.68, E: 0.55, A: 0.65, N: 0.35 },
    answers: { dreamShift: "식물 서비스를 하고 싶다.", fearPoint: "고객 식물을 망칠까 걱정된다.", stuckPoint: "메뉴판이 없다.", nonNegotiable: "무리한 시공은 싫다.", proofNeed: "첫 방문 케어 신청이 필요하다." },
  },
  {
    id: "GRIEF_JOURNALING",
    name: "상실 저널링",
    expectedTop1: "grief-journaling-guide",
    dream: { title: "상실을 겪은 사람을 위한 저널링 모임", description: "애도와 상실을 글로 정리하는 안전한 글쓰기 시간을 만들고 싶다.", whyThisMatters: "힘든 시간을 글로 버틴 경험을 나누고 싶다.", visualNote: "조용한 노트, 질문카드, 작은 모임", inspirationSlug: "classroom", modes: ["care", "write", "guide"], blockers: ["confidence"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "meaning", remotePreference: "hybrid", physicalDemandLimit: "low", experienceSummary: "글쓰기 모임과 상담적 대화에 관심이 많다." },
    riasec: { R: 0.2, I: 0.55, A: 0.75, S: 0.8, E: 0.4, C: 0.55 },
    bigFive: { O: 0.72, C: 0.7, E: 0.4, A: 0.85, N: 0.45 },
    answers: { dreamShift: "상실 저널링을 돕고 싶다.", fearPoint: "상처를 건드릴까 걱정된다.", stuckPoint: "비의료 범위가 필요하다.", nonNegotiable: "치료처럼 말하는 것은 싫다.", proofNeed: "안전한 체험 반응이 필요하다." },
  },
  {
    id: "PSYCHOLOGY_COUNSELING_BRIDGE",
    name: "심리상담 계열 안전 경로",
    expectedAnyTop3: ["grief-journaling-guide", "mindful-journaling-guide", "caregiver-support-group-host", "habit-reset-coach"],
    forbiddenTop3: ["small-cafe-concept-owner", "tax-prep-support-partner", "real-estate-coordinator"],
    dream: { title: "심리상담사처럼 사람의 마음을 돕는 사람", description: "치료라고 말하기보다 감정과 고민을 안전하게 정리하는 상담형 시간을 만들고 싶다.", whyThisMatters: "내가 힘들 때 질문과 기록이 도움이 됐고 다른 사람도 돕고 싶다.", visualNote: "상담 노트, 감정 카드, 조용한 대화", inspirationSlug: "classroom", modes: ["care", "guide", "write"], blockers: ["confidence"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "explore_first", primaryGoal: "meaning", remotePreference: "hybrid", physicalDemandLimit: "low", experienceSummary: "심리와 상담 콘텐츠를 오래 읽었고 주변 사람의 이야기를 잘 들어주는 편이다." },
    riasec: { R: 0.18, I: 0.62, A: 0.66, S: 0.86, E: 0.36, C: 0.58 },
    bigFive: { O: 0.74, C: 0.68, E: 0.38, A: 0.88, N: 0.5 },
    answers: { dreamShift: "심리상담과 마음 돌봄 쪽으로 가보고 싶다.", fearPoint: "전문가가 아닌데 해도 되는지 걱정된다.", stuckPoint: "안전한 범위가 필요하다.", nonNegotiable: "의료나 치료처럼 포장하는 것은 싫다.", proofNeed: "참여자가 안전하다고 느끼는지 확인하고 싶다." },
  },
  {
    id: "LECTURE_CLASS_BRIDGE",
    name: "강의 클래스 계열",
    expectedAnyTop3: ["small-class-creator", "ai-tools-tutor-for-adults", "smartphone-class-instructor", "craft-class-instructor", "education-program-planner", "reading-writing-tutor"],
    forbiddenTop3: ["pet-care-studio-owner", "real-estate-coordinator", "tax-prep-support-partner"],
    dream: { title: "내 경험으로 강의와 클래스를 여는 사람", description: "초보자에게 작은 수업과 실습형 클래스를 열어보고 싶다.", whyThisMatters: "알고 있는 것을 쉽게 설명하고 사람이 바뀌는 순간을 보는 게 좋다.", visualNote: "강의 자료, 작은 교실, 실습 체크리스트", inspirationSlug: "classroom", modes: ["teach", "expert", "community"], blockers: ["time"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "within_3_months", primaryGoal: "meaning", remotePreference: "hybrid", physicalDemandLimit: "low", experienceSummary: "사내 교육과 스터디 운영 경험이 있고 강의안을 만들어본 적이 있다." },
    riasec: { R: 0.22, I: 0.62, A: 0.5, S: 0.82, E: 0.58, C: 0.72 },
    bigFive: { O: 0.68, C: 0.78, E: 0.56, A: 0.78, N: 0.38 },
    answers: { dreamShift: "강의와 클래스를 해보고 싶다.", fearPoint: "수강생을 모을 수 있을지 걱정된다.", stuckPoint: "첫 커리큘럼을 못 잡겠다.", nonNegotiable: "이론만 많은 강의는 싫다.", proofNeed: "첫 수강생 피드백이 필요하다." },
  },
  {
    id: "GENERIC_SMALL_BUSINESS",
    name: "범용 작은 판매 실험",
    expectedAnyTop5: ["home-meal-preorder-seller", "local-market-organizer", "community-strategist", "select-shop-founder"],
    forbiddenTop3: ["pet-care-studio-owner", "pet-treat-maker", "paralegal-assistant"],
    dream: { title: "내 취향의 작은 판매 실험을 해보는 사람", description: "잡화나 클래스형으로 작게 팔아보며 반응을 보고 싶다.", whyThisMatters: "고객 응대 경험을 내 사업으로 연결하고 싶다.", visualNote: "작은 진열대와 예약 폼", inspirationSlug: "storefront", modes: ["business", "maker", "community"], blockers: ["money", "time"] },
    user: { weeklyTimeBudget: "3_5", incomeUrgency: "immediate", primaryGoal: "income", remotePreference: "mixed", physicalDemandLimit: "medium", experienceSummary: "고객 응대 경험이 많고 물건과 공간을 예쁘게 구성하는 일을 좋아한다." },
    riasec: { R: 0.6, I: 0.45, A: 0.7, S: 0.68, E: 0.78, C: 0.48 },
    bigFive: { O: 0.7, C: 0.68, E: 0.72, A: 0.68, N: 0.4 },
    answers: { dreamShift: "작은 판매 실험을 해보고 싶다.", fearPoint: "재고가 걱정된다.", stuckPoint: "상품을 못 정했다.", nonNegotiable: "무리한 재고는 싫다.", proofNeed: "첫 선주문이 필요하다." },
  },
  {
    id: "NEGATED_LEGAL_REMOTE",
    name: "법률 경험 없음 원격 실무",
    expectedAnyTop3: ["data-cleanup-assistant", "project-coordinator", "virtual-assistant"],
    forbiddenTop3: ["paralegal-assistant"],
    dream: { title: "원격으로 문서와 일정 정리를 돕는 사람", description: "전문 분야보다는 작은 사업자의 자료와 문의를 정리하고 싶다.", whyThisMatters: "집에서 빠르게 수입을 만들고 싶다.", visualNote: "업무 보드와 체크리스트", inspirationSlug: "classroom", modes: ["organize", "expert"], blockers: ["money", "time"] },
    user: { weeklyTimeBudget: "1_2", incomeUrgency: "immediate", primaryGoal: "income", remotePreference: "remote", physicalDemandLimit: "low", experienceSummary: "문서 정리와 고객 응대 경험은 있지만 법률 경험은 없다." },
    riasec: { R: 0.2, I: 0.58, A: 0.34, S: 0.48, E: 0.34, C: 0.88 },
    bigFive: { O: 0.48, C: 0.88, E: 0.26, A: 0.58, N: 0.42 },
    answers: { dreamShift: "원격 실무로 수입을 만들고 싶다.", fearPoint: "전문 분야 선택이 걱정된다.", stuckPoint: "업무 범위가 필요하다.", nonNegotiable: "외근은 어렵다.", proofNeed: "첫 파일럿이 필요하다." },
  },
];

const catalog = auditCatalog();
const scenarioResults = personas.map(auditScenario);
const failedChecks = [
  ...catalog.checks,
  ...scenarioResults.flatMap((scenario) => scenario.checks.map((check) => ({ ...check, scenario: scenario.id }))),
].filter((check) => !check.ok);

const report = {
  careerCount: CAREERS.length,
  categoryCounts: catalog.categoryCounts,
  keywordCareers: CAREERS.filter((career) => career.keywords?.length).length,
  scenarioResults,
  failedChecks,
};

console.log(JSON.stringify(report, null, 2));

if (failedChecks.length) {
  process.exitCode = 1;
}
