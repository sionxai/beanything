import {
  BLOCKER_OPTIONS,
  CAREERS,
  DEMO_PRESETS,
  DREAM_MODE_OPTIONS,
  INSPIRATION_CARDS,
  JOURNEY_BLUEPRINTS,
} from "./data/sample-data.js";
import { BIG_FIVE_QUESTIONS, LIKERT_CHOICES, RIASEC_QUESTIONS } from "./data/questions.js";
import { clearState, createInitialState, loadState, saveState } from "./lib/storage.js";
import {
  buildJourney,
  canAdvanceStage,
  composeCheckinFeedback,
  computeBigFiveResult,
  computeRiasecResult,
  createInsightHooks,
  generateRecommendations,
  getAgeBand,
  getCurrentStage,
  getNextStageKey,
  getStage,
  summarizeExploration,
  summarizeJourneyMetrics,
} from "./lib/engine.js";

const app = document.querySelector("#app");
const INSIGHT_HOOKS = createInsightHooks();
const SETUP_FLOW = [
  { key: "dream", title: "꿈의 방향", detail: "무엇이 되고 싶은지" },
  { key: "profile", title: "지금 상황", detail: "시간과 현실 조건" },
  { key: "interests", title: "끌리는 장면", detail: "무엇에 손이 가는지" },
  { key: "workstyle", title: "일하는 결", detail: "어떤 방식이 맞는지" },
  { key: "exploration", title: "막힌 지점", detail: "두려움과 현재 장벽" },
  { key: "recommendations", title: "경로 제안", detail: "당장 시작할 길" },
];
const EXPLORATION_QUESTIONS = [
  {
    id: "dreamShift",
    title: "그 꿈이 현실이 되면, 내 삶에서 어떤 장면이 달라질까요?",
    placeholder: "예: 회사 일이 끝나도 내 이름으로 만든 결과물이 남는 느낌을 갖고 싶어요.",
  },
  {
    id: "fearPoint",
    title: "솔직히 제일 무서운 건 무엇인가요?",
    placeholder: "예: 공개했는데 아무 반응이 없을까 봐, 돈이 너무 늦게 벌릴까 봐 무서워요.",
  },
  {
    id: "stuckPoint",
    title: "지금 가장 막힌 지점은 어디인가요?",
    placeholder: "예: 뭘 대표 결과물로 먼저 만들어야 할지 모르겠어요.",
  },
  {
    id: "nonNegotiable",
    title: "남들이 뭐라 해도 포기하고 싶지 않은 방식은 무엇인가요?",
    placeholder: "예: 감각 없이 찍어내는 방식은 싫고, 내가 만든 느낌은 꼭 남기고 싶어요.",
  },
  {
    id: "proofNeed",
    title: "한 달 안에 어떤 신호가 나오면 계속해볼 수 있을까요?",
    placeholder: "예: 인터뷰 반응이 좋거나, 작은 의뢰 제안이 한 번이라도 오면 계속해볼 수 있어요.",
  },
];
const ASSESSMENT_CONFIG = {
  interests: {
    title: "끌리는 장면",
    copy: "낯설어도 손이 가는 장면을 골라보세요. 정답은 없고, 지금의 감각을 잡는 용도입니다.",
    questions: RIASEC_QUESTIONS,
    pageSize: 6,
    answersKey: "interestAnswers",
    resultKey: "interestResult",
    pageKey: "interestPage",
  },
  workstyle: {
    title: "일하는 결",
    copy: "잘 버티는 방식보다 오래 가는 방식을 찾는 시간입니다. 일할 때의 결을 가볍게 확인해요.",
    questions: BIG_FIVE_QUESTIONS,
    pageSize: 5,
    answersKey: "styleAnswers",
    resultKey: "styleResult",
    pageKey: "stylePage",
  },
};
const ART_ASSETS = {
  hero: "./assets/generated/hero-background-v2.png",
  home: "./assets/generated/home-hero.png",
  creative: "./assets/generated/scene-creative.png",
  expert: "./assets/generated/scene-expert.png",
  business: "./assets/generated/scene-business.png",
  choiceSprite: "./assets/generated/choice-sprite-v1.png",
};
const ART_ROTATION = [ART_ASSETS.creative, ART_ASSETS.expert, ART_ASSETS.business, ART_ASSETS.home];
const CHOICE_VISUAL_BY_VALUE = {
  visual: { symbol: "시각", tone: "coral", scene: "gallery" },
  write: { symbol: "글", tone: "ink", scene: "pages" },
  teach: { symbol: "수업", tone: "sage", scene: "board" },
  guide: { symbol: "안내", tone: "teal", scene: "path" },
  maker: { symbol: "제작", tone: "clay", scene: "tools" },
  business: { symbol: "판매", tone: "sun", scene: "shop" },
  community: { symbol: "모임", tone: "green", scene: "people" },
  expert: { symbol: "전문", tone: "navy", scene: "chart" },
  organize: { symbol: "정리", tone: "slate", scene: "grid" },
  care: { symbol: "돌봄", tone: "mint", scene: "circle" },
  money: { symbol: "돈", tone: "sun", scene: "coins" },
  time: { symbol: "시간", tone: "slate", scene: "clock" },
  "skill-gap": { symbol: "기술", tone: "navy", scene: "stairs" },
  visibility: { symbol: "공개", tone: "coral", scene: "spotlight" },
  confidence: { symbol: "확신", tone: "mint", scene: "seed" },
  family: { symbol: "관계", tone: "green", scene: "people" },
  employee: { symbol: "회사", tone: "navy", scene: "desk" },
  self_employed: { symbol: "가게", tone: "sun", scene: "shop" },
  job_seeker: { symbol: "구직", tone: "slate", scene: "path" },
  retiring: { symbol: "전환", tone: "teal", scene: "bridge" },
  retired: { symbol: "새길", tone: "green", scene: "field" },
  career_break: { symbol: "재시작", tone: "mint", scene: "seed" },
  elementary_student: { symbol: "초등", tone: "sun", scene: "school" },
  middle_school_student: { symbol: "중등", tone: "green", scene: "school" },
  high_school_student: { symbol: "고등", tone: "navy", scene: "school" },
  university_student: { symbol: "대학", tone: "teal", scene: "campus" },
  "1_2": { symbol: "짧게", tone: "mint", scene: "clock" },
  "3_5": { symbol: "꾸준", tone: "teal", scene: "calendar" },
  "6_plus": { symbol: "깊게", tone: "coral", scene: "stairs" },
  immediate: { symbol: "바로", tone: "sun", scene: "coins" },
  within_3_months: { symbol: "3개월", tone: "teal", scene: "calendar" },
  explore_first: { symbol: "탐색", tone: "green", scene: "path" },
  income: { symbol: "수입", tone: "sun", scene: "coins" },
  meaning: { symbol: "의미", tone: "green", scene: "field" },
  flexibility: { symbol: "유연", tone: "mint", scene: "wave" },
  social_contribution: { symbol: "기여", tone: "green", scene: "people" },
  learning: { symbol: "배움", tone: "sage", scene: "board" },
  high: { symbol: "많이", tone: "coral", scene: "signal" },
  medium: { symbol: "보통", tone: "teal", scene: "signal" },
  low: { symbol: "적게", tone: "mint", scene: "signal" },
  onsite: { symbol: "현장", tone: "clay", scene: "pin" },
  hybrid: { symbol: "혼합", tone: "teal", scene: "bridge" },
  remote: { symbol: "원격", tone: "navy", scene: "screen" },
  any: { symbol: "열림", tone: "green", scene: "field" },
  unknown: { symbol: "미정", tone: "slate", scene: "dots" },
  done: { symbol: "완료", tone: "green", scene: "check" },
  partial: { symbol: "일부", tone: "sun", scene: "half" },
  skipped: { symbol: "넘김", tone: "slate", scene: "pause" },
  continue: { symbol: "계속", tone: "green", scene: "path" },
  pause: { symbol: "보류", tone: "slate", scene: "pause" },
  pivot: { symbol: "전환", tone: "coral", scene: "bridge" },
  on: { symbol: "켜기", tone: "green", scene: "signal" },
  off: { symbol: "끄기", tone: "slate", scene: "pause" },
};
const CHOICE_VISUAL_BY_GROUP = {
  currentStatus: { symbol: "현재", tone: "slate", scene: "desk" },
  weeklyTimeBudget: { symbol: "시간", tone: "teal", scene: "clock" },
  incomeUrgency: { symbol: "수입", tone: "sun", scene: "coins" },
  primaryGoal: { symbol: "목표", tone: "green", scene: "path" },
  peoplePreference: { symbol: "사람", tone: "green", scene: "people" },
  remotePreference: { symbol: "방식", tone: "navy", scene: "screen" },
  physicalDemandLimit: { symbol: "체력", tone: "mint", scene: "signal" },
  completionStatus: { symbol: "진행", tone: "green", scene: "check" },
  decision: { symbol: "결정", tone: "coral", scene: "path" },
  remindersEnabled: { symbol: "알림", tone: "sun", scene: "signal" },
};
const INSPIRATION_VISUAL_BY_SLUG = {
  studio: { symbol: "작업실", tone: "coral", scene: "gallery" },
  classroom: { symbol: "수업", tone: "sage", scene: "board" },
  storefront: { symbol: "가게", tone: "sun", scene: "shop" },
  community: { symbol: "모임", tone: "green", scene: "people" },
  expert: { symbol: "전문", tone: "navy", scene: "chart" },
  care: { symbol: "돌봄", tone: "mint", scene: "circle" },
};
const RATING_CONFIG = {
  confidenceScore: {
    low: "흔들림",
    high: "확신",
    labels: ["막막", "불안", "보통", "가능", "확신"],
  },
  interestScore: {
    low: "식음",
    high: "끌림",
    labels: ["식음", "약함", "보통", "끌림", "강함"],
  },
};
const CHOICE_TILE_BY_VALUE = {
  visual: [0, 0],
  write: [1, 0],
  teach: [2, 0],
  guide: [3, 0],
  maker: [0, 1],
  business: [1, 1],
  community: [2, 1],
  expert: [3, 1],
  organize: [3, 1],
  care: [0, 2],
  money: [1, 2],
  time: [2, 2],
  "skill-gap": [3, 1],
  visibility: [3, 2],
  confidence: [0, 3],
  family: [1, 3],
  employee: [3, 1],
  self_employed: [1, 1],
  job_seeker: [0, 3],
  retiring: [2, 2],
  retired: [1, 3],
  career_break: [0, 3],
  elementary_student: [2, 0],
  middle_school_student: [2, 1],
  high_school_student: [3, 1],
  university_student: [3, 3],
  "1_2": [2, 2],
  "3_5": [3, 1],
  "6_plus": [0, 0],
  immediate: [1, 2],
  within_3_months: [3, 1],
  explore_first: [0, 3],
  income: [1, 2],
  meaning: [1, 0],
  flexibility: [2, 3],
  social_contribution: [2, 1],
  learning: [2, 0],
  high: [2, 1],
  medium: [3, 1],
  low: [2, 3],
  onsite: [3, 3],
  hybrid: [3, 1],
  remote: [2, 3],
  any: [0, 3],
  unknown: [0, 3],
  done: [1, 1],
  partial: [3, 1],
  skipped: [2, 2],
  continue: [1, 2],
  pause: [0, 2],
  pivot: [0, 3],
  on: [2, 2],
  off: [0, 2],
};
const CHOICE_TILE_BY_GROUP = {
  currentStatus: [0, 3],
  weeklyTimeBudget: [2, 2],
  incomeUrgency: [1, 2],
  primaryGoal: [0, 0],
  peoplePreference: [2, 1],
  remotePreference: [2, 3],
  physicalDemandLimit: [3, 3],
  completionStatus: [1, 1],
  decision: [0, 3],
  remindersEnabled: [2, 2],
};
const SCALE_ART_BY_VALUE = {
  1: [0, 3],
  2: [2, 2],
  3: [3, 1],
  4: [0, 0],
  5: [1, 1],
};
const STAGE_ART_BY_KEY = {
  seven: [0, 3],
  thirty: [3, 1],
  ninety: [3, 2],
  revenue: [1, 2],
};
const PAINFIT_DOMAINS = {
  physical: { label: "신체", color: "#8b3a2f" },
  cognitive: { label: "인지", color: "#2c5f5d" },
  repetitive: { label: "반복", color: "#6b4423" },
  social: { label: "사회", color: "#a8541e" },
  emotional: { label: "정서", color: "#5c3a6e" },
  detail: { label: "디테일", color: "#3d5a3d" },
  uncertainty: { label: "불확실성", color: "#7a4e2d" },
};
const PAINFIT_DOMAIN_KEYS = Object.keys(PAINFIT_DOMAINS);
const PAINFIT_UNKNOWN_VALUE = "unknown";
const PAINFIT_NEUTRAL_SCORE = 1.5;
const PAINFIT_OPTIONS = [
  { value: "0", label: "거의 영향이 없다" },
  { value: "1", label: "피곤하지만 하루 안에 회복된다" },
  { value: "2", label: "다음 날까지 잔상이 남는다" },
  { value: "3", label: "며칠 이상 회복이 느리거나 회피하게 된다" },
  { value: PAINFIT_UNKNOWN_VALUE, label: "잘 모르겠다", detail: "경험이나 기억이 없어서 판단하기 어렵다" },
];
const PAINFIT_QUESTIONS = [
  { id: "p1", domain: "physical", text: "8시간 서 있는 일을 일주일 내내 했을 때 다음 주에 미치는 영향은?" },
  { id: "p2", domain: "physical", text: "하루 종일 책상에 앉아 있는 일을 며칠 반복했을 때 신체 회복은?" },
  { id: "p3", domain: "physical", text: "밤샘이나 불규칙한 수면 일정이 며칠 이어졌을 때 다음 회복 속도는?" },
  { id: "p4", domain: "physical", text: "소음, 냄새, 온도 변화가 큰 환경에서 작업한 후 회복은?" },
  { id: "c1", domain: "cognitive", text: "3시간 자료조사를 한 후 다음 날 같은 작업을 다시 시작할 때 회복은?" },
  { id: "c2", domain: "cognitive", text: "20페이지 보고서를 처음부터 끝까지 읽는 일을 한 후 다음 날 회복은?" },
  { id: "c3", domain: "cognitive", text: "정답 없는 모호한 문제를 며칠 붙잡고 있을 때 다음 회복은?" },
  { id: "c4", domain: "cognitive", text: "복잡한 시스템, 구조, 관계도를 이해하느라 종일 매달린 후 회복은?" },
  { id: "r1", domain: "repetitive", text: "같은 작업을 매일 반복하는 일을 한 달 했을 때 영향은?" },
  { id: "r2", domain: "repetitive", text: "체크리스트대로 정해진 절차만 따르는 일을 일주일 했을 때 영향은?" },
  { id: "r3", domain: "repetitive", text: "같은 문서를 5번 반복 검토하고 난 후 회복은?" },
  { id: "r4", domain: "repetitive", text: "예측 가능한 루틴이 매일 반복되는 환경의 영향은?" },
  { id: "s1", domain: "social", text: "하루에 낯선 사람 20명을 만난 다음 날 회복은?" },
  { id: "s2", domain: "social", text: "고객 5명에게 거절당한 날의 회복은?" },
  { id: "s3", domain: "social", text: "화가 난 사람을 응대해야 했던 날 다음 날 회복은?" },
  { id: "s4", domain: "social", text: "낯선 사람을 설득해야 하는 일이 며칠 이어졌을 때 회복은?" },
  { id: "e1", domain: "emotional", text: "내 결과물이 공개적으로 비판받은 후 다음 회복은?" },
  { id: "e2", domain: "emotional", text: "강한 마감 압박이 며칠 이어졌을 때 회복은?" },
  { id: "e3", domain: "emotional", text: "큰 책임을 혼자 져야 하는 상황에서 다음 회복은?" },
  { id: "e4", domain: "emotional", text: "결과물이 폐기되거나 무시받은 후 회복은?" },
  { id: "d1", domain: "detail", text: "숫자 한 자리 틀려서 처음부터 다시 검토해야 할 때 회복은?" },
  { id: "d2", domain: "detail", text: "문서 오타, 오류를 종일 잡아낸 후 회복은?" },
  { id: "d3", domain: "detail", text: "정확성이 100% 요구되는 작업을 매일 반복했을 때 회복은?" },
  { id: "d4", domain: "detail", text: "아주 작은 차이를 종일 구분해야 하는 일의 다음 날 회복은?" },
  { id: "u1", domain: "uncertainty", text: "월급이 매달 다르게 들어오는 상황이 몇 달 이어졌을 때 영향은?" },
  { id: "u2", domain: "uncertainty", text: "오늘 할 일을 스스로 정해야 하는 환경에서 회복은?" },
  { id: "u3", domain: "uncertainty", text: "실패할 가능성이 높은 일에 1년을 투자할 때 정서적 회복은?" },
  { id: "u4", domain: "uncertainty", text: "갑작스러운 변화가 자주 생기는 환경에서 회복은?" },
];
const PAINFIT_JOBS = [
  {
    name: "데이터 분석가",
    requires: ["cognitive", "detail", "repetitive"],
    lowDemand: ["social", "physical"],
    desc: "오래 앉아 숫자와 패턴을 다루는 일",
    experiment: "공개 데이터셋 하나를 받아 2시간 동안 표를 정리하고, 이상치 5개를 찾아 메모해보세요.",
  },
  {
    name: "회계, 세무사",
    requires: ["detail", "repetitive"],
    lowDemand: ["uncertainty", "social"],
    desc: "정확성과 절차 준수가 핵심인 일",
    experiment: "가계부를 2시간 동안 분류하고 카드 내역과 영수증의 차이를 찾아보세요.",
  },
  {
    name: "리서처, 연구원",
    requires: ["cognitive", "uncertainty"],
    lowDemand: ["social", "physical"],
    desc: "답이 없는 문제를 오래 붙잡는 일",
    experiment: "관심 주제의 보고서 3편을 읽고 핵심 가설과 한계를 2시간 안에 정리해보세요.",
  },
  {
    name: "편집자, 교정자",
    requires: ["cognitive", "detail", "repetitive"],
    lowDemand: ["social", "uncertainty"],
    desc: "긴 글을 반복해서 다듬는 일",
    experiment: "5페이지 글을 2시간 동안 3회 반복 검토하며 표현과 구조를 다듬어보세요.",
  },
  {
    name: "UX 리서처",
    requires: ["cognitive", "social", "uncertainty"],
    lowDemand: ["physical", "repetitive"],
    desc: "사람의 모호한 말을 구조화하는 일",
    experiment: "주변 사람 2명을 짧게 인터뷰하고, 앱 사용 이유의 공통 패턴을 정리해보세요.",
  },
  {
    name: "개발자, 엔지니어",
    requires: ["cognitive", "detail", "uncertainty"],
    lowDemand: ["social", "physical"],
    desc: "복잡한 시스템을 쌓아 올리는 일",
    experiment: "간단한 코딩 튜토리얼을 2시간 따라 하며 오류가 났을 때 디버깅 과정을 관찰하세요.",
  },
  {
    name: "콘텐츠 기획, 에디터",
    requires: ["cognitive", "emotional"],
    lowDemand: ["repetitive", "physical"],
    desc: "자료를 모아 새 형태로 빚는 일",
    experiment: "관심 주제로 짧은 글이나 카드뉴스 초안을 만들고 피드백을 받아 수정해보세요.",
  },
  {
    name: "영업, 세일즈",
    requires: ["social", "emotional", "uncertainty"],
    lowDemand: ["repetitive", "detail"],
    desc: "거절을 매일 받아내는 일",
    experiment: "낯선 사람 5명에게 정중한 제안 메시지를 보내고, 거절 후 다시 보낼 수 있는지 보세요.",
  },
  {
    name: "상담사, 코치",
    requires: ["social", "emotional"],
    lowDemand: ["detail", "physical"],
    desc: "타인의 감정을 오래 받아내는 일",
    experiment: "친구 2명의 고민을 각 1시간씩 들어주고 끝난 뒤 감정 에너지와 잔상을 관찰하세요.",
  },
  {
    name: "교사, 강사",
    requires: ["social", "physical", "repetitive"],
    lowDemand: ["uncertainty"],
    desc: "같은 내용을 다른 사람에게 반복 전달하는 일",
    experiment: "익숙한 주제로 30분 강의안을 만들고 2명에게 각각 설명해보세요.",
  },
  {
    name: "간호사, 의료직",
    requires: ["physical", "social", "emotional", "detail"],
    lowDemand: ["uncertainty"],
    desc: "몸과 감정과 정확성을 동시에 쓰는 일",
    experiment: "의료 현장 시뮬레이션 영상을 보며 절차를 메모하고 다중 부담의 피로를 관찰하세요.",
  },
  {
    name: "PM, 기획자",
    requires: ["cognitive", "social", "emotional", "uncertainty"],
    lowDemand: ["detail"],
    desc: "모호한 요구를 정리해 사람들을 움직이는 일",
    experiment: "작은 모임의 일정, 역할, 예산을 정리해 3명에게 공유하고 조율 피로를 확인하세요.",
  },
  {
    name: "디자이너",
    requires: ["cognitive", "emotional", "detail"],
    lowDemand: ["repetitive"],
    desc: "비판을 받아 다시 만드는 일",
    experiment: "포스터나 로고 시안 3개를 만들고 피드백을 받아 1개를 수정해보세요.",
  },
  {
    name: "창업가, 프리랜서",
    requires: ["uncertainty", "emotional", "social"],
    lowDemand: ["repetitive"],
    desc: "아무도 시키지 않는 일을 스스로 만드는 일",
    experiment: "내가 1만원에 팔 수 있는 것을 정의하고 실제 한 명에게 제안해보세요.",
  },
  {
    name: "공무원, 행정직",
    requires: ["repetitive", "detail", "social"],
    lowDemand: ["uncertainty", "emotional"],
    desc: "정해진 절차로 민원을 처리하는 일",
    experiment: "관공서 민원 절차 하나를 매뉴얼처럼 정리하며 양식과 반복이 안정적인지 보세요.",
  },
  {
    name: "물류, 현장관리",
    requires: ["physical", "repetitive", "social"],
    lowDemand: ["cognitive"],
    desc: "몸을 쓰며 흐름을 관리하는 일",
    experiment: "행사 운영이나 매장 보조 같은 현장 일을 2시간 해보고 다음 날 회복을 확인하세요.",
  },
];

