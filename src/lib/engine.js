const RIASEC_KEYS = ["R", "I", "A", "S", "E", "C"];
const BIG_FIVE_KEYS = ["O", "C", "E", "A", "N"];
const STAGE_ORDER = ["seven", "thirty", "ninety", "revenue"];
const STUDENT_STATUSES = new Set([
  "elementary_student",
  "middle_school_student",
  "high_school_student",
  "university_student",
]);
const YOUNG_STUDENT_STATUSES = new Set(["elementary_student", "middle_school_student"]);
const PRE_ADULT_STUDENT_STATUSES = new Set(["elementary_student", "middle_school_student", "high_school_student"]);
const STUDENT_PRIORITY_SLUGS = {
  elementary_student: new Set([
    "children-story-creator",
    "kids-craft-kit-maker",
    "digital-collage-artist",
    "illustration-commission-artist",
    "reading-writing-tutor",
    "craft-class-instructor",
    "hobby-community-teacher",
    "mindful-journaling-guide",
  ]),
  middle_school_student: new Set([
    "ai-image-prompt-designer",
    "children-story-creator",
    "digital-collage-artist",
    "sns-template-designer",
    "canva-template-creator",
    "ai-content-editor",
    "notion-template-seller",
    "kids-craft-kit-maker",
  ]),
  high_school_student: new Set([
    "career-portfolio-mentor",
    "presentation-visual-editor",
    "ai-content-editor",
    "sns-template-designer",
    "education-program-planner",
    "reading-writing-tutor",
    "notion-template-seller",
    "small-business-sns-teacher",
  ]),
  university_student: new Set([
    "sns-template-designer",
    "recipe-content-writer",
    "brand-visual-designer",
    "copywriter-for-small-brands",
    "notion-template-seller",
    "social-media-manager",
    "canva-template-creator",
    "ai-content-editor",
    "creator-business-strategist",
  ]),
};
const STUDENT_NAME_OVERRIDES = {
  "children-story-creator": "그림책·캐릭터 이야기 프로젝트",
  "kids-craft-kit-maker": "어린이 공예 키트 프로젝트",
  "digital-collage-artist": "디지털 콜라주 작품 프로젝트",
  "illustration-commission-artist": "일러스트 포트폴리오 프로젝트",
  "ai-image-prompt-designer": "AI 이미지·게임 콘셉트 프로젝트",
  "career-portfolio-mentor": "학생 포트폴리오 프로젝트",
  "presentation-visual-editor": "발표자료 포트폴리오 프로젝트",
  "sns-template-designer": "SNS 템플릿 포트폴리오 프로젝트",
  "canva-template-creator": "캔바 템플릿 프로젝트",
  "notion-template-seller": "노션 템플릿 프로젝트",
  "recipe-content-writer": "콘텐츠 샘플 포트폴리오 프로젝트",
  "brand-visual-designer": "브랜드 비주얼 포트폴리오 프로젝트",
  "copywriter-for-small-brands": "카피라이팅 포트폴리오 프로젝트",
  "social-media-manager": "SNS 운영 포트폴리오 프로젝트",
  "ai-content-editor": "AI 콘텐츠 편집 프로젝트",
};
const KEYWORD_STOPWORDS = new Set([
  "가게",
  "고객",
  "공간",
  "글쓰기",
  "문서",
  "모임",
  "사진",
  "상품",
  "서비스",
  "수업",
  "운영",
  "일정",
  "정리",
  "지역",
  "체크리스트",
  "클래스",
  "프로그램",
  "생활",
]);
const SHORT_DOMAIN_KEYWORDS = new Set([
  "ai",
  "cs",
  "ppt",
  "sns",
  "줌",
  "차",
  "숲",
  "펫",
  "카페",
  "커피",
  "세무",
  "회계",
  "세금",
  "장부",
  "여행",
  "보험",
  "병원",
  "특허",
  "민원",
  "물류",
  "구매",
  "공사",
  "엑셀",
  "요가",
  "식물",
  "반려",
  "돌봄",
  "가족",
  "퇴직",
  "은퇴",
  "법률",
  "강의",
  "강사",
  "교육",
  "마음",
  "상담",
  "심리",
]);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function isStudentProfile(profile) {
  return STUDENT_STATUSES.has(profile?.currentStatus);
}

function isPreAdultStudent(profile) {
  return PRE_ADULT_STUDENT_STATUSES.has(profile?.currentStatus);
}

function cosineSimilarity(userVector, careerVector) {
  const numerator = userVector.reduce((sum, value, index) => sum + value * careerVector[index], 0);
  const userMagnitude = Math.sqrt(userVector.reduce((sum, value) => sum + value ** 2, 0));
  const careerMagnitude = Math.sqrt(careerVector.reduce((sum, value) => sum + value ** 2, 0));

  if (!userMagnitude || !careerMagnitude) {
    return 0.5;
  }

  return numerator / (userMagnitude * careerMagnitude);
}