let state = loadState();
let toastMessage = "";
let toastTimer = null;
let loadingTimer = null;
const PAINFIT_STORAGE_KEY = "beanything-painfit-state-v1";
const createPainFitState = () => ({
  step: "intro",
  mode: null,
  answers: {},
  currentQ: 0,
  feedback: { rating: 0, hit: "", miss: "", submitted: false },
});

function loadPainFitState() {
  try {
    const raw = window.localStorage.getItem(PAINFIT_STORAGE_KEY);
    if (!raw) return createPainFitState();
    const parsed = JSON.parse(raw);
    const initial = createPainFitState();
    return {
      ...initial,
      ...parsed,
      answers: { ...initial.answers, ...(parsed.answers || {}) },
      feedback: { ...initial.feedback, ...(parsed.feedback || {}) },
    };
  } catch (error) {
    console.error("Failed to load painfit state", error);
    return createPainFitState();
  }
}

function savePainFitState() {
  try {
    window.localStorage.setItem(PAINFIT_STORAGE_KEY, JSON.stringify(painFitState));
  } catch (error) {
    console.error("Failed to save painfit state", error);
  }
}

let painFitState = loadPainFitState();

function persist() {
  state = saveState(state);
}

function setToast(message) {
  toastMessage = message;
  if (toastTimer) clearTimeout(toastTimer);
  render();
  toastTimer = setTimeout(() => {
    toastMessage = "";
    render();
  }, 2200);
}

function updateState(updater, options = { silent: false }) {
  const next = typeof updater === "function" ? updater(state) : updater;
  state = next;
  persist();
  render();
  if (!options.silent) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function formatSaveLabel(iso) {
  if (!iso) return "임시 저장 준비";
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} 저장됨`;
}

function getSetupIndex(view) {
  return SETUP_FLOW.findIndex((step) => step.key === view);
}

function isSetupView(view) {
  return getSetupIndex(view) !== -1;
}

function hasFilledExplorationAnswers(current) {
  return Object.values(current.exploration.answers || {}).every((value) => String(value || "").trim());
}

function getUnlockedSetupIndex(current = state) {
  if (current.assessments.styleResult) return 4;
  if (current.assessments.interestResult) return 3;

  const hasProfile =
    current.user.birthYear &&
    current.user.currentStatus &&
    current.user.weeklyTimeBudget &&
    current.user.incomeUrgency;
  if (hasProfile) return 2;

  const hasDream =
    current.dream.title &&
    current.dream.description &&
    Array.isArray(current.dream.modes) &&
    current.dream.modes.length > 0;
  if (hasDream) return 1;

  return 0;
}

function getResumeDestination(current = state) {
  if (current.activeJourney) {
    const currentStage = getCurrentStage(current.activeJourney);
    const metrics = summarizeJourneyMetrics(current.activeJourney);
    return {
      view: "dashboard",
      label: "실행 이어하기",
      title: current.activeJourney.careerName,
      detail: `${currentStage?.label || "진행 중"} · ${metrics.doneTasks}/${metrics.totalTasks}개 완료`,
      cta: "지금 경로 열기",
    };
  }

  if (current.recommendations.length) {
    return {
      view: "recommendations",
      label: "추천 다시 보기",
      title: current.dream.title || "추천 결과",
      detail: `${current.recommendations.length}개 후보를 다시 비교할 수 있어요.`,
      cta: "추천 보기",
    };
  }

  if (hasFilledExplorationAnswers(current)) {
    return {
      view: "exploration",
      label: "탐색 마무리",
      title: "막힌 지점 정리 중",
      detail: "탐색 답변을 확인하고 추천으로 넘어가면 됩니다.",
      cta: "탐색으로 돌아가기",
    };
  }

  if (current.assessments.styleResult) {
    return {
      view: "exploration",
      label: "다음 단계",
      title: "마지막 질문 남음",
      detail: "막힌 지점만 적으면 추천을 바로 볼 수 있어요.",
      cta: "탐색 이어서",
    };
  }

  if (current.assessments.interestResult) {
    return {
      view: "workstyle",
      label: "다음 단계",
      title: "일하는 결 이어서",
      detail: "남은 문항을 마치면 더 현실적인 추천이 나옵니다.",
      cta: "검사 이어서",
    };
  }

  const hasProfile =
    current.user.birthYear &&
    current.user.currentStatus &&
    current.user.weeklyTimeBudget &&
    current.user.incomeUrgency;
  if (hasProfile) {
    return {
      view: "interests",
      label: "다음 단계",
      title: "끌리는 장면부터 보기",
      detail: "지금 조건은 저장돼 있어요. 다음 단계로 넘어가면 됩니다.",
      cta: "이어하기",
    };
  }

  if (current.dream.title || current.dream.description) {
    return {
      view: "profile",
      label: "다음 단계",
      title: "현재 상황 입력하기",
      detail: "꿈 메모는 저장돼 있어요. 현실 조건만 붙이면 됩니다.",
      cta: "이어서 작성",
    };
  }

  return null;
}

function getTopNavItems(current = state) {
  const items = [
    { type: "view", view: "welcome", label: "홈" },
    { type: "view", view: getResumeDestination(current)?.view || "dream", label: getResumeDestination(current) ? "이어하기" : "시작하기" },
    { type: "view", view: "painfit", label: "견디는 결" },
    { type: "home-section", sectionId: "home-demo", label: "예시 보기" },
  ];
  const resume = getResumeDestination(current);
  const canOpenSettings =
    Boolean(current.activeJourney) ||
    current.recommendations.length > 0 ||
    Boolean(current.user.displayName) ||
    Boolean(current.settings.remindersEnabled);

  if (current.recommendations.length) {
    items.push({ type: "view", view: "recommendations", label: "추천" });
  }
  if (current.activeJourney) {
    items.push({ type: "view", view: "dashboard", label: "실행" });
  }
  if (canOpenSettings) {
    items.push({ type: "view", view: "settings", label: "설정" });
  }

  return items.filter((item, index, array) => {
    const key = item.type === "view" ? `${item.type}:${item.view}` : `${item.type}:${item.sectionId}`;
    return (
      array.findIndex((candidate) => {
        const candidateKey =
          candidate.type === "view" ? `${candidate.type}:${candidate.view}` : `${candidate.type}:${candidate.sectionId}`;
        return candidateKey === key;
      }) === index
    );
  });
}

function getSelectedRecommendation() {
  return state.recommendations.find((item) => item.slug === state.selectedCareerSlug) || state.recommendations[0] || null;
}

function getRecommendationForJourney(journey) {
  if (!journey?.careerSlug) return null;
  const existing = state.recommendations.find((item) => item.slug === journey.careerSlug);
  if (existing) return existing;

  const career = CAREERS.find((item) => item.slug === journey.careerSlug);
  if (!career) return null;

  const summary =
    state.exploration.summary ||
    summarizeExploration({
      dream: state.dream,
      profile: state.user,
      answers: state.exploration.answers,
      hooks: INSIGHT_HOOKS,
    });

  return generateRecommendations({
    dream: state.dream,
    profile: state.user,
    riasecResult: state.assessments.interestResult,
    bigFiveResult: state.assessments.styleResult,
    summary,
    careers: [career],
    hooks: INSIGHT_HOOKS,
  })[0] || null;
}

function getLatestCheckinForRecommendation(recommendation) {
  if (!recommendation || state.activeJourney?.careerSlug !== recommendation.slug) return null;
  return [...(state.activeJourney.checkins || [])]
    .filter((item) => item.stageKey)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0] || null;
}

function getCompletionStatusLabel(status) {
  const labels = {
    done: "끝냈다",
    partial: "조금 했다",
    skipped: "못 했다",
  };
  return labels[status] || "미입력";
}

function getCheckinSignal(checkin) {
  if (!checkin) return null;

  const confidence = Number(checkin.confidenceScore || 0);
  const interest = Number(checkin.interestScore || 0);
  if (!confidence && !interest && !checkin.completionStatus) return null;

  const ratedValues = [confidence, interest].filter((value) => value > 0);
  const statusOnlyScore = checkin.completionStatus === "skipped" ? 30 : checkin.completionStatus === "partial" ? 55 : 80;
  const responseScore = ratedValues.length
    ? Math.round((ratedValues.reduce((sum, value) => sum + value, 0) / ratedValues.length / 5) * 100)
    : statusOnlyScore;
  const statusCap = checkin.completionStatus === "skipped" ? 45 : checkin.completionStatus === "partial" ? 68 : 100;
  const lowSignalCap = ratedValues.length && ratedValues.every((value) => value <= 2) ? 52 : 100;
  const score = Math.max(0, Math.min(responseScore, statusCap, lowSignalCap));

  return {
    score,
    confidence,
    interest,
    status: checkin.completionStatus,
    isLow: score < 50,
    isMixed: score >= 50 && score < 70,
    evidence: `오늘 체크인: ${getCompletionStatusLabel(checkin.completionStatus)} · 확신 ${confidence || "미입력"} / 5 · 흥미 ${interest || "미입력"} / 5`,
  };
}

function parseMultiValue(raw) {
  return String(raw || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPainFitNumericAnswer(value) {
  if (value === undefined || value === null || value === PAINFIT_UNKNOWN_VALUE) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getPainFitStats(answers = painFitState.answers) {
  const domainKnownCounts = Object.fromEntries(PAINFIT_DOMAIN_KEYS.map((domain) => [domain, 0]));
  let answeredCount = 0;
  let knownCount = 0;
  let unknownCount = 0;

  PAINFIT_QUESTIONS.forEach((question) => {
    if (answers[question.id] === undefined) return;
    answeredCount += 1;

    const numeric = getPainFitNumericAnswer(answers[question.id]);
    if (numeric === null) {
      unknownCount += 1;
      return;
    }

    knownCount += 1;
    domainKnownCounts[question.domain] += 1;
  });

  const coveredDomains = Object.values(domainKnownCounts).filter((count) => count > 0).length;
  const reliability = Math.round(
    clamp(((knownCount / PAINFIT_QUESTIONS.length) * 0.72 + (coveredDomains / PAINFIT_DOMAIN_KEYS.length) * 0.28) * 100, 0, 100)
  );
  const label = reliability >= 85 ? "높음" : reliability >= 65 ? "보통" : reliability >= 45 ? "낮음" : "매우 낮음";
  const note =
    reliability >= 85
      ? "대부분의 영역에 답변 근거가 있어 결과를 비교적 강하게 참고할 수 있습니다."
      : reliability >= 65
        ? "일부 문항은 경험 근거가 부족합니다. 추천은 방향성으로 보고 2시간 실험으로 확인하세요."
        : reliability >= 45
          ? "잘 모르겠다는 답이 많아 결과가 가설에 가깝습니다. 직업명보다 검증 실험을 우선하세요."
          : "아직 판단 근거가 적습니다. 결과는 추천보다 질문 목록에 가깝게 보고, 작은 경험을 만든 뒤 다시 해보는 편이 낫습니다.";

  return {
    answeredCount,
    knownCount,
    unknownCount,
    coveredDomains,
    domainKnownCounts,
    reliability,
    label,
    note,
  };
}

function getPainFitScores(answers = painFitState.answers) {
  const buckets = Object.fromEntries(PAINFIT_DOMAIN_KEYS.map((domain) => [domain, { sum: 0, count: 0 }]));

  PAINFIT_QUESTIONS.forEach((question) => {
    if (answers[question.id] === undefined) return;
    const numeric = getPainFitNumericAnswer(answers[question.id]);
    if (numeric === null) return;
    buckets[question.domain].sum += numeric;
    buckets[question.domain].count += 1;
  });

  return Object.fromEntries(
    PAINFIT_DOMAIN_KEYS.map((domain) => {
      const bucket = buckets[domain];
      return [domain, bucket.count ? bucket.sum / bucket.count : PAINFIT_NEUTRAL_SCORE];
    })
  );
}

function getPainFitMatches(scores, answers = painFitState.answers) {
  if (Object.keys(answers).length < PAINFIT_QUESTIONS.length) return { fit: [], avoid: [] };

  const tolerable = PAINFIT_DOMAIN_KEYS.filter((domain) => scores[domain] < 1.3);
  const intolerable = PAINFIT_DOMAIN_KEYS.filter((domain) => scores[domain] > 1.8);
  const scored = PAINFIT_JOBS.map((job) => {
    const requiredFit = job.requires.filter((domain) => tolerable.includes(domain)).length;
    const requiredRisk = job.requires.filter((domain) => intolerable.includes(domain)).length;
    const relief = job.lowDemand.filter((domain) => intolerable.includes(domain)).length;
    const total = requiredFit * 2 + relief * 1.5 - requiredRisk * 3;
    const maxScore = job.requires.length * 2 + job.lowDemand.length * 1.5;
    const minScore = job.requires.length * -3;
    const matchScore = Math.round(clamp(((total - minScore) / (maxScore - minScore)) * 100, 0, 100));

    return {
      ...job,
      requiredFit,
      requiredRisk,
      relief,
      total,
      matchScore,
    };
  });

  return {
    fit: [...scored].sort((left, right) => right.total - left.total || right.matchScore - left.matchScore).slice(0, 4),
    avoid: [...scored].sort((left, right) => left.total - right.total || left.matchScore - right.matchScore).slice(0, 3),
  };
}

function getPainFitCopy(mode) {
  if (mode === "transition") {
    return {
      badge: "전환기",
      headline: "전환 가능성이 높은 결",
      sub: "지금 직무에서 당신을 닳게 한 고통이 적은 일들입니다. 다음 일을 볼 때 이 결의 비중을 먼저 확인하세요.",
      avoidLabel: "소진을 반복할 가능성이 높은 결",
      avoidSub: "겉으로는 가능해 보여도 회복 비용이 클 수 있습니다. 다음 직장에서도 같은 패턴을 반복할 위험이 있습니다.",
    };
  }

  return {
    badge: "탐색기",
    headline: "실험해볼 만한 결",
    sub: "바로 직업을 고르기보다, 작은 실험부터 시작하세요. 견디는 결을 직접 확인하면 진로가 좁혀집니다.",
    avoidLabel: "첫 경험으로는 위험한 결",
    avoidSub: "첫 시도가 너무 무거우면 진로 자체에 대한 인상이 나빠질 수 있습니다. 회복 자원이 있을 때만 시도하세요.",
  };
}

function getPainFitDomainLabel(domain) {
  return PAINFIT_DOMAINS[domain]?.label || domain;
}

function renderPainFitDomainTags(domains, className = "") {
  if (!domains.length) return `<span class="painfit-muted">뚜렷한 영역 없음</span>`;
  return domains
    .map((domain) => `<span class="painfit-domain-chip ${className}" style="--domain-color: ${PAINFIT_DOMAINS[domain].color};">${getPainFitDomainLabel(domain)}</span>`)
    .join("");
}

function hashText(value) {
  return String(value || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getSpritePosition(tile) {
  const [col, row] = tile;
  return `${(col / 3) * 100}% ${(row / 3) * 100}%`;
}

function getSpriteArt(tile) {
  const [col, row] = tile;
  return {
    image: ART_ASSETS.choiceSprite,
    position: getSpritePosition(tile),
    size: "400% auto",
    shiftX: `${col * -25}%`,
    shiftY: `${row * -25}%`,
  };
}

function getChoiceArt(name, value) {
  const hash = hashText(`${name}:${value}`);
  const tile =
    CHOICE_TILE_BY_VALUE[value] ||
    CHOICE_TILE_BY_GROUP[name] ||
    [hash % 4, Math.floor(hash / 4) % 4];
  return getSpriteArt(tile);
}

function getChoiceVisual(name, value) {
  return (
    CHOICE_VISUAL_BY_VALUE[value] ||
    CHOICE_VISUAL_BY_GROUP[name] ||
    { symbol: String(value || "?").slice(0, 4), tone: "slate", scene: "dots" }
  );
}

function renderVisualScene(visual, className = "choice-art") {
  return `
    <span class="${className} visual-scene tone-${visual.tone}" data-scene="${visual.scene}" aria-hidden="true">
      <span class="visual-mark">${visual.symbol}</span>
      <span class="visual-shape visual-shape-one"></span>
      <span class="visual-shape visual-shape-two"></span>
      <span class="visual-shape visual-shape-three"></span>
    </span>
  `;
}

function renderInspirationScene(card) {
  const visual = INSPIRATION_VISUAL_BY_SLUG[card.slug] || { symbol: card.label, tone: "green", scene: "field" };

  return `
    <span class="inspiration-art" aria-hidden="true">
      <img src="${card.image}" alt="" loading="lazy" />
      <span class="visual-mark">${visual.symbol}</span>
    </span>
  `;
}

function renderChoiceThumbnail(name, value) {
  const art = getChoiceArt(name, value);
  const visual = getChoiceVisual(name, value);

  return `
    <span class="choice-art image-thumb" aria-hidden="true">
      <img src="${art.image}" alt="" style="--sprite-x: ${art.shiftX}; --sprite-y: ${art.shiftY};" />
      <span class="visual-mark">${visual.symbol}</span>
    </span>
  `;
}

function getRecommendationArt(item) {
  if (!item) return ART_ASSETS.hero;
  if (["창작", "글·미디어", "디지털 프리랜스"].includes(item.category)) return ART_ASSETS.creative;
  if (["작은 사업", "핸드메이드·메이커"].includes(item.category)) return ART_ASSETS.business;
  if (["가르침·코칭", "컨설팅·서비스", "커뮤니티·공공", "웰니스·라이프", "전문 경로"].includes(item.category)) {
    return ART_ASSETS.expert;
  }
  return ART_ROTATION[hashText(item.slug) % ART_ROTATION.length];
}

function renderChoiceButton({ choice, name, selected, action, variant = "default" }) {
  return `
    <button
      type="button"
      class="choice-card image-choice ${variant} ${selected ? "is-selected" : ""}"
      data-action="${action}"
      data-name="${name}"
      data-value="${choice.value}"
    >
      ${renderChoiceThumbnail(name, choice.value)}
      <span class="choice-art-check-wrap" aria-hidden="true">
        <span class="choice-check">✓</span>
      </span>
      <span class="choice-copy">
        <strong>${choice.label}</strong>
        ${choice.description ? `<span>${choice.description}</span>` : ""}
      </span>
    </button>
  `;
}

function resetAll() {
  clearState();
  state = createInitialState();
  painFitState = createPainFitState();
  savePainFitState();
  persist();
  render();
}

function hasCompleteAssessmentAnswers(answers = []) {
  return answers.length > 0 && answers.every((answer) => Boolean(answer));
}

function needsAssessmentRefresh(current) {
  return (
    hasCompleteAssessmentAnswers(current.assessments.interestAnswers) &&
    hasCompleteAssessmentAnswers(current.assessments.styleAnswers) &&
    (
      current.assessments.interestResult?.scoringVersion !== "assessment-v3" ||
      current.assessments.styleResult?.scoringVersion !== "assessment-v3"
    )
  );
}

function refreshAssessmentResults(current) {
  if (!needsAssessmentRefresh(current)) return current;

  return {
    ...current,
    assessments: {
      ...current.assessments,
      interestResult: computeRiasecResult(RIASEC_QUESTIONS, current.assessments.interestAnswers),
      styleResult: computeBigFiveResult(BIG_FIVE_QUESTIONS, current.assessments.styleAnswers),
    },
  };
}

function buildRecommendationsState(baseState) {
  const refreshedState = refreshAssessmentResults(baseState);
  const summary = summarizeExploration({
    dream: refreshedState.dream,
    profile: refreshedState.user,
    answers: refreshedState.exploration.answers,
    hooks: INSIGHT_HOOKS,
  });
  const recommendations = generateRecommendations({
    dream: refreshedState.dream,
    profile: refreshedState.user,
    riasecResult: refreshedState.assessments.interestResult,
    bigFiveResult: refreshedState.assessments.styleResult,
    summary,
    careers: CAREERS,
    hooks: INSIGHT_HOOKS,
  });

  return {
    ...refreshedState,
    exploration: {
      ...refreshedState.exploration,
      summary,
    },
    recommendations,
    selectedCareerSlug: recommendations[0]?.slug || null,
    currentView: "recommendations",
  };
}

function refreshStoredRecommendationsIfNeeded() {
  if (
    !state.recommendations.length ||
    !hasCompleteAssessmentAnswers(state.assessments.interestAnswers) ||
    !hasCompleteAssessmentAnswers(state.assessments.styleAnswers)
  ) {
    return;
  }

  const previousView = state.currentView;
  const previousJourney = state.activeJourney;
  const previousSelectedSlug = state.selectedCareerSlug;
  const rebuilt = buildRecommendationsState(state);
  const hasPreviousSelection = rebuilt.recommendations.some((item) => item.slug === previousSelectedSlug);

  state = {
    ...rebuilt,
    currentView: previousView,
    activeJourney: previousJourney,
    selectedCareerSlug: hasPreviousSelection ? previousSelectedSlug : rebuilt.selectedCareerSlug,
  };
  persist();
}

function hydrateDemoState(kind) {
  const demo = DEMO_PRESETS[kind];
  if (!demo) return;

  const next = createInitialState();
  next.dream = { ...next.dream, ...demo.dream };
  next.user = { ...next.user, ...demo.user, ageBand: getAgeBand(demo.user.birthYear) };
  next.assessments.interestAnswers = [...demo.interestAnswers];
  next.assessments.styleAnswers = [...demo.styleAnswers];
  next.assessments.interestResult = computeRiasecResult(RIASEC_QUESTIONS, next.assessments.interestAnswers);
  next.assessments.styleResult = computeBigFiveResult(BIG_FIVE_QUESTIONS, next.assessments.styleAnswers);
  next.exploration.answers = { ...next.exploration.answers, ...demo.explorationAnswers };
  state = buildRecommendationsState(next);
  persist();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startLoadingRecommendations() {
  updateState((current) => ({ ...current, currentView: "loading" }), { silent: true });
  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => {
    updateState((current) => buildRecommendationsState(current), { silent: true });
  }, 900);
}

function applyVisibleDraft(current) {
  const form = app.querySelector("main form");
  if (!(form instanceof HTMLFormElement)) return current;

  const formData = new FormData(form);

  if (form.id === "dream-form") {
    return {
      ...current,
      dream: {
        ...current.dream,
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        whyThisMatters: String(formData.get("whyThisMatters") || "").trim(),
        visualNote: String(formData.get("visualNote") || "").trim(),
        referenceImageUrl: String(formData.get("referenceImageUrl") || "").trim(),
        inspirationSlug: String(formData.get("inspirationSlug") || "").trim(),
        modes: parseMultiValue(formData.get("modes")),
        blockers: parseMultiValue(formData.get("blockers")),
      },
    };
  }

  if (form.id === "profile-form") {
    const birthYear = String(formData.get("birthYear") || "").trim();
    return {
      ...current,
      user: {
        ...current.user,
        displayName: String(formData.get("displayName") || "").trim(),
        birthYear,
        ageBand: birthYear ? getAgeBand(birthYear) : current.user.ageBand,
        city: String(formData.get("city") || "").trim(),
        experienceSummary: String(formData.get("experienceSummary") || "").trim(),
        currentStatus: String(formData.get("currentStatus") || ""),
        weeklyTimeBudget: String(formData.get("weeklyTimeBudget") || ""),
        incomeUrgency: String(formData.get("incomeUrgency") || ""),
        primaryGoal: String(formData.get("primaryGoal") || ""),
        peoplePreference: String(formData.get("peoplePreference") || ""),
        remotePreference: String(formData.get("remotePreference") || "any"),
        physicalDemandLimit: String(formData.get("physicalDemandLimit") || "unknown"),
      },
    };
  }

  if (form.id === "exploration-form") {
    return {
      ...current,
      exploration: {
        ...current.exploration,
        answers: Object.fromEntries(
          EXPLORATION_QUESTIONS.map((question) => [question.id, String(formData.get(question.id) || "").trim()])
        ),
      },
    };
  }

  if (form.id === "settings-form") {
    return {
      ...current,
      settings: {
        ...current.settings,
        remindersEnabled: String(formData.get("remindersEnabled") || "off") === "on",
        reminderTime: String(formData.get("reminderTime") || "20:00"),
      },
    };
  }

  return current;
}

function renderSingleChoiceGroup({ name, currentValue, choices, columns = "three", variant = "default" }) {
  return `
    <div class="choice-group" data-choice-group="${name}">
      <input type="hidden" name="${name}" value="${currentValue || ""}" />
      <div class="choice-grid choice-grid-${columns}">
        ${choices
          .map((choice) =>
            renderChoiceButton({
              choice,
              name,
              selected: currentValue === choice.value,
              action: "set-form-value",
              variant,
            })
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMultiChoiceGroup({ name, currentValues, choices, columns = "three", max = 3 }) {
  const current = currentValues || [];
  return `
    <div class="choice-group" data-choice-group="${name}" data-multi="true" data-max="${max}">
      <input type="hidden" name="${name}" value="${current.join("|")}" />
      <div class="choice-grid choice-grid-${columns}">
        ${choices
          .map((choice) =>
            renderChoiceButton({
              choice,
              name,
              selected: current.includes(choice.value),
              action: "toggle-form-value",
            })
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAssessmentScale(kind, index, answer) {
  return `
    <div class="scale-row">
      ${LIKERT_CHOICES.map(
        (choice) => {
          return `
          <button
            type="button"
            class="scale-button text-scale ${Number(answer) === choice.value ? "is-selected" : ""}"
            data-action="set-answer"
            data-kind="${kind}"
            data-index="${index}"
            data-value="${choice.value}"
          >
            <span class="scale-meter" style="--level: ${choice.value};" aria-hidden="true">
              <span></span>
            </span>
            <span class="scale-number">${choice.value}</span>
            <span class="scale-text">${choice.label.replace("\n", " ")}</span>
          </button>
        `;
        }
      ).join("")}
    </div>
  `;
}

function renderRatingGroup({ name, currentValue }) {
  const config = RATING_CONFIG[name] || {
    low: "낮음",
    high: "높음",
    labels: ["1점", "2점", "3점", "4점", "5점"],
  };
  return `
    <div class="choice-group" data-choice-group="${name}">
      <input type="hidden" name="${name}" value="${currentValue || ""}" />
      <div class="rating-grid">
        ${[1, 2, 3, 4, 5]
          .map((value) => {
            return `
              <button
                type="button"
                class="rating-button text-rating ${Number(currentValue) === value ? "is-selected" : ""}"
                data-action="set-form-value"
                data-name="${name}"
                data-value="${value}"
              >
                <span class="rating-meter" style="--level: ${value};" aria-hidden="true">
                  <span></span>
                </span>
                <strong>${value}</strong>
                <span>${config.labels[value - 1]}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="rating-guide">
        <span>${config.low}</span>
        <span>${config.high}</span>
      </div>
    </div>
  `;
}

function renderHeader() {
  const resume = getResumeDestination();
  return `
    <header class="app-header">
      <button class="brand-button brand-lockup" data-action="navigate" data-view="welcome" aria-label="홈으로 이동">
        <div class="brand-mark">BA</div>
        <div class="brand-copy">
          <h1>Be Anything</h1>
          <p>하고 싶은 일을 현실로 바꾸는 작은 경로</p>
        </div>
      </button>
      <div class="header-side">
        <span class="save-chip">${formatSaveLabel(state.meta.lastSavedAt)}</span>
        ${resume ? `<button class="secondary-button header-shortcut" data-action="navigate" data-view="${resume.view}">${resume.label}</button>` : ""}
      </div>
    </header>
  `;
}

function renderTopNav() {
  const items = getTopNavItems();
  return `
    <nav class="top-nav" aria-label="주요 이동">
      ${items
        .map(
          (item) => `
            <button
              class="top-nav-button ${item.type === "view" && state.currentView === item.view ? "active" : ""}"
              data-action="${item.type === "view" ? "navigate" : "home-section"}"
              ${item.type === "view" ? `data-view="${item.view}"` : `data-section="${item.sectionId}"`}
            >
              ${item.label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderProgress() {
  if (!isSetupView(state.currentView)) return "";
  const index = getSetupIndex(state.currentView);
  const step = SETUP_FLOW[index];
  const unlockedIndex = Math.max(getUnlockedSetupIndex(), index);
  return `
    <section class="flow-meter">
      <div class="flow-head">
        <span>단계 ${index + 1}/${SETUP_FLOW.length}</span>
        <strong>${step.title}</strong>
      </div>
      <div class="flow-track">
        <div class="flow-fill" style="width: ${((index + 1) / SETUP_FLOW.length) * 100}%"></div>
      </div>
      <div class="flow-step-row">
        ${SETUP_FLOW.map(
          (item, itemIndex) => `
            <button
              type="button"
              class="flow-step ${item.key === state.currentView ? "active" : ""}"
              ${itemIndex <= unlockedIndex ? `data-action="navigate" data-view="${item.key}"` : "disabled"}
            >
              ${item.title}
            </button>
          `
        ).join("")}
      </div>
      <p>${step.detail}</p>
    </section>
  `;
}

function renderWelcome() {
  const resume = getResumeDestination();
  const setupShortcutView = state.dream.title ? "profile" : "dream";
  return `
    <section id="home-start" class="hero-scene" style="--hero-bg: url('${ART_ASSETS.hero}');">
      <div class="hero-content">
        <span class="eyebrow light">꿈에서 끝나지 않게, 결과물부터</span>
        <h2>하고 싶은 일을 이번 달 안에 눈에 보이게 만듭니다.</h2>
        <p>막연한 꿈을 적고, 지금 상황에 맞는 경로를 고른 뒤, 첫 결과물과 첫 수익 시도까지 이어갑니다.</p>
        <div class="inline-actions">
          <button class="primary-button hero-cta" data-action="start-flow">내 경로 만들기</button>
          ${resume ? `<button class="ghost-button hero-ghost" data-action="navigate" data-view="${resume.view}">${resume.cta}</button>` : ""}
        </div>
      </div>
      <div class="hero-floating-panel">
        ${
          resume
            ? `
              <span class="eyebrow">이어서 하기</span>
              <strong>${resume.title}</strong>
              <p>${resume.detail}</p>
              <button class="secondary-button" data-action="navigate" data-view="${resume.view}">${resume.cta}</button>
            `
            : `
              <span class="eyebrow">오늘의 시작</span>
              <strong>꿈을 적고 바로 실험 가능한 길을 고릅니다.</strong>
              <p>긴 설명보다 이번 주에 만들 결과물 하나를 먼저 잡습니다.</p>
            `
        }
      </div>
    </section>
    <section class="home-grid feature-band">
      <div class="feature-block">
        <div class="panel-header">
          <div>
            <h2 class="section-title">바로 이동</h2>
            <p class="section-copy">지금 필요한 화면으로 바로 들어갈 수 있게 정리했습니다.</p>
          </div>
        </div>
        <div class="shortcut-grid">
          <button class="shortcut-card" data-action="navigate" data-view="dream">
            <strong>꿈 정리하기</strong>
            <span>무엇이 되고 싶은지부터 다시 적습니다.</span>
          </button>
          <button class="shortcut-card" data-action="navigate" data-view="${resume?.view || setupShortcutView}">
            <strong>${resume ? resume.label : "현재 상황 입력"}</strong>
            <span>${resume ? resume.detail : "시간과 수입 조건을 정리합니다."}</span>
          </button>
          <button class="shortcut-card" data-action="navigate" data-view="${state.recommendations.length ? "recommendations" : "dream"}">
            <strong>${state.recommendations.length ? "추천 다시 보기" : "추천 받기 준비"}</strong>
            <span>${state.recommendations.length ? "후보 5개를 다시 비교합니다." : "앞 단계를 채우면 바로 추천을 볼 수 있어요."}</span>
          </button>
          <button class="shortcut-card painfit-shortcut" data-action="navigate" data-view="painfit">
            <strong>견디는 결 진단</strong>
            <span>좋아함보다 먼저 오래 버틸 수 있는 업무 마찰을 확인합니다.</span>
          </button>
        </div>
      </div>
      <div id="home-demo" class="feature-block">
        <div class="panel-header">
          <div>
            <h2 class="section-title">예시로 먼저 둘러보기</h2>
            <p class="section-copy">창작형, 전문형, 사업형 예시를 가볍게 열어볼 수 있어요.</p>
          </div>
        </div>
        <div class="choice-grid choice-grid-one demo-grid">
          ${Object.entries(DEMO_PRESETS)
            .map(
              ([key, preset]) => `
                <button class="choice-card demo-card" data-action="load-demo" data-demo="${key}">
                  <img src="${preset.image}" alt="${preset.label}" />
                  <strong>${preset.label}</strong>
                  <span>${preset.dream.title}</span>
                </button>
              `
            )
          .join("")}
        </div>
      </div>
    </section>
    <section id="home-about" class="feature-block">
      <div class="panel-header">
        <div>
          <h2 class="section-title">이 앱에서 하는 일</h2>
          <p class="section-copy">길게 설명하지 않고, 지금 바로 필요한 3단계만 남겼습니다.</p>
        </div>
      </div>
      <div class="home-notes">
        <div class="note-box">
          <strong>1. 꿈을 먼저 적습니다</strong>
          <p>하고 싶은 일의 장면과 막히는 지점을 먼저 적으면 추천이 덜 뜬구름 같아집니다.</p>
        </div>
        <div class="note-box">
          <strong>2. 지금 조건을 같이 봅니다</strong>
          <p>시간, 수입, 체력 조건을 같이 보면서 지금 가능한 경로만 앞으로 당깁니다.</p>
        </div>
        <div class="note-box">
          <strong>3. 조사보다 결과물로 갑니다</strong>
          <p>첫 주엔 조사보다 결과물 1개, 인터뷰 1건, 공개 1회, 유료 시도 1회를 우선합니다.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDream() {
  const dream = state.dream;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">나는 무엇이 되고 싶은가</h2>
          <p class="section-copy">정답처럼 쓰지 않아도 괜찮아요. 지금 가장 끌리는 방향을 적어두면 이후 추천이 훨씬 정확해집니다.</p>
        </div>
      </div>
      <form id="dream-form">
        <div class="field-grid">
          <div class="field full">
            <label for="dreamTitle">한 문장으로 적어보세요 *</label>
            <textarea id="dreamTitle" name="title" placeholder="예: 내 이름으로 브랜드 작업과 글을 하는 사람이 되고 싶어요." required>${dream.title}</textarea>
          </div>
          <div class="field full">
            <label for="dreamDescription">그 일을 하는 장면을 조금 더 적어주세요 *</label>
            <textarea id="dreamDescription" name="description" placeholder="예: 작은 브랜드의 분위기를 잡아주고, 글과 작업물이 꾸준히 쌓이는 삶을 원해요." required>${dream.description}</textarea>
          </div>
          <div class="field full">
            <label for="whyThisMatters">왜 지금 이 꿈이 중요해졌나요?</label>
            <textarea id="whyThisMatters" name="whyThisMatters" placeholder="예: 남이 만든 일 말고 내가 만든 결과물이 남는 일을 해보고 싶어요.">${dream.whyThisMatters}</textarea>
          </div>
          <div class="field">
            <label for="visualNote">머릿속 이미지나 분위기</label>
            <textarea id="visualNote" name="visualNote" placeholder="예: 차분한 작업실, 종이 샘플, 카메라, 작은 진열대가 떠올라요.">${dream.visualNote}</textarea>
          </div>
          <div class="field">
            <label for="referenceImageUrl">이미지 참고 URL</label>
            <input id="referenceImageUrl" name="referenceImageUrl" type="url" placeholder="https://..." value="${dream.referenceImageUrl}" />
          </div>
          <div class="field full">
            <label>이 꿈에 가까운 느낌을 골라보세요</label>
            <div class="choice-group" data-choice-group="inspirationSlug">
              <div class="inspiration-grid">
                ${INSPIRATION_CARDS.map(
                  (card) => `
                    <button
                      type="button"
                      class="inspiration-card ${dream.inspirationSlug === card.slug ? "is-selected" : ""}"
                      data-action="set-form-value"
                      data-name="inspirationSlug"
                      data-value="${card.slug}"
                    >
                      ${renderInspirationScene(card)}
                      <strong>${card.label}</strong>
                      <span>${card.description}</span>
                    </button>
                  `
                ).join("")}
              </div>
              <input type="hidden" name="inspirationSlug" value="${dream.inspirationSlug}" />
            </div>
          </div>
          <div class="field full">
            <label>이 꿈의 성격을 골라주세요. 최대 3개</label>
            ${renderMultiChoiceGroup({
              name: "modes",
              currentValues: dream.modes,
              choices: DREAM_MODE_OPTIONS,
              columns: "three",
              max: 3,
            })}
          </div>
          <div class="field full">
            <label>벌써부터 걸리는 게 있다면 골라주세요. 최대 3개</label>
            ${renderMultiChoiceGroup({
              name: "blockers",
              currentValues: dream.blockers,
              choices: BLOCKER_OPTIONS,
              columns: "three",
              max: 3,
            })}
          </div>
        </div>
        <div class="sticky-actions">
          <button class="secondary-button" type="button" data-action="navigate" data-view="welcome">이전</button>
          <button class="primary-button" type="submit">다음으로</button>
        </div>
      </form>
    </section>
  `;
}

function renderProfile() {
  const user = state.user;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">지금 내 상황</h2>
          <p class="section-copy">꿈이 같아도 지금 시간, 돈, 체력에 따라 시작 경로는 달라집니다.</p>
        </div>
      </div>
      <form id="profile-form">
        <div class="field-grid">
          <div class="field">
            <label for="displayName">이름 또는 닉네임</label>
            <input id="displayName" name="displayName" type="text" value="${user.displayName}" placeholder="예: 지영" />
          </div>
          <div class="field">
            <label for="birthYear">출생연도 *</label>
            <input id="birthYear" name="birthYear" type="number" min="1940" max="2020" value="${user.birthYear}" placeholder="예: 2008" required />
          </div>
          <div class="field">
            <label for="city">지역</label>
            <input id="city" name="city" type="text" value="${user.city}" placeholder="예: 서울" />
          </div>
          <div class="field">
            <label for="experienceSummary">지금까지 해온 일과 강점</label>
            <textarea id="experienceSummary" name="experienceSummary" placeholder="예: 운영, 문서 정리, 고객 응대, 일정 조율을 오래 했어요.">${user.experienceSummary}</textarea>
          </div>
          <div class="field full">
            <label>현재 상태 *</label>
            ${renderSingleChoiceGroup({
              name: "currentStatus",
              currentValue: user.currentStatus,
              columns: "three",
              choices: [
                { value: "elementary_student", label: "초등학생", description: "보호자와 함께 진로 감각을 탐색" },
                { value: "middle_school_student", label: "중학생", description: "좋아하는 분야와 활동을 넓혀봄" },
                { value: "high_school_student", label: "고등학생", description: "진학과 직업 방향을 함께 고민" },
                { value: "university_student", label: "대학생", description: "전공, 활동, 첫 일 경험을 연결" },
                { value: "employee", label: "직장인", description: "일을 유지하며 새 방향 탐색" },
                { value: "self_employed", label: "자영업", description: "기존 일을 유지하며 확장 고민" },
                { value: "job_seeker", label: "구직 중", description: "빠른 연결 가능성이 중요" },
                { value: "retiring", label: "은퇴 예정", description: "퇴직 전후를 준비 중" },
                { value: "retired", label: "은퇴", description: "새 챕터를 찾는 중" },
                { value: "career_break", label: "경력 공백", description: "다시 시작할 진입점이 필요" },
              ],
            })}
          </div>
          <div class="field full">
            <label>주당 투입 가능 시간 *</label>
            ${renderSingleChoiceGroup({
              name: "weeklyTimeBudget",
              currentValue: user.weeklyTimeBudget,
              columns: "three",
              choices: [
                { value: "1_2", label: "1~2시간", description: "아주 가볍게 시작" },
                { value: "3_5", label: "3~5시간", description: "현실적으로 가능한 수준" },
                { value: "6_plus", label: "6시간 이상", description: "좀 더 깊게 붙들 수 있음" },
              ],
            })}
          </div>
          <div class="field full">
            <label>수입 필요 정도 *</label>
            ${renderSingleChoiceGroup({
              name: "incomeUrgency",
              currentValue: user.incomeUrgency,
              columns: "three",
              choices: [
                { value: "immediate", label: "당장 필요", description: "빠른 현금 흐름이 중요" },
                { value: "within_3_months", label: "3개월 안", description: "속도와 적합도를 함께 봄" },
                { value: "explore_first", label: "우선 방향 확인", description: "무리한 전환은 피하고 싶음" },
              ],
            })}
          </div>
          <div class="field full">
            <label>이번 선택에서 제일 중요한 것</label>
            ${renderSingleChoiceGroup({
              name: "primaryGoal",
              currentValue: user.primaryGoal,
              columns: "five",
              variant: "compact",
              choices: [
                { value: "income", label: "수입" },
                { value: "meaning", label: "의미" },
                { value: "flexibility", label: "유연성" },
                { value: "social_contribution", label: "기여" },
                { value: "learning", label: "배움" },
              ],
            })}
          </div>
          <div class="field">
            <label>사람과 일하는 정도</label>
            ${renderSingleChoiceGroup({
              name: "peoplePreference",
              currentValue: user.peoplePreference,
              columns: "three",
              choices: [
                { value: "high", label: "많이", description: "사람과 부딪히는 편이 편함" },
                { value: "medium", label: "보통", description: "상황에 따라 다름" },
                { value: "low", label: "적게", description: "조용한 환경이 더 편함" },
              ],
            })}
          </div>
          <div class="field">
            <label>원하는 일 방식</label>
            ${renderSingleChoiceGroup({
              name: "remotePreference",
              currentValue: user.remotePreference,
              columns: "two",
              choices: [
                { value: "onsite", label: "현장", description: "직접 가는 일도 괜찮음" },
                { value: "hybrid", label: "섞여도 좋음", description: "반반이면 편함" },
                { value: "remote", label: "원격 선호", description: "집이나 온라인 중심" },
                { value: "any", label: "상관없음", description: "열어두고 싶음" },
              ],
            })}
          </div>
          <div class="field full">
            <label>체력 부담 허용도</label>
            ${renderSingleChoiceGroup({
              name: "physicalDemandLimit",
              currentValue: user.physicalDemandLimit,
              columns: "four",
              variant: "compact",
              choices: [
                { value: "low", label: "낮음" },
                { value: "medium", label: "보통" },
                { value: "high", label: "높음" },
                { value: "unknown", label: "미정" },
              ],
            })}
          </div>
        </div>
        <div class="sticky-actions">
          <button class="secondary-button" type="button" data-action="navigate" data-view="dream">이전</button>
          <button class="primary-button" type="submit">다음으로</button>
        </div>
      </form>
    </section>
  `;
}

function renderAssessment(viewKey) {
  const config = ASSESSMENT_CONFIG[viewKey];
  const page = state.assessments[config.pageKey];
  const answers = state.assessments[config.answersKey];
  const totalPages = Math.ceil(config.questions.length / config.pageSize);
  const start = page * config.pageSize;
  const currentQuestions = config.questions.slice(start, start + config.pageSize);
  const answeredCount = answers.filter(Boolean).length;

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">${config.title}</h2>
          <p class="section-copy">${config.copy}</p>
        </div>
        <span class="tag">${answeredCount}/${config.questions.length}</span>
      </div>
      <div class="summary-card slim-card">
        <div class="card-header">
          <h3>${page + 1}/${totalPages} 페이지</h3>
          <span>문항 ${start + 1}~${Math.min(start + config.pageSize, config.questions.length)}</span>
        </div>
      </div>
      <form id="${viewKey}-form">
        ${currentQuestions
          .map((question, index) => {
            const absoluteIndex = start + index;
            const answer = answers[absoluteIndex];
            return `
              <div class="question-card">
                <div class="question-meta">문항 ${absoluteIndex + 1}</div>
                <h3>${question.prompt}</h3>
                ${renderAssessmentScale(viewKey, absoluteIndex, answer)}
              </div>
            `;
          })
          .join("")}
        <div class="sticky-actions">
          ${page > 0 ? `<button class="secondary-button" type="button" data-action="assessment-page" data-kind="${viewKey}" data-direction="prev">이전</button>` : ""}
          ${
            page < totalPages - 1
              ? `<button class="primary-button" type="button" data-action="assessment-page" data-kind="${viewKey}" data-direction="next">다음</button>`
              : `<button class="primary-button" type="submit">다음으로</button>`
          }
        </div>
      </form>
    </section>
  `;
}

function renderExploration() {
  const summary = state.exploration.summary;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">지금 막힌 지점을 솔직하게 적어보세요</h2>
          <p class="section-copy">응원 문구보다 현실적인 경로가 필요하니, 무서운 점과 멈추는 지점을 그대로 적는 편이 좋습니다.</p>
        </div>
      </div>
      <form id="exploration-form">
        <div class="summary-card slim-card">
          <h3>지금까지 잡힌 꿈의 방향</h3>
          <p class="helper-text">${state.dream.title || "아직 없음"}</p>
        </div>
        ${EXPLORATION_QUESTIONS.map(
          (question) => `
            <div class="field full">
              <label for="${question.id}">${question.title}</label>
              <textarea id="${question.id}" name="${question.id}" placeholder="${question.placeholder}">${state.exploration.answers[question.id] || ""}</textarea>
            </div>
          `
        ).join("")}
        ${summary ? `<div class="summary-card slim-card"><p class="helper-text">${summary.proofNeed}</p></div>` : ""}
        <div class="sticky-actions">
          <button class="secondary-button" type="button" data-action="navigate" data-view="workstyle">이전</button>
          <button class="primary-button" type="submit">내 경로 보기</button>
        </div>
      </form>
    </section>
  `;
}

function renderLoading() {
  return `
    <section class="panel loading-state">
      <div class="loading-ring"></div>
      <h2 class="section-title">당신에게 맞는 경로를 고르고 있어요</h2>
      <p class="section-copy">꿈과의 거리, 지금 조건, 이번 주 결과물, 첫 수익 가능성을 함께 보고 있습니다.</p>
    </section>
  `;
}

function renderPathPreview(recommendation) {
  const stageLabels = {
    seven: "첫 7일",
    thirty: "30일 쌓기",
    ninety: "90일 굳히기",
    revenue: recommendation.studentMode ? "첫 피드백" : "첫 수익",
  };
  const journey = buildJourney(recommendation, JOURNEY_BLUEPRINTS);
  return `
    <div class="path-preview-grid">
      ${journey.stages.map(
        (stage) => `
          <div class="path-stage-card">
            <span>${stageLabels[stage.key]}</span>
            <strong>${stage.summary}</strong>
            <p>${stage.tasks[0].title}</p>
          </div>
        `
      ).join("")}
    </div>
  `;
}

function getChoiceLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function getModeLabels(values = []) {
  return values.map((value) => getChoiceLabel(DREAM_MODE_OPTIONS, value));
}

function getConditionLabel(group, value) {
  const labels = {
    time: {
      "1_2": "주 1~2시간",
      "3_5": "주 3~5시간",
      "6_plus": "주 6시간 이상",
    },
    income: {
      immediate: "수입을 빨리 확인해야 함",
      within_3_months: "3개월 안에 가능성을 보고 싶음",
      explore_first: "수익보다 방향 확인이 먼저",
    },
    remote: {
      onsite: "현장이 편함",
      hybrid: "현장과 원격을 섞고 싶음",
      remote: "원격이 필요함",
      mixed: "방식은 열어둠",
      any: "방식은 열어둠",
    },
    physical: {
      low: "몸 부담은 낮아야 함",
      medium: "보통 수준의 활동은 가능",
      high: "활동량이 있어도 괜찮음",
      unknown: "몸 부담은 아직 미정",
    },
  };

  return labels[group]?.[value] || value || "미정";
}

function buildRecommendationExplanation(recommendation) {
  const breakdown = recommendation.breakdown || {};
  const dreamCloseness = Math.max(0, 100 - (breakdown.dreamDistance ?? 50));
  const directMention = breakdown.directMentionFit || 0;
  const keywordFit = breakdown.keywordFit || 0;
  const studentFit = breakdown.studentFit || 0;
  const preferenceAdjustment = breakdown.preferenceAdjustment || 0;
  const dreamTitle = state.dream.title || "적어둔 꿈";
  const userModes = getModeLabels(state.dream.modes || []).slice(0, 3);
  const modeText = userModes.length ? userModes.join(", ") : "아직 뚜렷하지 않은 활동 방식";
  const timeText = getConditionLabel("time", state.user.weeklyTimeBudget);
  const incomeText = getConditionLabel("income", state.user.incomeUrgency);
  const remoteText = getConditionLabel("remote", state.user.remotePreference);
  const physicalText = getConditionLabel("physical", state.user.physicalDemandLimit);
  const interestScore = Math.round(breakdown.interestMatch || 0);
  const workStyleScore = Math.round(breakdown.workStyleMatch || 0);
  const scoreAverage = Math.round((interestScore + workStyleScore) / 2);
  const checkinSignal = getCheckinSignal(getLatestCheckinForRecommendation(recommendation));
  const displayScore = checkinSignal?.isLow
    ? Math.min(recommendation.finalScore, 48)
    : checkinSignal?.isMixed
      ? Math.min(recommendation.finalScore, 68)
      : recommendation.finalScore;
  const hasLowAssessment = interestScore < 50 || workStyleScore < 60;
  const hasVeryLowAssessment = interestScore < 35 && workStyleScore < 50;
  const verdict = checkinSignal?.isLow || displayScore < 50 || hasVeryLowAssessment
    ? "negative"
    : checkinSignal?.isMixed || displayScore < 70 || hasLowAssessment
      ? "caution"
      : "support";
  const factors = [];
  const cautions = [];

  const addFactor = (label, score, text, evidence) => {
    factors.push({
      label,
      score: Math.max(0, Math.min(100, Math.round(score))),
      text,
      evidence,
    });
  };

  const explanationTitle = verdict === "negative"
    ? "지금은 맞다고 보기 어렵습니다"
    : verdict === "caution"
      ? "추천이 아니라 점검 후보입니다"
      : "왜 이 경로가 맞다고 봤나요?";
  const verdictLabel = verdict === "negative" ? "비추천 신호" : verdict === "caution" ? "보류 신호" : "진행 후보";
  const headline = verdict === "negative"
    ? `"${dreamTitle}"과 일부 닿는 지점은 있지만, 지금 답변에서는 부정 신호가 더 큽니다. 이 경로를 확정하지 않는 편이 안전합니다.`
    : verdict === "caution"
      ? `"${dreamTitle}"에 닿는 단서는 있지만, 지금 답변만으로는 계속 밀어도 된다고 보기 어렵습니다. 작은 검증이 먼저입니다.`
      : directMention > 0
        ? `"${dreamTitle}" 안에 이 경로와 직접 맞닿는 표현이 있어서 먼저 올렸습니다.`
        : `"${dreamTitle}"을 바로 직업명으로 확정하기보다, 지금 만들 수 있는 결과물로 바꿔볼 때 이 경로가 가장 가깝습니다.`;

  const bridge = verdict === "negative"
    ? `${recommendation.name}는 "${recommendation.proofOfWork}" 같은 결과물로 시험해볼 수는 있지만, 현재 신호로는 흥미나 확신이 충분히 받쳐주지 않습니다. 지금은 추천을 믿고 진행하기보다 접을지, 범위를 줄일지, 다른 후보로 바꿀지 판단해야 합니다.`
    : verdict === "caution"
      ? `${recommendation.name}는 당신이 고른 ${modeText} 방향을 결과물로 바꿔볼 수는 있습니다. 다만 현재 반응이 애매하므로, 이 해설은 "맞다"는 판정이 아니라 다음 실험을 더 작게 만드는 경고로 봐야 합니다.`
      : `${recommendation.name}는 당신이 고른 ${modeText} 방향을 "${recommendation.proofOfWork}" 같은 확인 가능한 결과물로 바꿀 수 있습니다. 그래서 막연한 적성보다 "이번 주에 만들어 보고 반응을 볼 수 있는가"를 핵심 근거로 삼았습니다.`;

  addFactor(
    "하고 싶은 장면이 실제 작업으로 이어짐",
    dreamCloseness,
    dreamCloseness >= 80
      ? `입력한 꿈의 방향과 이 경로의 작업 방식이 많이 겹칩니다. ${recommendation.name}는 "${dreamTitle}"을 말로만 두지 않고 실제 작업으로 꺼내기 좋습니다.`
      : `꿈과 이름이 완전히 같지는 않지만, 지금 고른 활동 방식과 가까운 우회 경로입니다.`,
    `선택한 장면: ${modeText}`
  );

  if (directMention > 0) {
    addFactor(
      "직접 적은 꿈을 우선 반영함",
      92,
      `꿈 입력이나 메모에 ${recommendation.name}와 가까운 표현이 들어가 있어, 일반 성향보다 사용자의 직접 의도를 더 높게 봤습니다.`,
      `입력한 꿈: ${dreamTitle}`
    );
  } else if (keywordFit > 0) {
    addFactor(
      "사용한 단어가 경로의 핵심 단어와 겹침",
      Math.min(92, 62 + keywordFit * 2),
      `자유 입력에 나온 단어들이 ${recommendation.name}의 주요 작업 키워드와 맞닿아 있습니다.`,
      "자유 입력 키워드 반영"
    );
  }

  addFactor(
    "첫 실험이 눈에 보이는 결과물로 끝남",
    breakdown.proofFit ?? 0,
    `이 경로는 시작하자마자 "${recommendation.proofOfWork}"를 만들 수 있습니다. 결과물이 남아야 계속할지, 접을지, 바꿀지 판단할 수 있습니다.`,
    `이번 주 결과물: ${recommendation.proofOfWork}`
  );

  addFactor(
    "현재 조건에서 무리하게 멀지 않음",
    breakdown.realityFit ?? 0,
    `현재 조건은 ${timeText}, ${incomeText}, ${remoteText}, ${physicalText}입니다. 이 조건에서 너무 큰 준비나 과한 부담이 필요한 경로는 뒤로 밀었습니다.`,
    `${timeText} · ${incomeText} · ${remoteText} · ${physicalText}`
  );

  addFactor(
    "초기 끌림 검사와 일하는 방식",
    scoreAverage,
    interestScore < 50 || workStyleScore < 60
      ? `검사 답변만 보면 이 경로를 강하게 밀어주는 상태는 아닙니다. 그래서 이 점수는 결정 근거가 아니라 감점/주의 신호로 봐야 합니다.`
      : `끌리는 장면 답변과 일하는 결 답변을 같이 보면, 이 경로는 관심 방향과 작업 방식이 크게 어긋나지 않습니다.`,
    `초기 끌림 ${interestScore}점 · 초기 일하는 결 ${workStyleScore}점`
  );

  if (checkinSignal) {
    addFactor(
      "오늘 실행 반응",
      checkinSignal.score,
      checkinSignal.isLow
        ? "오늘 체크인은 이 경로를 강하게 지지하지 않습니다. 이 경우 추천 점수보다 실제 반응을 우선해서 보고, 다음 과제를 줄이거나 다른 후보와 비교해야 합니다."
        : checkinSignal.isMixed
          ? "오늘 반응은 애매합니다. 바로 포기할 정도는 아니지만, 다음 행동을 더 작게 쪼개서 부담과 흥미가 어디서 갈리는지 봐야 합니다."
          : "오늘 체크인은 이 경로를 계속 실험해볼 만한 쪽으로 나왔습니다.",
      checkinSignal.evidence
    );
  }

  if (studentFit > 0) {
    addFactor(
      "학생 단계에서는 안전한 프로젝트로 바꿈",
      Math.min(94, 58 + studentFit),
      `학생에게 바로 수익형 직무를 권하기보다, ${recommendation.name}를 포트폴리오와 피드백 중심의 프로젝트로 바꿔 제안했습니다.`,
      "수익보다 프로젝트/기록/피드백 우선"
    );
  }

  if (preferenceAdjustment < 0) {
    cautions.push("원격/시간/신체 부담 같은 현실 조건에서 일부 감점이 있었습니다.");
  }
  if (interestScore < 50) {
    cautions.push("흥미 검사 답변은 이 경로를 강하게 지지하지 않습니다. 실제로 끌리는지 7일 과제에서 다시 확인해야 합니다.");
  }
  if (workStyleScore < 60) {
    cautions.push("일하는 방식 점수가 높지 않습니다. 시작한다면 범위를 작게 잡고 부담이 쌓이는지 먼저 봐야 합니다.");
  }
  if (checkinSignal?.isLow) {
    cautions.push("오늘 체크인에서 확신과 흥미가 낮게 나왔습니다. 지금은 이 추천을 확정하지 말고 과제를 더 작게 줄이거나 다른 후보와 비교해야 합니다.");
  } else if (checkinSignal?.isMixed) {
    cautions.push("오늘 체크인 반응이 애매합니다. 다음 행동을 한 단계 낮춰서 다시 확인하는 편이 안전합니다.");
  }
  if ((breakdown.realityFit ?? 100) < 72) {
    cautions.push("지금 조건으로는 준비 부담이 있을 수 있어 범위를 작게 잡는 편이 좋습니다.");
  }
  if ((breakdown.proofFit ?? 100) < 65) {
    cautions.push("첫 결과물이 모호해질 수 있으니 7일 과제를 더 작게 쪼개야 합니다.");
  }
  if (dreamCloseness < 70) {
    cautions.push("꿈과 정면으로 같은 길이라기보다, 현실적으로 가까운 우회 경로에 가깝습니다.");
  }
  if (!cautions.length) {
    cautions.push("큰 감점은 없지만, 실제 반응을 보기 전까지는 가설로 다루는 편이 안전합니다.");
  }
  if (verdict === "negative") {
    cautions.unshift("현재 답변 기준으로는 이 경로를 계속 추천한다고 말하기 어렵습니다. 다음 행동은 진행이 아니라 중단 기준 확인입니다.");
  } else if (verdict === "caution") {
    cautions.unshift("지금은 확정 추천이 아닙니다. 더 작은 과제로 다시 확인해야 하는 보류 후보입니다.");
  }

  const sortedFactors = factors
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  const checkinFactor = factors.find((factor) => factor.label === "오늘 실행 반응");
  const importantFactors =
    checkinFactor && !sortedFactors.includes(checkinFactor)
      ? [checkinFactor, ...sortedFactors.slice(0, 4)]
      : sortedFactors;

  return {
    headline,
    bridge,
    factors: importantFactors,
    cautions,
    displayScore,
    initialScore: recommendation.finalScore,
    explanationTitle,
    verdict,
    verdictLabel,
  };
}

function renderRecommendationExplanation(recommendation) {
  const {
    headline,
    bridge,
    factors,
    cautions,
    displayScore,
    initialScore,
    explanationTitle,
    verdict,
    verdictLabel,
  } = buildRecommendationExplanation(recommendation);

  return `
    <div class="explanation-box explanation-${verdict}">
      <div class="explanation-head">
        <div>
          <span class="verdict-pill">${verdictLabel}</span>
          <strong>${explanationTitle}</strong>
          <p>${headline}</p>
        </div>
        <span class="score-chip">${displayScore}점${displayScore !== initialScore ? `<small>초기 ${initialScore}점</small>` : ""}</span>
      </div>
      <div class="explanation-summary">
        <p>${bridge}</p>
      </div>
      <div class="factor-list">
        ${factors.map((factor) => `
          <div class="factor-row">
            <div class="factor-copy">
              <strong>${factor.label}</strong>
              <span>${factor.text}</span>
              <small>${factor.evidence}</small>
            </div>
            <div class="factor-meter" aria-label="${factor.label} ${factor.score}점">
              <span style="--factor-score: ${factor.score}%"></span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="caution-list">
        <strong>주의해서 볼 점</strong>
        ${cautions.map((item) => `<p>${item}</p>`).join("")}
      </div>
    </div>
  `;
}

function renderRecommendations() {
  if (!state.recommendations.length) {
    return `
      <section class="panel empty-state">
        <h2 class="section-title">아직 보여드릴 경로를 못 골랐어요</h2>
        <p class="section-copy">꿈 입력이나 현재 상황이 비어 있으면 추천이 흐려집니다. 앞 단계 내용을 조금만 더 채워주세요.</p>
        <button class="primary-button" data-action="navigate" data-view="dream">처음부터 다시 정리하기</button>
      </section>
    `;
  }

  const selected = getSelectedRecommendation();
  const summary = state.exploration.summary;
  return `
    <section class="hero-card recommendation-hero" style="--hero-bg: url('${ART_ASSETS.hero}');">
      <div class="panel-header">
        <div>
          <span class="eyebrow">당신 상황에 맞는 5개</span>
          <h2 class="section-title">"${state.dream.title}"에 닿기 좋은 경로를 골랐어요.</h2>
          <p class="section-copy">무턱대고 멋있어 보이는 길보다, 이번 주 안에 결과물과 반응을 만들 수 있는 경로를 먼저 올렸습니다.</p>
        </div>
      </div>
      <div class="hero-summary-grid">
        <div class="metric-card">
          <strong>${summary?.blockers?.length || 0}개</strong>
          <span>현재 막힘</span>
        </div>
        <div class="metric-card">
          <strong>${state.user.weeklyTimeBudget === "6_plus" ? "깊게" : state.user.weeklyTimeBudget === "3_5" ? "현실적으로" : "가볍게"}</strong>
          <span>시작 강도</span>
        </div>
        <div class="metric-card">
          <strong>${state.user.incomeUrgency === "immediate" ? "빠른 수익" : state.user.incomeUrgency === "within_3_months" ? "속도+적합도" : "탐색 우선"}</strong>
          <span>우선 기준</span>
        </div>
      </div>
    </section>
    <section class="recommendation-layout">
      <div class="candidate-list">
        ${state.recommendations
          .map((item) => {
            const art = getRecommendationArt(item);
            return `
              <article class="candidate-card ${state.selectedCareerSlug === item.slug ? "selected" : ""}">
                <div class="candidate-visual" style="--choice-image: url('${art}');" aria-hidden="true">
                  <span>${item.category}</span>
                </div>
                <div class="candidate-head">
                  <div>
                    <div class="candidate-meta">
                      <span class="rank-badge">추천 ${item.rank}</span>
                      <span class="tag">${item.category}</span>
                    </div>
                    <h3>${item.name}</h3>
                    <p class="muted">${item.shortDescription}</p>
                  </div>
                  <button class="icon-button" data-action="toggle-save" data-slug="${item.slug}">
                    ${state.savedCareerSlugs.includes(item.slug) ? "★" : "☆"}
                  </button>
                </div>
                <div class="candidate-score-row">
                  <div class="score-chip">${item.fitLabel}</div>
                  <div class="score-text">꿈과의 거리 ${item.breakdown.dreamDistance}</div>
                  <div class="score-text">${item.paceLabel}</div>
                </div>
                <div class="proof-box">
                  <strong>${item.proofLabel}</strong>
                  <span>${item.proofOfWork}</span>
                </div>
                <p class="helper-text">${item.reasonShort}</p>
                <div class="inline-actions">
                  <button class="secondary-button" data-action="select-career" data-slug="${item.slug}">자세히 보기</button>
                  <button class="primary-button" data-action="start-journey" data-slug="${item.slug}">이 경로 시작</button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      ${
        selected
          ? `
            <div class="detail-stack">
              <section class="panel detail-panel">
                <div class="detail-top">
                  <div>
                    <span class="eyebrow">${selected.category}</span>
                    <h2 class="section-title">${selected.name}</h2>
                  </div>
                  <div class="detail-badges">
                    <span class="score-chip">${selected.finalScore}점</span>
                    <span class="tag">${selected.fitLabel}</span>
                  </div>
                </div>
	                <ul class="reason-list">
	                  ${selected.reasons.map((reason) => `<li>${reason}</li>`).join("")}
	                </ul>
	                ${renderRecommendationExplanation(selected)}
	                <div class="note-box">
	                  <strong>미리 알고 가면 좋은 점</strong>
                  <p>${selected.cautionText}</p>
                </div>
                <div class="note-box">
                  <strong>바로 시작할 3가지</strong>
                  <ul class="compact-list">
                    ${selected.firstActions.map((action) => `<li>${action}</li>`).join("")}
                  </ul>
                </div>
              </section>
	              <section class="panel detail-panel">
	                <div class="panel-header">
	                  <div>
	                    <h2 class="section-title">이 길의 전체 그림</h2>
	                    <p class="section-copy">7일에서 끝나지 않고, 30일과 90일, ${selected.studentMode ? "첫 피드백" : "첫 수익"}까지 이어집니다.</p>
	                  </div>
	                </div>
                ${renderPathPreview(selected)}
              </section>
              <div class="sticky-actions">
                <button class="primary-button" data-action="start-journey" data-slug="${selected.slug}">이 경로로 출발</button>
              </div>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderTaskCard(stageKey, task, index) {
  const orderLabel = `순서 ${index + 1}`;

  return `
    <article class="task-card ${task.status === "done" ? "done" : ""}">
      <div class="task-copy">
        <span class="task-order">${orderLabel}</span>
        <strong>${task.title}</strong>
        <p>${task.description}</p>
        <span>결과물: ${task.deliverable}</span>
      </div>
      <button class="task-toggle ${task.status === "done" ? "done" : ""}" data-action="toggle-task" data-stage="${stageKey}" data-task="${task.id}">
        ${task.status === "done" ? "완료됨" : "완료 체크"}
      </button>
    </article>
  `;
}

function renderDashboard() {
  const journey = state.activeJourney;
  if (!journey) {
    return `
      <section class="panel empty-state">
        <h2 class="section-title">아직 시작한 경로가 없어요</h2>
        <p class="section-copy">추천에서 한 경로를 골라 시작하면 7일, 30일, 90일, 첫 수익까지 이어지는 실행판이 열립니다.</p>
        <button class="primary-button" data-action="navigate" data-view="recommendations">추천 보러 가기</button>
      </section>
    `;
  }

  const metrics = summarizeJourneyMetrics(journey);
  const currentStage = getCurrentStage(journey);
  const latestCheckin = [...(journey.checkins || [])]
    .filter((entry) => entry.stageKey === currentStage.key)
    .slice(-1)[0] || null;
  const latestReflection = [...(journey.reflections || [])]
    .filter((entry) => entry.stageKey === currentStage.key)
    .slice(-1)[0] || null;
  const feedback = latestCheckin ? composeCheckinFeedback({ journey, checkin: latestCheckin, hooks: INSIGHT_HOOKS }) : "";
  const nextStageKey = getNextStageKey(journey.currentStageKey);
  const activeRecommendation = getRecommendationForJourney(journey);

  return `
    <section class="hero-card journey-hero" style="--hero-bg: url('${getRecommendationArt({ category: journey.careerCategory || "", slug: journey.careerSlug || journey.careerName })}');">
      <div class="panel-header">
	        <div>
	          <span class="eyebrow">지금 걷는 경로</span>
	          <h2 class="section-title">${journey.careerName}</h2>
	          <p class="section-copy">${currentStage.label} 단계에 있습니다. 지금은 ${currentStage.tasks.length}개 중 ${metrics.stageProgress}개를 마쳤어요.</p>
	          ${
              activeRecommendation
                ? `<button class="ghost-button hero-ghost" data-action="view-journey-explanation" data-slug="${journey.careerSlug}">왜 이 경로였는지 보기</button>`
                : ""
            }
	        </div>
        <div class="hero-summary-grid compact">
          <div class="metric-card">
            <strong>${metrics.doneTasks}/${metrics.totalTasks}</strong>
            <span>전체 완료</span>
          </div>
          <div class="metric-card">
            <strong>${currentStage.label}</strong>
            <span>현재 단계</span>
          </div>
        </div>
	      </div>
	    </section>
      ${
        activeRecommendation
          ? `
            <section class="panel detail-panel">
              <div class="panel-header">
                <div>
                  <span class="eyebrow">선택 근거</span>
                  <h2 class="section-title">이 경로가 추천된 이유</h2>
                  <p class="section-copy">처음 추천을 받은 뒤에도 언제든 이 근거를 다시 확인할 수 있습니다.</p>
                </div>
                <button class="secondary-button" data-action="view-journey-explanation" data-slug="${journey.careerSlug}">전체 추천에서 보기</button>
              </div>
              ${renderRecommendationExplanation(activeRecommendation)}
            </section>
          `
          : `
            <section class="panel">
              <div class="panel-header">
                <div>
                  <span class="eyebrow">선택 근거</span>
                  <h2 class="section-title">추천 해설을 다시 만들 수 없어요</h2>
                  <p class="section-copy">이전 버전에서 시작한 경로라 점수 근거가 남아 있지 않습니다. 추천을 다시 받으면 해설이 함께 저장됩니다.</p>
                </div>
                <button class="secondary-button" data-action="navigate" data-view="recommendations">추천 다시 보기</button>
              </div>
            </section>
          `
      }
	    <section class="panel">
      <div class="stage-tab-row">
        ${journey.stages
          .map(
            (stage) => {
              const art = getSpriteArt(STAGE_ART_BY_KEY[stage.key] || [0, 3]);
              return `
              <button
                class="stage-tab image-stage ${journey.currentStageKey === stage.key ? "active" : ""}"
                data-action="switch-stage"
                data-stage="${stage.key}"
              >
                <span class="stage-art" aria-hidden="true">
                  <img src="${art.image}" alt="" style="--sprite-x: ${art.shiftX}; --sprite-y: ${art.shiftY};" />
                </span>
                <span>${stage.label}</span>
                <strong>${stage.tasks.filter((task) => task.status === "done").length}/${stage.tasks.length}</strong>
              </button>
            `;
            }
          )
          .join("")}
      </div>
      <div class="stage-summary">
        <h3>${currentStage.label}</h3>
        <p>${currentStage.summary}</p>
      </div>
      <div class="task-list">
        ${currentStage.tasks.map((task, index) => renderTaskCard(currentStage.key, task, index)).join("")}
      </div>
      ${
        canAdvanceStage(journey) && nextStageKey
          ? `
            <div class="sticky-actions">
              <button class="primary-button" data-action="advance-stage">다음 단계 열기</button>
            </div>
          `
          : ""
      }
    </section>
    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="section-title">오늘의 체크인</h2>
            <p class="section-copy">지금 막힌 점을 짧게 남겨두면 다음 행동을 줄이거나 바꾸는 데 도움이 됩니다.</p>
          </div>
        </div>
        <form id="checkin-form">
          <input type="hidden" name="stageKey" value="${currentStage.key}" />
          <div class="field full">
            <label>오늘은 어디까지 했나요?</label>
            ${renderSingleChoiceGroup({
              name: "completionStatus",
              currentValue: latestCheckin?.completionStatus || "",
              columns: "three",
              choices: [
                { value: "done", label: "끝냈다", description: "계획한 만큼 해봤다" },
                { value: "partial", label: "조금 했다", description: "반쯤 했거나 맛만 봤다" },
                { value: "skipped", label: "못 했다", description: "오늘은 멈췄다" },
              ],
            })}
          </div>
          <div class="field">
            <label>확신 점수</label>
            ${renderRatingGroup({ name: "confidenceScore", currentValue: latestCheckin?.confidenceScore || "" })}
          </div>
          <div class="field">
            <label>흥미 점수</label>
            ${renderRatingGroup({ name: "interestScore", currentValue: latestCheckin?.interestScore || "" })}
          </div>
          <div class="field full">
            <label for="note">오늘 막혔던 점 또는 예상외로 좋았던 점</label>
            <textarea id="note" name="note" placeholder="예: 공개하려니 너무 어색했어요. 대신 결과물을 고르는 건 재밌었어요.">${latestCheckin?.note || ""}</textarea>
          </div>
          <div class="inline-actions">
            <button class="primary-button" type="submit">체크인 저장</button>
          </div>
        </form>
        ${feedback ? `<div class="feedback-card"><strong>지금 필요한 한마디</strong><p>${feedback}</p></div>` : ""}
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="section-title">단계 회고</h2>
            <p class="section-copy">완료 직후 적는 한 줄이 다음 단계를 덜 흔들리게 만듭니다.</p>
          </div>
        </div>
        <form id="reflection-form">
          <input type="hidden" name="stageKey" value="${currentStage.key}" />
          <div class="field full">
            <label>이 단계가 끝나면 어떤 결정을 내릴 건가요?</label>
            ${renderSingleChoiceGroup({
              name: "decision",
              currentValue: latestReflection?.decision || "",
              columns: "three",
              choices: [
                { value: "continue", label: "계속 간다", description: "다음 단계로 넘어간다" },
                { value: "pause", label: "잠깐 멈춘다", description: "조금 쉬고 다시 본다" },
                { value: "pivot", label: "축을 바꾼다", description: "다른 추천으로 돌아간다" },
              ],
            })}
          </div>
          <div class="field full">
            <label for="reflectionMemo">무엇이 맞았고, 무엇이 안 맞았나요?</label>
            <textarea id="reflectionMemo" name="memo" placeholder="예: 만드는 과정은 좋았지만 고객을 모으는 방식은 바꿔야 할 것 같아요.">${latestReflection?.memo || ""}</textarea>
          </div>
          <div class="inline-actions">
            <button class="secondary-button" type="submit">회고 저장</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderSettings() {
  const user = state.user;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">설정</h2>
          <p class="section-copy">알림 시간과 프로필만 가볍게 다듬는 공간입니다.</p>
        </div>
      </div>
      <div class="summary-card slim-card">
        <h3>${user.displayName || "이름 미입력"}</h3>
        <p class="helper-text">${user.city || "지역 미입력"} · ${user.currentStatus || "상태 미입력"}</p>
      </div>
      <form id="settings-form" class="settings-form">
        <div class="field full">
          <label>하루 한 번 리마인드</label>
          ${renderSingleChoiceGroup({
            name: "remindersEnabled",
            currentValue: state.settings.remindersEnabled ? "on" : "off",
            columns: "two",
            choices: [
              { value: "on", label: "켜기", description: "하루 한 번 떠올리기" },
              { value: "off", label: "끄기", description: "지금은 스스로 챙기기" },
            ],
          })}
        </div>
        <div class="field">
          <label for="reminderTime">생각나는 시간</label>
          <input id="reminderTime" name="reminderTime" type="time" value="${state.settings.reminderTime}" />
        </div>
        <div class="inline-actions">
          <button class="primary-button" type="submit">저장</button>
          <button class="secondary-button" type="button" data-action="test-notification">알림 테스트</button>
          <button class="ghost-button" type="button" data-action="reset-state">처음부터 다시</button>
        </div>
      </form>
    </section>
  `;
}

function renderPainFitIntro() {
  return `
    <section class="painfit-page painfit-hero">
      <div class="painfit-hero-copy">
        <span class="painfit-kicker">Pain-Fit Career Mapping</span>
        <h2>직업을 맞히기보다,<br />오래 버틸 수 있는 업무 마찰을 봅니다.</h2>
        <p>
          좋아하는 일을 찾기 전에 먼저 확인합니다. 어떤 종류의 피로는 자고 일어나면 사라지고,
          어떤 종류의 피로는 며칠을 가는지 28개 질문으로 그려봅니다.
        </p>
        <div class="inline-actions">
          <button class="painfit-primary-button" type="button" data-action="painfit-step" data-step="mode">진단 시작</button>
          <button class="painfit-ghost-button" type="button" data-action="navigate" data-view="welcome">홈으로</button>
        </div>
      </div>
      <aside class="painfit-thesis-card">
        <span>핵심 가설</span>
        <strong>직업은 특정 과업의 조합이고, 그 과업은 반복되는 고통의 결을 만듭니다.</strong>
        <p>결과는 정답이 아니라, 2시간짜리 검증 실험으로 확인할 후보입니다.</p>
      </aside>
    </section>
  `;
}

function renderPainFitMode() {
  return `
    <section class="painfit-page painfit-panel">
      <div class="painfit-section-head">
        <span class="painfit-kicker">Step 01</span>
        <h2>지금 당신은 어디쯤에 있습니까?</h2>
        <p>선택에 따라 결과 해석의 초점이 달라집니다.</p>
      </div>
      <div class="painfit-mode-grid">
        <button class="painfit-mode-card" type="button" data-action="painfit-mode" data-mode="youth">
          <span>A · 탐색기</span>
          <strong>아직 정하지 않았다</strong>
          <p>진로를 처음 탐색하거나, 무엇을 하고 싶은지 잘 모르겠습니다.</p>
          <em>작은 실험 중심 결과</em>
        </button>
        <button class="painfit-mode-card" type="button" data-action="painfit-mode" data-mode="transition">
          <span>B · 전환기</span>
          <strong>바꾸고 싶다</strong>
          <p>지금 일이 맞지 않는 것 같고, 다음 방향을 찾고 있습니다.</p>
          <em>소진 원인과 전환 방향</em>
        </button>
      </div>
      <div class="painfit-bottom-actions">
        <button class="painfit-ghost-button" type="button" data-action="painfit-step" data-step="intro">처음으로</button>
      </div>
    </section>
  `;
}

function renderPainFitQuiz() {
  const question = PAINFIT_QUESTIONS[painFitState.currentQ] || PAINFIT_QUESTIONS[0];
  const currentAnswer = painFitState.answers[question.id];
  const progress = ((painFitState.currentQ + 1) / PAINFIT_QUESTIONS.length) * 100;

  return `
    <section class="painfit-page painfit-panel painfit-quiz">
      <div class="painfit-progress-head">
        <span>${String(painFitState.currentQ + 1).padStart(2, "0")} / ${PAINFIT_QUESTIONS.length}</span>
        <strong>${PAINFIT_DOMAINS[question.domain].label}</strong>
      </div>
      <div class="painfit-progress-track" aria-hidden="true">
        <span style="width: ${progress}%"></span>
      </div>
      <div class="painfit-question-card">
        <span class="painfit-kicker">Q${painFitState.currentQ + 1}</span>
        <h2>${question.text}</h2>
        <div class="painfit-option-list">
          ${PAINFIT_OPTIONS.map(
            (option, index) => `
              <button
                class="painfit-option-button ${String(currentAnswer) === String(option.value) ? "is-selected" : ""}"
                type="button"
                data-action="painfit-answer"
                data-question-id="${question.id}"
                data-value="${option.value}"
              >
                <span>${String.fromCharCode(65 + index)}</span>
                <span class="painfit-option-copy">
                  <strong>${option.label}</strong>
                  ${option.detail ? `<small>${option.detail}</small>` : ""}
                </span>
              </button>
            `
          ).join("")}
        </div>
      </div>
      <div class="painfit-bottom-actions">
        <button class="painfit-ghost-button" type="button" data-action="painfit-prev" ${painFitState.currentQ === 0 ? "disabled" : ""}>이전</button>
        <button class="painfit-ghost-button" type="button" data-action="painfit-step" data-step="intro">처음으로</button>
      </div>
    </section>
  `;
}

function renderPainFitRadar(scores) {
  const center = 200;
  const radius = 128;
  const points = PAINFIT_DOMAIN_KEYS.map((domain, index) => {
    const angle = (Math.PI * 2 * index) / PAINFIT_DOMAIN_KEYS.length - Math.PI / 2;
    const distance = radius * (0.2 + (scores[domain] / 3) * 0.8);
    return {
      domain,
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 34),
      labelY: center + Math.sin(angle) * (radius + 34),
      gridX: center + Math.cos(angle) * radius,
      gridY: center + Math.sin(angle) * radius,
    };
  });
  const grid = [0.35, 0.68, 1]
    .map((scale) => {
      const polygon = points
        .map((point) => `${center + (point.gridX - center) * scale},${center + (point.gridY - center) * scale}`)
        .join(" ");
      return `<polygon points="${polygon}" fill="none" stroke="rgba(28,24,22,0.13)" stroke-width="1" />`;
    })
    .join("");

  return `
    <svg class="painfit-radar" viewBox="0 0 400 400" role="img" aria-label="고통 영역 프로파일">
      ${grid}
      ${points
        .map((point) => `<line x1="${center}" y1="${center}" x2="${point.gridX}" y2="${point.gridY}" stroke="rgba(28,24,22,0.13)" stroke-width="1" />`)
        .join("")}
      <polygon points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="rgba(139,58,47,0.15)" stroke="#8b3a2f" stroke-width="2" />
      ${points
        .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${PAINFIT_DOMAINS[point.domain].color}" />`)
        .join("")}
      ${points
        .map((point) => `<text x="${point.labelX}" y="${point.labelY}" text-anchor="middle" dominant-baseline="middle">${PAINFIT_DOMAINS[point.domain].label}</text>`)
        .join("")}
    </svg>
  `;
}

function renderPainFitJobCard(job, index, scores, stats) {
  const fitReasons = job.requires.filter((domain) => scores[domain] < 1.3);
  const riskAreas = job.requires.filter((domain) => scores[domain] > 1.8);
  const reliefAreas = job.lowDemand.filter((domain) => scores[domain] > 1.8);
  const scoreLabel = stats.reliability < 65 ? `가설 적합도 ${job.matchScore}점` : `적합도 ${job.matchScore}점`;

  return `
    <article class="painfit-job-card">
      <div class="painfit-job-head">
        <div>
          <span>#${String(index + 1).padStart(2, "0")} · ${scoreLabel}</span>
          <h3>${job.name}</h3>
          <p>${job.desc}</p>
        </div>
        <div class="painfit-match-meter" style="--match: ${job.matchScore}%"><span></span></div>
      </div>
      <div class="painfit-job-grid">
        <div>
          <strong>맞는 이유</strong>
          <p>
            ${
              fitReasons.length
                ? `${fitReasons.map(getPainFitDomainLabel).join(", ")} 영역의 회복 비용이 낮습니다. 이 일이 요구하는 핵심 마찰과 현재 패턴이 잘 겹칩니다.`
                : "강한 가산 신호는 약하지만, 큰 충돌 영역이 적어 실험 후보로 남았습니다."
            }
          </p>
          ${reliefAreas.length ? `<p>또 이 일은 ${reliefAreas.map(getPainFitDomainLabel).join(", ")} 부담을 상대적으로 적게 요구합니다.</p>` : ""}
        </div>
        <div>
          <strong>주의할 점</strong>
          <p>
            ${
              riskAreas.length
                ? `${riskAreas.map(getPainFitDomainLabel).join(", ")} 영역의 회복이 느립니다. 이 비중이 큰 환경이면 장기 소진 위험이 있습니다.`
                : "현재 답변 기준으로 큰 충돌 신호는 적습니다. 다만 실제 팀, 고객, 마감 강도에 따라 달라질 수 있습니다."
            }
          </p>
        </div>
        <div>
          <strong>2시간 검증 실험</strong>
          <p>${job.experiment} 끝난 뒤 다시 해볼 만한지, 다음 날 잔상이 남는지 기록하세요.</p>
        </div>
      </div>
    </article>
  `;
}

function renderPainFitAvoidCard(job, index, scores) {
  const conflicts = job.requires.filter((domain) => scores[domain] > 1.8);
  return `
    <article class="painfit-avoid-card">
      <span>#${index + 1}</span>
      <h3>${job.name}</h3>
      <p>${job.desc}</p>
      <div class="painfit-chip-row">
        ${renderPainFitDomainTags(conflicts, "risk")}
      </div>
    </article>
  `;
}

function renderPainFitFeedback() {
  const feedback = painFitState.feedback;
  if (feedback.submitted) {
    return `
      <div class="painfit-feedback-done">
        <strong>피드백을 남겼습니다.</strong>
        <p>다음 버전에서 추천 설명과 직업 데이터를 다듬는 데 사용하겠습니다.</p>
      </div>
    `;
  }

  return `
    <div class="painfit-rating-row" aria-label="정확도">
      ${[1, 2, 3, 4, 5]
        .map(
          (value) => `
            <button
              type="button"
              class="painfit-star-button ${feedback.rating >= value ? "is-selected" : ""}"
              data-action="painfit-rating"
              data-rating="${value}"
              aria-label="${value}점"
            >★</button>
          `
        )
        .join("")}
    </div>
    <div class="painfit-feedback-grid">
      <label>
        <span>가장 와닿은 문장</span>
        <textarea data-painfit-feedback="hit" placeholder="예: 회복이 느린 영역이 정확하다">${escapeHtml(feedback.hit)}</textarea>
      </label>
      <label>
        <span>이상하거나 틀렸다고 느낀 부분</span>
        <textarea data-painfit-feedback="miss" placeholder="예: 추천된 직업 중 X는 안 맞을 것 같다">${escapeHtml(feedback.miss)}</textarea>
      </label>
    </div>
    <button class="painfit-primary-button" type="button" data-action="painfit-submit-feedback" ${feedback.rating ? "" : "disabled"}>피드백 보내기</button>
  `;
}

function renderPainFitResults() {
  const scores = getPainFitScores();
  const stats = getPainFitStats();
  const matches = getPainFitMatches(scores);
  const sortedDomains = Object.entries(scores).sort((left, right) => left[1] - right[1]);
  const knownSortedDomains = sortedDomains.filter(([domain]) => stats.domainKnownCounts[domain] > 0);
  const summaryDomains = knownSortedDomains.length ? knownSortedDomains : sortedDomains;
  const tolerable = summaryDomains.slice(0, 3);
  const intolerable = summaryDomains.slice(-2).reverse();
  const copy = getPainFitCopy(painFitState.mode);
  const formatDomainList = (domains) =>
    domains.length && stats.knownCount
      ? domains.map(([domain]) => PAINFIT_DOMAINS[domain].label).join(" · ")
      : "아직 판단 어려움";

  return `
    <section class="painfit-page painfit-results">
      <div class="painfit-result-hero">
        <span class="painfit-kicker">결과 리포트 · ${copy.badge}</span>
        <h2>당신이 견디는<br />고통의 결</h2>
        <p>
          ${painFitState.mode === "transition"
            ? "지금까지 닳았던 이유를 보여드립니다. 다음 일을 고를 때 같은 패턴을 반복하지 않는 데 초점을 맞춥니다."
            : "아직 직업을 확정할 필요는 없습니다. 먼저 어떤 결의 일이 회복 사이클과 맞는지 확인하세요."}
        </p>
      </div>

      <section class="painfit-figure-grid">
        <div class="painfit-panel flat">
          <span class="painfit-kicker">Figure 01</span>
          <h3>고통 영역 프로파일</h3>
          <p>안쪽일수록 잘 견디고, 바깥쪽일수록 회복이 느립니다.</p>
          <div class="painfit-score-list">
            ${sortedDomains
              .map(
                ([domain, value]) => `
                  <div class="painfit-score-row ${stats.domainKnownCounts[domain] ? "" : "is-estimated"}">
                    <span>${PAINFIT_DOMAINS[domain].label}${stats.domainKnownCounts[domain] ? "" : "<em>근거 부족</em>"}</span>
                    <div><i style="width: ${(value / 3) * 100}%; background: ${PAINFIT_DOMAINS[domain].color};"></i></div>
                    <strong>${stats.domainKnownCounts[domain] ? value.toFixed(1) : "추정"}</strong>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="painfit-radar-card">
          ${renderPainFitRadar(scores)}
        </div>
      </section>

      <section class="painfit-summary-grid">
        <article class="painfit-summary-card strong">
          <span>잘 견디는 영역</span>
          <strong>${formatDomainList(tolerable)}</strong>
          <p>이 결의 일은 당신을 덜 닳게 할 가능성이 큽니다.</p>
        </article>
        <article class="painfit-summary-card risk">
          <span>회복이 느린 영역</span>
          <strong>${formatDomainList(intolerable)}</strong>
          <p>이 결의 일은 주업으로 삼기 전 실제 강도를 꼭 확인하세요.</p>
        </article>
        <article class="painfit-summary-card reliability ${stats.reliability < 65 ? "low" : ""}">
          <span>평가 신뢰도</span>
          <strong>${stats.reliability}점 · ${stats.label}</strong>
          <p>${stats.note}</p>
          <div class="painfit-reliability-meter" style="--reliability: ${stats.reliability}%"><i></i></div>
          <small>근거 답변 ${stats.knownCount}/${PAINFIT_QUESTIONS.length} · 잘 모르겠다 ${stats.unknownCount}개 · 영역 ${stats.coveredDomains}/${PAINFIT_DOMAIN_KEYS.length}</small>
        </article>
      </section>

      <section class="painfit-panel">
        <div class="painfit-section-head">
          <span class="painfit-kicker">Figure 03</span>
          <h2>${copy.headline}</h2>
          <p>${copy.sub}</p>
        </div>
        <div class="painfit-job-list">
          ${matches.fit.map((job, index) => renderPainFitJobCard(job, index, scores, stats)).join("")}
        </div>
      </section>

      <section class="painfit-panel warning">
        <div class="painfit-section-head">
          <span class="painfit-kicker">Figure 04</span>
          <h2>${copy.avoidLabel}</h2>
          <p>${copy.avoidSub}</p>
        </div>
        <div class="painfit-avoid-grid">
          ${matches.avoid.map((job, index) => renderPainFitAvoidCard(job, index, scores)).join("")}
        </div>
      </section>

      <section class="painfit-panel">
        <div class="painfit-section-head">
          <span class="painfit-kicker">Feedback</span>
          <h2>이 결과가 당신을 얼마나 잘 설명하나요?</h2>
          <p>정확도 피드백은 다음 버전의 문항, 직업 데이터, 해설을 다듬는 데 사용합니다.</p>
        </div>
        ${renderPainFitFeedback()}
      </section>

      <section class="painfit-actions-panel">
        <button class="painfit-ghost-button" type="button" data-action="painfit-reset">다시하기</button>
        <button class="painfit-primary-button" type="button" data-action="painfit-share-card">결과 카드 저장 PNG</button>
        <button class="painfit-ghost-button" type="button" data-action="navigate" data-view="welcome">홈으로</button>
      </section>
      <p class="painfit-disclaimer">
        이 진단은 단발성 참고 도구입니다. 같은 사람도 시기, 체력, 환경에 따라 답이 달라집니다.
        직업명은 결론이 아니라 카드 안의 2시간 검증 실험으로 확인할 후보입니다.
      </p>
    </section>
  `;
}

function renderPainFit() {
  if (painFitState.step === "mode") return renderPainFitMode();
  if (painFitState.step === "quiz") return renderPainFitQuiz();
  if (painFitState.step === "result") return renderPainFitResults();
  return renderPainFitIntro();
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;

  if (canvas.toBlob) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
    return;
  }

  link.href = canvas.toDataURL("image/png");
  link.click();
}

function sharePainFitCard() {
  const scores = getPainFitScores();
  const stats = getPainFitStats();
  const matches = getPainFitMatches(scores);
  if (!matches.fit.length) {
    setToast("진단을 완료한 뒤 저장할 수 있어요.");
    return;
  }

  const sortedDomains = Object.entries(scores).sort((left, right) => left[1] - right[1]);
  const tolerableText = sortedDomains.slice(0, 3).map(([domain]) => PAINFIT_DOMAINS[domain].label).join(" · ");
  const slowText = sortedDomains.slice(-2).reverse().map(([domain]) => PAINFIT_DOMAINS[domain].label).join(" · ");
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 2600; index += 1) {
    ctx.fillStyle = `rgba(28,24,22,${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.fillStyle = "#1c1816";
  ctx.font = "700 26px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("BE ANYTHING · PAIN-FIT REPORT", 80, 100);
  ctx.globalAlpha = 0.45;
  ctx.fillText("2026", 910, 100);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#1c1816";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 132);
  ctx.lineTo(1000, 132);
  ctx.stroke();

  ctx.font = "800 82px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("내가 견디는", 80, 265);
  ctx.fillText("고통의 결", 80, 365);

  ctx.globalAlpha = 0.55;
  ctx.font = "700 24px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("잘 견디는 영역", 80, 500);
  ctx.globalAlpha = 1;
  ctx.font = "800 58px Apple SD Gothic Neo, sans-serif";
  ctx.fillText(tolerableText, 80, 575);

  ctx.globalAlpha = 0.55;
  ctx.font = "700 24px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("회복이 느린 영역", 80, 700);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#8b3a2f";
  ctx.font = "800 58px Apple SD Gothic Neo, sans-serif";
  ctx.fillText(slowText, 80, 775);

  ctx.fillStyle = "#1c1816";
  ctx.globalAlpha = 0.55;
  ctx.font = "700 24px Apple SD Gothic Neo, sans-serif";
  ctx.fillText(`평가 신뢰도 ${stats.reliability}점 · ${stats.label}`, 80, 885);
  ctx.globalAlpha = 1;
  ctx.font = "500 26px Apple SD Gothic Neo, sans-serif";
  ctx.fillText(`근거 답변 ${stats.knownCount}/28 · 잘 모르겠다 ${stats.unknownCount}개`, 80, 930);

  ctx.globalAlpha = 0.55;
  ctx.font = "700 24px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("실험해볼 만한 일", 80, 1010);
  ctx.globalAlpha = 1;
  ctx.font = "700 46px Apple SD Gothic Neo, sans-serif";
  matches.fit.slice(0, 3).forEach((job, index) => {
    ctx.fillText(`${index + 1}. ${job.name}`, 80, 1085 + index * 62);
  });

  ctx.globalAlpha = 0.45;
  ctx.font = "500 22px Apple SD Gothic Neo, sans-serif";
  ctx.fillText("직업명은 결론이 아니라 2시간 검증 실험으로 확인할 후보입니다.", 80, 1268);
  ctx.globalAlpha = 1;

  downloadCanvas(canvas, "painfit-result.png");
}

function renderMain() {
  switch (state.currentView) {
    case "welcome":
      return renderWelcome();
    case "painfit":
      return renderPainFit();
    case "dream":
      return renderDream();
    case "profile":
      return renderProfile();
    case "interests":
      return renderAssessment("interests");
    case "workstyle":
      return renderAssessment("workstyle");
    case "exploration":
      return renderExploration();
    case "loading":
      return renderLoading();
    case "recommendations":
      return renderRecommendations();
    case "dashboard":
      return renderDashboard();
    case "settings":
      return renderSettings();
    default:
      return renderWelcome();
  }
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      <div class="shell-inner">
        ${renderHeader()}
        ${renderTopNav()}
        ${renderProgress()}
        <main class="layout-grid">
          ${renderMain()}
        </main>
      </div>
      ${toastMessage ? `<div class="toast">${toastMessage}</div>` : ""}
    </div>
  `;
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    setToast("이 브라우저에서는 알림 테스트가 어렵습니다.");
    return;
  }

  Notification.requestPermission().then((permission) => {
    updateState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        permission,
      },
    }), { silent: true });

    if (permission === "granted") {
      new Notification("Be Anything", {
        body: "오늘 한 걸음만 더 가보세요. 결과물은 생각보다 작은 데서 시작됩니다.",
        icon: "./assets/icon.svg",
      });
    }
  });
}

async function syncServiceWorkerForEnvironment() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalhost =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]";

  if (isLocalhost) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.error("Failed to clear local service workers", error);
    }
    return;
  }

  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("Service worker registration failed", error);
  });
}

function scrollToHomeSection(sectionId) {
  const run = () => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (state.currentView === "welcome") {
    run();
    return;
  }

  updateState((current) => ({ ...applyVisibleDraft(current), currentView: "welcome" }), { silent: false });
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(run);
  });
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action } = target.dataset;

  if (action === "start-flow") {
    updateState((current) => ({ ...current, currentView: "dream" }));
  }

  if (action === "load-demo") {
    hydrateDemoState(target.dataset.demo);
  }

  if (action === "navigate") {
    updateState((current) => ({ ...applyVisibleDraft(current), currentView: target.dataset.view }), { silent: false });
  }

  if (action === "view-journey-explanation") {
    updateState((current) => ({
      ...applyVisibleDraft(current),
      selectedCareerSlug: target.dataset.slug || current.activeJourney?.careerSlug || current.selectedCareerSlug,
      currentView: "recommendations",
    }), { silent: false });
  }

  if (action === "home-section") {
    scrollToHomeSection(target.dataset.section);
  }

  if (action === "painfit-step") {
    painFitState = { ...painFitState, step: target.dataset.step || "intro" };
    savePainFitState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "painfit-mode") {
    painFitState = {
      ...painFitState,
      mode: target.dataset.mode || "youth",
      step: "quiz",
      currentQ: 0,
    };
    savePainFitState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "painfit-answer") {
    const questionId = target.dataset.questionId;
    const value = target.dataset.value === PAINFIT_UNKNOWN_VALUE ? PAINFIT_UNKNOWN_VALUE : Number(target.dataset.value);
    const isLast = painFitState.currentQ >= PAINFIT_QUESTIONS.length - 1;
    painFitState = {
      ...painFitState,
      answers: { ...painFitState.answers, [questionId]: value },
      currentQ: isLast ? painFitState.currentQ : painFitState.currentQ + 1,
      step: isLast ? "result" : "quiz",
    };
    savePainFitState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "painfit-prev") {
    painFitState = {
      ...painFitState,
      currentQ: Math.max(0, painFitState.currentQ - 1),
      step: "quiz",
    };
    savePainFitState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "painfit-reset") {
    painFitState = createPainFitState();
    savePainFitState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "painfit-rating") {
    painFitState = {
      ...painFitState,
      feedback: { ...painFitState.feedback, rating: Number(target.dataset.rating) },
    };
    savePainFitState();
    render();
  }

  if (action === "painfit-submit-feedback") {
    if (!painFitState.feedback.rating) {
      setToast("정확도 점수를 먼저 골라주세요.");
      return;
    }
    painFitState = {
      ...painFitState,
      feedback: { ...painFitState.feedback, submitted: true },
    };
    savePainFitState();
    render();
  }

  if (action === "painfit-share-card") {
    sharePainFitCard();
  }

  if (action === "set-form-value") {
    const group = target.closest("[data-choice-group]");
    const hiddenInput = group?.querySelector(`input[name="${target.dataset.name}"]`);
    if (!group || !hiddenInput) return;
    hiddenInput.value = target.dataset.value;
    group.querySelectorAll(`[data-action="set-form-value"]`).forEach((button) => {
      button.classList.toggle("is-selected", button === target);
    });
  }

  if (action === "toggle-form-value") {
    const group = target.closest("[data-choice-group]");
    const hiddenInput = group?.querySelector(`input[name="${target.dataset.name}"]`);
    if (!group || !hiddenInput) return;

    const current = parseMultiValue(hiddenInput.value);
    const max = Number(group.dataset.max || 99);
    const exists = current.includes(target.dataset.value);
    const next = exists
      ? current.filter((item) => item !== target.dataset.value)
      : current.length >= max
        ? current
        : [...current, target.dataset.value];

    if (!exists && current.length >= max) {
      setToast(`최대 ${max}개까지 고를 수 있어요.`);
      return;
    }

    hiddenInput.value = next.join("|");
    group.querySelectorAll(`[data-action="toggle-form-value"]`).forEach((button) => {
      button.classList.toggle("is-selected", next.includes(button.dataset.value));
    });
  }

  if (action === "set-answer") {
    const kind = target.dataset.kind;
    const index = Number(target.dataset.index);
    const value = Number(target.dataset.value);
    updateState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        [kind === "interests" ? "interestAnswers" : "styleAnswers"]: (
          kind === "interests"
            ? [...current.assessments.interestAnswers]
            : [...current.assessments.styleAnswers]
        ).map((item, position) => (position === index ? value : item)),
      },
    }), { silent: true });
  }

  if (action === "assessment-page") {
    const kind = target.dataset.kind;
    const direction = target.dataset.direction;
    const config = ASSESSMENT_CONFIG[kind];
    const page = state.assessments[config.pageKey];
    const answers = state.assessments[config.answersKey];
    const start = page * config.pageSize;
    const currentAnswers = answers.slice(start, start + config.pageSize);

    if (direction === "next" && currentAnswers.some((answer) => !answer)) {
      setToast("현재 페이지 문항을 먼저 모두 눌러주세요.");
      return;
    }

    updateState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        [config.pageKey]: Math.min(
          Math.max(current.assessments[config.pageKey] + (direction === "next" ? 1 : -1), 0),
          Math.ceil(config.questions.length / config.pageSize) - 1
        ),
      },
    }));
  }

  if (action === "select-career") {
    updateState((current) => ({ ...current, selectedCareerSlug: target.dataset.slug }), { silent: true });
  }

  if (action === "toggle-save") {
    const slug = target.dataset.slug;
    updateState((current) => ({
      ...current,
      savedCareerSlugs: current.savedCareerSlugs.includes(slug)
        ? current.savedCareerSlugs.filter((item) => item !== slug)
        : [...current.savedCareerSlugs, slug],
    }), { silent: true });
  }

  if (action === "start-journey") {
    const recommendation = state.recommendations.find((item) => item.slug === target.dataset.slug);
    if (!recommendation) return;
    const journey = buildJourney(recommendation, JOURNEY_BLUEPRINTS);
    updateState((current) => ({
      ...current,
      activeJourney: journey,
      currentView: "dashboard",
      savedCareerSlugs: current.savedCareerSlugs.includes(recommendation.slug)
        ? current.savedCareerSlugs
        : [...current.savedCareerSlugs, recommendation.slug],
    }));
  }

  if (action === "toggle-task") {
    const stageKey = target.dataset.stage;
    const taskId = target.dataset.task;
    updateState((current) => ({
      ...current,
      activeJourney: {
        ...current.activeJourney,
        stages: current.activeJourney.stages.map((stage) =>
          stage.key !== stageKey
            ? stage
            : {
                ...stage,
                tasks: stage.tasks.map((task) =>
                  task.id !== taskId
                    ? task
                    : {
                        ...task,
                        status: task.status === "done" ? "todo" : "done",
                        completedAt: task.status === "done" ? null : new Date().toISOString(),
                      }
                ),
              }
        ),
      },
    }), { silent: true });
  }

  if (action === "switch-stage") {
    updateState((current) => ({
      ...current,
      activeJourney: {
        ...current.activeJourney,
        currentStageKey: target.dataset.stage,
      },
    }), { silent: true });
  }

  if (action === "advance-stage") {
    const nextKey = getNextStageKey(state.activeJourney.currentStageKey);
    if (!nextKey) return;
    updateState((current) => ({
      ...current,
      activeJourney: {
        ...current.activeJourney,
        currentStageKey: nextKey,
      },
    }));
  }

  if (action === "test-notification") {
    requestNotificationPermission();
  }

  if (action === "reset-state") {
    resetAll();
    setToast("처음 상태로 돌아갔어요.");
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return;
  const feedbackField = target.dataset.painfitFeedback;
  if (!feedbackField) return;

  painFitState = {
    ...painFitState,
    feedback: {
      ...painFitState.feedback,
      [feedbackField]: target.value,
    },
  };
  savePainFitState();
});