function signedCosineSimilarity(userVector, careerVector) {
  const numerator = userVector.reduce((sum, value, index) => sum + value * careerVector[index], 0);
  const userMagnitude = Math.sqrt(userVector.reduce((sum, value) => sum + value ** 2, 0));
  const careerMagnitude = Math.sqrt(careerVector.reduce((sum, value) => sum + value ** 2, 0));

  if (!userMagnitude || !careerMagnitude) {
    return 0;
  }

  return numerator / (userMagnitude * careerMagnitude);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function spread(values) {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

function scoreLikertStrength(mean) {
  return clamp(18 + ((mean - 0.2) / 0.8) * 74, 18, 92);
}

function humanizeModes(modes) {
  const labels = {
    visual: "보이는 결과물",
    write: "글과 이야기",
    teach: "가르치는 일",
    guide: "사람을 이끄는 일",
    maker: "직접 만드는 일",
    business: "내 이름의 장사",
    community: "사람을 모으는 일",
    expert: "전문성과 경험",
    organize: "흐름을 정리하는 일",
    care: "돌봄과 웰니스",
  };

  return modes.map((mode) => labels[mode] || mode);
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function collectIntentText(dream, profile, summary) {
  return normalizeText(
    [
      dream.title,
      dream.description,
      dream.whyThisMatters,
      dream.visualNote,
      profile.experienceSummary,
      summary.motivator,
      summary.fearPoint,
      summary.stuckPoint,
      summary.nonNegotiable,
      summary.proofNeed,
    ].join(" ")
  );
}

function collectDreamIntentText(dream, summary) {
  return normalizeText(
    [
      dream.title,
      dream.description,
      dream.whyThisMatters,
      dream.visualNote,
      summary.dreamCore,
    ].join(" ")
  );
}

function isSearchableKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim();
  if (!normalized || KEYWORD_STOPWORDS.has(normalized)) return false;
  return normalized.length >= 3 || SHORT_DOMAIN_KEYWORDS.has(normalized);
}

function keywordAppearsAffirmatively(intentText, keyword) {
  let cursor = 0;
  while (cursor < intentText.length) {
    const index = intentText.indexOf(keyword, cursor);
    if (index === -1) return false;

    const previousBoundaries = [".", "!", "?", "\n", "。", "！", "？"].map((boundary) =>
      intentText.lastIndexOf(boundary, index)
    );
    const nextBoundaries = [".", "!", "?", "\n", "。", "！", "？"]
      .map((boundary) => intentText.indexOf(boundary, index + keyword.length))
      .filter((position) => position !== -1);
    const sentenceStart = Math.max(0, Math.max(...previousBoundaries) + 1);
    const sentenceEnd = nextBoundaries.length ? Math.min(...nextBoundaries) : intentText.length;
    const context = intentText.slice(sentenceStart, sentenceEnd);
    if (!/(없다|없고|없는|아니다|아니고|말고|제외|싫다|싫고|피하고|어렵다|어려운|못\s)/.test(context)) {
      return true;
    }

    cursor = index + keyword.length;
  }

  return false;
}

const NARROW_DOMAIN_RULES = [
  {
    pattern: /펫|반려|강아지|고양이|동물|pet/i,
    slugs: ["pet-care-studio-owner"],
    keywords: ["펫", "반려", "강아지", "고양이", "동물", "pet"],
    softSignals: ["care", "business"],
  },
  {
    pattern: /법률|법무|변호|소송|계약서|legal/i,
    slugs: ["paralegal-assistant"],
    keywords: ["법률", "법무", "변호", "소송", "계약서", "legal"],
    softSignals: ["expert", "organize"],
  },
  {
    pattern: /세무|회계|세금|장부|tax|accounting/i,
    slugs: ["tax-prep-support-partner"],
    keywords: ["세무", "회계", "세금", "장부", "tax", "accounting"],
    softSignals: ["expert", "organize"],
  },
  {
    pattern: /부동산|공인중개|임대|매물|real estate/i,
    slugs: ["real-estate-coordinator"],
    keywords: ["부동산", "공인중개", "매물", "real estate"],
    softSignals: ["expert", "organize"],
  },
  {
    pattern: /꽃|플라워|화훼|floral|flower/i,
    slugs: ["floral-visual-creator"],
    keywords: ["꽃", "플라워", "화훼", "floral", "flower"],
    softSignals: ["visual", "maker"],
  },
  {
    pattern: /캔들|향초|비누|아로마|candle/i,
    slugs: ["candle-studio-maker"],
    keywords: ["캔들", "향초", "비누", "아로마", "candle"],
    softSignals: ["maker", "business"],
  },
  {
    pattern: /카페|커피|음료|브런치|베이커리|cafe|coffee/i,
    slugs: ["small-cafe-concept-owner"],
    keywords: ["카페", "커피", "음료", "브런치", "베이커리", "cafe", "coffee"],
    softSignals: ["business", "community"],
  },
  {
    pattern: /심리|상담|마음|감정|정서|애도|상실|치유|mental|counsel/i,
    slugs: [
      "grief-journaling-guide",
      "mindful-journaling-guide",
      "caregiver-support-group-host",
      "pet-loss-support-host",
      "habit-reset-coach",
    ],
    keywords: ["심리", "상담", "마음", "감정", "정서", "애도", "상실", "치유", "mental", "counsel"],
    softSignals: ["care", "guide"],
  },
  {
    pattern: /강의|강사|수업|클래스|튜터|교육|커리큘럼|lecture|class|teach/i,
    slugs: [
      "small-class-creator",
      "ai-tools-tutor-for-adults",
      "smartphone-class-instructor",
      "home-baking-class-teacher",
      "craft-class-instructor",
      "hobby-community-teacher",
      "career-portfolio-mentor",
      "education-program-planner",
      "reading-writing-tutor",
      "library-ai-class-curator",
    ],
    keywords: ["강의", "강사", "수업", "튜터", "교육", "커리큘럼", "lecture", "class", "teach"],
    softSignals: ["teach", "guide"],
  },
];

function getBudgetLabel(value) {
  return {
    "1_2": "주 1~2시간",
    "3_5": "주 3~5시간",
    "6_plus": "주 6시간 이상",
  }[value] || "시간 미정";
}

function getIncomeContextLabel(value) {
  return {
    immediate: "빠른 수입 확인이 필요한",
    within_3_months: "3개월 안에 가능성을 보고 싶은",
    explore_first: "방향 확인이 먼저 필요한",
    no_rush: "수익보다 경험 확인이 먼저인",
  }[value] || "속도를 아직 정하지 않은";
}

function hasFinalConsonant(value) {
  const lastChar = [...String(value).trim()].at(-1);
  if (!lastChar) return false;

  const code = lastChar.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function objectParticle(value) {
  return hasFinalConsonant(value) ? "을" : "를";
}

function andParticle(value) {
  return hasFinalConsonant(value) ? "과" : "와";
}

function joinKoreanList(items) {
  const values = unique(items);
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]}${andParticle(values[0])} ${values[1]}`;

  const beforeLast = values.at(-2);
  return `${values.slice(0, -1).join(", ")}${andParticle(beforeLast)} ${values.at(-1)}`;
}

function getStageLabel(key) {
  return {
    seven: "첫 7일",
    thirty: "30일 쌓기",
    ninety: "90일 굳히기",
    revenue: "첫 수익",
  }[key];
}

function replaceTokens(text, recommendation) {
  return String(text)
    .replaceAll("{{career}}", recommendation.name)
    .replaceAll("{{proofOfWork}}", recommendation.proofOfWork)
    .replaceAll("{{publishAction}}", recommendation.publishAction)
    .replaceAll("{{interviewTarget}}", recommendation.interviewTarget)
    .replaceAll("{{firstRevenueOffer}}", recommendation.firstRevenueOffer);
}

export function getAgeBand(birthYear) {
  const year = Number(birthYear);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age >= 40 && age < 50) return "40s";
  if (age >= 50 && age < 60) return "50s";
  if (age >= 60) return "60plus";
  return "other";
}

export function computeRiasecResult(questions, answers) {
  const totals = Object.fromEntries(RIASEC_KEYS.map((key) => [key, 0]));
  const counts = Object.fromEntries(RIASEC_KEYS.map((key) => [key, 0]));
  const rawAnswers = [];

  questions.forEach((question, index) => {
    const answer = Number(answers[index] || 0);
    if (!answer) return;
    rawAnswers.push(answer);
    totals[question.code] += answer;
    counts[question.code] += 1;
  });

  const normalized = Object.fromEntries(
    RIASEC_KEYS.map((key) => [key, counts[key] ? totals[key] / (counts[key] * 5) : 0])
  );
  const normalizedValues = RIASEC_KEYS.map((key) => normalized[key] || 0);

  const rankedCodes = [...RIASEC_KEYS].sort((left, right) => totals[right] - totals[left]);
  return {
    scoringVersion: "assessment-v3",
    totals,
    normalized,
    answeredCount: rawAnswers.length,
    mean: average(normalizedValues),
    spread: spread(normalizedValues),
    rawMean: average(rawAnswers) / 5,
    rawSpread: spread(rawAnswers) / 4,
    rankedCodes,
    topCodes: rankedCodes.slice(0, 3),
  };
}

export function computeBigFiveResult(questions, answers) {
  const totals = Object.fromEntries(BIG_FIVE_KEYS.map((key) => [key, 0]));
  const counts = Object.fromEntries(BIG_FIVE_KEYS.map((key) => [key, 0]));
  const rawAnswers = [];

  questions.forEach((question, index) => {
    const raw = Number(answers[index] || 0);
    if (!raw) return;
    rawAnswers.push(raw);
    const adjusted = question.reverse ? 6 - raw : raw;
    totals[question.trait] += adjusted;
    counts[question.trait] += 1;
  });

  const normalized = Object.fromEntries(
    BIG_FIVE_KEYS.map((key) => [key, counts[key] ? totals[key] / (counts[key] * 5) : 0])
  );
  const normalizedValues = BIG_FIVE_KEYS.map((key) => normalized[key] || 0);

  return {
    scoringVersion: "assessment-v3",
    totals,
    normalized,
    answeredCount: rawAnswers.length,
    mean: average(normalizedValues),
    spread: spread(normalizedValues),
    rawMean: average(rawAnswers) / 5,
    rawSpread: spread(rawAnswers) / 4,
  };
}

export function createInsightHooks(overrides = {}) {
  return {
    summarizeExploration: overrides.summarizeExploration || null,
    composeRecommendationNarrative: overrides.composeRecommendationNarrative || null,
    composeCheckinFeedback: overrides.composeCheckinFeedback || null,
  };
}

export function summarizeExploration({ dream, profile, answers, hooks }) {
  if (hooks?.summarizeExploration) {
    return hooks.summarizeExploration({ dream, profile, answers });
  }

  const blockers = unique([...(dream.blockers || [])]);
  const summary = {
    hookSource: "structured-fallback",
    dreamCore: dream.title || dream.description,
    dreamModes: dream.modes || [],
    blockers,
    motivator: answers.dreamShift || dream.whyThisMatters || "",
    fearPoint: answers.fearPoint || "",
    stuckPoint: answers.stuckPoint || "",
    nonNegotiable: answers.nonNegotiable || "",
    proofNeed: answers.proofNeed || "",
    paceNeed: profile.incomeUrgency || "within_3_months",
    realityPressure: {
      time: profile.weeklyTimeBudget || "",
      income: profile.incomeUrgency || "",
      physical: profile.physicalDemandLimit || "",
    },
  };

  summary.riskLevel =
    blockers.includes("money") || blockers.includes("time")
      ? "high"
      : blockers.includes("confidence") || blockers.includes("visibility")
        ? "medium"
        : "low";

  return summary;
}

function scoreDreamCloseness(dream, career) {
  const selectedModes = dream.modes || [];
  const overlap = selectedModes.filter((mode) => career.dreamSignals.includes(mode)).length;
  const overlapRatio = selectedModes.length ? overlap / selectedModes.length : 0.55;

  const inspirationBoosts = {
    studio: ["visual-creative", "writing-media", "craft-maker"],
    classroom: ["teaching-guide", "consulting-service", "community-public"],
    storefront: ["micro-business", "craft-maker", "digital-freelance"],
    community: ["community-public", "teaching-guide", "wellness-life"],
    expert: ["consulting-service", "professional-path", "digital-freelance"],
    care: ["wellness-life", "community-public", "teaching-guide"],
  };

  let score = selectedModes.length ? 38 + overlapRatio * 48 : 60;

  if ((inspirationBoosts[dream.inspirationSlug] || []).includes(career.cluster)) {
    score += 12;
  }
  if (selectedModes.length >= 2 && overlap === selectedModes.length) {
    score += 4;
  }
  if (selectedModes.length && overlap === 0) {
    score -= 8;
  }
  if (dream.blockers?.includes("money") && career.incomeMode === "immediate") {
    score += 6;
  }
  if (dream.blockers?.includes("visibility") && ["writing-media", "visual-creative"].includes(career.cluster)) {
    score -= 5;
  }

  return clamp(score);
}

function scoreSpecificityFit(dream, profile, summary, career) {
  const intentText = collectIntentText(dream, profile, summary);
  const dreamIntentText = collectDreamIntentText(dream, summary);
  const selectedModes = dream.modes || [];
  const rule = NARROW_DOMAIN_RULES.find((item) => item.slugs.includes(career.slug) || item.pattern.test(career.name));

  if (!rule) return 0;
  if (rule.keywords.some((keyword) => keywordAppearsAffirmatively(dreamIntentText, keyword.toLowerCase()))) return 32;
  if (rule.keywords.some((keyword) => keywordAppearsAffirmatively(intentText, keyword.toLowerCase()))) return 20;

  const softSignalMatches = rule.softSignals.filter(
    (signal) => selectedModes.includes(signal) || career.dreamSignals.includes(signal)
  ).length;

  return softSignalMatches >= rule.softSignals.length ? -7 : -14;
}

function scoreKeywordFit(dream, profile, summary, career) {
  const keywords = unique(career.keywords || [])
    .map((keyword) => keyword.toLowerCase().trim())
    .filter(isSearchableKeyword);
  if (!keywords.length) return 0;

  const intentText = collectIntentText(dream, profile, summary);
  const matches = keywords.filter((keyword) => keywordAppearsAffirmatively(intentText, keyword));

  if (!matches.length) {
    return career.keywordGate ? -6 : 0;
  }

  return clamp(2 + Math.min(matches.length, 4) * 3, -6, 14);
}

function scoreDirectCareerMention(dream, profile, summary, career) {
  const intentText = collectIntentText(dream, profile, summary);
  const compactIntent = intentText.replace(/\s+/g, "");
  const careerName = normalizeText(career.name);
  const compactName = careerName.replace(/\s+/g, "");

  if (compactName && keywordAppearsAffirmatively(compactIntent, compactName)) return 34;
  if (career.slug && keywordAppearsAffirmatively(intentText, career.slug.toLowerCase())) return 28;

  return 0;
}

function getPositiveIntentBonusCap({ dreamCloseness, directMentionFit, specificityFit }) {
  if (directMentionFit > 0) return dreamCloseness >= 55 ? 48 : 38;
  if (specificityFit >= 20) {
    if (dreamCloseness >= 75) return 32;
    if (dreamCloseness >= 60) return 24;
    return 14;
  }
  if (dreamCloseness >= 85) return 28;
  if (dreamCloseness >= 70) return 22;
  if (dreamCloseness >= 60) return 16;
  return 10;
}

function getDreamSortAdjustment({ dreamCloseness, directMentionFit, specificityFit }) {
  if (directMentionFit > 0) return 0;
  if (dreamCloseness >= 72) return 0;
  if (specificityFit >= 20 && dreamCloseness >= 62) return 0;
  if (dreamCloseness >= 60) return -8;
  return -18;
}

function compareRecommendations(left, right) {
  const dreamGap = right.breakdown.dreamCloseness - left.breakdown.dreamCloseness;
  const leftDirect = left.breakdown.directMentionFit > 0;
  const rightDirect = right.breakdown.directMentionFit > 0;

  if (dreamGap >= 30 && !leftDirect && right.sortScore >= left.sortScore - 14) return 1;
  if (dreamGap <= -30 && !rightDirect && left.sortScore >= right.sortScore - 14) return -1;

  const scoreDelta = right.sortScore - left.sortScore;
  if (Math.abs(scoreDelta) <= 4) {
    const directDelta = right.breakdown.directMentionFit - left.breakdown.directMentionFit;
    if (directDelta) return directDelta;

    const keywordDelta = right.breakdown.keywordFit - left.breakdown.keywordFit;
    if (keywordDelta) return keywordDelta;

    const specificityDelta = right.breakdown.specificityFit - left.breakdown.specificityFit;
    if (specificityDelta) return specificityDelta;
  }

  return scoreDelta;
}

function scoreInterestMatch(riasecResult, career) {
  const userVector = RIASEC_KEYS.map((key) => riasecResult?.normalized?.[key] ?? 0.5);
  const careerVector = RIASEC_KEYS.map((key) => career.riasecWeights[key] ?? 0);
  if (riasecResult?.scoringVersion !== "assessment-v3") {
    return clamp(cosineSimilarity(userVector, careerVector) * 100);
  }

  const mean = riasecResult.mean ?? average(userVector);
  const responseSpread = riasecResult.spread ?? spread(userVector);
  const careerMean = average(careerVector);
  const centeredUserVector = userVector.map((value) => value - mean);
  const centeredCareerVector = careerVector.map((value) => value - careerMean);
  const directionScore = 50 + signedCosineSimilarity(centeredUserVector, centeredCareerVector) * 50;
  const strengthScore = scoreLikertStrength(mean);
  const spreadWeight = clamp(responseSpread / 0.28, 0, 1);
  let score = strengthScore * (1 - spreadWeight) + (directionScore * 0.72 + strengthScore * 0.28) * spreadWeight;

  if (mean <= 0.34) score = Math.min(score, 34);
  if (mean <= 0.46) score = Math.min(score, 48);

  return clamp(score);
}

function scoreWorkStyleMatch(bigFiveResult, career) {
  const scores = BIG_FIVE_KEYS.map((trait) => {
    const user = bigFiveResult?.normalized?.[trait] ?? 0.5;
    const target = career.personalityPreferences[trait] ?? 0.5;
    return 1 - Math.abs(user - target);
  });

  let score = clamp((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100);

  if (bigFiveResult?.scoringVersion !== "assessment-v3") {
    return score;
  }

  const rawSpread = bigFiveResult.rawSpread ?? 1;
  const traitSpread = bigFiveResult.spread ?? 1;
  const rawMean = bigFiveResult.rawMean ?? 0.6;
  const traitMean = bigFiveResult.mean ?? 0.6;

  if (rawSpread <= 0.02) {
    score = Math.min(score, rawMean <= 0.4 || rawMean >= 0.8 ? 42 : 55);
  } else if (traitSpread <= 0.08) {
    score = Math.min(score, 62);
  }
  if (traitMean <= 0.34) {
    score = Math.min(score, 46);
  } else if (traitMean <= 0.46) {
    score = Math.min(score, 58);
  }

  return clamp(score);
}

function scoreRealityFit(profile, summary, career) {
  const pieces = [];
  const budgetLevel = { "1_2": 1, "3_5": 2, "6_plus": 3 }[profile.weeklyTimeBudget] || 2;
  const trainingLevel = { low: 1, medium: 2, high: 3 }[career.trainingTimeCategory] || 2;
  pieces.push(trainingLevel <= budgetLevel ? 96 : trainingLevel - budgetLevel === 1 ? 72 : 45);

  const incomeMatrix = {
    immediate: { immediate: 100, short_term: 70, mixed: 80, long_term: 50 },
    within_3_months: { immediate: 88, short_term: 92, mixed: 84, long_term: 62 },
    explore_first: { immediate: 70, short_term: 82, mixed: 84, long_term: 94 },
  };
  pieces.push(incomeMatrix[profile.incomeUrgency || "within_3_months"]?.[career.incomeMode] ?? 78);

  const remoteMatrix = {
    onsite: { onsite: 100, hybrid: 72, remote: 38, mixed: 68 },
    hybrid: { onsite: 76, hybrid: 100, remote: 80, mixed: 88 },
    remote: { onsite: 35, hybrid: 68, remote: 100, mixed: 82 },
    mixed: { onsite: 80, hybrid: 90, remote: 78, mixed: 92 },
    any: { onsite: 86, hybrid: 90, remote: 88, mixed: 92 },
  };
  pieces.push(remoteMatrix[profile.remotePreference || "any"]?.[career.remoteOption] ?? 80);

  const physicalMatrix = {
    low: { low: 100, medium: 60, high: 24 },
    medium: { low: 94, medium: 86, high: 56 },
    high: { low: 88, medium: 90, high: 92 },
    unknown: { low: 84, medium: 76, high: 60 },
  };
  pieces.push(physicalMatrix[profile.physicalDemandLimit || "unknown"]?.[career.physicalDemand] ?? 78);

  if (summary.riskLevel === "high" && career.transitionCostScore <= 30) {
    pieces.push(94);
  }

  return clamp(pieces.reduce((sum, value) => sum + value, 0) / pieces.length);
}

function scorePreferenceAdjustment(profile, career) {
  let adjustment = 0;

  if (profile.remotePreference === "remote") {
    if (career.remoteOption === "remote") adjustment += 7;
    if (career.remoteOption === "mixed") adjustment += 2;
    if (career.remoteOption === "hybrid") adjustment -= 6;
    if (career.remoteOption === "onsite") adjustment -= 15;
  }

  if (profile.remotePreference === "onsite") {
    if (career.remoteOption === "onsite") adjustment += 6;
    if (career.remoteOption === "remote") adjustment -= 10;
  }

  if (profile.physicalDemandLimit === "low") {
    if (career.physicalDemand === "medium") adjustment -= 7;
    if (career.physicalDemand === "high") adjustment -= 16;
  }

  if (profile.weeklyTimeBudget === "1_2") {
    if (career.trainingTimeCategory === "medium") adjustment -= 5;
    if (career.trainingTimeCategory === "high") adjustment -= 12;
  }

  if (profile.incomeUrgency === "immediate" && career.incomeMode === "long_term") {
    adjustment -= 10;
  }

  return adjustment;
}

function scoreStudentFit(profile, career) {
  if (!isStudentProfile(profile)) return 0;

  const status = profile.currentStatus;
  const priority = STUDENT_PRIORITY_SLUGS[status] || new Set();
  const searchableText = `${career.slug} ${career.name} ${career.shortDescription} ${(career.dreamSignals || []).join(" ")} ${(career.keywords || []).join(" ")}`;
  let adjustment = 0;

  if (priority.has(career.slug)) {
    adjustment += status === "university_student" ? 18 : status === "high_school_student" ? 24 : 32;
  }

  if (profile.primaryGoal === "learning") {
    adjustment += career.trainingTimeCategory === "high" ? -6 : 6;
  }

  if (YOUNG_STUDENT_STATUSES.has(status)) {
    if (career.incomeMode === "immediate") adjustment -= 18;
    if (career.category === "전문 경로") adjustment -= 32;
    if (career.cluster === "consulting-service") adjustment -= 18;
    if (career.dreamSignals?.includes("client-work")) adjustment -= 10;
    if (career.dreamSignals?.includes("business")) adjustment -= 8;
  }

  if (status === "high_school_student") {
    if (career.incomeMode === "immediate") adjustment -= 10;
    if (career.category === "전문 경로") adjustment -= 14;
    if (career.dreamSignals?.includes("client-work")) adjustment -= 4;
  }

  if (status === "university_student") {
    if (["digital-freelance", "writing-media", "visual-creative"].includes(career.cluster)) adjustment += 8;
    if (career.category === "전문 경로" && career.incomeMode === "immediate") adjustment -= 4;
  }

  if (/법률|세무|보험|병원|부동산|특허|민원|물류|구매|공사|의료관광/.test(searchableText)) {
    if (YOUNG_STUDENT_STATUSES.has(status)) adjustment -= 22;
    if (status === "high_school_student") adjustment -= 10;
  }

  if (/포트폴리오|작품|샘플|템플릿|이야기|캐릭터|공예|발표|콘텐츠|AI|ai|디지털/.test(searchableText)) {
    adjustment += status === "university_student" ? 5 : 8;
  }

  return clamp(adjustment, -42, 38);
}

function scoreMomentumFit(profile, summary, career) {
  let score = 52;

  if (career.transitionCostScore <= 30) score += 14;
  if (career.ageFriendlyScore >= 80) score += 8;
  if (profile.primaryGoal === "income" && career.incomeMode === "immediate") score += 12;
  if (profile.primaryGoal === "meaning" && ["community-public", "teaching-guide", "wellness-guide"].includes(career.cluster)) score += 10;
  if (profile.primaryGoal === "flexibility" && ["digital-freelance", "writing-media", "consulting-service"].includes(career.cluster)) score += 10;
  if (profile.primaryGoal === "social_contribution" && ["community-public", "teaching-guide", "wellness-guide"].includes(career.cluster)) score += 10;
  if (profile.primaryGoal === "learning" && career.trainingTimeCategory !== "low") score += 8;
  if (summary.proofNeed && career.proofOfWork) score += 6;

  return clamp(score);
}

function scoreProofFit(dream, summary, career) {
  let score = 58;

  if (dream.modes?.includes("write") && career.proofOfWork.includes("글")) score += 10;
  if (dream.modes?.includes("visual") && /시안|사진|보드|영상|카드/.test(career.proofOfWork)) score += 10;
  if (dream.modes?.includes("maker") && /제품|작품|소품|시제품/.test(career.proofOfWork)) score += 10;
  if (dream.modes?.includes("teach") && /진행안|수업안|커리큘럼|세션/.test(career.proofOfWork)) score += 10;
  if (dream.modes?.includes("business") && /제안서|판매|페이지|오퍼/.test(career.proofOfWork)) score += 10;
  if (summary.blockers?.includes("visibility") && career.publishAction) score -= 5;
  if (summary.blockers?.includes("confidence") && career.transitionCostScore <= 30) score += 6;

  return clamp(score);
}

function diversityPass(items) {
  const clusterCounts = new Map();
  const picks = [];

  for (const item of items) {
    if (item.breakdown?.directMentionFit <= 0) continue;
    picks.push(item);
    clusterCounts.set(item.cluster, (clusterCounts.get(item.cluster) || 0) + 1);
    if (picks.length === 5) return picks;
  }

  for (const item of items) {
    if (picks.includes(item)) continue;
    const count = clusterCounts.get(item.cluster) || 0;
    if (count >= 1 && picks.length < 5) {
      continue;
    }

    picks.push(item);
    clusterCounts.set(item.cluster, count + 1);
    if (picks.length === 5) break;
  }

  if (picks.length < 5) {
    for (const item of items) {
      if (picks.includes(item)) continue;
      picks.push(item);
      if (picks.length === 5) break;
    }
  }

  return picks;
}

function fitLabel(score) {
  if (score >= 84) return "매우 가까움";
  if (score >= 74) return "가까움";
  if (score >= 64) return "실험해볼 만함";
  return "우회 경로";
}

function paceLabel(career) {
  if (career.transitionCostScore <= 28) return "빠르게 시작";
  if (career.transitionCostScore <= 42) return "조금 준비 필요";
  return "차근차근 준비";
}

function composeNarrative({ dream, profile, summary, career, breakdown, hooks }) {
  if (hooks?.composeRecommendationNarrative) {
    return hooks.composeRecommendationNarrative({ dream, profile, summary, career, breakdown });
  }

  const dreamLine = dream.title || summary.dreamCore || "하고 싶은 일";
  if (isStudentProfile(profile)) {
    return {
      reasonShort: `"${dreamLine}"을 직업으로 확정하기보다, 지금은 작은 프로젝트로 확인해보기 좋은 경로예요.`,
      reasons: [
        `${career.name}는 학생 단계에서 결과물, 기록, 피드백을 만들기 좋은 방향입니다.`,
        `${getBudgetLabel(profile.weeklyTimeBudget)} 안에서 무리한 수익화보다 포트폴리오와 경험을 먼저 쌓기 좋습니다.`,
        `첫 실험에서 ${career.proofOfWork} 같은 눈에 보이는 결과물을 만들 수 있어 다음 선택을 판단하기 쉽습니다.`,
      ],
      cautionText: career.realityNote,
      firstActions: [
        `${career.proofOfWork} 만들기`,
        `${career.interviewTarget} 만나기`,
        `${career.firstRevenueOffer}`,
      ],
    };
  }

  const modeText = joinKoreanList(humanizeModes((dream.modes || []).slice(0, 2))) || "하고 싶은 일";
  const incomeContext = getIncomeContextLabel(profile.incomeUrgency);

  return {
    reasonShort: `"${dreamLine}"에 너무 멀지 않게 닿으면서, 이번 주에 결과물을 만들 수 있는 경로예요.`,
    reasons: [
      `${career.name}는 당신이 끌리는 ${modeText}${objectParticle(modeText)} 실제 결과물로 옮기기 좋은 경로입니다.`,
      `${getBudgetLabel(profile.weeklyTimeBudget)} 안에서 ${incomeContext} 상황을 함께 보면, 이 경로는 속도와 현실성을 같이 챙기기 쉽습니다.`,
      `첫 실험에서 ${career.proofOfWork} 같은 눈에 보이는 결과물을 만들 수 있어서 생각을 빨리 밖으로 꺼내기 좋습니다.`,
    ],
    cautionText: career.realityNote,
    firstActions: [
      `${career.proofOfWork} 만들기`,
      `${career.interviewTarget} 만나기`,
      `${career.firstRevenueOffer}`,
    ],
  };
}

function adaptCareerForProfile(career, profile) {
  if (!isStudentProfile(profile)) return career;

  const isPreAdult = isPreAdultStudent(profile);
  const studentName = STUDENT_NAME_OVERRIDES[career.slug] || `${career.name} 프로젝트`;

  return {
    ...career,
    studentMode: true,
    name: studentName,
    shortDescription: `학생 단계에서 ${career.shortDescription}을 바로 직업으로 정하기보다, 작은 결과물과 활동 기록으로 확인하는 경로`,
    firstRevenueOffer: isPreAdult
      ? "보호자, 선생님, 멘토 중 1명에게 결과물을 보여주고 다음 활동을 제안"
      : career.firstRevenueOffer,
    realityNote: isPreAdult
      ? "학생 단계에서는 수익보다 안전한 프로젝트, 기록, 피드백이 먼저입니다. 보호자나 선생님과 함께 범위를 정하는 것이 좋습니다."
      : "학생 단계에서는 첫 유료 경험보다 포트폴리오, 안전한 실험 범위, 피드백 기록을 함께 챙겨야 합니다.",
  };
}

export function generateRecommendations({ dream, profile, riasecResult, bigFiveResult, summary, careers, hooks }) {
  const scored = careers.map((career) => {
    const dreamCloseness = scoreDreamCloseness(dream, career);
    const interestMatch = scoreInterestMatch(riasecResult, career);
    const workStyleMatch = scoreWorkStyleMatch(bigFiveResult, career);
    const realityFit = scoreRealityFit(profile, summary, career);
    const momentumFit = scoreMomentumFit(profile, summary, career);
    const proofFit = scoreProofFit(dream, summary, career);
    const specificityFit = scoreSpecificityFit(dream, profile, summary, career);
    const keywordFit = scoreKeywordFit(dream, profile, summary, career);
    const directMentionFit = scoreDirectCareerMention(dream, profile, summary, career);
    const preferenceAdjustment = scorePreferenceAdjustment(profile, career);
    const studentFit = scoreStudentFit(profile, career);
    const baseScore =
      0.38 * dreamCloseness +
        0.17 * interestMatch +
        0.13 * workStyleMatch +
        0.15 * realityFit +
        0.1 * momentumFit +
        0.07 * proofFit;
    const intentBonus = specificityFit + keywordFit + directMentionFit + studentFit + preferenceAdjustment;
    const boundedIntentBonus = clamp(
      intentBonus,
      -36,
      getPositiveIntentBonusCap({ dreamCloseness, directMentionFit, specificityFit })
    );
    const rawScore = baseScore + boundedIntentBonus;
    let finalScore = clamp(rawScore);
    const assessmentSupport = (interestMatch + workStyleMatch) / 2;
    if (interestMatch < 35 && workStyleMatch < 50) {
      finalScore = Math.min(finalScore, 66);
    } else if (assessmentSupport < 55) {
      finalScore = Math.min(finalScore, 76);
    }

    const breakdown = {
      dreamCloseness: Math.round(dreamCloseness),
      dreamDistance: Math.round(100 - dreamCloseness),
      interestMatch: Math.round(interestMatch),
      workStyleMatch: Math.round(workStyleMatch),
      realityFit: Math.round(realityFit),
      momentumFit: Math.round(momentumFit),
      proofFit: Math.round(proofFit),
      specificityFit: Math.round(specificityFit),
      keywordFit: Math.round(keywordFit),
      directMentionFit: Math.round(directMentionFit),
      studentFit: Math.round(studentFit),
      preferenceAdjustment: Math.round(preferenceAdjustment),
    };

    const displayCareer = adaptCareerForProfile(career, profile);
    const narrative = composeNarrative({ dream, profile, summary, career: displayCareer, breakdown, hooks });
    return {
      ...displayCareer,
      finalScore: Math.round(finalScore),
      sortScore:
        rawScore +
        0.18 * dreamCloseness +
        getDreamSortAdjustment({ dreamCloseness, directMentionFit, specificityFit }),
      fitLabel: fitLabel(finalScore),
      paceLabel: isStudentProfile(profile) ? "프로젝트로 확인" : paceLabel(career),
      breakdown,
      ...narrative,
    };
  });

  const sorted = scored.sort(compareRecommendations);
  return diversityPass(sorted).map(({ sortScore, ...item }, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function buildFallbackJourneyBlueprint() {
  return {
    stageSummaries: {
      seven: "이번 주에는 결과물 1개, 인터뷰 1건, 공개 1회, 유료 제안 1회를 만듭니다.",
      thirty: "30일 안에는 포트폴리오와 제안 구조를 정리합니다.",
      ninety: "90일 안에는 반복 가능한 방식으로 좁혀갑니다.",
      revenue: "첫 수익 단계에서는 첫 유료 연결을 끝까지 마무리합니다.",
    },
    taskTemplates: {
      seven: [
        { title: "오퍼 한 줄 정리", description: "{{career}}로 무엇을 만들지와 접을 기준 2개를 적습니다.", deliverable: "오퍼 한 줄 + 실패 기준" },
        { title: "인터뷰 1건", description: "{{interviewTarget}}에게 현실을 묻습니다.", deliverable: "인터뷰 메모" },
        { title: "대표 결과물 1개", description: "{{proofOfWork}}", deliverable: "{{proofOfWork}}" },
        { title: "첫 공개", description: "{{publishAction}}", deliverable: "공개 링크" },
        { title: "첫 유료 시도", description: "{{firstRevenueOffer}}", deliverable: "제안 메시지" },
      ],
      thirty: [
        { title: "결과물 3개 쌓기", description: "비슷한 톤으로 3개를 만듭니다.", deliverable: "결과물 3개" },
        { title: "소개 페이지 만들기", description: "무엇을 해주는지 적습니다.", deliverable: "소개 페이지" },
        { title: "유료 제안 5회", description: "작게라도 보냅니다.", deliverable: "제안 기록표" },
      ],
      ninety: [
        { title: "강점 좁히기", description: "가장 잘 맞는 축을 고릅니다.", deliverable: "강점 한 줄" },
        { title: "후기 모으기", description: "짧은 반응을 모읍니다.", deliverable: "후기 3개" },
      ],
      revenue: [
        { title: "가격표 만들기", description: "첫 가격을 정합니다.", deliverable: "가격표" },
        { title: "첫 유료 완료", description: "첫 건을 끝냅니다.", deliverable: "첫 수익 기록" },
      ],
    },
  };
}

export function buildJourney(recommendation, journeyBlueprints) {
  const blueprint = journeyBlueprints[recommendation.roadmapTrack] || buildFallbackJourneyBlueprint();
  const getStudentAwareStageLabel = (stageKey) => {
    if (recommendation.studentMode && stageKey === "revenue") return "첫 피드백";
    return getStageLabel(stageKey);
  };
  const adaptStudentStageSummary = (summary) => {
    if (!recommendation.studentMode) return summary;

    return summary
      .replace(/첫 수익 단계에서는 첫 유료 연결을 끝까지 마무리합니다\./g, "첫 피드백 단계에서는 결과물을 보여주고 외부 반응을 정리합니다.")
      .replace(/유료 제안/g, "피드백 요청")
      .replace(/유료/g, "피드백")
      .replace(/피드백로/g, "피드백으로")
      .replace(/결제/g, "신청")
      .replace(/수익/g, "외부 반응")
      .replace(/가격/g, "활동 범위");
  };
  const adaptStudentTask = (task) => {
    if (!recommendation.studentMode) return task;

    return {
      ...task,
      title: task.title
        .replace(/내가 팔고 싶은 한 줄 정리/g, "내가 만들고 싶은 한 줄 정리")
        .replace(/상품 형태 고르기/g, "활동 형태 고르기")
        .replace(/단가 정하기/g, "활동 범위 정하기")
        .replace(/유료 구조 정리/g, "피드백 구조 정리")
        .replace(/결제와 안내 정리/g, "신청과 안내 정리")
        .replace(/고객 질문 정리/g, "보는 사람이 궁금해할 점 정리")
        .replace(/결제 흐름 만들기/g, "신청 흐름 정리")
        .replace(/첫 유료 시도|유료 가능성 시험|첫 결제 시도/g, "첫 피드백 요청")
        .replace(/유료 제안|유료 체험 제안|유료 파일럿 제안/g, "멘토 피드백 요청")
        .replace(/가격표 만들기|가격표 확정/g, "다음 활동 범위 정리")
        .replace(/첫 고객 마감|첫 고객 완료/g, "첫 반응 정리")
        .replace(/첫 유료 완료|첫 유료 작업 완료|첫 유료 세션 완료|첫 유료 진단 완료|첫 유료 고객 완료/g, "첫 외부 반응 정리"),
      description: task.description
        .replace(/팔고 싶은/g, "만들고 싶은")
        .replace(/돈 가능성/g, "계속할 이유")
        .replace(/클라이언트|고객/g, "보는 사람")
        .replace(/상품/g, "활동")
        .replace(/단가/g, "활동 범위")
        .replace(/잠재고객|고객/g, "보는 사람")
        .replace(/유료/g, "피드백")
        .replace(/결제/g, "신청")
        .replace(/수익/g, "외부 반응")
        .replace(/가격/g, "활동 범위"),
      deliverable: task.deliverable
        .replace(/제안 메시지 또는 결제 링크/g, "피드백 요청 메시지")
        .replace(/제안 메시지 또는 모집 문구/g, "피드백 요청 글")
        .replace(/유료 체험 제안/g, "피드백 요청 글")
        .replace(/선주문 또는 모집 문구/g, "체험 반응 기록")
        .replace(/결제\/전달 흐름도/g, "신청/전달 흐름도")
        .replace(/제안 기록표/g, "피드백 요청 기록표")
        .replace(/수익 축 1개/g, "반응 축 1개")
        .replace(/단가표/g, "활동 범위표")
        .replace(/첫 수익 기록/g, "첫 피드백 기록")
        .replace(/가격/g, "활동 범위")
        .replace(/결제/g, "신청")
        .replace(/가격표/g, "활동 범위표"),
    };
  };
  const stages = STAGE_ORDER.map((stageKey) => ({
    key: stageKey,
    label: getStudentAwareStageLabel(stageKey),
    summary: adaptStudentStageSummary(blueprint.stageSummaries[stageKey]),
    tasks: blueprint.taskTemplates[stageKey].map((task, index) => {
      const renderedTask = adaptStudentTask({
        title: replaceTokens(task.title, recommendation),
        description: replaceTokens(task.description, recommendation),
        deliverable: replaceTokens(task.deliverable, recommendation),
      });

      return {
        id: `${stageKey}-${index + 1}`,
        ...renderedTask,
        status: "todo",
        completedAt: null,
      };
    }),
  }));

  return {
    id: `${recommendation.slug}-${Date.now()}`,
    careerSlug: recommendation.slug,
    careerName: recommendation.name,
    startedAt: new Date().toISOString(),
    currentStageKey: "seven",
    stages,
    checkins: [],
    reflections: [],
    savedAt: new Date().toISOString(),
  };
}

export function getStage(journey, stageKey) {
  return journey?.stages?.find((stage) => stage.key === stageKey) || null;
}

export function getCurrentStage(journey) {
  return getStage(journey, journey?.currentStageKey);
}

export function canAdvanceStage(journey) {
  const currentStage = getCurrentStage(journey);
  return currentStage ? currentStage.tasks.every((task) => task.status === "done") : false;
}

export function getNextStageKey(currentStageKey) {
  const index = STAGE_ORDER.indexOf(currentStageKey);
  return STAGE_ORDER[index + 1] || null;
}

export function summarizeJourneyMetrics(journey) {
  const allTasks = journey?.stages?.flatMap((stage) => stage.tasks) || [];
  const doneTasks = allTasks.filter((task) => task.status === "done").length;
  const totalTasks = allTasks.length;
  const currentStage = getCurrentStage(journey);
  const latestCheckin = journey?.checkins?.[journey.checkins.length - 1] || null;

  return {
    doneTasks,
    totalTasks,
    stageLabel: currentStage?.label || "",
    stageProgress: currentStage ? currentStage.tasks.filter((task) => task.status === "done").length : 0,
    stageTaskCount: currentStage?.tasks?.length || 0,
    latestCheckin,
  };
}

function shorten(text, limit = 28) {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export function composeCheckinFeedback({ journey, checkin, hooks }) {
  if (hooks?.composeCheckinFeedback) {
    return hooks.composeCheckinFeedback({ journey, checkin });
  }

  const currentStage = getCurrentStage(journey);
  const activeTask = currentStage?.tasks?.find((task) => task.status !== "done") || currentStage?.tasks?.[currentStage.tasks.length - 1];
  const parts = [];

  if (checkin.note?.trim()) {
    parts.push(`메모에 적은 "${shorten(checkin.note)}"가 지금 가장 큰 막힘으로 보여요.`);
  }

  if (checkin.completionStatus === "done") {
    parts.push(`좋습니다. ${activeTask?.title || currentStage?.label} 단계에서 실제로 몸을 움직였다는 게 가장 큰 진전이에요.`);
  } else if (checkin.completionStatus === "partial") {
    parts.push(`반만 했더라도 흐름은 끊기지 않았어요. 다음엔 범위를 더 작게 잘라 끝내는 쪽으로 조정해보세요.`);
  } else {
    parts.push(`오늘 멈췄다면 의지 문제보다 작업 크기가 컸을 가능성이 큽니다. 가장 작은 버전으로 다시 자르는 게 우선입니다.`);
  }

  if ((checkin.confidenceScore || 0) <= 2) {
    parts.push(`내일은 새 작업을 늘리기보다 ${activeTask?.deliverable || "현재 결과물"}의 최소 버전만 끝내는 쪽이 좋습니다.`);
  } else if ((checkin.interestScore || 0) >= 4) {
    parts.push(`흥미가 살아있다면 이번 단계는 계속 밀어볼 가치가 있습니다. 반응을 더 빨리 밖으로 받아보세요.`);
  }

  return parts.join(" ");
}