app.addEventListener("submit", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) return;
  event.preventDefault();
  const formData = new FormData(target);

  if (target.id === "dream-form") {
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const modes = parseMultiValue(formData.get("modes"));

    if (!title || !description) {
      setToast("무엇이 되고 싶은지와 그 장면을 먼저 적어주세요.");
      return;
    }

    if (!modes.length) {
      setToast("이 꿈의 성격을 최소 1개는 골라주세요.");
      return;
    }

    updateState((current) => ({
      ...current,
      dream: {
        ...current.dream,
        title,
        description,
        whyThisMatters: String(formData.get("whyThisMatters") || "").trim(),
        visualNote: String(formData.get("visualNote") || "").trim(),
        referenceImageUrl: String(formData.get("referenceImageUrl") || "").trim(),
        inspirationSlug: String(formData.get("inspirationSlug") || "").trim(),
        modes,
        blockers: parseMultiValue(formData.get("blockers")),
      },
      currentView: "profile",
    }));
  }

  if (target.id === "profile-form") {
    const birthYear = String(formData.get("birthYear") || "").trim();
    const currentStatus = String(formData.get("currentStatus") || "");
    const weeklyTimeBudget = String(formData.get("weeklyTimeBudget") || "");
    const incomeUrgency = String(formData.get("incomeUrgency") || "");

    if (!birthYear || !currentStatus || !weeklyTimeBudget || !incomeUrgency) {
      setToast("출생연도와 현재 상황, 시간, 수입 기준은 꼭 골라주세요.");
      return;
    }

    updateState((current) => ({
      ...current,
      user: {
        ...current.user,
        displayName: String(formData.get("displayName") || "").trim(),
        birthYear,
        ageBand: getAgeBand(birthYear),
        city: String(formData.get("city") || "").trim(),
        experienceSummary: String(formData.get("experienceSummary") || "").trim(),
        currentStatus,
        weeklyTimeBudget,
        incomeUrgency,
        primaryGoal: String(formData.get("primaryGoal") || ""),
        peoplePreference: String(formData.get("peoplePreference") || ""),
        remotePreference: String(formData.get("remotePreference") || "any"),
        physicalDemandLimit: String(formData.get("physicalDemandLimit") || "unknown"),
      },
      currentView: "interests",
    }));
  }

  if (target.id === "interests-form") {
    if (state.assessments.interestAnswers.some((answer) => !answer)) {
      setToast("모든 문항을 먼저 눌러주세요.");
      return;
    }

    updateState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        interestResult: computeRiasecResult(RIASEC_QUESTIONS, current.assessments.interestAnswers),
      },
      currentView: "workstyle",
    }));
  }

  if (target.id === "workstyle-form") {
    if (state.assessments.styleAnswers.some((answer) => !answer)) {
      setToast("모든 문항을 먼저 눌러주세요.");
      return;
    }

    updateState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        styleResult: computeBigFiveResult(BIG_FIVE_QUESTIONS, current.assessments.styleAnswers),
      },
      currentView: "exploration",
    }));
  }

  if (target.id === "exploration-form") {
    const nextAnswers = Object.fromEntries(
      EXPLORATION_QUESTIONS.map((question) => [question.id, String(formData.get(question.id) || "").trim()])
    );

    if (Object.values(nextAnswers).some((value) => !value)) {
      setToast("빈칸 없이 적을수록 경로가 더 정확해져요.");
      return;
    }

    updateState((current) => ({
      ...current,
      exploration: {
        ...current.exploration,
        answers: nextAnswers,
      },
    }), { silent: true });

    startLoadingRecommendations();
  }

  if (target.id === "checkin-form") {
    const stageKey = String(formData.get("stageKey") || "");
    const completionStatus = String(formData.get("completionStatus") || "");
    if (!completionStatus) {
      setToast("오늘 어디까지 했는지 먼저 골라주세요.");
      return;
    }

    const entry = {
      id: `${stageKey}-${Date.now()}`,
      stageKey,
      completionStatus,
      confidenceScore: Number(formData.get("confidenceScore") || 0),
      interestScore: Number(formData.get("interestScore") || 0),
      note: String(formData.get("note") || "").trim(),
      createdAt: new Date().toISOString(),
    };

    updateState((current) => ({
      ...current,
      activeJourney: {
        ...current.activeJourney,
        checkins: [...current.activeJourney.checkins.filter((item) => item.stageKey !== stageKey), entry],
      },
    }), { silent: true });
    setToast("오늘 체크인을 남겼어요.");
  }

  if (target.id === "reflection-form") {
    const decision = String(formData.get("decision") || "");
    const memo = String(formData.get("memo") || "").trim();
    const stageKey = String(formData.get("stageKey") || "");

    if (!decision) {
      setToast("이 단계의 결론을 하나 골라주세요.");
      return;
    }

    const reflection = {
      id: `${stageKey}-${Date.now()}`,
      stageKey,
      decision,
      memo,
      createdAt: new Date().toISOString(),
    };

    updateState((current) => ({
      ...current,
      reflections: [...current.reflections.filter((item) => item.stageKey !== stageKey), reflection],
      activeJourney: {
        ...current.activeJourney,
        reflections: [...current.activeJourney.reflections.filter((item) => item.stageKey !== stageKey), reflection],
      },
      currentView: decision === "pivot" ? "recommendations" : current.currentView,
    }), { silent: decision === "pivot" });
    setToast(decision === "pivot" ? "추천 목록으로 돌아갑니다." : "회고를 남겼어요.");
  }

  if (target.id === "settings-form") {
    updateState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        remindersEnabled: String(formData.get("remindersEnabled") || "off") === "on",
        reminderTime: String(formData.get("reminderTime") || "20:00"),
      },
    }), { silent: true });
    setToast("설정을 저장했어요.");
  }
});

function init() {
  refreshStoredRecommendationsIfNeeded();
  render();
  syncServiceWorkerForEnvironment();
}

init();
